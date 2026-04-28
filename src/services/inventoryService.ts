import type { PoolClient } from "pg";
import { ApiError } from "../middlewares/errorMiddleware.js";
import {
  decrementInventoryQuantity,
  deleteZeroQuantityInventory,
  deleteInventoryRecord,
  getInventoryQuantityForUpdate,
  getWarehouseInventoryReportRecords,
  incrementInventoryQuantity,
  setInventoryQuantity
} from "../repositories/inventoryRepository.js";
import { findActiveItemBySku } from "../repositories/itemRepository.js";
import type { ItemRecord, WarehouseRecord } from "../repositories/types.js";
import {
  countActiveWarehouses,
  getWarehouseOccupancy,
  lockActiveWarehouse
} from "../repositories/warehouseRepository.js";

export type InventoryMutationResult = {
  warehouseId: string;
  sku: string;
  quantity: number;
};

function assertStorageCompatible(warehouse: WarehouseRecord, item: ItemRecord) {
  // Standard stock can sit in cold storage, but cold-required stock cannot sit in standard storage.
  if (item.storage_requirement === "COLD" && warehouse.type !== "COLD") {
    throw new ApiError(
      "INCOMPATIBLE_STORAGE",
      "Cold storage items cannot be stored in a standard warehouse.",
      422
    );
  }
}

async function getRequiredLockedWarehouse(client: PoolClient, warehouseId: string) {
  const warehouse = await lockActiveWarehouse(client, warehouseId);
  if (!warehouse) {
    throw new ApiError("WAREHOUSE_NOT_FOUND", "Warehouse was not found or is deleted.", 404);
  }

  return warehouse;
}

async function getRequiredItemBySku(client: PoolClient, sku: string) {
  const item = await findActiveItemBySku(client, sku);
  if (!item) {
    throw new ApiError("ITEM_NOT_FOUND", "Item SKU was not found or is deleted.", 404);
  }

  return item;
}

async function upsertInventory(
  client: PoolClient,
  warehouseId: string,
  itemId: string,
  quantityDelta: number
) {
  if (quantityDelta < 0) {
    await decrementInventoryQuantity(client, warehouseId, itemId, Math.abs(quantityDelta));
    await deleteZeroQuantityInventory(client);
    return;
  }

  await incrementInventoryQuantity(client, warehouseId, itemId, quantityDelta);
  await deleteZeroQuantityInventory(client);
}

export async function addInventory(
  client: PoolClient,
  input: { warehouseId: string; sku: string; quantity: number }
): Promise<InventoryMutationResult> {
  // The warehouse lock serializes competing capacity checks for the same destination.
  const warehouse = await getRequiredLockedWarehouse(client, input.warehouseId);
  const item = await getRequiredItemBySku(client, input.sku);
  assertStorageCompatible(warehouse, item);

  const occupancy = await getWarehouseOccupancy(client, warehouse.id);
  if (occupancy + input.quantity > warehouse.max_capacity) {
    throw new ApiError(
      "INSUFFICIENT_CAPACITY",
      `Adding ${input.quantity} units exceeds warehouse capacity.`,
      422
    );
  }

  await upsertInventory(client, warehouse.id, item.id, input.quantity);

  return {
    warehouseId: warehouse.id,
    sku: item.sku,
    quantity: occupancy + input.quantity
  };
}

export async function setInventory(
  client: PoolClient,
  input: { warehouseId: string; sku: string; quantity: number }
): Promise<InventoryMutationResult> {
  const warehouse = await getRequiredLockedWarehouse(client, input.warehouseId);
  const item = await getRequiredItemBySku(client, input.sku);
  assertStorageCompatible(warehouse, item);

  const currentQuantity = await getInventoryQuantityForUpdate(client, warehouse.id, item.id);
  const occupancy = await getWarehouseOccupancy(client, warehouse.id);
  const nextOccupancy = occupancy - currentQuantity + input.quantity;
  if (nextOccupancy > warehouse.max_capacity) {
    throw new ApiError("INSUFFICIENT_CAPACITY", "Updated quantity exceeds warehouse capacity.", 422);
  }

  await setInventoryQuantity(client, warehouse.id, item.id, input.quantity);
  await deleteZeroQuantityInventory(client);

  return {
    warehouseId: warehouse.id,
    sku: item.sku,
    quantity: input.quantity
  };
}

export async function deleteInventory(
  client: PoolClient,
  input: { warehouseId: string; sku: string }
) {
  const warehouse = await getRequiredLockedWarehouse(client, input.warehouseId);
  const item = await getRequiredItemBySku(client, input.sku);
  const deleted = await deleteInventoryRecord(client, warehouse.id, item.id);
  if (!deleted) {
    throw new ApiError("INVENTORY_NOT_FOUND", "Inventory row was not found.", 404);
  }
}

export async function transferInventory(
  client: PoolClient,
  input: { fromWarehouseId: string; toWarehouseId: string; sku: string; quantity: number }
): Promise<{ from: InventoryMutationResult; to: InventoryMutationResult }> {
  // Lock in deterministic order to reduce deadlock risk when two transfers touch the same warehouses.
  const [firstWarehouseId, secondWarehouseId] = [input.fromWarehouseId, input.toWarehouseId].sort();
  const first = await getRequiredLockedWarehouse(client, firstWarehouseId);
  const second = await getRequiredLockedWarehouse(client, secondWarehouseId);
  const fromWarehouse = first.id === input.fromWarehouseId ? first : second;
  const toWarehouse = first.id === input.toWarehouseId ? first : second;
  // Resolve the SKU once and use the resulting item id for both sides to prevent ghost stock.
  const item = await getRequiredItemBySku(client, input.sku);

  assertStorageCompatible(toWarehouse, item);

  const fromQuantity = await getInventoryQuantityForUpdate(client, fromWarehouse.id, item.id);
  if (fromQuantity < input.quantity) {
    throw new ApiError(
      "INSUFFICIENT_STOCK",
      "Source warehouse does not have enough stock for this SKU.",
      422
    );
  }

  const toOccupancy = await getWarehouseOccupancy(client, toWarehouse.id);
  if (toOccupancy + input.quantity > toWarehouse.max_capacity) {
    throw new ApiError(
      "INSUFFICIENT_CAPACITY",
      "Destination warehouse does not have enough remaining capacity.",
      422
    );
  }

  // Both mutations run in the caller's transaction, so any later error rolls the whole transfer back.
  await upsertInventory(client, fromWarehouse.id, item.id, -input.quantity);
  await upsertInventory(client, toWarehouse.id, item.id, input.quantity);

  return {
    from: {
      warehouseId: fromWarehouse.id,
      sku: item.sku,
      quantity: fromQuantity - input.quantity
    },
    to: {
      warehouseId: toWarehouse.id,
      sku: item.sku,
      quantity: toOccupancy + input.quantity
    }
  };
}

export async function getInventoryReport(
  warehousePage: number,
  warehousesPerPage: number,
  warehouseItemPage: number,
  warehouseItemsPerPage: number
) {
  const warehouseOffset = (warehousePage - 1) * warehousesPerPage;
  const warehouseItemOffset = (warehouseItemPage - 1) * warehouseItemsPerPage;
  const warehouses = await getWarehouseInventoryReportRecords(
    warehousesPerPage,
    warehouseOffset,
    warehouseItemsPerPage,
    warehouseItemOffset
  );

  const total = await countActiveWarehouses();

  return {
    warehousePage,
    warehousesPerPage,
    warehouseItemPage,
    warehouseItemsPerPage,
    total,
    warehouses
  };
}

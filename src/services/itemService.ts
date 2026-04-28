import type { PoolClient } from "pg";
import { ApiError } from "../middlewares/errorMiddleware.js";
import {
  countInventoryRowsForItem,
  createItemRecord,
  listActiveItemRecords,
  lockActiveItem,
  softDeleteItemRecord,
  updateItemRecord
} from "../repositories/itemRepository.js";
import { setInventory } from "./inventoryService.js";

export type CreateItemInput = {
  name: string;
  sku: string;
  storageRequirement: "STANDARD" | "COLD";
  warehouseId?: string;
  quantity?: number;
};

export async function createItem(client: PoolClient, input: CreateItemInput) {
  const item = await createItemRecord(client, input);

  if (input.warehouseId) {
    await setInventory(client, {
      warehouseId: input.warehouseId,
      sku: item.sku,
      quantity: input.quantity ?? 1
    });
  }

  return item;
}

export async function listItems() {
  return listActiveItemRecords();
}

export async function updateItem(client: PoolClient, itemId: string, input: CreateItemInput) {
  const item = await lockActiveItem(client, itemId);
  if (!item) {
    throw new ApiError("ITEM_NOT_FOUND", "Item was not found or is deleted.", 404);
  }

  return updateItemRecord(client, item.id, input);
}

export async function softDeleteItem(client: PoolClient, itemId: string) {
  const item = await lockActiveItem(client, itemId);
  if (!item) {
    throw new ApiError("ITEM_NOT_FOUND", "Item was not found or is deleted.", 404);
  }

  const inventoryRows = await countInventoryRowsForItem(client, item.id);
  if (inventoryRows > 0) {
    throw new ApiError("ITEM_HAS_STOCK", "Item must have no inventory rows before deletion.", 409);
  }

  await softDeleteItemRecord(client, item.id);
}

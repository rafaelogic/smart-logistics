import type { PoolClient } from "pg";
import { ApiError } from "../middlewares/errorMiddleware.js";
import {
  createWarehouseRecord,
  getWarehouseOccupancy,
  listActiveWarehouseRecords,
  lockActiveWarehouse,
  softDeleteWarehouseRecord
} from "../repositories/warehouseRepository.js";

export type CreateWarehouseInput = {
  name: string;
  location: string;
  maxCapacity: number;
  type: "STANDARD" | "COLD";
};

export async function createWarehouse(input: CreateWarehouseInput) {
  return createWarehouseRecord(input);
}

export async function listWarehouses() {
  return listActiveWarehouseRecords();
}

export async function softDeleteWarehouse(client: PoolClient, warehouseId: string) {
  const warehouse = await lockActiveWarehouse(client, warehouseId);
  if (!warehouse) {
    throw new ApiError("WAREHOUSE_NOT_FOUND", "Warehouse was not found or is deleted.", 404);
  }

  const occupancy = await getWarehouseOccupancy(client, warehouse.id);
  if (occupancy > 0) {
    throw new ApiError("WAREHOUSE_NOT_EMPTY", "Warehouse must be empty before deletion.", 409);
  }

  // Soft delete preserves history and prevents inventory from silently disappearing.
  await softDeleteWarehouseRecord(client, warehouse.id);
}

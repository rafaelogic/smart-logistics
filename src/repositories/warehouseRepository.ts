import { pool } from "../database/db.js";
import type { Queryable, WarehouseRecord } from "./types.js";

type CreateWarehouseRecordInput = {
  name: string;
  location: string;
  maxCapacity: number;
  type: "STANDARD" | "COLD";
};

export async function createWarehouseRecord(input: CreateWarehouseRecordInput) {
  const result = await pool.query(
    `INSERT INTO warehouses (name, location, max_capacity, type)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, location, max_capacity AS "maxCapacity", type`,
    [input.name, input.location, input.maxCapacity, input.type]
  );

  return result.rows[0];
}

export async function listActiveWarehouseRecords() {
  const result = await pool.query(
    `SELECT id, name, location, max_capacity AS "maxCapacity", type
     FROM warehouses
     WHERE deleted_at IS NULL
     ORDER BY name`
  );

  return result.rows;
}

export async function lockActiveWarehouse(client: Queryable, warehouseId: string) {
  // FOR UPDATE blocks concurrent writers until this transaction finishes its capacity decision.
  const result = await client.query<WarehouseRecord>(
    `SELECT id, name, location, max_capacity, type
     FROM warehouses
     WHERE id = $1 AND deleted_at IS NULL
     FOR UPDATE`,
    [warehouseId]
  );

  return result.rows[0] ?? null;
}

export async function getWarehouseOccupancy(client: Queryable, warehouseId: string) {
  const result = await client.query<{ occupancy: string }>(
    `SELECT COALESCE(SUM(quantity), 0)::text AS occupancy
     FROM inventory
     WHERE warehouse_id = $1`,
    [warehouseId]
  );

  return Number(result.rows[0]?.occupancy ?? 0);
}

export async function countActiveWarehouses() {
  const result = await pool.query<{ total: string }>(
    "SELECT COUNT(*)::text AS total FROM warehouses WHERE deleted_at IS NULL"
  );

  return Number(result.rows[0]?.total ?? 0);
}

export async function softDeleteWarehouseRecord(client: Queryable, warehouseId: string) {
  await client.query("UPDATE warehouses SET deleted_at = now(), updated_at = now() WHERE id = $1", [
    warehouseId
  ]);
}

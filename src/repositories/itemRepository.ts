import { pool } from "../database/db.js";
import type { ItemRecord, Queryable } from "./types.js";

type CreateItemRecordInput = {
  name: string;
  sku: string;
  storageRequirement: "STANDARD" | "COLD";
};

export async function createItemRecord(input: CreateItemRecordInput) {
  const result = await pool.query(
    `INSERT INTO items (name, sku, storage_requirement)
     VALUES ($1, $2, $3)
     RETURNING id, name, sku, storage_requirement AS "storageRequirement"`,
    [input.name, input.sku, input.storageRequirement]
  );

  return result.rows[0];
}

export async function listActiveItemRecords() {
  const result = await pool.query(
    `SELECT id, name, sku, storage_requirement AS "storageRequirement"
     FROM items
     WHERE deleted_at IS NULL
     ORDER BY sku`
  );

  return result.rows;
}

export async function findActiveItemBySku(client: Queryable, sku: string) {
  const result = await client.query<ItemRecord>(
    `SELECT id, name, sku, storage_requirement
     FROM items
     WHERE sku = $1 AND deleted_at IS NULL`,
    [sku]
  );

  return result.rows[0] ?? null;
}

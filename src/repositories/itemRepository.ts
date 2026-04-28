import { pool } from "../database/db.js";
import type { ItemRecord, Queryable } from "./types.js";

type CreateItemRecordInput = {
  name: string;
  sku: string;
  storageRequirement: "STANDARD" | "COLD";
};

export async function createItemRecord(client: Queryable, input: CreateItemRecordInput) {
  const result = await client.query(
    `INSERT INTO items (name, sku, storage_requirement)
     VALUES ($1, $2, $3)
     RETURNING id, name, sku, storage_requirement AS "storageRequirement", created_at AS "createdAt"`,
    [input.name, input.sku, input.storageRequirement]
  );

  return result.rows[0];
}

export async function listActiveItemRecords() {
  const result = await pool.query(
    `SELECT
       i.id,
       i.name,
       i.sku,
       i.storage_requirement AS "storageRequirement",
       i.created_at AS "createdAt",
       COALESCE(
         json_agg(
           json_build_object(
             'id', w.id,
             'name', w.name,
             'quantity', inv.quantity,
             'lowStock', inv.quantity < 10,
             'low_stock', inv.quantity < 10
           )
           ORDER BY w.name
         ) FILTER (WHERE w.id IS NOT NULL),
         '[]'::json
       ) AS warehouses
     FROM items i
     LEFT JOIN inventory inv ON inv.item_id = i.id
     LEFT JOIN warehouses w ON w.id = inv.warehouse_id AND w.deleted_at IS NULL
     WHERE i.deleted_at IS NULL
     GROUP BY i.id
     ORDER BY i.created_at DESC, i.sku`
  );

  return result.rows;
}

export async function updateItemRecord(client: Queryable, itemId: string, input: CreateItemRecordInput) {
  const result = await client.query(
    `UPDATE items
     SET name = $2, sku = $3, storage_requirement = $4, updated_at = now()
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING id, name, sku, storage_requirement AS "storageRequirement", created_at AS "createdAt"`,
    [itemId, input.name, input.sku, input.storageRequirement]
  );

  return result.rows[0] ?? null;
}

export async function lockActiveItem(client: Queryable, itemId: string) {
  const result = await client.query<ItemRecord>(
    `SELECT id, name, sku, storage_requirement
     FROM items
     WHERE id = $1 AND deleted_at IS NULL
     FOR UPDATE`,
    [itemId]
  );

  return result.rows[0] ?? null;
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

export async function countInventoryRowsForItem(client: Queryable, itemId: string) {
  const result = await client.query<{ total: string }>(
    "SELECT COUNT(*)::text AS total FROM inventory WHERE item_id = $1",
    [itemId]
  );

  return Number(result.rows[0]?.total ?? 0);
}

export async function softDeleteItemRecord(client: Queryable, itemId: string) {
  await client.query("UPDATE items SET deleted_at = now(), updated_at = now() WHERE id = $1", [itemId]);
}

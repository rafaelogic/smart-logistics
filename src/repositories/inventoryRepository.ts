import { pool } from "../database/db.js";
import type { Queryable } from "./types.js";

export async function getInventoryQuantityForUpdate(
  client: Queryable,
  warehouseId: string,
  itemId: string
) {
  // Lock the source SKU row so concurrent transfers cannot spend the same units twice.
  const result = await client.query<{ quantity: number }>(
    `SELECT quantity
     FROM inventory
     WHERE warehouse_id = $1 AND item_id = $2
     FOR UPDATE`,
    [warehouseId, itemId]
  );

  return result.rows[0]?.quantity ?? 0;
}

export async function incrementInventoryQuantity(
  client: Queryable,
  warehouseId: string,
  itemId: string,
  quantity: number,
  priority?: boolean
) {
  await client.query(
    `INSERT INTO inventory (warehouse_id, item_id, quantity, priority)
     VALUES ($1, $2, $3, COALESCE($4, false))
     ON CONFLICT (warehouse_id, item_id)
     DO UPDATE SET
       quantity = inventory.quantity + EXCLUDED.quantity,
       priority = COALESCE($4, inventory.priority),
       updated_at = now()`,
    [warehouseId, itemId, quantity, priority ?? null]
  );
}

export async function setInventoryQuantity(
  client: Queryable,
  warehouseId: string,
  itemId: string,
  quantity: number,
  priority?: boolean
) {
  await client.query(
    `INSERT INTO inventory (warehouse_id, item_id, quantity, priority)
     VALUES ($1, $2, $3, COALESCE($4, false))
     ON CONFLICT (warehouse_id, item_id)
     DO UPDATE SET
       quantity = EXCLUDED.quantity,
       priority = COALESCE($4, inventory.priority),
       updated_at = now()`,
    [warehouseId, itemId, quantity, priority ?? null]
  );
}

export async function decrementInventoryQuantity(
  client: Queryable,
  warehouseId: string,
  itemId: string,
  quantity: number
) {
  // Decrements are explicit updates; inserting a negative row would violate the quantity check.
  await client.query(
    `UPDATE inventory
     SET quantity = quantity + $3, updated_at = now()
     WHERE warehouse_id = $1 AND item_id = $2`,
    [warehouseId, itemId, -quantity]
  );
}

export async function deleteZeroQuantityInventory(client: Queryable) {
  await client.query("DELETE FROM inventory WHERE quantity = 0");
}

export async function deleteInventoryRecord(client: Queryable, warehouseId: string, itemId: string) {
  const result = await client.query(
    `DELETE FROM inventory
     WHERE warehouse_id = $1 AND item_id = $2`,
    [warehouseId, itemId]
  );

  return (result.rowCount ?? 0) > 0;
}

export async function getWarehouseInventoryReportRecords(
  warehousesPerPage: number,
  warehouseOffset: number,
  warehouseItemsPerPage: number,
  warehouseItemOffset: number
) {
  // LATERAL keeps each warehouse's item list independently paginated.
  const result = await pool.query(
    `WITH warehouse_occupancy AS (
       SELECT
         w.id,
         w.name,
         w.location,
         w.max_capacity,
         w.type,
         COALESCE(SUM(inv.quantity), 0)::int AS current_occupancy
       FROM warehouses w
       LEFT JOIN inventory inv ON inv.warehouse_id = w.id
       WHERE w.deleted_at IS NULL
       GROUP BY w.id
     ),
     paged_warehouses AS (
       SELECT *
       FROM warehouse_occupancy
       ORDER BY name
       LIMIT $1 OFFSET $2
     )
     SELECT
       pw.id,
       pw.name,
       pw.location,
       pw.max_capacity AS total_capacity,
       pw.current_occupancy,
       ROUND((pw.current_occupancy::numeric / pw.max_capacity::numeric) * 100, 2)::float AS percent_full,
       COALESCE(item_count.total_items, 0) AS total_items,
       COALESCE(paged_items.items, '[]'::json) AS items
     FROM paged_warehouses pw
     LEFT JOIN LATERAL (
       SELECT COUNT(*)::int AS total_items
       FROM inventory inv
       JOIN items i ON i.id = inv.item_id AND i.deleted_at IS NULL
       WHERE inv.warehouse_id = pw.id
     ) item_count ON TRUE
     LEFT JOIN LATERAL (
       SELECT COALESCE(json_agg(row_to_json(item_rows)), '[]'::json) AS items
       FROM (
         SELECT
           i.sku,
           i.name,
           inv.quantity,
           inv.priority,
           inv.created_at AS "createdAt",
           inv.priority AND inv.created_at >= now() - interval '24 hours' AS "recentPriority",
           inv.quantity < 10 AS low_stock
         FROM inventory inv
         JOIN items i ON i.id = inv.item_id AND i.deleted_at IS NULL
         WHERE inv.warehouse_id = pw.id
         ORDER BY
           CASE WHEN inv.priority AND inv.created_at >= now() - interval '24 hours' THEN 0 ELSE 1 END,
           i.sku
         LIMIT $3 OFFSET $4
       ) item_rows
     ) paged_items ON TRUE
     ORDER BY pw.name`,
    [warehousesPerPage, warehouseOffset, warehouseItemsPerPage, warehouseItemOffset]
  );

  return result.rows;
}

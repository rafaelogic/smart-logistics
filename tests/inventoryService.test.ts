import { newDb } from "pg-mem";
import { beforeEach, describe, expect, it } from "vitest";
import type { Pool, PoolClient } from "pg";
import { addInventory, setInventory, transferInventory } from "../src/services/inventoryService.js";
import { addInventorySchema, setInventorySchema, transferInventorySchema } from "../src/validations/schemas.js";

const standardA = "00000000-0000-0000-0000-000000000001";
const standardB = "00000000-0000-0000-0000-000000000002";
const coldWarehouse = "00000000-0000-0000-0000-000000000003";
const standardItem = "10000000-0000-0000-0000-000000000001";
const coldItem = "10000000-0000-0000-0000-000000000002";

let pool: Pool;

async function withTestTransaction<T>(run: (client: PoolClient) => Promise<T>) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await run(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function getQuantity(warehouseId: string, itemId: string) {
  const result = await pool.query<{ quantity: number }>(
    "SELECT quantity FROM inventory WHERE warehouse_id = $1 AND item_id = $2",
    [warehouseId, itemId]
  );

  return result.rows[0]?.quantity ?? 0;
}

async function getPriority(warehouseId: string, itemId: string) {
  const result = await pool.query<{ priority: boolean }>(
    "SELECT priority FROM inventory WHERE warehouse_id = $1 AND item_id = $2",
    [warehouseId, itemId]
  );

  return result.rows[0]?.priority ?? false;
}

beforeEach(async () => {
  const db = newDb();
  const pg = db.adapters.createPg();
  pool = new pg.Pool();

  db.public.none(`
    CREATE TABLE warehouses (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      max_capacity INTEGER NOT NULL CHECK (max_capacity > 0),
      type TEXT NOT NULL CHECK (type IN ('STANDARD', 'COLD')),
      deleted_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE items (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL,
      sku TEXT NOT NULL UNIQUE,
      storage_requirement TEXT NOT NULL CHECK (storage_requirement IN ('STANDARD', 'COLD')),
      deleted_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE inventory (
      warehouse_id UUID NOT NULL REFERENCES warehouses(id),
      item_id UUID NOT NULL REFERENCES items(id),
      quantity INTEGER NOT NULL CHECK (quantity >= 0),
      priority BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (warehouse_id, item_id)
    );

    INSERT INTO warehouses (id, name, location, max_capacity, type) VALUES
      ('${standardA}', 'Standard A', 'Manila', 100, 'STANDARD'),
      ('${standardB}', 'Standard B', 'Cebu', 20, 'STANDARD'),
      ('${coldWarehouse}', 'Cold A', 'Davao', 100, 'COLD');

    INSERT INTO items (id, name, sku, storage_requirement) VALUES
      ('${standardItem}', 'Rice', 'RIC-12345-A', 'STANDARD'),
      ('${coldItem}', 'Ice Cream', 'ICE-12345-C', 'COLD');

    INSERT INTO inventory (warehouse_id, item_id, quantity) VALUES
      ('${standardA}', '${standardItem}', 50),
      ('${standardB}', '${standardItem}', 15),
      ('${coldWarehouse}', '${coldItem}', 20);
  `);
});

describe("transferInventory", () => {
  it("moves the requested SKU from source to destination", async () => {
    await withTestTransaction((client) =>
      transferInventory(client, {
        fromWarehouseId: standardA,
        toWarehouseId: standardB,
        sku: "RIC-12345-A",
        quantity: 5
      })
    );

    expect(await getQuantity(standardA, standardItem)).toBe(45);
    expect(await getQuantity(standardB, standardItem)).toBe(20);
  });

  it("rolls back when the destination lacks capacity", async () => {
    await expect(
      withTestTransaction((client) =>
        transferInventory(client, {
          fromWarehouseId: standardA,
          toWarehouseId: standardB,
          sku: "RIC-12345-A",
          quantity: 6
        })
      )
    ).rejects.toMatchObject({ error: "INSUFFICIENT_CAPACITY" });

    expect(await getQuantity(standardA, standardItem)).toBe(50);
    expect(await getQuantity(standardB, standardItem)).toBe(15);
  });

  it("rolls back when storage requirements are incompatible", async () => {
    await expect(
      withTestTransaction((client) =>
        transferInventory(client, {
          fromWarehouseId: coldWarehouse,
          toWarehouseId: standardA,
          sku: "ICE-12345-C",
          quantity: 5
        })
      )
    ).rejects.toMatchObject({ error: "INCOMPATIBLE_STORAGE" });

    expect(await getQuantity(coldWarehouse, coldItem)).toBe(20);
    expect(await getQuantity(standardA, coldItem)).toBe(0);
  });

  it("rolls back when source stock is insufficient", async () => {
    await expect(
      withTestTransaction((client) =>
        transferInventory(client, {
          fromWarehouseId: standardA,
          toWarehouseId: coldWarehouse,
          sku: "RIC-12345-A",
          quantity: 51
        })
      )
    ).rejects.toMatchObject({ error: "INSUFFICIENT_STOCK" });

    expect(await getQuantity(standardA, standardItem)).toBe(50);
    expect(await getQuantity(coldWarehouse, standardItem)).toBe(0);
  });

  it("rejects invalid SKU and negative quantity before transfer logic runs", () => {
    const result = transferInventorySchema.safeParse({
      fromWarehouseId: standardA,
      toWarehouseId: standardB,
      sku: "bad-sku",
      quantity: -1
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues).toHaveLength(2);
  });
});

describe("addInventory", () => {
  it("rejects negative quantities before add logic runs", () => {
    const result = addInventorySchema.safeParse({
      warehouseId: standardA,
      sku: "RIC-12345-A",
      quantity: -1
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Quantity must be greater than 0");
  });

  it("prevents adding stock when warehouse capacity would be exceeded", async () => {
    await expect(
      withTestTransaction((client) =>
        addInventory(client, {
          warehouseId: standardB,
          sku: "RIC-12345-A",
          quantity: 6
        })
      )
    ).rejects.toMatchObject({ error: "INSUFFICIENT_CAPACITY" });

    expect(await getQuantity(standardB, standardItem)).toBe(15);
  });

  it("prevents adding cold stock to standard warehouses", async () => {
    await expect(
      withTestTransaction((client) =>
        addInventory(client, {
          warehouseId: standardA,
          sku: "ICE-12345-C",
          quantity: 1
        })
      )
    ).rejects.toMatchObject({ error: "INCOMPATIBLE_STORAGE" });
  });

  it("stores priority when adding stock", async () => {
    await withTestTransaction((client) =>
      addInventory(client, {
        warehouseId: coldWarehouse,
        sku: "RIC-12345-A",
        quantity: 1,
        priority: true
      })
    );

    expect(await getPriority(coldWarehouse, standardItem)).toBe(true);
  });
});

describe("setInventory", () => {
  it("rejects negative quantities but allows zero", async () => {
    expect(setInventorySchema.safeParse({ quantity: -1 }).success).toBe(false);
    expect(setInventorySchema.safeParse({ quantity: 0 }).success).toBe(true);

    await withTestTransaction((client) =>
      setInventory(client, {
        warehouseId: standardA,
        sku: "RIC-12345-A",
        quantity: 0
      })
    );

    expect(await getQuantity(standardA, standardItem)).toBe(0);
  });

  it("updates priority without requiring a quantity change", async () => {
    await withTestTransaction((client) =>
      setInventory(client, {
        warehouseId: standardA,
        sku: "RIC-12345-A",
        quantity: 50,
        priority: true
      })
    );

    expect(await getPriority(standardA, standardItem)).toBe(true);
  });
});

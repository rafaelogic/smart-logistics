import { Pool, PoolClient } from "pg";
import { config } from "../config/index.js";

export type DbClient = Pick<PoolClient, "query">;

export const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: config.databaseSsl ? { rejectUnauthorized: false } : undefined
});

export async function withTransaction<T>(
  run: (client: PoolClient) => Promise<T>,
  options: { isolationLevel?: "READ COMMITTED" | "SERIALIZABLE" } = {}
): Promise<T> {
  const client = await pool.connect();
  try {
    // SERIALIZABLE is the default because capacity checks depend on a stable occupancy snapshot.
    await client.query(`BEGIN ISOLATION LEVEL ${options.isolationLevel ?? "SERIALIZABLE"}`);
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

export function withLockedCapacityTransaction<T>(run: (client: PoolClient) => Promise<T>) {
  // Inventory capacity checks lock the touched warehouse rows explicitly with FOR UPDATE.
  // READ COMMITTED lets the next waiting request re-read occupancy after the first commit.
  return withTransaction(run, { isolationLevel: "READ COMMITTED" });
}

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedFile = path.resolve(__dirname, "../../seed.sql");

async function seed() {
  const sql = await fs.readFile(seedFile, "utf8");
  await pool.query(sql);
  console.info("Applied seed.sql");
}

seed()
  .then(() => pool.end())
  .catch((error) => {
    console.error(error);
    pool.end().finally(() => process.exit(1));
  });

import type { PoolClient } from "pg";

export type Queryable = Pick<PoolClient, "query">;

export type WarehouseRecord = {
  id: string;
  name: string;
  location: string;
  max_capacity: number;
  type: "STANDARD" | "COLD";
};

export type ItemRecord = {
  id: string;
  name: string;
  sku: string;
  storage_requirement: "STANDARD" | "COLD";
};

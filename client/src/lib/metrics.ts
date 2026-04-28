import { capacityFor } from "./api";
import type { Warehouse } from "../types/logistics";

export function getNetworkMetrics(warehouses: Warehouse[], reportRows: number) {
  const capacities = warehouses.map(capacityFor);
  const averageCapacity = capacities.length
    ? Math.round(capacities.reduce((sum, value) => sum + value, 0) / capacities.length)
    : 0;
  const exceptions = capacities.filter((value) => value >= 78).length;

  return {
    warehouseCount: warehouses.length,
    reportRows,
    averageCapacity,
    exceptions,
    healthScore: Math.max(0, 100 - exceptions * 3)
  };
}

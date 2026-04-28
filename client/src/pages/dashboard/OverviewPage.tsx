import { MetricCard } from "../../components/MetricCard";
import { InventoryHealth } from "../../components/dashboard/InventoryHealth";
import { WarehouseTable } from "../../components/dashboard/WarehouseTable";
import type { getNetworkMetrics } from "../../lib/metrics";
import type { InventoryReport, Item, Warehouse } from "../../types/logistics";
import { Link } from "react-router-dom";

type OverviewPageProps = {
  warehouses: Warehouse[];
  items: Item[];
  inventoryReport: InventoryReport;
  filteredWarehouses: Warehouse[];
  filteredItems: Item[];
  filteredInventoryReport: InventoryReport;
  searchQuery: string;
  metrics: ReturnType<typeof getNetworkMetrics>;
};

export function OverviewPage({
  warehouses,
  items,
  inventoryReport,
  filteredWarehouses,
  filteredItems,
  filteredInventoryReport,
  searchQuery,
  metrics
}: OverviewPageProps) {
  if (searchQuery.trim()) {
    return (
      <OverviewSearchResults
        query={searchQuery}
        warehouses={filteredWarehouses}
        items={filteredItems}
        inventoryReport={filteredInventoryReport}
      />
    );
  }

  return (
    <>
      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Dashboard metrics">
        <MetricCard label="Warehouses" value={metrics.warehouseCount} caption="network nodes" />
        <MetricCard label="Items" value={items.length || "-"} caption="active SKU catalog" />
        <MetricCard label="Capacity used" value={`${metrics.averageCapacity}%`} caption="weighted average" />
        <MetricCard label="Exceptions" value={metrics.exceptions} caption="need review" />
      </section>
      <div className="mt-6 grid gap-5 xl:grid-cols-[1.45fr_0.8fr]">
        <WarehouseTable warehouses={warehouses} onDelete={null} />
        <InventoryHealth metrics={metrics} inventoryReport={inventoryReport} />
      </div>
    </>
  );
}

function OverviewSearchResults({
  query,
  warehouses,
  items,
  inventoryReport
}: {
  query: string;
  warehouses: Warehouse[];
  items: Item[];
  inventoryReport: InventoryReport;
}) {
  const normalizedQuery = query.trim().toLowerCase();
  const inventoryWarehouses = inventoryReport.warehouses ?? inventoryReport.data ?? [];
  const inventoryItemCount = inventoryWarehouses.reduce((count, warehouse) => count + (warehouse.items?.length ?? 0), 0);
  const pageResults = [
    {
      title: "Warehouses",
      path: "/dashboard/warehouses",
      count: warehouses.length,
      label: `${warehouses.length} matching warehouse${warehouses.length === 1 ? "" : "s"}`,
      keywords: ["warehouse", "warehouses", "location", "capacity", "storage"]
    },
    {
      title: "Items",
      path: "/dashboard/items",
      count: items.length,
      label: `${items.length} matching SKU${items.length === 1 ? "" : "s"}`,
      keywords: ["item", "items", "sku", "stock", "low stock"]
    },
    {
      title: "Inventory",
      path: "/dashboard/inventory",
      count: inventoryWarehouses.length + inventoryItemCount,
      label: `${inventoryWarehouses.length} warehouse${inventoryWarehouses.length === 1 ? "" : "s"}, ${inventoryItemCount} item${inventoryItemCount === 1 ? "" : "s"}`,
      keywords: ["inventory", "stock", "transfer", "occupancy", "low stock"]
    }
  ].filter((result) => result.count > 0 || result.keywords.some((keyword) => keyword.includes(normalizedQuery)));

  return (
    <section className="mt-6 rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-extrabold text-foreground">Search results</h3>
          <p className="mt-1 text-sm text-muted-foreground">Open the matching page to view filtered data for "{query}".</p>
        </div>
        <span className="text-xs font-extrabold uppercase text-muted-foreground">{pageResults.length} pages</span>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {pageResults.map((result) => (
          <Link key={result.path} className="rounded-lg border border-border bg-muted/30 p-4 text-foreground transition hover:bg-muted" to={result.path}>
            <span className="text-lg font-extrabold">{result.title}</span>
            <span className="mt-2 block text-sm font-semibold text-muted-foreground">{result.label}</span>
          </Link>
        ))}
        {pageResults.length === 0 ? <p className="text-sm font-semibold text-muted-foreground">No matching pages found.</p> : null}
      </div>
    </section>
  );
}

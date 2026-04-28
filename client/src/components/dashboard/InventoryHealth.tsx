import type { getNetworkMetrics } from "../../lib/metrics";
import type { InventoryReport, InventoryReportItem } from "../../types/logistics";

type StockSummary = {
  sku: string;
  name: string;
  quantity: number;
  lowStock: boolean;
};

export function InventoryHealth({ metrics, inventoryReport }: { metrics: ReturnType<typeof getNetworkMetrics>; inventoryReport: InventoryReport }) {
  const { mostStocked, leastStocked } = summarizeStock(inventoryReport);

  return (
    <section className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-extrabold text-foreground">Inventory health</h3>
        <span className="text-xs font-extrabold uppercase text-muted-foreground">By storage type</span>
      </div>
      <div className="mt-6 flex items-center gap-5">
        <div className="grid h-32 w-32 place-items-center rounded-full bg-[conic-gradient(var(--primary)_0_68%,var(--muted-foreground)_68%_88%,#b7791f_88%_100%)]">
          <div className="size-20 rounded-full bg-background" />
        </div>
        <div>
          <strong className="text-4xl font-extrabold text-foreground">{metrics.healthScore}%</strong>
          <span className="mt-1 block text-sm font-bold text-muted-foreground">ready stock</span>
        </div>
      </div>
      {[
        ["bg-primary", "Standard storage"],
        ["bg-muted-foreground", "Cold storage"],
        ["bg-saffron", "Capacity watch"]
      ].map(([color, label]) => (
        <div key={label} className="mt-4 flex items-center gap-2 text-sm font-bold text-muted-foreground">
          <span className={`size-2.5 rounded-full ${color}`} />
          {label}
        </div>
      ))}
      <div className="mt-6 border-t border-border pt-4">
        <h4 className="text-sm font-extrabold uppercase text-muted-foreground">Stock range</h4>
        <div className="mt-3 grid gap-3">
          <StockRow label="Most stocked" item={mostStocked} />
          <StockRow label="Least stocked" item={leastStocked} />
        </div>
      </div>
    </section>
  );
}

function StockRow({ label, item }: { label: string; item: StockSummary | null }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase text-muted-foreground">{label}</p>
          <p className="mt-1 text-sm font-bold text-foreground">{item ? item.name : "No stock data"}</p>
          {item ? <p className="mt-1 font-mono text-xs text-muted-foreground">{item.sku}</p> : null}
        </div>
        {item ? <span className="text-sm font-extrabold text-foreground">{item.quantity}</span> : null}
      </div>
      {item?.lowStock ? (
        <span className="mt-2 inline-flex rounded-full border border-destructive/30 bg-destructive/10 px-2 py-1 text-xs font-bold text-destructive">
          Low Stock
        </span>
      ) : null}
    </div>
  );
}

function summarizeStock(report: InventoryReport) {
  const totals = new Map<string, StockSummary>();
  const warehouses = report.warehouses ?? report.data ?? [];

  warehouses.forEach((warehouse) => {
    (warehouse.items ?? []).forEach((item) => {
      const sku = item.sku;
      if (!sku) return;

      const current = totals.get(sku);
      const quantity = Number(item.quantity ?? 0);

      totals.set(sku, {
        sku,
        name: item.name ?? current?.name ?? sku,
        quantity: (current?.quantity ?? 0) + quantity,
        lowStock: Boolean(current?.lowStock || isLowStock(item))
      });
    });
  });

  const summaries = [...totals.values()].sort((left, right) => left.quantity - right.quantity);

  return {
    leastStocked: summaries[0] ?? null,
    mostStocked: summaries[summaries.length - 1] ?? null
  };
}

function isLowStock(item: InventoryReportItem) {
  return Boolean(item.low_stock ?? item.lowStock ?? Number(item.quantity ?? 0) < 10);
}

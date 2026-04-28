import { useEffect, useState } from "react";
import { ArrowRightLeft, PackageMinus, PackagePlus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ActionModal } from "../../components/dashboard/ActionModal";
import { FormStack, SkuField, TextField, WarehouseSelect } from "../../components/dashboard/FormControls";
import { addInventory, deleteInventory, getInventoryReport, setInventory, transferInventory } from "../../lib/api";
import type { InventoryReport, InventoryReportItem, InventoryReportWarehouse, Item, Warehouse } from "../../types/logistics";

type InventoryPageProps = {
  token: string | null;
  warehouses: Warehouse[];
  items: Item[];
  inventoryReport: InventoryReport;
  searchQuery: string;
  onRunAction: (action: () => Promise<unknown>, successMessage: string) => Promise<boolean>;
};

const quickLinks = [
  {
    key: "add",
    title: "Add stock",
    description: "Increase quantity after storage and capacity checks.",
    icon: PackagePlus
  },
  {
    key: "set",
    title: "Set stock",
    description: "Replace the exact warehouse quantity for one SKU.",
    icon: Save
  },
  {
    key: "transfer",
    title: "Transfer stock",
    description: "Move one SKU atomically between warehouses.",
    icon: ArrowRightLeft
  },
  {
    key: "delete",
    title: "Delete stock row",
    description: "Remove one warehouse-item inventory row.",
    icon: PackageMinus
  }
] as const;

const numberFormatter = new Intl.NumberFormat("en-US");
const warehouseItemPageSize = 100;
type InventoryFormErrors = Partial<Record<"warehouseId" | "fromWarehouseId" | "toWarehouseId" | "sku" | "quantity", string>>;

export function InventoryPage({ token, warehouses, items, inventoryReport, searchQuery, onRunAction }: InventoryPageProps) {
  const [activeAction, setActiveAction] = useState<(typeof quickLinks)[number]["key"] | null>(null);
  const warehouseOptions = warehouses.filter((warehouse) => warehouse.id);
  const skuOptions = items.filter((item) => item.sku);
  const [report, setReport] = useState(inventoryReport);
  const [warehouseItemPage, setWarehouseItemPage] = useState(inventoryReport.warehouseItemPage ?? 1);
  const reportWarehouses = report.warehouses ?? report.data ?? [];
  const maxItemsInWarehouse = reportWarehouses.reduce((max, warehouse) => Math.max(max, warehouse.total_items ?? warehouse.totalItems ?? warehouse.items?.length ?? 0), 0);
  const itemPageCount = Math.max(1, Math.ceil(maxItemsInWarehouse / warehouseItemPageSize));

  useEffect(() => {
    setReport(inventoryReport);
    setWarehouseItemPage(inventoryReport.warehouseItemPage ?? 1);
  }, [inventoryReport]);

  async function loadItemPage(nextPage: number) {
    if (!token) return;
    try {
      const nextReport = await getInventoryReport(token, {
        warehousePage: report.warehousePage ?? 1,
        warehousesPerPage: report.warehousesPerPage ?? 100,
        warehouseItemPage: nextPage,
        warehouseItemsPerPage: warehouseItemPageSize
      });
      setReport(nextReport);
      setWarehouseItemPage(nextPage);
    } catch {
      setWarehouseItemPage((currentPage) => currentPage);
    }
  }

  return (
    <div className="mt-6 flex flex-col gap-5">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {quickLinks.map((link) => {
          const Icon = link.icon;

          return (
            <ActionModal
              key={link.key}
              title={link.title}
              description={link.description}
              open={activeAction === link.key}
              onOpenChange={(open) => setActiveAction(open ? link.key : null)}
              trigger={
                <button className="text-left" type="button">
                  <Card className="h-full transition hover:bg-muted/60">
                    <CardHeader>
                      <Icon />
                      <CardTitle>{link.title}</CardTitle>
                      <CardDescription>{link.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </button>
              }
            >
              <InventoryActionForm
                action={link.key}
                token={token}
                warehouses={warehouseOptions}
                items={skuOptions}
                onRunAction={onRunAction}
                onSuccess={() => setActiveAction(null)}
              />
            </ActionModal>
          );
        })}
      </section>

      <InventoryReportTable
        warehouses={reportWarehouses}
        itemPage={warehouseItemPage}
        itemPageCount={itemPageCount}
        searching={Boolean(searchQuery.trim())}
        onItemPageChange={(page) => void loadItemPage(page)}
      />
    </div>
  );
}

function InventoryReportTable({
  warehouses,
  itemPage,
  itemPageCount,
  searching,
  onItemPageChange
}: {
  warehouses: InventoryReportWarehouse[];
  itemPage: number;
  itemPageCount: number;
  searching: boolean;
  onItemPageChange: (page: number) => void;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xl font-extrabold text-foreground">Inventory report</h3>
        <span className="text-xs font-extrabold uppercase text-muted-foreground">{warehouses.length} warehouses</span>
      </div>

      <div className="mt-5 overflow-x-auto">
        <div className="min-w-[1040px]">
          <div className="grid grid-cols-[1fr_0.7fr_0.78fr_0.7fr_1.65fr] gap-x-8 border-b border-border px-3 py-3 text-xs font-extrabold uppercase text-muted-foreground">
            <span>Warehouse</span>
            <span>Total capacity</span>
            <span>Current occupancy</span>
            <span>Percent full</span>
            <span>Items stored</span>
          </div>

          {warehouses.map((warehouse) => (
            <div key={warehouse.id ?? warehouse.name} className="grid grid-cols-[1fr_0.7fr_0.78fr_0.7fr_1.65fr] items-start gap-x-8 border-b border-border px-3 py-4 text-sm font-semibold text-foreground last:border-b-0">
              <div>
                <p>{warehouse.name ?? "Warehouse"}</p>
                <p className="mt-1 text-xs font-normal text-muted-foreground">{warehouse.location ?? "--"}</p>
              </div>
              <span>{formatNumber(warehouse.total_capacity ?? warehouse.totalCapacity ?? 0)}</span>
              <span>{formatNumber(warehouse.current_occupancy ?? warehouse.currentOccupancy ?? 0)}</span>
              <div className="grid gap-1.5">
                <span>{formatPercent(warehouse.percent_full ?? warehouse.percentFull ?? 0)}</span>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <span
                    className="block h-full rounded-full bg-foreground"
                    style={{ width: `${Math.min(100, Math.max(0, Number(warehouse.percent_full ?? warehouse.percentFull ?? 0)))}%` }}
                  />
                </div>
              </div>
              <InventoryItems
                items={warehouse.items ?? []}
                totalItems={warehouse.total_items ?? warehouse.totalItems ?? warehouse.items?.length ?? 0}
              />
            </div>
          ))}

          {warehouses.length === 0 ? <p className="px-3 py-5 text-sm font-semibold text-muted-foreground">No inventory report loaded yet.</p> : null}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <p className="text-sm font-semibold text-muted-foreground">{searching ? "Showing filtered report rows" : `SKU page ${itemPage} / ${itemPageCount}`}</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={searching || itemPage <= 1} onClick={() => onItemPageChange(itemPage - 1)}>Previous SKUs</Button>
          <Button variant="outline" size="sm" disabled={searching || itemPage >= itemPageCount} onClick={() => onItemPageChange(itemPage + 1)}>Next SKUs</Button>
        </div>
      </div>
    </section>
  );
}

function InventoryItems({ items, totalItems }: { items: InventoryReportItem[]; totalItems: number }) {
  if (items.length === 0) {
    return <span className="text-sm font-normal text-muted-foreground">No stored items</span>;
  }

  const previewItems = items.slice(0, 6);
  const hiddenCount = Math.max(0, totalItems - previewItems.length);
  const lowStockCount = items.filter((item) => Boolean(item.low_stock ?? item.lowStock)).length;

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-bold text-foreground">{formatNumber(totalItems)} item{totalItems === 1 ? "" : "s"}</span>
        {lowStockCount > 0 ? (
          <span className="rounded-full border border-destructive/20 bg-destructive/10 px-2 py-0.5 font-semibold text-destructive">
            {formatNumber(lowStockCount)} low
          </span>
        ) : null}
      </div>
      <div className="grid max-w-xl gap-1.5 sm:grid-cols-2">
        {previewItems.map((item) => {
        const lowStock = Boolean(item.low_stock ?? item.lowStock);

        return (
          <div
            key={`${item.sku ?? item.name}-${item.quantity}`}
            className="flex min-w-0 items-center justify-between gap-2 rounded-md border border-border bg-muted/30 px-2 py-1 text-xs"
          >
            <span className="min-w-0 truncate font-mono text-foreground">{item.sku ?? item.name}</span>
            <span className="shrink-0 font-bold text-foreground">{formatNumber(item.quantity ?? 0)}</span>
            {lowStock ? <span className="size-1.5 shrink-0 rounded-full bg-destructive" aria-label="Low Stock" /> : null}
          </div>
        );
      })}
      </div>
      {hiddenCount > 0 ? (
        <span className="text-xs font-semibold text-muted-foreground">
          +{formatNumber(hiddenCount)} more on this SKU page
        </span>
      ) : null}
    </div>
  );
}

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function formatPercent(value: number) {
  return `${Number(value).toFixed(2).replace(/\.00$/, "")}%`;
}

function InventoryActionForm({
  action,
  token,
  warehouses,
  items,
  onRunAction,
  onSuccess
}: {
  action: (typeof quickLinks)[number]["key"];
  token: string | null;
  warehouses: Warehouse[];
  items: Item[];
  onRunAction: (action: () => Promise<unknown>, successMessage: string) => Promise<boolean>;
  onSuccess: () => void;
}) {
  const [errors, setErrors] = useState<InventoryFormErrors>({});

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const formElement = event.currentTarget;
        const form = new FormData(event.currentTarget);
        const sku = String(form.get("sku") ?? "").toUpperCase();
        const warehouseId = String(form.get("warehouseId") ?? "");
        const quantity = Number(form.get("quantity"));
        const nextErrors = validateInventoryForm(form, action, warehouses, items);

        setErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) {
          return;
        }

        const submit =
          action === "add"
            ? onRunAction(() => addInventory(token!, { warehouseId, sku, quantity }), "Inventory added.")
            : action === "set"
              ? onRunAction(() => setInventory(token!, { warehouseId, sku, quantity }), "Inventory quantity updated.")
              : action === "transfer"
                ? onRunAction(
                    () =>
                      transferInventory(token!, {
                        fromWarehouseId: String(form.get("fromWarehouseId") ?? ""),
                        toWarehouseId: String(form.get("toWarehouseId") ?? ""),
                        sku,
                        quantity
                      }),
                    "Inventory transferred."
                  )
                : onRunAction(() => deleteInventory(token!, { warehouseId, sku }), "Inventory row deleted.");

        void submit.then((success) => {
          if (success) {
            setErrors({});
            formElement.reset();
            onSuccess();
          }
        });
      }}
    >
      <FormStack>
        {action === "transfer" ? (
          <>
            <WarehouseSelect warehouses={warehouses} name="fromWarehouseId" label="From warehouse" error={errors.fromWarehouseId} />
            <WarehouseSelect warehouses={warehouses} name="toWarehouseId" label="To warehouse" error={errors.toWarehouseId} />
          </>
        ) : (
          <WarehouseSelect warehouses={warehouses} name="warehouseId" label="Warehouse" error={errors.warehouseId} />
        )}
        <SkuField items={items} error={errors.sku} />
        {action !== "delete" ? (
          <TextField name="quantity" label="Quantity" type="number" min={action === "set" ? "0" : "1"} placeholder="10" error={errors.quantity} />
        ) : null}
        <Button type="submit">{quickLinks.find((link) => link.key === action)?.title ?? "Submit"}</Button>
      </FormStack>
    </form>
  );
}

function validateInventoryForm(form: FormData, action: (typeof quickLinks)[number]["key"], warehouses: Warehouse[], items: Item[]) {
  const errors: InventoryFormErrors = {};
  const sku = String(form.get("sku") ?? "").trim().toUpperCase();
  const quantityValue = String(form.get("quantity") ?? "").trim();
  const quantity = Number(quantityValue);
  const item = items.find((candidate) => String(candidate.sku ?? "").toUpperCase() === sku);

  if (action === "transfer") {
    const fromWarehouseId = String(form.get("fromWarehouseId") ?? "");
    const toWarehouseId = String(form.get("toWarehouseId") ?? "");

    if (!fromWarehouseId) errors.fromWarehouseId = "Select a source warehouse.";
    if (!toWarehouseId) errors.toWarehouseId = "Select a destination warehouse.";
    if (fromWarehouseId && toWarehouseId && fromWarehouseId === toWarehouseId) {
      errors.toWarehouseId = "Destination must be different.";
    }
  } else {
    const warehouseId = String(form.get("warehouseId") ?? "");
    if (!warehouseId) errors.warehouseId = "Select a warehouse.";
  }

  if (!sku) {
    errors.sku = "SKU is required.";
  } else if (!/^[A-Z]{3}-\d{5}-[A-Z]$/.test(sku)) {
    errors.sku = "Use the ABC-12345-X format.";
  } else if (!item) {
    errors.sku = "Choose an existing SKU from the item catalog.";
  }

  if (action !== "delete") {
    const minimum = action === "set" ? 0 : 1;
    if (!quantityValue) {
      errors.quantity = "Quantity is required.";
    } else if (!Number.isInteger(quantity) || quantity < minimum) {
      errors.quantity = action === "set" ? "Quantity must be a whole number 0 or greater." : "Quantity must be a whole number greater than 0.";
    }
  }

  if (item && quantityValue && Number.isInteger(quantity)) {
    const selectedWarehouseId = action === "transfer" ? String(form.get("toWarehouseId") ?? "") : String(form.get("warehouseId") ?? "");
    const selectedWarehouse = warehouses.find((warehouse) => warehouse.id === selectedWarehouseId);
    const itemStorage = item.storageRequirement ?? item.storage_requirement ?? "STANDARD";
    const warehouseType = selectedWarehouse?.type ?? selectedWarehouse?.storageType ?? "STANDARD";

    if (selectedWarehouse && itemStorage === "COLD" && warehouseType !== "COLD") {
      const message = "Cold-storage SKUs can only go to cold warehouses.";
      if (action === "transfer") {
        errors.toWarehouseId = message;
      } else {
        errors.warehouseId = message;
      }
    }

    if (selectedWarehouse && (action === "add" || action === "transfer")) {
      const maxCapacity = Number(selectedWarehouse.maxCapacity ?? selectedWarehouse.max_capacity ?? 0);
      const currentOccupancy = Number(selectedWarehouse.currentQuantity ?? selectedWarehouse.current_quantity ?? selectedWarehouse.quantity ?? 0);

      if (maxCapacity > 0 && currentOccupancy + quantity > maxCapacity) {
        const remaining = Math.max(0, maxCapacity - currentOccupancy);
        const message = `Only ${formatNumber(remaining)} capacity slots remain in this warehouse.`;
        if (action === "transfer") {
          errors.toWarehouseId = message;
        } else {
          errors.quantity = message;
        }
      }
    }
  }

  return errors;
}

import { useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { capacityFor } from "../../lib/api";
import type { Warehouse } from "../../types/logistics";

type WarehouseTableProps = {
  warehouses: Warehouse[];
  onDelete?: null | ((warehouseId: string) => void);
  onEdit?: (warehouse: Warehouse) => void;
};

const pageSize = 8;

export function WarehouseTable({ warehouses, onDelete, onEdit }: WarehouseTableProps) {
  const [page, setPage] = useState(1);
  const [viewingWarehouse, setViewingWarehouse] = useState<Warehouse | null>(null);
  const [warehousePendingDelete, setWarehousePendingDelete] = useState<Warehouse | null>(null);
  const hasActions = Boolean(onDelete || onEdit);
  const gridColumns = hasActions
    ? "grid-cols-[1.15fr_0.7fr_1fr_0.72fr_48px]"
    : "grid-cols-[1.4fr_0.75fr_1fr_0.75fr]";
  const pageCount = Math.max(1, Math.ceil(warehouses.length / pageSize));
  const paginatedWarehouses = useMemo(
    () => warehouses.slice((page - 1) * pageSize, page * pageSize),
    [page, warehouses]
  );

  useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, pageCount));
  }, [pageCount]);

  return (
    <section className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xl font-extrabold text-foreground">Warehouse capacity</h3>
        <span className="text-xs font-extrabold uppercase text-muted-foreground">{warehouses.length} active</span>
      </div>
      <div className="mt-5 overflow-x-auto">
        <div className="min-w-[760px]">
          <div className={`grid ${gridColumns} border-b border-border px-3 py-3 text-xs font-extrabold uppercase text-muted-foreground`}>
            <span>Warehouse</span>
            <span>Type</span>
            <span>Capacity</span>
            <span>Status</span>
            {hasActions ? <span aria-hidden="true" /> : null}
          </div>
          {paginatedWarehouses.map((warehouse, index) => {
            const capacity = capacityFor(warehouse);
            const status = capacity >= 88 ? ["Limited", "bg-destructive/10 text-destructive"] : capacity >= 78 ? ["Watch", "bg-amber-500/10 text-amber-700"] : ["Healthy", "bg-emerald-500/10 text-emerald-700"];

            return (
              <div key={`${warehouse.id ?? warehouse.name ?? "warehouse"}-${index}`} className={`grid ${gridColumns} items-center border-b border-border px-3 py-4 text-sm font-semibold text-foreground last:border-b-0`}>
                <span>
                  {warehouse.name ?? "Warehouse"}
                  <small className="mt-1 block text-xs font-bold text-muted-foreground">{warehouse.location ?? "No location"}</small>
                </span>
                <span>{warehouse.type ?? warehouse.storageType ?? "STANDARD"}</span>
                <CapacityCell warehouse={warehouse} capacity={capacity} />
                <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-extrabold ${status[1]}`}>{status[0]}</span>
                {hasActions ? (
                  <RowActions
                    disabled={!warehouse.id}
                    label={warehouse.name ?? "warehouse"}
                    onView={() => setViewingWarehouse(warehouse)}
                    onEdit={onEdit ? () => onEdit(warehouse) : undefined}
                    onDelete={onDelete && warehouse.id ? () => setWarehousePendingDelete(warehouse) : undefined}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
      <TablePagination
        page={page}
        pageCount={pageCount}
        total={warehouses.length}
        pageSize={pageSize}
        onPageChange={setPage}
      />
      <WarehouseViewDialog warehouse={viewingWarehouse} onOpenChange={(open) => !open && setViewingWarehouse(null)} />
      <ConfirmDeleteDialog
        open={Boolean(warehousePendingDelete)}
        title={isWarehouseEmpty(warehousePendingDelete) ? "Delete warehouse?" : "Warehouse is not empty"}
        description={
          isWarehouseEmpty(warehousePendingDelete)
            ? `This will delete ${warehousePendingDelete?.name ?? "this warehouse"}.`
            : `${warehousePendingDelete?.name ?? "This warehouse"} still has ${warehouseOccupancy(warehousePendingDelete)} stored units. Clear its inventory before deleting.`
        }
        canConfirm={isWarehouseEmpty(warehousePendingDelete)}
        onCancel={() => setWarehousePendingDelete(null)}
        onConfirm={() => {
          if (warehousePendingDelete?.id) {
            onDelete?.(warehousePendingDelete.id);
          }
          setWarehousePendingDelete(null);
        }}
      />
    </section>
  );
}

function RowActions({
  disabled,
  label,
  onView,
  onEdit,
  onDelete
}: {
  disabled: boolean;
  label: string;
  onView: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function run(action?: () => void) {
    if (!action) return;
    setOpen(false);
    action();
  }

  function toggleMenu(event: MouseEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + 6,
      left: Math.max(8, rect.right - 144)
    });
    setOpen((current) => !current);
  }

  return (
    <div className="relative flex justify-end" ref={menuRef}>
      <Button variant="ghost" size="icon-lg" disabled={disabled} aria-label={`Open actions for ${label}`} aria-haspopup="menu" aria-expanded={open} onClick={toggleMenu}>
        <MoreHorizontal />
      </Button>
      {open ? (
        <div
          className="fixed z-[80] w-36 overflow-hidden rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-xl ring-1 ring-foreground/10"
          role="menu"
          style={{ top: menuPosition.top, left: menuPosition.left }}
        >
          <MenuButton onClick={() => run(onView)}>
            <span>View</span>
          </MenuButton>
          {onEdit ? (
            <MenuButton onClick={() => run(onEdit)}>
              <span>Edit</span>
            </MenuButton>
          ) : null}
          {onDelete ? (
            <MenuButton destructive onClick={() => run(onDelete)}>
              <span>Delete</span>
            </MenuButton>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function MenuButton({ children, destructive = false, onClick }: { children: ReactNode; destructive?: boolean; onClick: () => void }) {
  return (
    <button
      className={`flex min-h-9 w-full items-center rounded-md px-2 text-left text-sm font-normal outline-none hover:bg-accent focus:bg-accent ${
        destructive ? "text-destructive hover:bg-destructive/10 focus:bg-destructive/10" : "hover:text-accent-foreground focus:text-accent-foreground"
      }`}
      type="button"
      role="menuitem"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function CapacityCell({ warehouse, capacity }: { warehouse: Warehouse; capacity: number }) {
  const max = Number(warehouse.maxCapacity ?? warehouse.max_capacity ?? 0);
  const current = warehouseOccupancy(warehouse);

  return (
    <span className="min-w-0 pr-3">
      <span className="block text-sm font-bold text-foreground">
        {capacity}% <span className="text-xs text-muted-foreground">({current} / {max || "--"})</span>
      </span>
      <span className="mt-2 block h-2 overflow-hidden rounded-full bg-muted">
        <span className="block h-full rounded-full bg-primary transition-all" style={{ width: `${capacity}%` }} />
      </span>
    </span>
  );
}

function TablePagination({
  page,
  pageCount,
  total,
  pageSize,
  onPageChange
}: {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
      <p className="text-sm font-semibold text-muted-foreground">
        Showing {start}-{end} of {total}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Previous
        </Button>
        <span className="min-w-16 text-center text-sm font-bold text-foreground">
          {page} / {pageCount}
        </span>
        <Button variant="outline" size="sm" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}

function WarehouseViewDialog({ warehouse, onOpenChange }: { warehouse: Warehouse | null; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={Boolean(warehouse)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{warehouse?.name ?? "Warehouse"}</DialogTitle>
          <DialogDescription>Warehouse record details.</DialogDescription>
        </DialogHeader>
        <dl className="grid gap-3 text-sm">
          <Detail label="Location" value={warehouse?.location ?? "No location"} />
          <Detail label="Type" value={warehouse?.type ?? warehouse?.storageType ?? "STANDARD"} />
          <Detail label="Max capacity" value={warehouse?.maxCapacity ?? warehouse?.max_capacity ?? "--"} />
          <Detail label="Current quantity" value={warehouse?.currentQuantity ?? warehouse?.current_quantity ?? warehouse?.quantity ?? 0} />
          <Detail label="Capacity used" value={`${capacityFor(warehouse ?? {})}%`} />
          <Detail label="ID" value={warehouse?.id ?? "--"} />
        </dl>
      </DialogContent>
    </Dialog>
  );
}

function Detail({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="grid gap-1 rounded-lg border border-border bg-muted/40 p-3">
      <dt className="text-xs font-bold uppercase text-muted-foreground">{label}</dt>
      <dd className="break-words font-semibold text-foreground">{value}</dd>
    </div>
  );
}

function ConfirmDeleteDialog({
  open,
  title,
  description,
  canConfirm = true,
  onCancel,
  onConfirm
}: {
  open: boolean;
  title: string;
  description: string;
  canConfirm?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>{canConfirm ? "Cancel" : "Close"}</Button>
          {canConfirm ? <Button variant="destructive" onClick={onConfirm}>Delete</Button> : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function warehouseOccupancy(warehouse: Warehouse | null) {
  return Number(warehouse?.currentQuantity ?? warehouse?.current_quantity ?? warehouse?.quantity ?? 0);
}

function isWarehouseEmpty(warehouse: Warehouse | null) {
  return Boolean(warehouse?.id) && warehouseOccupancy(warehouse) === 0;
}

import { useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Item } from "../../types/logistics";

type ItemTableProps = {
  items: Item[];
  onDelete?: (itemId: string) => void;
  onEdit?: (item: Item) => void;
};

const pageSize = 10;

export function ItemTable({ items, onDelete, onEdit }: ItemTableProps) {
  const [page, setPage] = useState(1);
  const [viewingItem, setViewingItem] = useState<Item | null>(null);
  const [itemPendingDelete, setItemPendingDelete] = useState<Item | null>(null);
  const hasActions = Boolean(onDelete || onEdit);
  const gridColumns = hasActions ? "grid-cols-[1fr_0.68fr_0.72fr_0.9fr_48px]" : "grid-cols-[1fr_0.8fr_0.8fr_0.9fr]";
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const paginatedItems = useMemo(() => items.slice((page - 1) * pageSize, page * pageSize), [items, page]);

  useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, pageCount));
  }, [pageCount]);

  return (
    <section className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xl font-extrabold text-foreground">Item catalog</h3>
        <span className="text-xs font-extrabold uppercase text-muted-foreground">{items.length} active</span>
      </div>
      <div className="mt-5 overflow-x-auto">
        <div className={hasActions ? "min-w-[900px]" : "min-w-[760px]"}>
          <div className={`grid ${gridColumns} border-b border-border px-3 py-3 text-xs font-extrabold uppercase text-muted-foreground`}>
            <span>Name</span>
            <span>SKU</span>
            <span>Storage</span>
            <span>Warehouse</span>
            {hasActions ? <span aria-hidden="true" /> : null}
          </div>
          {paginatedItems.map((item, index) => (
            <div key={`${item.sku ?? "item"}-${index}`} className={`grid ${gridColumns} items-center border-b border-border px-3 py-4 text-sm font-semibold text-foreground last:border-b-0`}>
              <span>{item.name ?? "Item"}</span>
              <span className="font-mono">{item.sku ?? "--"}</span>
              <span>{item.storageRequirement ?? item.storage_requirement ?? "STANDARD"}</span>
              <WarehouseBadges item={item} />
              {hasActions ? (
                <RowActions
                  disabled={!item.id}
                  label={item.name ?? "item"}
                  onView={() => setViewingItem(item)}
                  onEdit={onEdit ? () => onEdit(item) : undefined}
                  onDelete={onDelete && item.id ? () => setItemPendingDelete(item) : undefined}
                />
              ) : null}
            </div>
          ))}
          {items.length === 0 ? <p className="px-3 py-5 text-sm font-semibold text-muted-foreground">No items loaded yet.</p> : null}
        </div>
      </div>
      <TablePagination page={page} pageCount={pageCount} total={items.length} pageSize={pageSize} onPageChange={setPage} />
      <ItemViewDialog item={viewingItem} onOpenChange={(open) => !open && setViewingItem(null)} />
      <ConfirmDeleteDialog
        open={Boolean(itemPendingDelete)}
        title="Delete item?"
        description={`This will delete ${itemPendingDelete?.name ?? "this item"} if it is not used in inventory.`}
        onCancel={() => setItemPendingDelete(null)}
        onConfirm={() => {
          if (itemPendingDelete?.id) {
            onDelete?.(itemPendingDelete.id);
          }
          setItemPendingDelete(null);
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

function ItemViewDialog({ item, onOpenChange }: { item: Item | null; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={Boolean(item)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{item?.name ?? "Item"}</DialogTitle>
          <DialogDescription>Catalog item details.</DialogDescription>
        </DialogHeader>
        <dl className="grid gap-3 text-sm">
          <Detail label="SKU" value={item?.sku ?? "--"} />
          <Detail label="Storage requirement" value={item?.storageRequirement ?? item?.storage_requirement ?? "STANDARD"} />
          <Detail label="Warehouse" value={item ? warehousesForItem(item) : "--"} />
          <Detail label="ID" value={item?.id ?? "--"} />
        </dl>
      </DialogContent>
    </Dialog>
  );
}

function warehousesForItem(item: Item) {
  const warehouses = item.warehouses ?? [];
  if (warehouses.length === 0) {
    return "Not assigned";
  }

  return warehouses
    .map((warehouse) => {
      const name = warehouse.name ?? "Warehouse";
      return typeof warehouse.quantity === "number" ? `${name} (${warehouse.quantity})` : name;
    })
    .join(", ");
}

function WarehouseBadges({ item }: { item: Item }) {
  const warehouses = item.warehouses ?? [];

  if (warehouses.length === 0) {
    return (
      <span>
        <Badge variant="outline" className="border-border bg-muted/40 text-muted-foreground">Not assigned</Badge>
      </span>
    );
  }

  return (
    <span className="flex flex-wrap gap-1.5">
      {warehouses.map((warehouse, index) => {
        const name = warehouse.name ?? "Warehouse";
        const quantity = typeof warehouse.quantity === "number" ? ` (${warehouse.quantity})` : "";
        const lowStock = Boolean(warehouse.lowStock ?? warehouse.low_stock);

        return (
          <Badge
            key={`${warehouse.id ?? name}-${index}`}
            variant="outline"
            className={lowStock ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-border bg-muted/50 text-foreground"}
          >
            {name}{quantity}{lowStock ? " - Low Stock" : ""}
          </Badge>
        );
      })}
    </span>
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
  onCancel,
  onConfirm
}: {
  open: boolean;
  title: string;
  description: string;
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
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm}>Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

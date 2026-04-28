import { ChevronDown, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { Brand } from "../components/Brand";
import { UserMenu } from "../components/dashboard/UserMenu";
import { ApiRequestError, friendlyApiError, listItems } from "../lib/api";
import { getNetworkMetrics } from "../lib/metrics";
import type { ThemeMode } from "../lib/theme";
import type { AuthUser, InventoryReport, Item, UserProfile, Warehouse } from "../types/logistics";
import { InventoryPage } from "./dashboard/InventoryPage";
import { ItemsPage } from "./dashboard/ItemsPage";
import { OpsPage } from "./dashboard/OpsPage";
import { OverviewPage } from "./dashboard/OverviewPage";
import { SettingsPage } from "./dashboard/SettingsPage";
import { WarehousesPage } from "./dashboard/WarehousesPage";

type DashboardPageProps = {
  token: string | null;
  signedIn: boolean;
  statusMessage: string;
  warehouses: Warehouse[];
  inventoryReport: InventoryReport;
  reportRows: number;
  user: AuthUser | null;
  profile: UserProfile;
  theme: ThemeMode;
  onRefresh: () => void | Promise<void>;
  onLogout: () => void;
  onProfileChange: (profile: UserProfile) => void;
  onThemeChange: (theme: ThemeMode) => void;
};

type PageKey = "overview" | "warehouses" | "items" | "inventory" | "ops" | "settings";
type ActionStatus = "idle" | "loading" | "success" | "error";
const alertAutoHideMs = 5000;

const menuItems: Array<{ key: PageKey; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "warehouses", label: "Warehouses" },
  { key: "items", label: "Items" },
  { key: "inventory", label: "Inventory" }
];

const pageLabels: Record<PageKey, string> = {
  overview: "Overview",
  warehouses: "Warehouses",
  items: "Items",
  inventory: "Inventory",
  ops: "Ops",
  settings: "Settings"
};

const pageKeys = new Set<PageKey>(["overview", "warehouses", "items", "inventory", "ops", "settings"]);

function isPageKey(page: string | undefined): page is PageKey {
  return Boolean(page && pageKeys.has(page as PageKey));
}

export function DashboardPage({
  token,
  signedIn,
  statusMessage,
  warehouses,
  inventoryReport,
  reportRows,
  user,
  profile,
  theme,
  onRefresh,
  onLogout,
  onProfileChange,
  onThemeChange
}: DashboardPageProps) {
  const navigate = useNavigate();
  const { page } = useParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [actionMessage, setActionMessage] = useState("");
  const [actionStatus, setActionStatus] = useState<ActionStatus>("idle");
  const [searchQuery, setSearchQuery] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const metrics = useMemo(() => getNetworkMetrics(warehouses, reportRows), [warehouses, reportRows]);
  const activePage = isPageKey(page) ? page : null;
  const currentLabel = activePage ? pageLabels[activePage] : "Overview";
  const filteredWarehouses = useMemo(() => filterWarehouses(warehouses, searchQuery), [warehouses, searchQuery]);
  const filteredItems = useMemo(() => filterItems(items, searchQuery), [items, searchQuery]);
  const filteredInventoryReport = useMemo(() => filterInventoryReport(inventoryReport, searchQuery), [inventoryReport, searchQuery]);

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.addEventListener("click", handleDocumentClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("click", handleDocumentClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    void refreshItems();
  }, [token]);

  useEffect(() => {
    if (!actionMessage || actionStatus === "loading") {
      return;
    }

    const timeout = window.setTimeout(() => {
      setActionMessage("");
      setActionStatus("idle");
    }, alertAutoHideMs);

    return () => window.clearTimeout(timeout);
  }, [actionMessage, actionStatus]);

  async function refreshItems() {
    if (!token) {
      setItems([]);
      return;
    }

    try {
      const payload = await listItems(token);
      setItems(payload.items ?? []);
    } catch (error) {
      setActionMessage(friendlyApiError(error, "Unable to load items."));
      setActionStatus("error");
    }
  }

  function selectPage(page: PageKey) {
    setMenuOpen(false);
    navigate(`/dashboard/${page}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function runAction(action: () => Promise<unknown>, successMessage: string) {
    if (!token) {
      setActionMessage("Sign in before using protected CRUD operations.");
      setActionStatus("error");
      return false;
    }

    setActionMessage("Working...");
    setActionStatus("loading");

    try {
      await action();
      setActionMessage(successMessage);
      setActionStatus("success");
      await Promise.resolve(onRefresh());
      await refreshItems();
      return true;
    } catch (error) {
      if (error instanceof ApiRequestError && error.errorCode === "VALIDATION_ERROR") {
        setActionMessage("");
        setActionStatus("idle");
        return false;
      }

      setActionMessage(friendlyApiError(error));
      setActionStatus("error");
      return false;
    }
  }

  if (!activePage) {
    return <Navigate to="/dashboard/overview" replace />;
  }

  return (
    <section className="min-h-screen bg-background text-foreground" id="dashboard" aria-label="Protected logistics dashboard">
      <header className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-4 border-b border-border bg-background/95 px-5 py-4 backdrop-blur-lg lg:px-7">
        <div className="flex flex-wrap items-center gap-2.5 text-sm font-extrabold text-muted-foreground" aria-label="Dashboard breadcrumb">
          <Brand />
          <span className="text-border">/</span>
          <span>Operations</span>
          <span className="text-border">/</span>
          <div className="relative" ref={menuRef}>
            <button
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border bg-card px-3 font-extrabold text-foreground shadow-sm"
              type="button"
              aria-expanded={menuOpen}
              aria-controls="dashboard-menu"
              onClick={() => setMenuOpen((open) => !open)}
            >
              {currentLabel}
              <ChevronDown size={16} />
            </button>
            {menuOpen ? (
              <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-60 rounded-lg border border-border bg-popover p-2 text-popover-foreground shadow-corporate" id="dashboard-menu" role="menu">
                {menuItems.map((item) => (
                  <button
                    key={item.key}
                    className={`flex min-h-10 w-full items-center rounded-md px-3 text-left text-sm font-bold transition hover:bg-muted ${
                      activePage === item.key ? "bg-muted text-foreground" : "text-popover-foreground"
                    }`}
                    type="button"
                    role="menuitem"
                    onClick={() => selectPage(item.key)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2.5">
          <span className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-card px-3 text-sm font-bold text-foreground">
            <span className="size-2.5 rounded-full bg-emerald-500" />
            API online
          </span>
          <UserMenu
            user={user}
            profile={profile}
            theme={theme}
            onThemeChange={onThemeChange}
            onSelectSettings={() => selectPage("settings")}
            onSelectOps={() => selectPage("ops")}
            onLogout={onLogout}
          />
        </div>
      </header>

      <div className="px-5 py-7 lg:px-7">
        <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-3xl font-extrabold text-foreground">{currentLabel}</h2>
            <p className="mt-2 text-muted-foreground">{statusMessage}</p>
          </div>
          <label className="relative w-full max-w-xl">
            <span className="sr-only">Search dashboard</span>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              className="h-11 w-full rounded-lg border border-border bg-card pl-10 pr-3 font-semibold outline-none focus:border-ring"
              type="search"
              placeholder={`Search ${currentLabel.toLowerCase()}`}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </label>
        </header>

        <DashboardToast message={actionMessage} status={actionStatus} />

        {activePage === "overview" ? (
          <OverviewPage
            warehouses={warehouses}
            items={items}
            inventoryReport={inventoryReport}
            filteredWarehouses={filteredWarehouses}
            filteredItems={filteredItems}
            filteredInventoryReport={filteredInventoryReport}
            searchQuery={searchQuery}
            metrics={metrics}
          />
        ) : null}
        {activePage === "warehouses" ? <WarehousesPage token={token} warehouses={filteredWarehouses} onRunAction={runAction} /> : null}
        {activePage === "items" ? <ItemsPage token={token} warehouses={warehouses} items={filteredItems} onRunAction={runAction} /> : null}
        {activePage === "inventory" ? <InventoryPage token={token} warehouses={warehouses} items={items} inventoryReport={filteredInventoryReport} searchQuery={searchQuery} onRunAction={runAction} /> : null}
        {activePage === "ops" ? <OpsPage /> : null}
        {activePage === "settings" ? (
          <SettingsPage
            signedIn={signedIn}
            user={user}
            profile={profile}
            theme={theme}
            onRefresh={onRefresh}
            onLogout={onLogout}
            onProfileChange={onProfileChange}
            onThemeChange={onThemeChange}
          />
        ) : null}
      </div>
    </section>
  );
}

function includesQuery(values: Array<string | number | boolean | null | undefined>, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;

  return values.some((value) => String(value ?? "").toLowerCase().includes(needle));
}

function filterWarehouses(warehouses: Warehouse[], query: string) {
  if (!query.trim()) return warehouses;

  return warehouses.filter((warehouse) =>
    includesQuery(
      [
        warehouse.name,
        warehouse.location,
        warehouse.type,
        warehouse.storageType,
        warehouse.maxCapacity,
        warehouse.max_capacity,
        warehouse.currentQuantity,
        warehouse.current_quantity
      ],
      query
    )
  );
}

function filterItems(items: Item[], query: string) {
  if (!query.trim()) return items;

  return items.filter((item) =>
    includesQuery(
      [
        item.name,
        item.sku,
        item.storageRequirement,
        item.storage_requirement,
        ...(item.warehouses ?? []).flatMap((warehouse) => [
          warehouse.name,
          warehouse.quantity,
          warehouse.lowStock ?? warehouse.low_stock ? "low stock" : ""
        ])
      ],
      query
    )
  );
}

function filterInventoryReport(report: InventoryReport, query: string) {
  if (!query.trim()) return report;

  const warehouses = report.warehouses ?? report.data ?? [];
  const filteredWarehouses = warehouses
    .map((warehouse) => {
      const items = warehouse.items ?? [];
      const matchingItems = items.filter((item) =>
        includesQuery([item.sku, item.name, item.quantity, item.lowStock ?? item.low_stock ? "low stock" : ""], query)
      );
      const warehouseMatches = includesQuery(
        [
          warehouse.name,
          warehouse.location,
          warehouse.total_capacity,
          warehouse.totalCapacity,
          warehouse.current_occupancy,
          warehouse.currentOccupancy,
          warehouse.percent_full,
          warehouse.percentFull
        ],
        query
      );

      return warehouseMatches ? warehouse : { ...warehouse, items: matchingItems };
    })
    .filter((warehouse) => {
      const warehouseMatches = includesQuery([warehouse.name, warehouse.location], query);
      return warehouseMatches || (warehouse.items?.length ?? 0) > 0;
    });

  return { ...report, warehouses: filteredWarehouses, data: undefined };
}

function DashboardToast({ message, status }: { message: string; status: ActionStatus }) {
  if (!message) {
    return null;
  }

  return (
    <div
      className={`fixed right-4 top-20 z-[90] w-[min(calc(100vw-2rem),26rem)] overflow-hidden rounded-lg border px-4 py-3 text-sm font-semibold shadow-xl ring-1 ring-foreground/10 ${
        status === "success"
          ? "border-border bg-card text-foreground"
          : status === "error"
            ? "border-destructive bg-destructive text-white"
            : "border-border bg-muted text-muted-foreground"
      }`}
      role={status === "error" ? "alert" : "status"}
    >
      <span className="relative z-10 block pr-2">{message}</span>
      {status !== "loading" ? (
        <span
          className={`absolute inset-y-0 right-0 ${status === "error" ? "bg-white/20" : "bg-primary/10"}`}
          style={{ animation: `alert-progress ${alertAutoHideMs}ms linear forwards` }}
          aria-hidden="true"
        />
      ) : null}
    </div>
  );
}

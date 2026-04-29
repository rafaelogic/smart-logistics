import type { ApiError, AuthPayload, AuthUser, InventoryReport, Item, Warehouse } from "../types/logistics";

export const tokenKey = "smart.accessToken";

export const demoWarehouses: Warehouse[] = [
  { name: "North Distribution", type: "STANDARD", location: "Quezon City", maxCapacity: 9200, currentQuantity: 6250 },
  { name: "Cold Manila", type: "COLD", location: "Manila", maxCapacity: 4600, currentQuantity: 3860 },
  { name: "Cebu Hub", type: "STANDARD", location: "Cebu", maxCapacity: 7400, currentQuantity: 4980 },
  { name: "South Cold Chain", type: "COLD", location: "Davao", maxCapacity: 3600, currentQuantity: 2210 }
];

type ApiOptions = RequestInit & {
  token?: string | null;
};

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly errorCode?: string,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

export function friendlyApiError(error: unknown, fallback = "Request failed.") {
  if (!(error instanceof ApiRequestError)) {
    return error instanceof Error ? error.message : fallback;
  }

  switch (error.errorCode) {
    case "INSUFFICIENT_CAPACITY":
      return "The destination warehouse does not have enough remaining capacity.";
    case "INCOMPATIBLE_STORAGE":
      return "This item cannot be stored in the selected warehouse type.";
    case "INSUFFICIENT_STOCK":
      return "The source warehouse does not have enough stock for this transfer.";
    case "WAREHOUSE_NOT_EMPTY":
      return "This warehouse still has inventory. Clear its stock before deleting it.";
    case "INVENTORY_NOT_FOUND":
      return "No inventory row exists for that warehouse and SKU.";
    case "ITEM_NOT_FOUND":
      return "That SKU does not exist or has been deleted.";
    case "WAREHOUSE_NOT_FOUND":
      return "That warehouse does not exist or has been deleted.";
    case "DUPLICATE_RESOURCE":
      return "A record with this unique value already exists.";
    case "DATABASE_NOT_MIGRATED":
      return "The database schema is missing or stale. Run the migration first.";
    case "DATABASE_AUTH_FAILED":
      return "Database authentication failed. Check the configured credentials.";
    case "DATABASE_SSL_REQUIRED":
      return "The database requires SSL. Enable DATABASE_SSL.";
    case "INVALID_JSON":
      return "The request body was invalid.";
    case "VALIDATION_ERROR":
      return "Check the form fields and try again.";
    default:
      return error.message || fallback;
  }
}

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { token, headers, ...init } = options;
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers
    }
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as ApiError;
    throw new ApiRequestError(error.message || `Request failed with ${response.status}`, error.error, error.code ?? response.status);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json() as Promise<T>;
}

export function requestToken(username: FormDataEntryValue | null, password: FormDataEntryValue | null) {
  return api<AuthPayload>("/auth/token", {
    method: "POST",
    body: JSON.stringify({ username, password })
  });
}

export function getCurrentUser(token: string) {
  return api<{ user: AuthUser }>("/auth/me", { token });
}

export async function loadOperationsData(token: string) {
  const [warehousePayload, reportPayload] = await Promise.all([
    api<{ warehouses?: Warehouse[]; data?: Warehouse[] }>("/warehouses", { token }),
    getInventoryReport(token)
  ]);

  return {
    warehouses: normalizeWarehouses(warehousePayload),
    inventoryReport: reportPayload,
    reportRows: normalizeReportRows(reportPayload)
  };
}

export function getInventoryReport(
  token: string,
  input: { warehousePage?: number; warehousesPerPage?: number; warehouseItemPage?: number; warehouseItemsPerPage?: number } = {}
) {
  const params = new URLSearchParams({
    warehousePage: String(input.warehousePage ?? 1),
    warehousesPerPage: String(input.warehousesPerPage ?? 100),
    warehouseItemPage: String(input.warehouseItemPage ?? 1),
    warehouseItemsPerPage: String(input.warehouseItemsPerPage ?? 100)
  });

  return api<InventoryReport>(`/inventory/report?${params.toString()}`, { token });
}

export function listItems(token: string) {
  return api<{ items: Item[] }>("/items", { token });
}

export function createWarehouse(
  token: string,
  input: { name: string; location: string; maxCapacity: number; type: "STANDARD" | "COLD" }
) {
  return api<Warehouse>("/warehouses", {
    token,
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function updateWarehouse(
  token: string,
  warehouseId: string,
  input: { name: string; location: string; maxCapacity: number; type: "STANDARD" | "COLD" }
) {
  return api<Warehouse>(`/warehouses/${warehouseId}`, {
    token,
    method: "PUT",
    body: JSON.stringify(input)
  });
}

export function deleteWarehouse(token: string, warehouseId: string) {
  return api<null>(`/warehouses/${warehouseId}`, {
    token,
    method: "DELETE"
  });
}

export function createItem(
  token: string,
  input: { name: string; sku: string; storageRequirement: "STANDARD" | "COLD"; warehouseId?: string; quantity?: number }
) {
  return api<Item>("/items", {
    token,
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function updateItem(
  token: string,
  itemId: string,
  input: { name: string; sku: string; storageRequirement: "STANDARD" | "COLD" }
) {
  return api<Item>(`/items/${itemId}`, {
    token,
    method: "PUT",
    body: JSON.stringify(input)
  });
}

export function deleteItem(token: string, itemId: string) {
  return api<null>(`/items/${itemId}`, {
    token,
    method: "DELETE"
  });
}

export function addInventory(
  token: string,
  input: { warehouseId: string; sku: string; quantity: number; priority?: boolean }
) {
  return api("/inventory/add", {
    token,
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function setInventory(
  token: string,
  input: { warehouseId: string; sku: string; quantity: number; priority?: boolean }
) {
  return api(`/inventory/${input.warehouseId}/${encodeURIComponent(input.sku)}`, {
    token,
    method: "PUT",
    body: JSON.stringify({ quantity: input.quantity, priority: input.priority })
  });
}

export function deleteInventory(
  token: string,
  input: { warehouseId: string; sku: string }
) {
  return api<null>(`/inventory/${input.warehouseId}/${encodeURIComponent(input.sku)}`, {
    token,
    method: "DELETE"
  });
}

export function transferInventory(
  token: string,
  input: { fromWarehouseId: string; toWarehouseId: string; sku: string; quantity: number }
) {
  return api("/inventory/transfer", {
    token,
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function normalizeWarehouses(payload: { warehouses?: Warehouse[]; data?: Warehouse[] }) {
  if (Array.isArray(payload?.warehouses)) {
    return payload.warehouses;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return demoWarehouses;
}

export function normalizeReportRows(payload: InventoryReport) {
  const warehouses = payload?.warehouses ?? payload?.data ?? [];

  if (!Array.isArray(warehouses)) {
    return 720;
  }

  return warehouses.reduce((count, warehouse) => {
    const items = warehouse.items ?? warehouse.inventory ?? warehouse.inventoryItems ?? [];
    return count + (Array.isArray(items) ? Math.max(items.length, 1) : 1);
  }, 0);
}

export function capacityFor(warehouse: Warehouse) {
  const max = Number(warehouse.maxCapacity ?? warehouse.max_capacity ?? 1);
  const current = Number(warehouse.currentQuantity ?? warehouse.current_quantity ?? warehouse.quantity ?? 0);

  return Math.min(100, Math.round((current / Math.max(max, 1)) * 100));
}

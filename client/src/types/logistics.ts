export type Warehouse = {
  id?: string;
  name?: string;
  location?: string;
  type?: "STANDARD" | "COLD" | string;
  storageType?: string;
  maxCapacity?: number;
  max_capacity?: number;
  currentQuantity?: number;
  current_quantity?: number;
  quantity?: number;
  createdAt?: string;
  created_at?: string;
};

export type Item = {
  id?: string;
  name?: string;
  sku?: string;
  storageRequirement?: "STANDARD" | "COLD" | string;
  storage_requirement?: "STANDARD" | "COLD" | string;
  createdAt?: string;
  created_at?: string;
  warehouses?: Array<{
    id?: string;
    name?: string;
    quantity?: number;
    lowStock?: boolean;
    low_stock?: boolean;
  }>;
};

export type AuthPayload = {
  accessToken: string;
};

export type AuthUser = {
  username?: string;
  role?: string;
};

export type UserProfile = {
  displayName: string;
  email: string;
  avatarUrl: string;
};

export type ApiError = {
  error?: string;
  message?: string;
  code?: number;
};

export type InventoryReport = {
  warehousePage?: number;
  warehousesPerPage?: number;
  warehouseItemPage?: number;
  warehouseItemsPerPage?: number;
  total?: number;
  warehouses?: InventoryReportWarehouse[];
  data?: InventoryReportWarehouse[];
};

export type InventoryReportWarehouse = {
  id?: string;
  name?: string;
  location?: string;
  total_capacity?: number;
  totalCapacity?: number;
  current_occupancy?: number;
  currentOccupancy?: number;
  percent_full?: number;
  percentFull?: number;
  total_items?: number;
  totalItems?: number;
  items?: InventoryReportItem[];
  inventory?: InventoryReportItem[];
  inventoryItems?: InventoryReportItem[];
};

export type InventoryReportItem = {
  sku?: string;
  name?: string;
  quantity?: number;
  priority?: boolean;
  recentPriority?: boolean;
  createdAt?: string;
  created_at?: string;
  low_stock?: boolean;
  lowStock?: boolean;
};

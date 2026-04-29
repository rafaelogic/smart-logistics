CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  max_capacity INTEGER NOT NULL CHECK (max_capacity > 0),
  type TEXT NOT NULL CHECK (type IN ('STANDARD', 'COLD')),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE CHECK (sku ~ '^[A-Z]{3}-[0-9]{5}-[A-Z]$'),
  storage_requirement TEXT NOT NULL CHECK (storage_requirement IN ('STANDARD', 'COLD')),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inventory (
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  item_id UUID NOT NULL REFERENCES items(id),
  quantity INTEGER NOT NULL CHECK (quantity >= 0),
  priority BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (warehouse_id, item_id)
);

CREATE INDEX IF NOT EXISTS warehouses_active_name_idx
  ON warehouses (name)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS items_active_sku_idx
  ON items (sku)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS inventory_item_id_idx
  ON inventory (item_id);

CREATE INDEX IF NOT EXISTS inventory_recent_priority_idx
  ON inventory (priority, created_at DESC)
  WHERE priority = true;

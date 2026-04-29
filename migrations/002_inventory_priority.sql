ALTER TABLE inventory
  ADD COLUMN IF NOT EXISTS priority BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS inventory_recent_priority_idx
  ON inventory (priority, created_at DESC)
  WHERE priority = true;

INSERT INTO warehouses (id, name, location, max_capacity, type)
VALUES
  ('00000000-0000-0000-0000-000000000101', 'Metro Manila Cold Hub', 'Manila', 1000, 'COLD'),
  ('00000000-0000-0000-0000-000000000102', 'Cebu Cold Hub', 'Cebu', 1000, 'COLD'),
  ('00000000-0000-0000-0000-000000000103', 'Davao Cold Hub', 'Davao', 1000, 'COLD'),
  ('00000000-0000-0000-0000-000000000104', 'Clark Cold Hub', 'Pampanga', 1000, 'COLD'),
  ('00000000-0000-0000-0000-000000000105', 'Iloilo Cold Hub', 'Iloilo', 1000, 'COLD'),
  ('00000000-0000-0000-0000-000000000106', 'Cagayan Cold Hub', 'Cagayan de Oro', 1000, 'COLD'),
  ('00000000-0000-0000-0000-000000000107', 'Bacolod Cold Hub', 'Bacolod', 1000, 'COLD'),
  ('00000000-0000-0000-0000-000000000108', 'Batangas Cold Hub', 'Batangas', 1000, 'COLD'),
  ('00000000-0000-0000-0000-000000000109', 'Subic Cold Hub', 'Zambales', 1000, 'COLD'),
  ('00000000-0000-0000-0000-000000000110', 'General Santos Cold Hub', 'General Santos', 1000, 'COLD')
ON CONFLICT (id)
DO UPDATE SET
  name = EXCLUDED.name,
  location = EXCLUDED.location,
  max_capacity = EXCLUDED.max_capacity,
  type = EXCLUDED.type,
  deleted_at = NULL,
  updated_at = now();

INSERT INTO items (id, name, sku, storage_requirement)
VALUES
  ('10000000-0000-0000-0000-000000000101', 'Premium Rice 25kg', 'RIC-10001-A', 'STANDARD'),
  ('10000000-0000-0000-0000-000000000102', 'Canned Tuna Case', 'TUN-10002-A', 'STANDARD'),
  ('10000000-0000-0000-0000-000000000103', 'Bottled Water Case', 'WAT-10003-A', 'STANDARD'),
  ('10000000-0000-0000-0000-000000000104', 'Instant Noodles Box', 'NDL-10004-A', 'STANDARD'),
  ('10000000-0000-0000-0000-000000000105', 'Cooking Oil Case', 'OIL-10005-A', 'STANDARD'),
  ('10000000-0000-0000-0000-000000000106', 'Coffee Beans Sack', 'COF-10006-A', 'STANDARD'),
  ('10000000-0000-0000-0000-000000000107', 'Sugar Sack', 'SUG-10007-A', 'STANDARD'),
  ('10000000-0000-0000-0000-000000000108', 'Flour Sack', 'FLR-10008-A', 'STANDARD'),
  ('10000000-0000-0000-0000-000000000109', 'Pasta Case', 'PAS-10009-A', 'STANDARD'),
  ('10000000-0000-0000-0000-000000000110', 'Cereal Case', 'CER-10010-A', 'STANDARD'),
  ('10000000-0000-0000-0000-000000000111', 'Soap Carton', 'SOA-10011-A', 'STANDARD'),
  ('10000000-0000-0000-0000-000000000112', 'Shampoo Carton', 'SHA-10012-A', 'STANDARD'),
  ('10000000-0000-0000-0000-000000000113', 'Toothpaste Carton', 'TOO-10013-A', 'STANDARD'),
  ('10000000-0000-0000-0000-000000000114', 'Detergent Box', 'DET-10014-A', 'STANDARD'),
  ('10000000-0000-0000-0000-000000000115', 'Paper Towels Case', 'PAP-10015-A', 'STANDARD'),
  ('10000000-0000-0000-0000-000000000116', 'Office Paper Box', 'OPP-10016-A', 'STANDARD'),
  ('10000000-0000-0000-0000-000000000117', 'Printer Ink Pack', 'INK-10017-A', 'STANDARD'),
  ('10000000-0000-0000-0000-000000000118', 'LED Bulb Case', 'LED-10018-A', 'STANDARD'),
  ('10000000-0000-0000-0000-000000000119', 'Battery Pack Case', 'BAT-10019-A', 'STANDARD'),
  ('10000000-0000-0000-0000-000000000120', 'Safety Gloves Box', 'GLV-10020-A', 'STANDARD'),
  ('10000000-0000-0000-0000-000000000121', 'Frozen Chicken Case', 'CHK-10021-C', 'COLD'),
  ('10000000-0000-0000-0000-000000000122', 'Frozen Beef Case', 'BEF-10022-C', 'COLD'),
  ('10000000-0000-0000-0000-000000000123', 'Frozen Fish Case', 'FSH-10023-C', 'COLD'),
  ('10000000-0000-0000-0000-000000000124', 'Ice Cream Tub Case', 'ICE-10024-C', 'COLD'),
  ('10000000-0000-0000-0000-000000000125', 'Milk Crate', 'MLK-10025-C', 'COLD'),
  ('10000000-0000-0000-0000-000000000126', 'Yogurt Case', 'YOG-10026-C', 'COLD'),
  ('10000000-0000-0000-0000-000000000127', 'Cheese Case', 'CHS-10027-C', 'COLD'),
  ('10000000-0000-0000-0000-000000000128', 'Fresh Produce Crate', 'PRD-10028-C', 'COLD'),
  ('10000000-0000-0000-0000-000000000129', 'Vaccine Cooler Box', 'VAC-10029-C', 'COLD'),
  ('10000000-0000-0000-0000-000000000130', 'Seafood Pack Case', 'SEA-10030-C', 'COLD')
ON CONFLICT (sku)
DO UPDATE SET
  name = EXCLUDED.name,
  storage_requirement = EXCLUDED.storage_requirement,
  deleted_at = NULL,
  updated_at = now();

INSERT INTO inventory (warehouse_id, item_id, quantity)
SELECT
  warehouse.id,
  seeded_item.id,
  ((warehouse.number * item.number) % 7) + 1 AS quantity
FROM (
  VALUES
    (1, '00000000-0000-0000-0000-000000000101'::uuid),
    (2, '00000000-0000-0000-0000-000000000102'::uuid),
    (3, '00000000-0000-0000-0000-000000000103'::uuid),
    (4, '00000000-0000-0000-0000-000000000104'::uuid),
    (5, '00000000-0000-0000-0000-000000000105'::uuid),
    (6, '00000000-0000-0000-0000-000000000106'::uuid),
    (7, '00000000-0000-0000-0000-000000000107'::uuid),
    (8, '00000000-0000-0000-0000-000000000108'::uuid),
    (9, '00000000-0000-0000-0000-000000000109'::uuid),
    (10, '00000000-0000-0000-0000-000000000110'::uuid)
) AS warehouse(number, id)
CROSS JOIN (
  VALUES
    (1, 'RIC-10001-A'),
    (2, 'TUN-10002-A'),
    (3, 'WAT-10003-A'),
    (4, 'NDL-10004-A'),
    (5, 'OIL-10005-A'),
    (6, 'COF-10006-A'),
    (7, 'SUG-10007-A'),
    (8, 'FLR-10008-A'),
    (9, 'PAS-10009-A'),
    (10, 'CER-10010-A'),
    (11, 'SOA-10011-A'),
    (12, 'SHA-10012-A'),
    (13, 'TOO-10013-A'),
    (14, 'DET-10014-A'),
    (15, 'PAP-10015-A'),
    (16, 'OPP-10016-A'),
    (17, 'INK-10017-A'),
    (18, 'LED-10018-A'),
    (19, 'BAT-10019-A'),
    (20, 'GLV-10020-A'),
    (21, 'CHK-10021-C'),
    (22, 'BEF-10022-C'),
    (23, 'FSH-10023-C'),
    (24, 'ICE-10024-C'),
    (25, 'MLK-10025-C'),
    (26, 'YOG-10026-C'),
    (27, 'CHS-10027-C'),
    (28, 'PRD-10028-C'),
    (29, 'VAC-10029-C'),
    (30, 'SEA-10030-C')
) AS item(number, sku)
JOIN items seeded_item ON seeded_item.sku = item.sku
ON CONFLICT (warehouse_id, item_id)
DO UPDATE SET
  quantity = EXCLUDED.quantity,
  updated_at = now();

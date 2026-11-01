-- Animal identity by id, not name (2026-11-01 refactor).
-- RUN THIS BEFORE BOOTING THE NEW CODE — on prod (POSTGRES_SYNC_ALTER=false)
-- nothing else adds the columns, and in dev sync/alter would drop the old
-- animal_type columns before they could be backfilled. Safe to re-run.
BEGIN;

-- 1. Catalogue flag replacing the hard-coded "Адуу needs a stamp" rule.
ALTER TABLE "Animals"
  ADD COLUMN IF NOT EXISTS requires_stamp BOOLEAN NOT NULL DEFAULT false;
UPDATE "Animals" SET requires_stamp = true WHERE name = 'Адуу';

-- 2. Cargo / sale lines / sales lines: store animal_id, backfilled by name.
ALTER TABLE "ShipmentCargoEntries"
  ADD COLUMN IF NOT EXISTS animal_id UUID
  REFERENCES "Animals"(id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ShipmentSaleLines"
  ADD COLUMN IF NOT EXISTS animal_id UUID
  REFERENCES "Animals"(id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SalesLineItems"
  ADD COLUMN IF NOT EXISTS animal_id UUID
  REFERENCES "Animals"(id) ON DELETE SET NULL ON UPDATE CASCADE;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['ShipmentCargoEntries','ShipmentSaleLines','SalesLineItems'] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = t AND column_name = 'animal_type') THEN
      EXECUTE format(
        'UPDATE %I x SET animal_id = a.id FROM "Animals" a
          WHERE x.animal_id IS NULL AND a.name = x.animal_type', t);
    END IF;
  END LOOP;
END $$;

CREATE INDEX IF NOT EXISTS sales_line_items_product_type_animal_id
  ON "SalesLineItems" (product_type, animal_id);

-- 3. One stock key everywhere: MEAT:<animal_id> | BYPN:<animal_id>:<name> |
--    BYPN:<name> (was "Мах:<name>" / "Дайвар:<name>" on items and
--    "MEAT:<name>" on sale lines).
UPDATE "ShipmentSaleLines" SET group_key = CASE
  WHEN product_type = 'MEAT' THEN 'MEAT:' || animal_id::text
  ELSE 'BYPN:' || COALESCE(animal_id::text || ':', '') || byproduct_name
END
WHERE (product_type = 'MEAT' AND animal_id IS NOT NULL)
   OR (product_type <> 'MEAT' AND byproduct_name IS NOT NULL);

-- (If one shipment got cargo of an animal both before and after a rename,
-- its two sale lines now share a key and the unique index stops the script —
-- merge those two ShipmentSaleLines by hand first.)

-- A rename before this fix could have split one animal's stock into two
-- items (same factory + animal + byproduct). Merge them into the oldest.
CREATE TEMP TABLE item_dupes ON COMMIT DROP AS
SELECT id, keep_id FROM (
  SELECT id,
         first_value(id) OVER (
           PARTITION BY factory,
             CASE WHEN product_type = 'MEAT' THEN 'MEAT:' || animal_id::text
                  ELSE 'BYPN:' || COALESCE(animal_id::text || ':', '') || byproduct_name
             END
           ORDER BY created_at, id) AS keep_id
  FROM "InventoryItems"
) r
WHERE id <> keep_id;

UPDATE "InventoryMovements" m SET inventory_item_id = d.keep_id
FROM item_dupes d WHERE m.inventory_item_id = d.id;

UPDATE "InventoryItems" i
SET quantity_kg = i.quantity_kg + t.kg, quantity_count = i.quantity_count + t.cnt
FROM (
  SELECT d.keep_id, SUM(x.quantity_kg) AS kg, SUM(x.quantity_count) AS cnt
  FROM item_dupes d JOIN "InventoryItems" x ON x.id = d.id
  GROUP BY d.keep_id
) t
WHERE i.id = t.keep_id;

DELETE FROM "InventoryItems" i USING item_dupes d WHERE i.id = d.id;

UPDATE "InventoryItems" SET sku = CASE
  WHEN product_type = 'MEAT' THEN 'MEAT:' || animal_id::text
  ELSE 'BYPN:' || COALESCE(animal_id::text || ':', '') || byproduct_name
END;

-- 4. Rows whose stored name matches no catalogue animal (renamed before this
--    fix). They keep animal_id NULL — fix by hand, then re-run step 2.
DO $$
DECLARE t text; n int;
BEGIN
  FOREACH t IN ARRAY ARRAY['ShipmentCargoEntries','ShipmentSaleLines','SalesLineItems'] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = t AND column_name = 'animal_type') THEN
      EXECUTE format('SELECT count(*) FROM %I WHERE animal_id IS NULL AND animal_type IS NOT NULL', t) INTO n;
      IF n > 0 THEN RAISE NOTICE '% rows in % have an unknown animal_type', n, t; END IF;
    END IF;
  END LOOP;
END $$;

COMMIT;

-- 5. Once step 4 reports nothing, the name columns can go (dev's sync/alter
--    drops them on its own):
-- ALTER TABLE "ShipmentCargoEntries" DROP COLUMN IF EXISTS animal_type;
-- ALTER TABLE "ShipmentSaleLines"    DROP COLUMN IF EXISTS animal_type;
-- ALTER TABLE "SalesLineItems"       DROP COLUMN IF EXISTS animal_type;

-- Inventory became per-factory on 2026-10-10: unique (factory, sku). DBs
-- created before that still carry the old global unique on sku (sync/alter
-- never drops it), so the same SKU in a second factory — e.g. FACTORY_2
-- stocking "Мах:Үхэр" that FACTORY_1 already has — fails with
-- "Validation error". Drops every sku-only unique; safe to re-run.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_attribute a
      ON a.attrelid = c.conrelid AND a.attname = 'sku'
    WHERE c.conrelid = '"InventoryItems"'::regclass
      AND c.contype = 'u'
      AND c.conkey = ARRAY[a.attnum]
  LOOP
    EXECUTE format('ALTER TABLE "InventoryItems" DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;
DROP INDEX IF EXISTS inventory_items_sku;

-- Per-factory byproduct price list (2026-10-19).
-- Wrapper prices move from ByproductWrappers.price to FactoryByproducts.
-- `sync({alter:true})` creates FactoryByproducts + ByproductBundles.constant_id
-- and DROPS ByproductWrappers.price, but never drops NOT NULL on an FK column
-- (Sequelize skips it when the column has REFERENCES) — step 2 does that.

-- 1. BEFORE booting the new build: keep the old wrapper prices.
CREATE TABLE IF NOT EXISTS wrapper_price_backup AS
  SELECT id, price FROM "ByproductWrappers";

-- 2–3. AFTER the new build has booted once (tables exist):
BEGIN;

-- 2. PRE_BUTCHERED bundle rows reference an item, not a wrapper.
ALTER TABLE "ByproductBundles" ALTER COLUMN wrapper_id DROP NOT NULL;

-- 3. Old prices → every LIVE_SLAUGHTER site's list.
INSERT INTO "FactoryByproducts" (id, factory, wrapper_id, price, created_at, updated_at)
SELECT gen_random_uuid(), f.code, b.id, b.price, now(), now()
FROM wrapper_price_backup b
CROSS JOIN "Factories" f
WHERE f.kind = 'LIVE_SLAUGHTER'
ON CONFLICT DO NOTHING;

DROP TABLE wrapper_price_backup;

COMMIT;

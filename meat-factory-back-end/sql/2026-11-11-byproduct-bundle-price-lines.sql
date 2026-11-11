-- Pre-butchered byproducts may repeat at different prices on one
-- registration (2 Арьс × 35,000 + 1 × 25,000), so drop the one-row-per-item
-- uniques. sync/alter never drops an index, so run this on every DB (dev +
-- prod) — before or after deploying, either order works. Safe to re-run.
DROP INDEX IF EXISTS byproduct_bundles_registration_id_wrapper_id;
DROP INDEX IF EXISTS byproduct_bundles_registration_id_constant_id;

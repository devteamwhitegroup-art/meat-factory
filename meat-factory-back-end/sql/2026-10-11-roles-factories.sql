-- Roles + factories catalogue migration (2026-10-11).
-- Run ONCE against an existing database BEFORE booting the new build.
-- (A fresh dev DB needs none of this: sync creates the tables and boot seeds
--  the default roles/factories. The old Admins.role enum column makes
--  `sync({alter:true})` fail on existing rows — this backfills it.)
BEGIN;

-- 1. Roles ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "Roles" (
  id            uuid PRIMARY KEY,
  name          varchar(255) NOT NULL UNIQUE,
  permissions   varchar(255)[] NOT NULL DEFAULT '{}',
  cross_factory boolean NOT NULL DEFAULT false,
  is_system     boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Timestamps set explicitly: if the new build was booted first, sync already
-- created this table WITHOUT a now() default (and then failed on Admins).
INSERT INTO "Roles" (id, name, permissions, cross_factory, is_system, created_at, updated_at) VALUES
  (gen_random_uuid(), 'Админ', ARRAY[
    'REGISTRATION_CREATE','REGISTRATION_WEIGH','REGISTRATION_WEIGH_FIX','REGISTRATION_VERIFY',
    'REGISTRATION_CANCEL','CHANGE_REQUEST_REVIEW','MEDICAL_NUMBER_ENTER','MEDICAL_NUMBER_CHECK',
    'SETTLEMENT_CREATE','SETTLEMENT_PAY','HERDER_EDIT','HERDER_MANAGE','CUSTOMER_MANAGE',
    'SALES_MANAGE','SHIPMENT_VIEW','SHIPMENT_MANAGE','SHIPMENT_SALES','INVENTORY_VIEW',
    'INVENTORY_ADJUST','BYPRODUCT_TRANSFER','BYPRODUCT_PROCESS','DASHBOARD_VIEW',
    'CATALOG_MANAGE','SETTINGS_MANAGE','STAFF_MANAGE'], true, true, now(), now()),
  (gen_random_uuid(), 'Нярав', ARRAY[
    'REGISTRATION_CREATE','REGISTRATION_WEIGH','REGISTRATION_VERIFY','MEDICAL_NUMBER_ENTER',
    'MEDICAL_NUMBER_CHECK','SETTLEMENT_CREATE','HERDER_EDIT','SHIPMENT_VIEW','SHIPMENT_MANAGE',
    'INVENTORY_VIEW','INVENTORY_ADJUST','BYPRODUCT_TRANSFER','BYPRODUCT_PROCESS'], false, false, now(), now()),
  (gen_random_uuid(), 'Нягтлан', ARRAY[
    'SETTLEMENT_CREATE','SETTLEMENT_PAY','CUSTOMER_MANAGE','SALES_MANAGE','SHIPMENT_VIEW',
    'SHIPMENT_SALES','DASHBOARD_VIEW'], false, false, now(), now()),
  (gen_random_uuid(), 'Эмч', ARRAY[
    'REGISTRATION_CREATE','MEDICAL_NUMBER_ENTER','MEDICAL_NUMBER_CHECK'], false, false, now(), now())
ON CONFLICT (name) DO NOTHING;

-- 2. Admins: role enum → role_id ---------------------------------------------
ALTER TABLE "Admins" ADD COLUMN IF NOT EXISTS role_id uuid;
UPDATE "Admins" a SET role_id = r.id FROM "Roles" r
  WHERE a.role_id IS NULL AND r.name = CASE a.role::text
    WHEN 'ADMIN' THEN 'Админ' WHEN 'STOREKEEPER' THEN 'Нярав'
    WHEN 'ACCOUNTANT' THEN 'Нягтлан' WHEN 'DOCTOR' THEN 'Эмч' ELSE 'Нярав' END;
ALTER TABLE "Admins" ALTER COLUMN role_id SET NOT NULL;
ALTER TABLE "Admins" DROP COLUMN IF EXISTS role;
DROP TYPE IF EXISTS "enum_Admins_role";

-- 3. Factories ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "Factories" (
  code       varchar(32) PRIMARY KEY,
  name       varchar(255) NOT NULL,
  kind       varchar(32) NOT NULL,
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO "Factories" (code, name, kind, is_active, created_at, updated_at) VALUES
  ('FACTORY_1', 'Урд үйлдвэр',    'LIVE_SLAUGHTER', true, now(), now()),
  ('FACTORY_2', 'Хойд үйлдвэр',   'PRE_BUTCHERED',  true, now(), now()),
  ('FACTORY_3', 'Дайвар үйлдвэр', 'BYPRODUCT',      true, now(), now())
ON CONFLICT (code) DO NOTHING;

-- 4. factory enum columns → varchar codes --------------------------------------
ALTER TABLE "Admins"               ALTER COLUMN factory TYPE varchar(32) USING factory::text;
ALTER TABLE "Registrations"        ALTER COLUMN factory DROP DEFAULT, ALTER COLUMN factory TYPE varchar(32) USING factory::text;
ALTER TABLE "InventoryItems"       ALTER COLUMN factory DROP DEFAULT, ALTER COLUMN factory TYPE varchar(32) USING factory::text;
ALTER TABLE "Shipments"            ALTER COLUMN factory DROP DEFAULT, ALTER COLUMN factory TYPE varchar(32) USING factory::text;
ALTER TABLE "ByproductProcessings" ALTER COLUMN factory TYPE varchar(32) USING factory::text;
DROP TYPE IF EXISTS "enum_Admins_factory";
DROP TYPE IF EXISTS "enum_Registrations_factory";
DROP TYPE IF EXISTS "enum_InventoryItems_factory";
DROP TYPE IF EXISTS "enum_Shipments_factory";
DROP TYPE IF EXISTS "enum_ByproductProcessings_factory";

COMMIT;
-- Sequelize sync (alter) then adds the FK Admins.role_id → Roles and the
-- Factories.kind enum type on the next boot.

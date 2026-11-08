-- Landing-page shop (OrderPackages + Orders). Only needed where the server
-- boots with POSTGRES_SYNC_ON_START=false; otherwise sync creates these.
DO $$ BEGIN
  CREATE TYPE "enum_Orders_status" AS ENUM ('PENDING', 'PAID', 'DELIVERED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "OrderPackages" (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  thumbnail_file_id UUID REFERENCES "Files"(id) ON DELETE SET NULL,
  image_file_ids UUID[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

-- Package photos, for a DB that already ran the CREATE above without them.
ALTER TABLE "OrderPackages" ADD COLUMN IF NOT EXISTS thumbnail_file_id UUID REFERENCES "Files"(id) ON DELETE SET NULL;
ALTER TABLE "OrderPackages" ADD COLUMN IF NOT EXISTS image_file_ids UUID[] NOT NULL DEFAULT '{}';

CREATE TABLE IF NOT EXISTS "Orders" (
  id UUID PRIMARY KEY,
  code VARCHAR(255) NOT NULL UNIQUE,
  customer_name VARCHAR(255) NOT NULL,
  phone VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  note TEXT,
  lines JSONB NOT NULL,
  total INTEGER NOT NULL,
  status "enum_Orders_status" NOT NULL DEFAULT 'PENDING',
  qpay_invoice_id VARCHAR(255),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS orders_status ON "Orders" (status);
CREATE INDEX IF NOT EXISTS orders_phone ON "Orders" (phone);

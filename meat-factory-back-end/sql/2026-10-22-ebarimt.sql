-- eBarimt (PosAPI 3.0) - run once on DBs that boot with POSTGRES_SYNC_ALTER=false.
ALTER TABLE "Herders" ADD COLUMN IF NOT EXISTS tin VARCHAR(255);
ALTER TABLE "Settlements" ADD COLUMN IF NOT EXISTS ebarimt_id VARCHAR(64);
ALTER TABLE "Settlements" ADD COLUMN IF NOT EXISTS ebarimt_date VARCHAR(32);
ALTER TABLE "Settlements" ADD COLUMN IF NOT EXISTS ebarimt_issued_at TIMESTAMPTZ;
ALTER TABLE "Settlements" ADD COLUMN IF NOT EXISTS ebarimt_voided_at TIMESTAMPTZ;
ALTER TABLE "Settlements" ADD COLUMN IF NOT EXISTS ebarimt_error TEXT;

-- Manual check at verification while the PosAPI flow is parked (2026-10-23):
-- receipt entered on the herder's phone?, its photo, a note.
ALTER TABLE "Registrations" ADD COLUMN IF NOT EXISTS ebarimt_taken BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Registrations" ADD COLUMN IF NOT EXISTS ebarimt_image_file_id UUID REFERENCES "Files"(id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Registrations" ADD COLUMN IF NOT EXISTS ebarimt_note TEXT;

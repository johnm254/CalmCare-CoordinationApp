-- Migration 007: Rename strap model identifiers epi_strap_a/b → mojo_strap_a/b
-- Safe because no hardware units are live-paired yet (Stage 3 approval, 27 Oct 2026).
-- Updates: devices.model, firmware_releases.model CHECK constraints and any data rows.

BEGIN;

-- ── 1. Migrate existing data rows ─────────────────────────────────────────────
UPDATE devices          SET model = 'mojo_strap_a' WHERE model = 'epi_strap_a';
UPDATE devices          SET model = 'mojo_strap_b' WHERE model = 'epi_strap_b';
UPDATE firmware_releases SET model = 'mojo_strap_a' WHERE model = 'epi_strap_a';
UPDATE firmware_releases SET model = 'mojo_strap_b' WHERE model = 'epi_strap_b';

-- ── 2. Drop old CHECK constraints and add new ones ────────────────────────────
ALTER TABLE devices DROP CONSTRAINT IF EXISTS devices_model_check;
ALTER TABLE devices ADD CONSTRAINT devices_model_check
  CHECK (model IN ('mojo_strap_a', 'mojo_strap_b'));

ALTER TABLE firmware_releases DROP CONSTRAINT IF EXISTS firmware_releases_model_check;
ALTER TABLE firmware_releases ADD CONSTRAINT firmware_releases_model_check
  CHECK (model IN ('mojo_strap_a', 'mojo_strap_b'));

COMMIT;

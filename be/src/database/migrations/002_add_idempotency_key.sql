-- ============================================================
-- Kiosk Webhook Reliability Layer — Add Idempotency Key
-- Migration: 002_add_idempotency_key.sql
-- ============================================================

BEGIN;

ALTER TABLE events ADD COLUMN idempotency_key VARCHAR(255);
ALTER TABLE events ADD COLUMN is_processing BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE events ADD CONSTRAINT uq_events_idempotency UNIQUE (endpoint_id, idempotency_key);

COMMIT;

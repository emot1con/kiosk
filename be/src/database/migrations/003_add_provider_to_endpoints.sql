-- ============================================================
-- Kiosk Webhook Reliability Layer — Add Provider to Endpoints
-- Migration: 003_add_provider_to_endpoints.sql
-- ============================================================

BEGIN;

ALTER TABLE endpoints ADD COLUMN provider VARCHAR(50) DEFAULT NULL;

COMMENT ON COLUMN endpoints.provider IS 'Nama provider webhook (e.g. stripe, github, shopify). Di-set oleh user saat membuat endpoint.';

COMMIT;

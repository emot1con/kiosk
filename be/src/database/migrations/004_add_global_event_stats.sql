-- ============================================================
-- Migration: XXX_replace_user_event_stats_with_global.sql
-- Replaces per-user event stats with global single-tenant stats
-- ============================================================

BEGIN;

DROP TABLE IF EXISTS user_event_stats CASCADE;

CREATE TABLE IF NOT EXISTS global_event_stats (
    id VARCHAR(10) PRIMARY KEY,
    total INT DEFAULT 0,
    pending INT DEFAULT 0,
    delivered INT DEFAULT 0,
    retrying INT DEFAULT 0,
    dead INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO global_event_stats (id) VALUES ('global')
ON CONFLICT (id) DO NOTHING;

COMMIT;
-- ============================================================
-- Migration: Remove auth (users table, user_id, user_event_stats)
-- Single tenant: no multi-user auth needed
-- ============================================================

BEGIN;

-- Drop user_id FK from endpoints
ALTER TABLE endpoints DROP COLUMN IF EXISTS user_id;

-- Drop users table
DROP TABLE IF EXISTS users CASCADE;

-- Drop old per-user stats table
DROP TABLE IF EXISTS user_event_stats CASCADE;

-- Create global stats table (single tenant)
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
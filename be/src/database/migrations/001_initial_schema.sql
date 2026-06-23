-- ============================================================
-- Kiosk Webhook Reliability Layer — Initial Database Schema
-- Migration: 001_initial_schema.sql
-- Database: PostgreSQL 15+
-- ============================================================

BEGIN;

-- ============================================================
-- 1. EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 2. CUSTOM TYPES
-- ============================================================
CREATE TYPE event_status AS ENUM ('pending', 'delivered', 'retrying', 'dead');

-- ============================================================
-- 3. TABLES
-- ============================================================

-- ----- users -----
CREATE TABLE users (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    api_key_hash  VARCHAR(255),
    api_key_prefix VARCHAR(50),
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at    TIMESTAMPTZ,

    CONSTRAINT uq_users_email   UNIQUE (email),
    CONSTRAINT uq_users_api_key_hash UNIQUE (api_key_hash)
);

COMMENT ON TABLE  users IS 'Akun developer yang mengelola webhook endpoints';
COMMENT ON COLUMN users.api_key_hash IS 'Hash dari token autentikasi incoming webhook';

-- ----- endpoints -----
CREATE TABLE endpoints (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID         NOT NULL,
    name            VARCHAR(100) NOT NULL,
    incoming_key    VARCHAR(32)  NOT NULL,
    destination_url TEXT         NOT NULL,
    signing_secret  VARCHAR(255),
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ,

    CONSTRAINT uq_endpoints_incoming_key UNIQUE (incoming_key),
    CONSTRAINT fk_endpoints_user 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

COMMENT ON TABLE  endpoints IS 'Konfigurasi webhook endpoint: incoming URL → destination URL';
COMMENT ON COLUMN endpoints.incoming_key IS 'Path segment URL publik, dibuat random saat user membuat endpoint';
COMMENT ON COLUMN endpoints.is_active IS 'false = worker skip processing event baru untuk endpoint ini';

-- ----- events -----
CREATE TABLE events (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint_id   UUID         NOT NULL,
    provider      VARCHAR(50),
    status        event_status NOT NULL DEFAULT 'pending',
    headers       JSONB        NOT NULL DEFAULT '{}',
    payload       JSONB        NOT NULL DEFAULT '{}',
    retry_count   INT          NOT NULL DEFAULT 0,
    max_retries   INT          NOT NULL DEFAULT 5,
    next_retry_at TIMESTAMPTZ,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at    TIMESTAMPTZ,

    CONSTRAINT fk_events_endpoint 
        FOREIGN KEY (endpoint_id) REFERENCES endpoints(id) ON DELETE CASCADE,
    CONSTRAINT chk_events_retry_count 
        CHECK (retry_count >= 0),
    CONSTRAINT chk_events_max_retries 
        CHECK (max_retries > 0)
);

COMMENT ON TABLE  events IS 'Webhook event yang diterima — satu payload masuk = satu record';
COMMENT ON COLUMN events.status IS 'Lifecycle: pending → delivered | retrying → dead';
COMMENT ON COLUMN events.headers IS 'HTTP headers asli dari provider (JSONB)';
COMMENT ON COLUMN events.payload IS 'Body request asli dari provider (JSONB)';
COMMENT ON COLUMN events.next_retry_at IS 'Waktu retry berikutnya dijadwalkan, NULL jika delivered/dead';

-- ----- delivery_attempts -----
CREATE TABLE delivery_attempts (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id        UUID        NOT NULL,
    response_status INT,
    response_body   TEXT,
    latency_ms      INT         NOT NULL DEFAULT 0,
    attempted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ,

    CONSTRAINT fk_attempts_event 
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    CONSTRAINT chk_attempts_latency 
        CHECK (latency_ms >= 0)
);

COMMENT ON TABLE  delivery_attempts IS 'Log percobaan pengiriman: response code, body, dan latency';
COMMENT ON COLUMN delivery_attempts.response_status IS 'HTTP status code dari destination, NULL jika timeout/connection error';
COMMENT ON COLUMN delivery_attempts.response_body IS 'Response body dari destination (TEXT, tidak selalu JSON)';
COMMENT ON COLUMN delivery_attempts.latency_ms IS 'Waktu tempuh request dalam milidetik';

-- ============================================================
-- 4. INDEXES
-- ============================================================
CREATE INDEX idx_users_api_key_hash ON users (api_key_hash);
CREATE INDEX idx_endpoints_user_id ON endpoints (user_id);
CREATE INDEX idx_endpoints_incoming_key ON endpoints (incoming_key);
CREATE INDEX idx_events_endpoint_id ON events (endpoint_id);
CREATE INDEX idx_events_status ON events (status);
CREATE INDEX idx_events_created_at ON events (created_at DESC);

-- Partial index for worker queue retry selection
CREATE INDEX idx_events_retry_queue 
    ON events (next_retry_at) 
    WHERE status = 'retrying' AND next_retry_at IS NOT NULL;

CREATE INDEX idx_attempts_event_id ON delivery_attempts (event_id);
CREATE INDEX idx_attempts_attempted_at ON delivery_attempts (attempted_at DESC);

-- ============================================================
-- 5. TRIGGER: Auto update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_endpoints_updated_at
    BEFORE UPDATE ON endpoints
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

COMMIT;

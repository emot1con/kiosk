-- ============================================================
-- Migration: 004_add_user_event_stats.sql
-- Tujuan: Pre-aggregated counter table untuk dashboard metrics
--         Menggantikan COUNT(*) query yang lambat saat data besar
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS user_event_stats (
  user_id    UUID        PRIMARY KEY,
  total      INT         NOT NULL DEFAULT 0,
  pending    INT         NOT NULL DEFAULT 0,
  delivered  INT         NOT NULL DEFAULT 0,
  retrying   INT         NOT NULL DEFAULT 0,
  dead       INT         NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_user_event_stats_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT chk_stats_non_negative
    CHECK (total >= 0 AND pending >= 0 AND delivered >= 0 AND retrying >= 0 AND dead >= 0)
);

COMMENT ON TABLE user_event_stats IS 'Pre-aggregated event counters per user untuk performa dashboard O(1)';

-- Seed tabel dengan data existing (untuk user yang sudah ada)
-- Jalankan satu kali saat migrasi
INSERT INTO user_event_stats (user_id, total, pending, delivered, retrying, dead)
SELECT
  ep.user_id,
  COUNT(e.id)                                                         AS total,
  COUNT(CASE WHEN e.status = 'pending'   THEN 1 END)                  AS pending,
  COUNT(CASE WHEN e.status = 'delivered' THEN 1 END)                  AS delivered,
  COUNT(CASE WHEN e.status = 'retrying'  THEN 1 END)                  AS retrying,
  COUNT(CASE WHEN e.status = 'dead'      THEN 1 END)                  AS dead
FROM endpoints ep
LEFT JOIN events e ON e.endpoint_id = ep.id AND e.deleted_at IS NULL
GROUP BY ep.user_id
ON CONFLICT (user_id) DO UPDATE SET
  total     = EXCLUDED.total,
  pending   = EXCLUDED.pending,
  delivered = EXCLUDED.delivered,
  retrying  = EXCLUDED.retrying,
  dead      = EXCLUDED.dead,
  updated_at = NOW();

COMMIT;

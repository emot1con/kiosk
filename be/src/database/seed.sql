-- ============================================================
-- Kiosk Webhook Reliability Layer — Initial Seed Data
-- ============================================================

BEGIN;

-- 1. Clean existing records (Optional, for fresh seed runs)
TRUNCATE TABLE delivery_attempts CASCADE;
TRUNCATE TABLE events CASCADE;
TRUNCATE TABLE endpoints CASCADE;

-- 2. Insert Mock Endpoints
-- IDs: b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22, c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33, d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44
INSERT INTO endpoints (id, name, incoming_key, destination_url, is_active, created_at, updated_at)
VALUES 
(
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'stripe-prod',
    'abc127stripe',
    'https://api.mycommerce.com/webhooks/stripe',
    TRUE,
    '2026-06-18T10:00:00Z',
    '2026-06-18T10:00:00Z'
),
(
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    'gh-webhook',
    'xyz456github',
    'https://api.mycommerce.com/webhooks/github',
    TRUE,
    '2026-06-19T14:30:00Z',
    '2026-06-19T14:30:00Z'
),
(
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
    'midtrans-payment',
    'mdt999payment',
    'https://api.mycommerce.com/webhooks/midtrans',
    TRUE,
    '2026-06-20T08:15:00Z',
    '2026-06-20T08:15:00Z'
);

-- 3. Insert Mock Events
-- IDs: e0eebc99-9c0b-4ef8-bb6d-6bb9bd380ae1, e0eebc99-9c0b-4ef8-bb6d-6bb9bd380ae2, e0eebc99-9c0b-4ef8-bb6d-6bb9bd380ae3, e0eebc99-9c0b-4ef8-bb6d-6bb9bd380ae4, e0eebc99-9c0b-4ef8-bb6d-6bb9bd380ae5
INSERT INTO events (id, endpoint_id, provider, status, headers, payload, retry_count, max_retries, next_retry_at, created_at, updated_at)
VALUES
(
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380ae1',
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'Stripe',
    'delivered',
    '{"Content-Type": "application/json", "Stripe-Signature": "t=1672531199,v1=g2d8g23...", "User-Agent": "Stripe/1.0"}'::jsonb,
    '{"id": "evt_1Mjj45Lkd...", "object": "event", "type": "charge.succeeded", "data": {"object": {"id": "ch_1Mjj45Lkd...", "amount": 29900, "currency": "usd"}}}'::jsonb,
    0,
    5,
    NULL,
    NOW() - INTERVAL '2 minutes',
    NOW() - INTERVAL '2 minutes'
),
(
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380ae2',
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    'GitHub',
    'retrying',
    '{"Content-Type": "application/json", "X-GitHub-Event": "push", "User-Agent": "GitHub-Hookshot"}'::jsonb,
    '{"ref": "refs/heads/main", "pusher": {"name": "numpyh"}, "repository": {"name": "kiosk", "full_name": "numpyh/kiosk"}}'::jsonb,
    2,
    5,
    NOW() + INTERVAL '28 minutes',
    NOW() - INTERVAL '5 minutes',
    NOW() - INTERVAL '4 minutes'
),
(
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380ae3',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
    'Midtrans',
    'delivered',
    '{"Content-Type": "application/json", "User-Agent": "Midtrans-HTTP-Client"}'::jsonb,
    '{"order_id": "order-10129", "gross_amount": "150000.00", "transaction_status": "settlement"}'::jsonb,
    0,
    5,
    NULL,
    NOW() - INTERVAL '60 minutes',
    NOW() - INTERVAL '60 minutes'
),
(
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380ae4',
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    'GitHub',
    'dead',
    '{"Content-Type": "application/json", "X-GitHub-Event": "ping"}'::jsonb,
    '{"zen": "Responsive is better than fast."}'::jsonb,
    5,
    5,
    NULL,
    NOW() - INTERVAL '150 minutes',
    NOW() - INTERVAL '60 minutes'
),
(
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380ae5',
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'Stripe',
    'delivered',
    '{"Content-Type": "application/json"}'::jsonb,
    '{"id": "evt_1Mji90Lkd...", "type": "customer.subscription.created"}'::jsonb,
    1,
    5,
    NULL,
    NOW() - INTERVAL '240 minutes',
    NOW() - INTERVAL '240 minutes'
);

-- 4. Insert Mock Attempts
INSERT INTO delivery_attempts (id, event_id, response_status, response_body, latency_ms, attempted_at)
VALUES
(
    gen_random_uuid(),
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380ae1',
    200,
    '{"received": true, "status": "success"}',
    145,
    NOW() - INTERVAL '2 minutes'
),
(
    gen_random_uuid(),
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380ae2',
    500,
    '{"error": "Internal Server Error", "message": "Database connection failed"}',
    312,
    NOW() - INTERVAL '5 minutes'
),
(
    gen_random_uuid(),
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380ae2',
    503,
    '{"error": "Service Unavailable", "message": "Destination container restarting"}',
    1204,
    NOW() - INTERVAL '4 minutes'
),
(
    gen_random_uuid(),
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380ae3',
    200,
    '{"status": "OK"}',
    98,
    NOW() - INTERVAL '60 minutes'
),
-- github_2 attempts (5 attempts, status: dead)
(
    gen_random_uuid(),
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380ae4',
    502,
    'Bad Gateway: Cannot resolve server',
    231,
    NOW() - INTERVAL '150 minutes'
),
(
    gen_random_uuid(),
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380ae4',
    502,
    'Bad Gateway: Cannot resolve server',
    198,
    NOW() - INTERVAL '140 minutes'
),
(
    gen_random_uuid(),
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380ae4',
    504,
    'Gateway Timeout: Server didn''t respond',
    5000,
    NOW() - INTERVAL '120 minutes'
),
(
    gen_random_uuid(),
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380ae4',
    504,
    'Gateway Timeout: Server didn''t respond',
    5002,
    NOW() - INTERVAL '90 minutes'
),
(
    gen_random_uuid(),
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380ae4',
    500,
    '{"message": "Fatal error", "exception": "OutOfMemoryException"}',
    450,
    NOW() - INTERVAL '60 minutes'
),
-- stripe_2 attempts (2 attempts, status: delivered)
(
    gen_random_uuid(),
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380ae5',
    503,
    'Rate limit exceeded',
    80,
    NOW() - INTERVAL '241 minutes'
),
(
    gen_random_uuid(),
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380ae5',
    200,
    '{"success": true}',
    110,
    NOW() - INTERVAL '240 minutes'
);

-- 5. Seed global_event_stats (if not exists)
INSERT INTO global_event_stats (id, total, pending, delivered, retrying, dead)
VALUES ('global', 0, 0, 0, 0, 0)
ON CONFLICT (id) DO NOTHING;

COMMIT;
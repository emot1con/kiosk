# Project Context: Webhook Reliability Layer

## Apa Ini

Sistem backend yang berfungsi sebagai **buffer/guarantee layer** antara webhook provider (Stripe, GitHub, Midtrans, dll) dan aplikasi tujuan (destination app). Tujuannya memastikan webhook event **pasti terkirim** ke destination meskipun destination sedang down, dengan automatic retry dan full visibility lewat dashboard.

Bukan aggregator webhook (seperti OpenRouter untuk LLM). Ini lebih tepat disebut **delivery guarantee + async job processing system**, analoginya mirip Hookdeck/Svix versi sederhana.

## Konteks Project

- Domain ketertarikan: dev tools / developer productivity
- Constraint: bukan CRUD repetitif — harus solve problem nyata dengan kompleksitas backend yang genuine
- Level: backend dev 1-2 tahun pengalaman

## Problem yang Diselesaikan

Webhook itu fire-and-forget. Kalau destination app sedang down saat event datang, event tersebut hilang permanen. Tiap service biasanya implement retry logic sendiri-sendiri secara inconsistent. Sistem ini memusatkan reliability itu di satu tempat.

## Arsitektur Sistem

```
Provider (Stripe/GitHub)
    │ POST /incoming/:endpointId (+ X-Api-Key header)
    ▼
API Service → simpan event ke DB → push job ke Redis (BullMQ)
    │
    ▼
Worker (BullMQ) → forward POST ke destination_url
    │
    ├── Sukses → status: delivered
    └── Gagal  → retry_count++, hitung next_retry_at,
                 push ulang ke BullMQ dengan delay
                 (max retry tercapai → status: dead)
```

## Retry Strategy

```
Attempt 1 → immediate
Attempt 2 → delay 1 menit
Attempt 3 → delay 5 menit
Attempt 4 → delay 30 menit
Attempt 5 → delay 2 jam
Attempt 6+ → status = dead (dead letter)
```

## Database Schema

```sql
users
  id, email, password_hash, api_key, created_at

endpoints
  id, user_id (FK), name, destination_url, created_at

events
  id, endpoint_id (FK), payload, headers, status,
  retry_count, next_retry_at, created_at
  -- status: pending | delivered | retrying | dead

delivery_attempts
  id, event_id (FK), attempted_at, response_status,
  response_body, latency_ms
```

Schema didesain dari pertanyaan use-case (apa yang harus dijawab dashboard), bukan dari asumsi tabel di awal.

## Autentikasi

- User register → dapat `api_key`
- `api_key` dipasang sebagai header (`X-Api-Key`) saat setup webhook URL di provider (Stripe dll)
- Mencegah request palsu ke endpoint yang URL-nya bocor/tertebak
- Bukan signature verification provider (itu fitur terpisah, belum di-scope untuk MVP ini)

## Stack

- API: Typescript Node.js (Nest)
- Queue/Worker: Kafka/Rabbitmq
- DB: PostgreSQL
- Dashboard: React atau Next.js sederhana

## Scope Yang Wajib Ada

1. Register user + dapat api_key
2. Register endpoint (destination_url)
3. Receive webhook → simpan event → return 200 cepat
4. Worker forward ke destination, catat attempt
5. Retry logic dengan backoff
6. Dashboard: list events + status + detail attempt history + manual retry
7. Deploy live (bukan localhost saja)

## Cara Testing & Demo

- `destination_url` testing: pakai webhook.site untuk lihat payload masuk
- Simulasi provider: cURL/Postman manual POST ke `/incoming/:endpointId`
- Simulasi failure untuk demo retry: arahkan destination ke httpstat.us/500, lalu ganti ke webhook.site untuk simulasikan "recovery" — ini demo flow paling kuat untuk presentasi (problem → fail → retry → recover)

## Narasi README (Problem-First)

Opening yang disarankan:

> "Webhook calls fail silently. When your consumer is down, Stripe doesn't care — the event is gone. This service sits between webhook providers and your app, guaranteeing delivery with automatic retries and full visibility."

## Catatan Eksekusi

Urutan build yang disarankan: DB schema → endpoint receive webhook → worker basic → retry logic → dashboard → deploy.

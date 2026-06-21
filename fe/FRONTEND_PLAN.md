# Frontend Plan: Webhook Reliability Dashboard

## Tech Stack

| Layer | Pilihan | Alasan |
|-------|---------|--------|
| Framework | Next.js (App Router) | SSR, routing built-in, API routes |
| Styling | Vanilla CSS + CSS Modules | Kontrol penuh, tidak perlu library tambahan |
| HTTP Client | fetch / axios | Komunikasi ke backend API |
| Auth State | Context API + cookies | Simpel, cukup untuk scope ini |
| Icons | Lucide React | Ringan, konsisten |
| Date formatting | date-fns | Lightweight date utility |

---

## Halaman Yang Dibutuhkan

### 1. Auth Pages

#### `/login`
```
┌─────────────────────────────────────┐
│           KIOSK WEBHOOK             │
│                                     │
│   ┌───────────────────────────┐     │
│   │ Email                     │     │
│   └───────────────────────────┘     │
│   ┌───────────────────────────┐     │
│   │ Password                  │     │
│   └───────────────────────────┘     │
│                                     │
│   [ Login ]                         │
│                                     │
│   Belum punya akun? Register        │
└─────────────────────────────────────┘
```
- POST `/api/auth/login` → dapat JWT token
- Simpan token di httpOnly cookie
- Redirect ke `/dashboard`

#### `/register`
```
┌─────────────────────────────────────┐
│           KIOSK WEBHOOK             │
│                                     │
│   ┌───────────────────────────┐     │
│   │ Email                     │     │
│   └───────────────────────────┘     │
│   ┌───────────────────────────┐     │
│   │ Password                  │     │
│   └───────────────────────────┘     │
│   ┌───────────────────────────┐     │
│   │ Confirm Password          │     │
│   └───────────────────────────┘     │
│                                     │
│   [ Register ]                      │
│                                     │
│   Sudah punya akun? Login           │
└─────────────────────────────────────┘
```
- POST `/api/auth/register` → dapat JWT + api_key
- Tampilkan api_key sekali (copy to clipboard)
- Redirect ke `/dashboard`

---

### 2. Dashboard Overview (`/dashboard`)

Halaman utama setelah login. Menampilkan ringkasan kesehatan sistem.

```
┌──────────────────────────────────────────────────────────┐
│  [SIDEBAR]          DASHBOARD OVERVIEW                   │
│  ─────────          ──────────────────                   │
│  Dashboard    ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐       │
│  Endpoints    │ 1247 │ │ 1180 │ │  42  │ │  25  │       │
│  Events       │Total │ │Deliv.│ │Retry │ │Dead  │       │
│  Settings     └──────┘ └──────┘ └──────┘ └──────┘       │
│                                                          │
│  RECENT EVENTS                                           │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Status │ Endpoint    │ Provider │ Time    │ Action │  │
│  │ ✅ del │ stripe-prod │ Stripe   │ 2m ago  │ View   │  │
│  │ 🔄 ret │ gh-webhook  │ GitHub   │ 5m ago  │ View   │  │
│  │ ❌ dead│ midtrans-1  │ Midtrans │ 1h ago  │ Retry  │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ENDPOINT HEALTH                                         │
│  ┌────────────────────────────────────────────────────┐  │
│  │ stripe-prod   ████████████░░ 94% healthy          │  │
│  │ gh-webhook    ██████░░░░░░░░ 45% healthy          │  │
│  │ midtrans-1    ████████████████ 100% healthy       │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

**Data yang dibutuhkan dari API:**
- `GET /api/events/stats` → total, delivered, retrying, dead counts
- `GET /api/events?limit=10&sort=latest` → recent events
- `GET /api/endpoints` → list endpoints + health percentage

---

### 3. Endpoints Page (`/endpoints`)

#### List View (`/endpoints`)
```
┌──────────────────────────────────────────────────────────┐
│  ENDPOINTS                              [ + New Endpoint]│
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Name          │ Destination URL       │ Events │ ⚙  │  │
│  │ stripe-prod   │ https://myapp.com/hook│ 523    │ ⚙  │  │
│  │ gh-webhook    │ https://myapp.com/gh  │ 312    │ ⚙  │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

#### Create Endpoint (Modal)
```
┌─────────────────────────────────┐
│  Create New Endpoint            │
│                                 │
│  Name: [stripe-production    ]  │
│  URL:  [https://myapp.com/wh ]  │
│                                 │
│  [ Cancel ]  [ Create ]         │
└─────────────────────────────────┘
```

#### Endpoint Detail (`/endpoints/[id]`)
```
┌──────────────────────────────────────────────────────────┐
│  ← Back    ENDPOINT: stripe-prod                         │
│                                                          │
│  Destination: https://myapp.com/webhook/stripe           │
│  Webhook URL: https://kiosk.dev/incoming/abc123          │
│  Created: 2026-06-20                                     │
│                                                          │
│  EVENTS FOR THIS ENDPOINT          [Filter: All Status ▼]│
│  ┌────────────────────────────────────────────────────┐  │
│  │ ID      │ Status    │ Retries │ Time    │ Action   │  │
│  │ evt_01  │ delivered │ 0       │ 2m ago  │ View     │  │
│  │ evt_02  │ retrying  │ 2       │ 5m ago  │ View     │  │
│  │ evt_03  │ dead      │ 5       │ 1h ago  │ Retry    │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

**API:**
- `GET /api/endpoints` → list
- `POST /api/endpoints` → create
- `GET /api/endpoints/:id` → detail + events
- `DELETE /api/endpoints/:id` → hapus

---

### 4. Events Page (`/events`)

#### List View (`/events`)
```
┌──────────────────────────────────────────────────────────┐
│  ALL EVENTS                                              │
│                                                          │
│  Filters: [Endpoint ▼] [Status ▼] [Date Range]  [Search]│
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ ID     │ Endpoint   │ Status  │ Retries │ Action   │  │
│  │ evt_01 │ stripe-pro │ ✅ del  │ 0/5     │ View     │  │
│  │ evt_02 │ gh-webhook │ 🔄 ret  │ 2/5     │ View     │  │
│  │ evt_03 │ midtrans-1 │ ❌ dead │ 5/5     │ Retry    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  [← Prev]  Page 1 of 12  [Next →]                       │
└──────────────────────────────────────────────────────────┘
```

#### Event Detail (`/events/[id]`)

Halaman **paling penting** — ini yang membuktikan value sistem.

```
┌──────────────────────────────────────────────────────────┐
│  ← Back    EVENT: evt_02                    [ 🔄 Retry ] │
│                                                          │
│  Status: 🔄 retrying (attempt 2/5)                       │
│  Endpoint: gh-webhook                                    │
│  Next retry: in 28 minutes                               │
│  Received: 2026-06-20 14:32:01                           │
│                                                          │
│  ── PAYLOAD ──────────────────────────────────────────   │
│  {                                                       │
│    "action": "push",                                     │
│    "repository": "myrepo",                               │
│    "sender": { "login": "numpyh" }                       │
│  }                                                       │
│                                                          │
│  ── ORIGINAL HEADERS ─────────────────────────────────   │
│  X-GitHub-Event: push                                    │
│  X-GitHub-Delivery: abc-123-def                          │
│  Content-Type: application/json                          │
│                                                          │
│  ── DELIVERY ATTEMPTS ────────────────────────────────   │
│  ┌────────────────────────────────────────────────────┐  │
│  │ #  │ Time            │ HTTP │ Latency │ Response   │  │
│  │ 1  │ 14:32:01        │ 500  │ 234ms   │ View body  │  │
│  │ 2  │ 14:33:01 (+1m)  │ 503  │ 1203ms  │ View body  │  │
│  │ 3  │ (scheduled)     │ —    │ —       │ —          │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

**API:**
- `GET /api/events?endpoint=X&status=Y&page=1` → filtered list
- `GET /api/events/:id` → detail + delivery attempts
- `POST /api/events/:id/retry` → manual retry

---

### 5. Settings Page (`/settings`)

```
┌──────────────────────────────────────────────────────────┐
│  SETTINGS                                                │
│                                                          │
│  ── API KEY ──────────────────────────────────────────   │
│  sk_live_abc123def456...  [👁 Show] [📋 Copy] [🔄 Regen]│
│                                                          │
│  ⚠️ Regenerating akan invalidate key lama.               │
│                                                          │
│  ── WEBHOOK BASE URL ─────────────────────────────────   │
│  https://kiosk.dev/incoming/:endpointId                  │
│  (URL ini dipasang di provider seperti Stripe/GitHub)    │
│                                                          │
│  ── ACCOUNT ──────────────────────────────────────────   │
│  Email: user@example.com                                 │
│  [ Change Password ]                                     │
│  [ Logout ]                                              │
└──────────────────────────────────────────────────────────┘
```

**API:**
- `GET /api/user/me` → profile + masked api_key
- `POST /api/user/regenerate-key` → new api_key
- `PUT /api/user/password` → change password

---

## User Flow

```
Register → Dapat API Key → Buat Endpoint → Pasang Webhook URL di Stripe
                                                      │
                              Stripe kirim event ─────┘
                                                      │
                              Event masuk ke sistem ───┘
                                                      │
                    Dashboard: lihat event + status ───┘
                                                      │
            Kalau gagal: lihat retry attempts + manual retry
```

---

## Folder Structure (Next.js App Router)

```
fe/
├── public/
├── src/
│   ├── app/
│   │   ├── layout.js              ← Root layout + sidebar
│   │   ├── page.js                ← Redirect ke /dashboard
│   │   ├── login/
│   │   │   └── page.js
│   │   ├── register/
│   │   │   └── page.js
│   │   ├── dashboard/
│   │   │   └── page.js            ← Overview + stats
│   │   ├── endpoints/
│   │   │   ├── page.js            ← List endpoints
│   │   │   └── [id]/
│   │   │       └── page.js        ← Endpoint detail + events
│   │   ├── events/
│   │   │   ├── page.js            ← All events + filter
│   │   │   └── [id]/
│   │   │       └── page.js        ← Event detail + attempts
│   │   └── settings/
│   │       └── page.js
│   ├── components/
│   │   ├── Sidebar.js
│   │   ├── Sidebar.module.css
│   │   ├── StatCard.js             ← Kartu angka di dashboard
│   │   ├── EventTable.js           ← Tabel events reusable
│   │   ├── StatusBadge.js          ← Badge delivered/retrying/dead
│   │   ├── EndpointHealthBar.js    ← Progress bar kesehatan
│   │   ├── PayloadViewer.js        ← JSON viewer untuk payload
│   │   ├── Modal.js                ← Modal reusable
│   │   └── Pagination.js
│   ├── context/
│   │   └── AuthContext.js          ← Auth state management
│   ├── lib/
│   │   └── api.js                  ← API helper (fetch wrapper + token)
│   └── styles/
│       └── globals.css             ← Design system tokens + base styles
├── package.json
└── next.config.js
```

---

## Fase Build (Urutan Eksekusi)

### Fase 1: Foundation
- Setup Next.js project
- Design system (CSS variables, typography, colors)
- Layout + Sidebar component
- Auth context (dummy dulu, tanpa API)

### Fase 2: Auth Pages
- Login page (form + validation)
- Register page (form + validation)
- Connect ke backend auth API

### Fase 3: Dashboard
- StatCard component
- StatusBadge component
- EventTable component (reusable)
- Dashboard page (compose components)

### Fase 4: Endpoints
- Endpoints list page
- Create endpoint modal
- Endpoint detail page

### Fase 5: Events
- Events list page + filters + pagination
- Event detail page
- PayloadViewer (JSON syntax highlight)
- Delivery attempts timeline
- Manual retry button

### Fase 6: Settings
- API key display + copy + regenerate
- Account settings

### Fase 7: Polish
- Loading states & skeletons
- Error handling (toast notifications)
- Empty states (belum ada endpoint, belum ada event)
- Responsive design

---

## Rekomendasi Saya (Pertanyaan 7, 8, 10)

| Topik | Keputusan | Alasan |
|-------|-----------|--------|
| **Payload size limit** | 256KB | Cukup untuk semua webhook umum (Stripe ~2KB, GitHub ~15KB). Mencegah abuse. |
| **Manual retry** | Per-event + bulk retry dead per endpoint | Per-event wajib. Bulk berguna saat destination recover — retry semua dead sekaligus. |
| **Retention** | 30 hari delivered, 90 hari failed/dead | Delivered sudah selesai, tidak perlu lama. Failed/dead perlu audit trail lebih panjang. Auto-cleanup via cron job. |

---

## Catatan

> Dokumen ini adalah **peta** sebelum kita mulai coding.
> Kita akan build **fase per fase**, diskusi tiap langkah.
> Kalau ada yang kurang jelas atau mau diubah, bilang sebelum kita mulai Fase 1.

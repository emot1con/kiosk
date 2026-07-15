// ============================================================
// 03_stress.js — Stress test: dorong hingga sistem mulai gagal
// Target: 500 → 2000 VU, cari breaking point
// Jalankan: k6 run scripts/03_stress.js
// ============================================================

import { sleep } from 'k6';
import {
  post, get,
  createTestUser, authHeader,
  randomUrl, randomProvider, randomPayload,
  assertOk,
} from '../utils/helpers.js';

export const options = {
  stages: [
    { duration: '2m',  target: 100  },
    { duration: '3m',  target: 500  },
    { duration: '3m',  target: 1000 },
    { duration: '3m',  target: 1500 },
    { duration: '3m',  target: 2000 },  // ← biasanya breaking point ada di sini
    { duration: '5m',  target: 2000 },  // hold untuk observasi
    { duration: '3m',  target: 0    },  // recovery
  ],

  thresholds: {
    // Di stress test threshold sengaja lebih longgar, tujuan = amati perilaku
    http_req_failed:   ['rate<0.20'],     // toleransi 20% error
    http_req_duration: ['p(90)<5000'],
  },
};

export function setup() {
  return createTestUser('_stress');
}

export default function (data) {
  const headers = authHeader(data.accessToken);

  // Fokus pada hot path: ingress webhook
  // Endpoint dibuat sekali di setup lalu dipakai semua VU
  const ep = data.endpoint;
  if (ep && ep.incomingKey) {
    const res = post(`/incoming/${ep.incomingKey}`, randomPayload());
    assertOk(res, 'webhook-stress');
  } else {
    // Fallback: buat endpoint baru
    const created = post('/endpoints', {
      name:           `stress-${__VU}`,
      destinationUrl: randomUrl(),
      provider:       randomProvider(),
    }, headers);
    assertOk(created, 'create-endpoint-stress');
  }

  sleep(0.05); // minimal sleep → maksimalkan throughput
}

// Override setup untuk buat shared endpoint
export function setup() {
  const user = createTestUser('_stress');
  const headers = authHeader(user.accessToken);

  const ep = post('/endpoints', {
    name:           'Stress Shared Endpoint',
    destinationUrl: randomUrl(),
    provider:       'stripe',
  }, headers);

  const endpoint = ep.json();
  return { ...user, endpoint };
}

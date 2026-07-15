// ============================================================
// 05_soak.js — Soak test: 200 VU selama 2 jam
// Tujuan: deteksi memory leak, connection pool exhaustion,
//         degradasi performa jangka panjang
// Jalankan: k6 run scripts/05_soak.js
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
    { duration: '5m',   target: 200 },   // warm-up
    { duration: '110m', target: 200 },   // soak 2 jam
    { duration: '5m',   target: 0   },   // ramp-down
  ],

  thresholds: {
    http_req_failed:   ['rate<0.01'],     // 1% max error — ketat di soak
    http_req_duration: ['p(95)<1500', 'p(99)<3000'],
  },
};

export function setup() {
  return createTestUser('_soak');
}

export default function (data) {
  const headers = authHeader(data.accessToken);

  // Siklus operasi realistis: create → send → list → repeat
  const created = post('/endpoints', {
    name:           `soak-${__VU}-${Date.now()}`,
    destinationUrl: randomUrl(),
    provider:       randomProvider(),
  }, headers);

  if (created.status === 201) {
    const ep = created.json();

    // Kirim beberapa webhook ke endpoint baru
    for (let i = 0; i < 3; i++) {
      const wb = post(`/incoming/${ep.incomingKey}`, randomPayload());
      assertOk(wb, 'soak-webhook');
      sleep(0.2);
    }

    // Sesekali list events
    if (__ITER % 10 === 0) {
      const ev = get('/events', headers);
      assertOk(ev, 'soak-events');
    }

    // Bersihkan: hapus endpoint setelah selesai (hindari data bloat)
    // Uncomment jika ingin cleanup:
    // del(`/endpoints/${ep.id}`, headers);
  }

  sleep(1 + Math.random()); // sleep 1–2 detik
}

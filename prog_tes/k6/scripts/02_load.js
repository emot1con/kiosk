// ============================================================
// 02_load.js — Load test: ramp naik ke 500 VU → hold → ramp down
// Target: ~50.000–100.000 request per run (~15 menit)
// Jalankan: k6 run scripts/02_load.js
// ============================================================

import { sleep } from 'k6';
import {
  createTestUser, authHeader,
  post, get,
  randomUrl, randomProvider, randomPayload,
  assertOk,
} from '../utils/helpers.js';

export const options = {
  // Skenario ramp-up bertahap — intensitas diturunkan agar tidak OOM
  stages: [
    { duration: '1m',  target: 20  },   // warm-up
    { duration: '2m',  target: 80  },   // ramp naik
    { duration: '2m',  target: 150 },   // plateau utama
    { duration: '3m',  target: 150 },   // hold
    { duration: '1m',  target: 50  },   // cool-down
    { duration: '1m',  target: 0   },   // ramp turun
  ],

  thresholds: {
    http_req_failed:            ['rate<0.05'],      // max 5% error
    http_req_duration:          ['p(90)<1000', 'p(99)<3000'],
    'http_req_duration{name:webhook-ingress}': ['p(95)<800'],
    'http_req_duration{name:list-events}':     ['p(95)<1200'],
  },
};

// setup() → satu user dibagi ke semua VU
export function setup() {
  const user = createTestUser('_load');
  const headers = authHeader(user.accessToken);

  // Buat 1 endpoint untuk dipakai bersama (shared) selama load test
  const created = post('/endpoints', {
    name:           'Load Test Shared Endpoint',
    destinationUrl: randomUrl(),
    provider:       randomProvider(),
  }, headers);
  
  return { ...user, endpoint: created.json() };
}

export default function (data) {
  const headers = authHeader(data.accessToken);
  const ep = data.endpoint;

  if (!ep || !ep.incomingKey) {
    sleep(0.5);
    return;
  }

  // Hot path: kirim webhook masuk — dengan tag agar K6 bisa track metrics per-name
  const webhook = post(`/incoming/${ep.incomingKey}`, randomPayload(), {}, { name: 'webhook-ingress' });
  assertOk(webhook, 'webhook-ingress');

  // Sesekali list events (dikurangi frekuensinya agar lebih realistis)
  if (__ITER % 20 === 0) {
    const events = get('/events?page=1&limit=15', headers, { name: 'list-events' });
    assertOk(events, 'list-events');
  }

  sleep(Math.random() * 0.5 + 0.1); // jitter 0.1–0.6 detik
}

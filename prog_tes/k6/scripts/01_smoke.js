// ============================================================
// 01_smoke.js — Smoke test: 1 VU, ~10 req, validasi endpoint
// Tujuan: pastikan API jalan sebelum load test besar
// Jalankan: k6 run scripts/01_smoke.js
// ============================================================

import { sleep } from 'k6';
import { createTestUser, authHeader, post, get, randomUrl, randomProvider, randomPayload, assertOk } from '../utils/helpers.js';

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    http_req_failed:   ['rate<0.01'],        // max 1% error
    http_req_duration: ['p(95)<2000'],       // 95th percentile < 2s
  },
};

// setup() dijalankan sekali sebelum test — hasilkan data bersama
export function setup() {
  return createTestUser('_smoke');
}

export default function (data) {
  const headers = authHeader(data.accessToken);

  // 1. List endpoints (harusnya kosong)
  const listEmpty = get('/endpoints', headers);
  assertOk(listEmpty, 'list-endpoints-empty');

  // 2. Buat endpoint
  const created = post('/endpoints', {
    name:           'Smoke Test Endpoint',
    destinationUrl: randomUrl(),
    provider:       randomProvider(),
  }, headers);
  assertOk(created, 'create-endpoint');
  const endpoint = created.json();

  // 3. List endpoints (harusnya ada 1)
  const listOne = get('/endpoints', headers);
  assertOk(listOne, 'list-endpoints-one');

  // 4. Get by ID
  const getOne = get(`/endpoints/${endpoint.id}`, headers);
  assertOk(getOne, 'get-endpoint-by-id');

  // 5. Kirim webhook (ingress)
  const webhookRes = post(`/incoming/${endpoint.incomingKey}`, randomPayload());
  assertOk(webhookRes, 'webhook-ingress');

  // 6. Lihat events
  const events = get('/events', headers);
  assertOk(events, 'list-events');

  sleep(1);
}

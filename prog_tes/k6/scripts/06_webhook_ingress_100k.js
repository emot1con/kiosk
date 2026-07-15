// ============================================================
// 06_webhook_ingress_100k.js — High-volume ingress test
// Target: 100.000+ request pada endpoint /incoming/:key
// Gunakan --vus dan --iterations dari CLI untuk kontrol penuh
//
// Contoh:
//   k6 run --vus 1000 --iterations 100000 scripts/06_webhook_ingress_100k.js
//   k6 run --vus 2000 --duration 5m       scripts/06_webhook_ingress_100k.js
// ============================================================

import { sleep } from 'k6';
import {
  post,
  createTestUser, authHeader,
  randomUrl, randomPayload,
  assertOk, assert,
} from '../utils/helpers.js';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom metrics
const webhookSuccessCount  = new Counter('webhook_success_total');
const webhookErrorRate     = new Rate('webhook_error_rate');
const webhookLatency       = new Trend('webhook_latency_ms', true);

export const options = {
  // Default: override via CLI --vus / --iterations / --duration
  scenarios: {
    high_volume_ingress: {
      executor:   'constant-arrival-rate',
      rate:       5000,          // 5000 request per detik
      timeUnit:   '1s',
      duration:   '30s',        // total = 150.000 request
      preAllocatedVUs: 500,
      maxVUs:     2000,
    },
  },

  thresholds: {
    http_req_failed:              ['rate<0.05'],
    http_req_duration:            ['p(90)<500', 'p(99)<2000'],
    webhook_error_rate:           ['rate<0.05'],
    webhook_latency_ms:           ['p(95)<1000'],
  },
};

// Setup: buat satu endpoint yang dipakai semua VU
export function setup() {
  const user = createTestUser('_ingress100k');
  const headers = authHeader(user.accessToken);

  const ep = post('/endpoints', {
    name:           'High Volume Ingress Test',
    destinationUrl: randomUrl(),
    provider:       'stripe',
  }, headers);

  assertOk(ep, 'setup-create-endpoint');
  const endpoint = ep.json();

  console.log(`✅ Endpoint created: ${endpoint.id}`);
  console.log(`🔑 Incoming key: ${endpoint.incomingKey}`);

  return { ...user, endpoint };
}

export default function (data) {
  if (!data.endpoint?.incomingKey) {
    console.error('No incoming key available!');
    return;
  }

  const start = Date.now();
  const res = post(`/incoming/${data.endpoint.incomingKey}`, randomPayload());
  const latency = Date.now() - start;

  webhookLatency.add(latency);

  const ok = assertOk(res, 'high-volume-webhook');
  if (ok) {
    webhookSuccessCount.add(1);
    webhookErrorRate.add(0);
  } else {
    webhookErrorRate.add(1);
    console.warn(`❌ Failed: status=${res.status} body=${res.body?.slice(0, 200)}`);
  }
}

export function teardown(data) {
  console.log('✅ Load test selesai. Cek hasil di ./results/');
}

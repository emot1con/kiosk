// ============================================================
// 04_spike.js — Spike test: lonjakan tiba-tiba dari 0 → 3000 VU
// Simulasi: flash sale / traffic burst yang tidak terduga
// Jalankan: k6 run scripts/04_spike.js
// ============================================================

import { sleep } from 'k6';
import {
  post,
  createTestUser, authHeader,
  randomUrl, randomPayload,
  assertOk,
} from '../utils/helpers.js';

export const options = {
  stages: [
    { duration: '10s', target: 50   },   // baseline
    { duration: '30s', target: 3000 },   // SPIKE — naik cepat
    { duration: '1m',  target: 3000 },   // hold spike
    { duration: '30s', target: 50   },   // turun cepat
    { duration: '2m',  target: 50   },   // observasi recovery
    { duration: '30s', target: 0    },
  ],

  thresholds: {
    http_req_failed:   ['rate<0.30'],   // 30% error masih diterima saat spike
    http_req_duration: ['p(95)<10000'],
  },
};

export function setup() {
  const user = createTestUser('_spike');
  const headers = authHeader(user.accessToken);

  const ep = post('/endpoints', {
    name:           'Spike Test Endpoint',
    destinationUrl: randomUrl(),
    provider:       'github',
  }, headers);

  return { ...user, endpoint: ep.json() };
}

export default function (data) {
  if (!data.endpoint?.incomingKey) return;

  const res = post(`/incoming/${data.endpoint.incomingKey}`, randomPayload());
  assertOk(res, 'spike-ingress');

  // Tidak ada sleep — simulasikan burst murni
}

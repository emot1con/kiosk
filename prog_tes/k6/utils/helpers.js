// ============================================================
// helpers.js — shared utilities for all k6 test scripts
// ============================================================

import http from 'k6/http';
import { check } from 'k6';

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

// --------------- HTTP wrappers ---------------

export function post(path, body, headers = {}, tags = {}) {
  return http.post(`${BASE_URL}${path}`, JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json', ...headers },
    timeout: '30s',
    tags,
  });
}

export function get(path, headers = {}, tags = {}) {
  return http.get(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...headers },
    timeout: '30s',
    tags,
  });
}

export function patch(path, body, headers = {}) {
  return http.patch(`${BASE_URL}${path}`, JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json', ...headers },
    timeout: '30s',
  });
}

export function del(path, headers = {}) {
  return http.del(`${BASE_URL}${path}`, null, {
    headers: { 'Content-Type': 'application/json', ...headers },
    timeout: '30s',
  });
}

// --------------- Auth helpers ---------------

/**
 * Register + login a fresh test user, returns { accessToken, apiKey }
 * Use in setup() so tokens are shared across VUs.
 */
export function createTestUser(suffix = '') {
  const ts = Date.now();
  const email = `loadtest_${ts}${suffix}@test.local`;
  const password = 'LoadTest@1234';

  const reg = post('/auth/register', { email, password });
  check(reg, { 'register 201': (r) => r.status === 201 });

  // (The register endpoint returns plain text "register succedd", so we don't parse it as JSON)
  const apiKey = null; // apiKey is not needed for the tests since we use accessToken

  const login = post('/auth/login', { email, password });
  check(login, { 'login 200': (r) => r.status === 200 });

  const { accessToken, refreshToken } = login.json();
  return { email, password, accessToken, refreshToken, apiKey };
}

export function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

// --------------- Assertion helpers ---------------

export function assertOk(res, tag = '') {
  return check(res, {
    [`${tag} status 2xx`]: (r) => r.status >= 200 && r.status < 300,
  });
}

export function assert(res, label, fn) {
  return check(res, { [label]: fn });
}

// --------------- Random data ---------------

const PROVIDERS = ['stripe', 'github', 'shopify', 'twilio', 'sendgrid'];

export function randomProvider() {
  return PROVIDERS[Math.floor(Math.random() * PROVIDERS.length)];
}

export function randomUrl() {
  // Use a local echo server or a no-op URL during load tests
  const echoHost = __ENV.ECHO_HOST || 'http://localhost:8080';
  return `${echoHost}/webhook/${Math.random().toString(36).slice(2, 8)}`;
}

export function randomPayload() {
  return {
    event: 'payment.succeeded',
    id: `evt_${Math.random().toString(36).slice(2, 12)}`,
    amount: Math.floor(Math.random() * 100000),
    currency: 'idr',
    timestamp: new Date().toISOString(),
    metadata: { orderId: `ord_${Math.random().toString(36).slice(2, 8)}` },
  };
}

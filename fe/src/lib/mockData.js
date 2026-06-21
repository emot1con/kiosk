export const initialEndpoints = [
  {
    id: "ep_1",
    name: "stripe-prod",
    destinationUrl: "https://api.mycommerce.com/webhooks/stripe",
    incomingKey: "abc127stripe",
    createdAt: "2026-06-18T10:00:00Z",
    eventsCount: 523,
    successCount: 492,
    isActive: true,
  },
  {
    id: "ep_2",
    name: "gh-webhook",
    destinationUrl: "https://api.mycommerce.com/webhooks/github",
    incomingKey: "xyz456github",
    createdAt: "2026-06-19T14:30:00Z",
    eventsCount: 312,
    successCount: 140,
    isActive: true,
  },
  {
    id: "ep_3",
    name: "midtrans-payment",
    destinationUrl: "https://api.mycommerce.com/webhooks/midtrans",
    incomingKey: "mdt999payment",
    createdAt: "2026-06-20T08:15:00Z",
    eventsCount: 184,
    successCount: 184,
    isActive: true,
  }
];

export const initialEvents = [
  {
    id: "evt_stripe_1",
    endpointId: "ep_1",
    provider: "Stripe",
    status: "delivered",
    retryCount: 0,
    maxRetries: 5,
    nextRetryAt: null,
    createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2m ago
    headers: {
      "Content-Type": "application/json",
      "Stripe-Signature": "t=1672531199,v1=g2d8g23...",
      "User-Agent": "Stripe/1.0 (+https://stripe.com/docs/webhooks)"
    },
    payload: {
      id: "evt_1Mjj45Lkd...",
      object: "event",
      type: "charge.succeeded",
      data: {
        object: {
          id: "ch_1Mjj45Lkd...",
          amount: 29900,
          currency: "usd",
          customer: "cus_NWb45y...",
          billing_details: {
            email: "client@example.com",
            name: "John Doe"
          }
        }
      }
    }
  },
  {
    id: "evt_github_1",
    endpointId: "ep_2",
    provider: "GitHub",
    status: "retrying",
    retryCount: 2,
    maxRetries: 5,
    nextRetryAt: new Date(Date.now() + 28 * 60 * 1000).toISOString(), // In 28 mins
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5m ago
    headers: {
      "Content-Type": "application/json",
      "X-GitHub-Event": "push",
      "X-GitHub-Delivery": "7bca4589-9e62-42db-...",
      "User-Agent": "GitHub-Hookshot/11234a"
    },
    payload: {
      ref: "refs/heads/main",
      before: "95790bf8917...",
      after: "41fb7f483ee...",
      repository: {
        id: 54321098,
        name: "kiosk",
        full_name: "numpyh/kiosk",
        private: true
      },
      pusher: {
        name: "numpyh",
        email: "numpyh@github.com"
      }
    }
  },
  {
    id: "evt_midtrans_1",
    endpointId: "ep_3",
    provider: "Midtrans",
    status: "delivered",
    retryCount: 0,
    maxRetries: 5,
    nextRetryAt: null,
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1h ago
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "User-Agent": "Midtrans-HTTP-Client/1.0"
    },
    payload: {
      transaction_time: "2026-06-21 17:41:00",
      transaction_status: "settlement",
      transaction_id: "782ac-db81-4201-...",
      status_message: "midtrans payment successful",
      status_code: "200",
      signature_key: "abc123789xyz...",
      payment_type: "qris",
      order_id: "order-10129",
      gross_amount: "150000.00"
    }
  },
  {
    id: "evt_github_2",
    endpointId: "ep_2",
    provider: "GitHub",
    status: "dead",
    retryCount: 5,
    maxRetries: 5,
    nextRetryAt: null,
    createdAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(), // 2.5h ago
    headers: {
      "Content-Type": "application/json",
      "X-GitHub-Event": "ping",
      "X-GitHub-Delivery": "123e4567-e89b-...",
      "User-Agent": "GitHub-Hookshot/11234a"
    },
    payload: {
      zen: "Responsive is better than fast.",
      hook_id: 9912831,
      hook: {
        type: "Repository",
        id: 9912831,
        active: true,
        events: ["push", "pull_request"]
      }
    }
  },
  {
    id: "evt_stripe_2",
    endpointId: "ep_1",
    provider: "Stripe",
    status: "delivered",
    retryCount: 1,
    maxRetries: 5,
    nextRetryAt: null,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4h ago
    headers: {
      "Content-Type": "application/json",
      "Stripe-Signature": "t=1672521199,v1=f893d...",
      "User-Agent": "Stripe/1.0"
    },
    payload: {
      id: "evt_1Mji90Lkd...",
      object: "event",
      type: "customer.subscription.created",
      data: {
        object: {
          id: "sub_1Mji90Lkd...",
          customer: "cus_NWb45y...",
          status: "active",
          items: {
            data: [{ id: "si_NWb4...", price: { id: "price_premium", unit_amount: 1900 } }]
          }
        }
      }
    }
  },
  {
    id: "evt_stripe_3",
    endpointId: "ep_1",
    provider: "Stripe",
    status: "pending",
    retryCount: 0,
    maxRetries: 5,
    nextRetryAt: null,
    createdAt: new Date(Date.now() - 30 * 1000).toISOString(), // 30s ago
    headers: {
      "Content-Type": "application/json",
      "Stripe-Signature": "t=1672531199,v1=f7324...",
      "User-Agent": "Stripe/1.0"
    },
    payload: {
      id: "evt_1Mjj90Lkd...",
      object: "event",
      type: "payment_intent.created",
      data: {
        object: {
          id: "pi_3Mjj90Lkd...",
          amount: 50000,
          currency: "idr",
          status: "requires_payment_method"
        }
      }
    }
  }
];

export const initialAttempts = [
  {
    id: "att_1",
    eventId: "evt_stripe_1",
    attemptedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    responseStatus: 200,
    responseBody: JSON.stringify({ received: true, status: "success" }),
    latencyMs: 145,
  },
  {
    id: "att_2",
    eventId: "evt_github_1",
    attemptedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    responseStatus: 500,
    responseBody: JSON.stringify({ error: "Internal Server Error", message: "Database connection failed" }),
    latencyMs: 312,
  },
  {
    id: "att_3",
    eventId: "evt_github_1",
    attemptedAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    responseStatus: 503,
    responseBody: JSON.stringify({ error: "Service Unavailable", message: "Destination container restarting" }),
    latencyMs: 1204,
  },
  {
    id: "att_4",
    eventId: "evt_midtrans_1",
    attemptedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    responseStatus: 200,
    responseBody: JSON.stringify({ status: "OK", transactionId: "782ac-db81-4201-..." }),
    latencyMs: 98,
  },
  // attempts for dead github_2 event (5 attempts)
  {
    id: "att_5",
    eventId: "evt_github_2",
    attemptedAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(),
    responseStatus: 502,
    responseBody: "Bad Gateway: Cannot resolve server",
    latencyMs: 231,
  },
  {
    id: "att_6",
    eventId: "evt_github_2",
    attemptedAt: new Date(Date.now() - 2.4 * 60 * 60 * 1000).toISOString(),
    responseStatus: 502,
    responseBody: "Bad Gateway: Cannot resolve server",
    latencyMs: 198,
  },
  {
    id: "att_7",
    eventId: "evt_github_2",
    attemptedAt: new Date(Date.now() - 2.0 * 60 * 60 * 1000).toISOString(),
    responseStatus: 504,
    responseBody: "Gateway Timeout: Server didn't respond",
    latencyMs: 5000,
  },
  {
    id: "att_8",
    eventId: "evt_github_2",
    attemptedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
    responseStatus: 504,
    responseBody: "Gateway Timeout: Server didn't respond",
    latencyMs: 5002,
  },
  {
    id: "att_9",
    eventId: "evt_github_2",
    attemptedAt: new Date(Date.now() - 1.0 * 60 * 60 * 1000).toISOString(),
    responseStatus: 500,
    responseBody: JSON.stringify({ message: "Fatal error", exception: "OutOfMemoryException" }),
    latencyMs: 450,
  },
  // stripe_2 succeeded on attempt 2
  {
    id: "att_10",
    eventId: "evt_stripe_2",
    attemptedAt: new Date(Date.now() - 4.1 * 60 * 60 * 1000).toISOString(),
    responseStatus: 503,
    responseBody: "Rate limit exceeded",
    latencyMs: 80,
  },
  {
    id: "att_11",
    eventId: "evt_stripe_2",
    attemptedAt: new Date(Date.now() - 4.0 * 60 * 60 * 1000).toISOString(),
    responseStatus: 200,
    responseBody: JSON.stringify({ success: true }),
    latencyMs: 110,
  }
];

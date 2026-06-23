# Architecture Plan — Kiosk Backend (Hexagonal)

## Folder Structure

```
src/
├── common/
│   ├── guards/             # AuthGuard (JWT + API Key)
│   ├── filters/            # GlobalExceptionFilter
│   ├── interceptors/       # ResponseTransformInterceptor
│   └── decorators/         # @CurrentUser()
│
├── modules/
│   ├── auth/
│   │   ├── domain/
│   │   │   ├── entities/user.entity.ts
│   │   │   └── ports/
│   │   │       ├── user-repository.port.ts      # IUserRepository
│   │   │       └── hash-service.port.ts         # IHashService
│   │   ├── application/
│   │   │   ├── register.use-case.ts
│   │   │   ├── login.use-case.ts
│   │   │   └── auth.service.ts
│   │   ├── infrastructure/
│   │   │   ├── adapters/
│   │   │   │   ├── postgres-user.repository.ts
│   │   │   │   └── bcrypt-hash.service.ts
│   │   │   ├── controllers/auth.controller.ts
│   │   │   └── strategies/                      # Passport JWT + API Key
│   │   └── auth.module.ts
│   │
│   ├── endpoints/
│   │   ├── domain/
│   │   │   ├── entities/endpoint.entity.ts
│   │   │   └── ports/endpoint-repository.port.ts
│   │   ├── application/
│   │   │   └── endpoints.service.ts             # CRUD + toggle active
│   │   ├── infrastructure/
│   │   │   ├── adapters/postgres-endpoint.repository.ts
│   │   │   └── controllers/endpoints.controller.ts
│   │   └── endpoints.module.ts
│   │
│   ├── events/
│   │   ├── domain/
│   │   │   ├── entities/event.entity.ts
│   │   │   └── ports/
│   │   │       ├── event-repository.port.ts
│   │   │       └── queue-publisher.port.ts       # IQueuePublisher
│   │   ├── application/
│   │   │   ├── ingest-event.use-case.ts         # Terima webhook → simpan → publish ke queue
│   │   │   └── events.service.ts                # Query, filter, manual retry
│   │   ├── infrastructure/
│   │   │   ├── adapters/
│   │   │   │   ├── postgres-event.repository.ts
│   │   │   │   └── rabbitmq-publisher.adapter.ts
│   │   │   └── controllers/
│   │   │       ├── incoming.controller.ts       # POST /incoming/:key (publik)
│   │   │       └── events.controller.ts         # GET /events (dashboard API)
│   │   └── events.module.ts
│   │
│   └── delivery/
│       ├── domain/
│       │   ├── entities/delivery-attempt.entity.ts
│       │   ├── ports/
│       │   │   ├── attempt-repository.port.ts
│       │   │   └── webhook-dispatcher.port.ts   # IWebhookDispatcher
│       │   └── services/
│       │       └── retry-strategy.service.ts    # Backoff logic (domain pure)
│       ├── application/
│       │   └── process-delivery.use-case.ts     # Consume queue → dispatch → update status
│       ├── infrastructure/
│       │   ├── adapters/
│       │   │   ├── postgres-attempt.repository.ts
│       │   │   ├── http-webhook.dispatcher.ts   # Axios POST ke destination
│       │   │   └── rabbitmq-consumer.adapter.ts
│       │   └── controllers/delivery.controller.ts  # GET /attempts (dashboard)
│       └── delivery.module.ts
│
├── database/               # (sudah ada)
├── app.module.ts
└── main.ts
```

---

## Port Interfaces (Inti Hexagonal)

### Auth Ports
```typescript
// IUserRepository
findByEmail(email): Promise<User | null>
findByApiKeyHash(hash): Promise<User | null>
create(data): Promise<User>
updateApiKeyHash(userId, hash): Promise<void>
softDelete(userId): Promise<void>

// IHashService
hash(plain): Promise<string>
compare(plain, hashed): Promise<boolean>
```

### Endpoint Ports
```typescript
// IEndpointRepository
findById(id): Promise<Endpoint | null>
findByUserId(userId): Promise<Endpoint[]>
findByIncomingKey(key): Promise<Endpoint | null>
create(data): Promise<Endpoint>
update(id, data): Promise<Endpoint>
toggleActive(id, isActive): Promise<void>
softDelete(id): Promise<void>
```

### Event Ports
```typescript
// IEventRepository
findById(id): Promise<Event | null>
findByEndpointId(endpointId, filters?): Promise<Event[]>
findByUserId(userId, filters?): Promise<Event[]>
create(data): Promise<Event>
updateStatus(id, status, retryData?): Promise<void>
findRetryQueue(): Promise<Event[]>
getStatusCounts(userId): Promise<{pending,delivered,retrying,dead}>

// IQueuePublisher
publish(eventId): Promise<void>
publishWithDelay(eventId, delayMs): Promise<void>
```

### Delivery Ports
```typescript
// IAttemptRepository
create(data): Promise<DeliveryAttempt>
findByEventId(eventId): Promise<DeliveryAttempt[]>
getAvgLatencyByEndpoint(endpointId): Promise<number>

// IWebhookDispatcher
dispatch(url, payload, headers): Promise<{status,body,latencyMs}>
```

---

## Dependencies yang Perlu Di-install

| Package | Fungsi |
|---|---|
| `@nestjs/typeorm` + `typeorm` + `pg` | PostgreSQL ORM |
| `@nestjs/passport` + `passport-jwt` + `passport-custom` | Auth (JWT + API Key) |
| `@nestjs/jwt` + `bcrypt` | Token signing + password hashing |
| `amqplib` + `@golevelup/nestjs-rabbitmq` | RabbitMQ publisher/consumer |
| `@nestjs/config` | Environment variables |
| `class-validator` + `class-transformer` | DTO validation |
| `@nestjs/swagger` | API documentation (opsional tapi recommended) |

---

## Implementasi Per Fase

### Fase 1 — Foundation
- [ ] Install semua dependencies
- [ ] Setup `ConfigModule`, `TypeOrmModule` (connect ke PostgreSQL)
- [ ] Buat common guards, filters, interceptors
- [ ] Buat base domain entities (plain classes)

### Fase 2 — Auth Module
- [ ] Port interfaces → Adapter implementations
- [ ] Register & Login use cases
- [ ] JWT strategy + API Key strategy
- [ ] `POST /auth/register`, `POST /auth/login`, `POST /auth/regenerate-key`

### Fase 3 — Endpoints Module  
- [ ] CRUD endpoints + toggle active/paused
- [ ] `GET /endpoints`, `POST /endpoints`, `PATCH /endpoints/:id`, `DELETE /endpoints/:id`

### Fase 4 — Events Module (Ingestion)
- [ ] `POST /incoming/:incoming_key` — publik, validasi API Key header
- [ ] Simpan event → publish ke RabbitMQ
- [ ] `GET /events` — dashboard query dengan filter status, pagination

### Fase 5 — Delivery Module (Worker)
- [ ] RabbitMQ consumer
- [ ] HTTP dispatcher (Axios POST ke destination_url)
- [ ] Retry strategy (exponential backoff)
- [ ] Status transitions: `pending → delivered | retrying → dead`

### Fase 6 — Dashboard API
- [ ] Analytics aggregation (status counts, avg latency)
- [ ] Delivery attempts timeline
- [ ] Bulk retry for dead events
- [ ] Export CSV/JSON

---

## API Routes Summary

| Method | Route | Auth | Deskripsi |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Register user baru |
| `POST` | `/auth/login` | Public | Login → JWT token |
| `POST` | `/auth/regenerate-key` | JWT | Generate API key baru |
| `GET` | `/endpoints` | JWT | List endpoints milik user |
| `POST` | `/endpoints` | JWT | Buat endpoint baru |
| `PATCH` | `/endpoints/:id` | JWT | Update endpoint |
| `DELETE` | `/endpoints/:id` | JWT | Soft delete endpoint |
| `POST` | `/incoming/:key` | API Key | Terima webhook dari provider |
| `GET` | `/events` | JWT | List events + filter |
| `GET` | `/events/:id` | JWT | Detail event + attempts |
| `POST` | `/events/:id/retry` | JWT | Manual retry |
| `POST` | `/events/bulk-retry` | JWT | Bulk retry dead events |
| `GET` | `/analytics/overview` | JWT | Status counts + latency |
| `GET` | `/analytics/chart` | JWT | Time-series delivery data |

<br />
<div align="center">
  <h1 align="center">Kiosk</h1>
  <p align="center">
    <strong>Enterprise-grade Webhook Management & Delivery Middleware</strong>
    <br />
    Robust, scalable, and resilient webhook proxy designed to handle high-volume event ingestion, signature validation, and reliable delivery with automatic retries.
  </p>
</div>

---

## 🚀 Overview

**Kiosk** acts as a unified gateway between external webhook providers (Stripe, GitHub, Midtrans, etc.) and your internal microservices. It solves the common pain points of dealing with webhooks: missing events due to temporary downtime, complex signature validations, and lack of visibility into webhook traffic.

Instead of exposing your microservices directly to the internet, point your webhook providers to Kiosk. Kiosk will ingest, validate, queue, and reliably deliver the events to your destination services, complete with exponential backoff retries and an analytics dashboard.

## ✨ Key Features

- **🛡️ Secure Ingestion:** Unified endpoint to receive webhooks from multiple providers with automatic HMAC signature validation.
- **🔄 Reliable Delivery:** Built-in retry mechanism using RabbitMQ Delayed Message Exchange (Exponential Backoff).
- **💀 Dead Letter Queue (DLQ):** Messages that fail all retry attempts are safely stored in a DLQ for manual inspection and bulk replay.
- **📊 Analytics Dashboard:** Real-time visibility into delivery success rates, volume trends (24h/7d/30d), and endpoint health.
- **🔀 Payload Transformation & Normalization:** Standardizes incoming payloads before forwarding them to your internal services.
- **🔌 Provider Agnostic:** Easily scalable to support any custom webhook provider.

## 🏗️ Architecture

```mermaid
graph LR
    subgraph External Providers
        S(Stripe) -->|Webhook POST| K(Kiosk Ingress)
        M(Midtrans) -->|Webhook POST| K
        G(GitHub) -->|Webhook POST| K
    end

    subgraph Kiosk Middleware
        K -->|1. Validate & Save| DB[(PostgreSQL)]
        K -->|2. Publish Event| RMQ((RabbitMQ))
        RMQ -->|3. Consume| W[Delivery Worker]
        W -.->|If Failed| RMQ_DELAY((RabbitMQ Delayed Exchange))
        RMQ_DELAY -.->|Retry| W
        W -->|Update Status| DB
    end

    subgraph Internal Architecture
        W -->|4. Forward Payload| IS1[Order Service]
        W -->|4. Forward Payload| IS2[Notification Service]
    end
```

## 🛠️ Technology Stack

- **Backend:** [NestJS](https://nestjs.com/) (Node.js), TypeScript, TypeORM
- **Frontend:** [Next.js](https://nextjs.org/) (App Router), React, Recharts, Lucide Icons
- **Database:** PostgreSQL (with advanced SQL aggregations for analytics)
- **Message Broker:** RabbitMQ (with `rabbitmq_delayed_message_exchange` plugin)
- **Infrastructure:** Docker & Docker Compose

## 📂 Project Structure

This is a monorepo containing three main services:

```text
kiosk/
├── be/                 # NestJS Backend API & Delivery Workers
├── fe/                 # Next.js Frontend Dashboard
└── prog_tes/           # Dummy destination service for local testing
```

## 🚦 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Docker](https://www.docker.com/) & Docker Compose (for PostgreSQL & RabbitMQ)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/kiosk.git
cd kiosk
```

### 2. Setup Infrastructure (Database & Message Queue)

Kiosk relies on PostgreSQL and a custom RabbitMQ image (with the delayed message exchange plugin installed).

```bash
cd be
docker-compose up -d
```

### 3. Setup Backend

Install dependencies and start the backend development server.

```bash
cd be
npm install
npm run start:dev
```
*The backend will run on `http://localhost:3000`*

### 4. Setup Frontend

Install dependencies and start the Next.js dashboard.

```bash
cd ../fe
npm install
npm run dev
```
*The frontend dashboard will run on `http://localhost:3001`*

### 5. Run the Local Tester (Optional)

If you want to simulate a destination microservice locally:

```bash
cd ../prog_tes
npm install
node index.js
```
*The tester runs on `http://localhost:3005`*

## 📖 Environment Variables

Copy the `.env.example` file to `.env` in both the `be/` and `fe/` directories and update the variables accordingly.

**Backend (`be/.env`)**
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=kiosk

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@localhost:5672

# JWT Authentication
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=1d
```

**Frontend (`fe/.env.local`)**
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

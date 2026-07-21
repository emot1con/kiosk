.PHONY: dev up down logs help fe be build

# Default command: Start Docker Compose, Backend, and Frontend directly
dev: up
	@echo "🚀 Starting Backend and Frontend dev servers..."
	@(trap 'kill 0' SIGINT SIGTERM EXIT; cd be && npm run start:dev & cd fe && npm run dev & wait)

# Start Docker Compose services (Postgres, RabbitMQ, Redis)
up:
	@echo "📦 Starting Docker containers in background..."
	@docker compose -f be/docker-compose.yml up -d

# Stop Docker Compose services
down:
	@echo "🛑 Stopping Docker containers..."
	@docker compose -f be/docker-compose.yml down

# Run only Backend
be: up
	@echo "⚙️ Starting Backend dev server..."
	@cd be && npm run start:dev

# Run only Frontend
fe:
	@echo "💻 Starting Frontend dev server..."
	@cd fe && npm run dev

# Build both FE and BE
build:
	@echo "🛠️ Building Backend and Frontend..."
	@cd be && npm run build
	@cd fe && npm run build

# View Docker logs
logs:
	@docker compose -f be/docker-compose.yml logs -f

help:
	@echo "Usage:"
	@echo "  make dev    - Run Docker Compose, Backend (NestJS), and Frontend (Next.js) directly"
	@echo "  make up     - Start Docker containers (Postgres, RabbitMQ, Redis)"
	@echo "  make down   - Stop Docker containers"
	@echo "  make be     - Start Docker containers and Backend dev server"
	@echo "  make fe     - Start Frontend dev server"
	@echo "  make build  - Build production bundles for BE and FE"
	@echo "  make logs   - Tail logs from Docker containers"

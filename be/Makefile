.PHONY: dev up up_build down be fe

# Default target: Start Docker Compose, Backend, and Frontend directly
dev: up
	@echo "🚀 Starting Backend and Frontend dev servers..."
	@(trap 'kill 0' SIGINT SIGTERM EXIT; npm run start:dev & cd ../fe && npm run dev & wait)

# Start containers with rebuild
up_build:
	docker compose down
	docker compose up --build -d

# Start without rebuilding
up:
	docker compose up -d

# Stop all containers
down:
	docker compose down

be: up
	npm run start:dev

fe:
	cd ../fe && npm run dev
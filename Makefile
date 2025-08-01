COMPOSE_FILE = infra/docker-compose.dev.yaml

.DEFAULT_GOAL := help

.PHONY: help dev-up dev-down logs migrate api-shell db-shell test lint format web-install web-shell web-lint ci-backend ci-frontend ci-all ci-backend-local ci-frontend-local ci-all-local

help:
	@echo "Available targets:"
		@echo "   dev-up  Start all services (build & detach)"
		@echo "   dev-down       Stop and remove all services"
		@echo "   logs           Tail logs for all services"
		@echo "   migrate        Run Alembic migrations"
		@echo "   db-shell       Open psql shell to the Postgres container"
		@echo "   api-shell      Open a bash shell inside the API container"
		@echo "   web-shell      Open a shell inside the Web container"
		@echo "   test           Run pytest inside the API container"
		@echo "   lint           Run ruff & mypy inside the API container"
		@echo "   format         Run black & ruff --fix inside the API container"
		@echo "   web-install    Install frontend dependencies"
		@echo "   web-lint      Run frontend lint"
		@echo ""
		@echo "CI Commands (using Docker):"
		@echo "   ci-backend       Run all backend CI checks (Docker)"
		@echo "   ci-frontend      Run all frontend CI checks (Docker)"
		@echo "   ci-all           Run all CI checks (Docker)"
		@echo ""
		@echo "CI Commands (local - no Docker):"
		@echo "   ci-backend-local Run all backend CI checks (local)"
		@echo "   ci-frontend-local Run all frontend CI checks (local)"
		@echo "   ci-all-local     Run all CI checks (local)"

dev-up:
		docker-compose -f $(COMPOSE_FILE) up --build -d

dev-down:
		docker-compose -f $(COMPOSE_FILE) down -v

logs:
		docker-compose -f $(COMPOSE_FILE) logs -f

migrate:
		docker-compose -f $(COMPOSE_FILE) run --rm api alembic upgrade head

db-shell:
		docker-compose -f $(COMPOSE_FILE) exec db psql -U $$POSTGRES_USER -d $$POSTGRES_DB

api-shell:
		docker-compose -f $(COMPOSE_FILE) exec api bash

test:
		docker-compose -f $(COMPOSE_FILE) run --rm api poetry run pytest

lint:
		docker-compose -f $(COMPOSE_FILE) run --rm api poetry run ruff check . && \
		docker-compose -f $(COMPOSE_FILE) run --rm api poetry run mypy app

format:
		docker-compose -f $(COMPOSE_FILE) run --rm api poetry run ruff --fix . && \
		docker-compose -f $(COMPOSE_FILE) run --rm api poetry run black .

web-install:
		docker-compose -f $(COMPOSE_FILE) exec web pnpm install

web-shell:
		docker-compose -f $(COMPOSE_FILE) exec web sh

web-lint:
		docker-compose -f $(COMPOSE_FILE) exec web pnpm lint

ci-backend-local:
		@echo "🔍 Running backend CI checks locally..."
		cd apps/api && poetry run ruff check .
		cd apps/api && poetry run mypy app
		cd apps/api && poetry run pytest
		@echo "✅ Backend CI checks completed!"

ci-frontend-local:
		@echo "🔍 Running frontend CI checks locally..."
		cd apps/web && pnpm lint:check
		cd apps/web && pnpm build
		cd apps/web && pnpm test
		@echo "✅ Frontend CI checks completed!"

ci-all-local: ci-backend-local ci-frontend-local

ci-backend-docker:
		@echo "🐳 Running backend CI checks in Docker..."
		docker-compose -f $(COMPOSE_FILE) run --rm api poetry run ruff check .
		docker-compose -f $(COMPOSE_FILE) run --rm api poetry run mypy app
		docker-compose -f $(COMPOSE_FILE) run --rm api poetry run pytest
		@echo "✅ Backend CI checks completed!"

ci-all-mixed: ci-backend-docker ci-frontend-local

ci: ci-all-local
ci-docker: ci-backend-docker ci-frontend-local

test-backend:
		docker-compose -f $(COMPOSE_FILE) run --rm api poetry run pytest

test-frontend:
		docker-compose -f $(COMPOSE_FILE) exec web pnpm test

test-backend-local:
		cd apps/api && poetry run pytest

test-frontend-local:
		cd apps/web && pnpm test

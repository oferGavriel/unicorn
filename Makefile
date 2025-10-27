.PHONY: help
.DEFAULT_GOAL := help


# Colors for output
COLOR_RESET = \033[0m
COLOR_INFO = \033[36m
COLOR_SUCCESS = \033[32m
COLOR_ERROR = \033[31m
COLOR_WARNING = \033[33m

# Directories
INFRA_DIR = infra
API_DIR = apps/api
WEB_DIR = apps/web

# Docker Compose files
COMPOSE_DEV = $(INFRA_DIR)/docker-compose.dev.yaml
COMPOSE_PROD = $(INFRA_DIR)/docker-compose.prod.yaml
COMPOSE_OBSERVABILITY = $(INFRA_DIR)/docker-compose.observability.yaml

help:
	@echo "$(COLOR_INFO)═══════════════════════════════════════════════════════════$(COLOR_RESET)"
	@echo "$(COLOR_INFO)  Unicorn Development Commands$(COLOR_RESET)"
	@echo "$(COLOR_INFO)═══════════════════════════════════════════════════════════$(COLOR_RESET)"
	@grep -E '^[a-zA-Z_-]+:.*?
		awk 'BEGIN {FS = ":.*?
	@echo ""

dev-up:
	@echo "$(COLOR_INFO)🚀 Starting development environment...$(COLOR_RESET)"
	docker-compose -f $(COMPOSE_DEV) up -d
	@echo "$(COLOR_SUCCESS)✅ Services started!$(COLOR_RESET)"
	@echo "$(COLOR_INFO)API: http://localhost:8000$(COLOR_RESET)"
	@echo "$(COLOR_INFO)Docs: http://localhost:8000/docs$(COLOR_RESET)"
	@echo "$(COLOR_INFO)PostgreSQL: localhost:5432$(COLOR_RESET)"
	@echo "$(COLOR_INFO)Redis: localhost:6379$(COLOR_RESET)"

dev-up-full:
	@echo "$(COLOR_INFO)🚀 Starting full development environment with observability...$(COLOR_RESET)"
	@echo "$(COLOR_INFO)Creating networks...$(COLOR_RESET)"
	@docker network create unicorn-net 2>/dev/null || true
	docker-compose -f $(COMPOSE_DEV) up -d
	@echo "$(COLOR_INFO)⏳ Waiting for core services to be ready...$(COLOR_RESET)"
	@sleep 5
	docker-compose -f $(COMPOSE_OBSERVABILITY) up -d
	@echo "$(COLOR_SUCCESS)✅ Full stack started!$(COLOR_RESET)"
	@echo ""
	@echo "$(COLOR_INFO)═══════════════════════════════════════════════════════════$(COLOR_RESET)"
	@echo "$(COLOR_INFO)  Application Services$(COLOR_RESET)"
	@echo "$(COLOR_INFO)═══════════════════════════════════════════════════════════$(COLOR_RESET)"
	@echo "$(COLOR_SUCCESS)API:$(COLOR_RESET)          http://localhost:8000"
	@echo "$(COLOR_SUCCESS)API Docs:$(COLOR_RESET)     http://localhost:8000/docs"
	@echo "$(COLOR_SUCCESS)PostgreSQL:$(COLOR_RESET)   localhost:5432"
	@echo "$(COLOR_SUCCESS)Redis:$(COLOR_RESET)        localhost:6379"
	@echo ""
	@echo "$(COLOR_INFO)═══════════════════════════════════════════════════════════$(COLOR_RESET)"
	@echo "$(COLOR_INFO)  Observability Stack$(COLOR_RESET)"
	@echo "$(COLOR_INFO)═══════════════════════════════════════════════════════════$(COLOR_RESET)"
	@echo "$(COLOR_SUCCESS)Grafana:$(COLOR_RESET)      http://localhost:3000 (admin/admin)"
	@echo "$(COLOR_SUCCESS)Prometheus:$(COLOR_RESET)   http://localhost:9090"
	@echo "$(COLOR_SUCCESS)Alertmanager:$(COLOR_RESET) http://localhost:9093"
	@echo "$(COLOR_SUCCESS)Loki:$(COLOR_RESET)         http://localhost:3100"
	@echo ""

dev-down:
	@echo "$(COLOR_WARNING)🛑 Stopping development environment...$(COLOR_RESET)"
	docker-compose -f $(COMPOSE_DEV) down
	@echo "$(COLOR_SUCCESS)✅ Services stopped$(COLOR_RESET)"

dev-down-full:
	@echo "$(COLOR_WARNING)🛑 Stopping full development environment...$(COLOR_RESET)"
	docker-compose -f $(COMPOSE_OBSERVABILITY) down
	docker-compose -f $(COMPOSE_DEV) down
	@echo "$(COLOR_SUCCESS)✅ All services stopped$(COLOR_RESET)"

dev-restart:
	@echo "$(COLOR_INFO)🔄 Restarting development environment...$(COLOR_RESET)"
	docker-compose -f $(COMPOSE_DEV) restart
	@echo "$(COLOR_SUCCESS)✅ Services restarted$(COLOR_RESET)"

dev-logs:
	docker-compose -f $(COMPOSE_DEV) logs -f

dev-logs-api:
	docker-compose -f $(COMPOSE_DEV) logs -f api

dev-logs-worker:
	docker-compose -f $(COMPOSE_DEV) logs -f notification_worker

dev-ps:
	docker-compose -f $(COMPOSE_DEV) ps

dev-clean:
	@echo "$(COLOR_WARNING)⚠️  Cleaning development environment (this will delete data!)...$(COLOR_RESET)"
	docker-compose -f $(COMPOSE_DEV) down -v --remove-orphans
	@echo "$(COLOR_SUCCESS)✅ Development environment cleaned$(COLOR_RESET)"

dev-clean-full:
	@echo "$(COLOR_ERROR)⚠️  WARNING: This will delete ALL data including metrics and logs!$(COLOR_RESET)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose -f $(COMPOSE_OBSERVABILITY) down -v --remove-orphans; \
		docker-compose -f $(COMPOSE_DEV) down -v --remove-orphans; \
		echo "$(COLOR_SUCCESS)✅ Full environment cleaned$(COLOR_RESET)"; \
	else \
		echo "$(COLOR_INFO)Cancelled$(COLOR_RESET)"; \
	fi

dev-rebuild:
	@echo "$(COLOR_INFO)🔨 Rebuilding development containers...$(COLOR_RESET)"
	docker-compose -f $(COMPOSE_DEV) build --no-cache
	@echo "$(COLOR_SUCCESS)✅ Containers rebuilt$(COLOR_RESET)"

# ═══════════════════════════════════════════════════════════
# Observability
# ═══════════════════════════════════════════════════════════

obs-up:
	@echo "$(COLOR_INFO)🔍 Starting observability stack...$(COLOR_RESET)"
	@docker network create unicorn-net 2>/dev/null || true
	docker-compose -f $(COMPOSE_OBSERVABILITY) up -d
	@echo "$(COLOR_SUCCESS)✅ Observability stack started!$(COLOR_RESET)"
	@echo "$(COLOR_INFO)Grafana: http://localhost:3000 (admin/admin)$(COLOR_RESET)"
	@echo "$(COLOR_INFO)Prometheus: http://localhost:9090$(COLOR_RESET)"
	@echo "$(COLOR_INFO)Alertmanager: http://localhost:9093$(COLOR_RESET)"

obs-down:
	@echo "$(COLOR_WARNING)🛑 Stopping observability stack...$(COLOR_RESET)"
	docker-compose -f $(COMPOSE_OBSERVABILITY) down
	@echo "$(COLOR_SUCCESS)✅ Observability stack stopped$(COLOR_RESET)"

obs-restart:
	@echo "$(COLOR_INFO)🔄 Restarting observability stack...$(COLOR_RESET)"
	docker-compose -f $(COMPOSE_OBSERVABILITY) restart
	@echo "$(COLOR_SUCCESS)✅ Observability stack restarted$(COLOR_RESET)"

obs-logs:
	docker-compose -f $(COMPOSE_OBSERVABILITY) logs -f

obs-logs-grafana:
	docker-compose -f $(COMPOSE_OBSERVABILITY) logs -f grafana

obs-logs-prometheus:
	docker-compose -f $(COMPOSE_OBSERVABILITY) logs -f prometheus

obs-logs-loki:
	docker-compose -f $(COMPOSE_OBSERVABILITY) logs -f loki

obs-ps:
	docker-compose -f $(COMPOSE_OBSERVABILITY) ps

obs-clean:
	@echo "$(COLOR_WARNING)⚠️  This will delete all stored metrics and logs!$(COLOR_RESET)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose -f $(COMPOSE_OBSERVABILITY) down -v --remove-orphans; \
		echo "$(COLOR_SUCCESS)✅ Observability data cleaned$(COLOR_RESET)"; \
	else \
		echo "$(COLOR_INFO)Cancelled$(COLOR_RESET)"; \
	fi

grafana-reset-password:
	@echo "$(COLOR_INFO)🔑 Resetting Grafana password to 'admin'...$(COLOR_RESET)"
	docker exec -it unicorn-grafana grafana-cli admin reset-admin-password admin
	@echo "$(COLOR_SUCCESS)✅ Password reset to: admin$(COLOR_RESET)"

# ═══════════════════════════════════════════════════════════
# Backend - API
# ═══════════════════════════════════════════════════════════

api-shell:
	docker exec -it api bash

api-restart:
	docker-compose -f $(COMPOSE_DEV) restart api

api-test:
	@echo "$(COLOR_INFO)🧪 Running backend tests...$(COLOR_RESET)"
	cd $(API_DIR) && poetry run pytest -v
	@echo "$(COLOR_SUCCESS)✅ Tests completed$(COLOR_RESET)"

api-test-cov:
	@echo "$(COLOR_INFO)🧪 Running backend tests with coverage...$(COLOR_RESET)"
	cd $(API_DIR) && poetry run pytest --cov=app --cov-report=html --cov-report=term-missing -v
	@echo "$(COLOR_SUCCESS)✅ Coverage report generated at $(API_DIR)/htmlcov/index.html$(COLOR_RESET)"

api-lint:
	@echo "$(COLOR_INFO)🔍 Linting backend code...$(COLOR_RESET)"
	cd $(API_DIR) && poetry run ruff check .
	@echo "$(COLOR_SUCCESS)✅ Linting completed$(COLOR_RESET)"

api-lint-fix:
	@echo "$(COLOR_INFO)🔧 Linting and fixing backend code...$(COLOR_RESET)"
	cd $(API_DIR) && poetry run ruff check --fix .
	@echo "$(COLOR_SUCCESS)✅ Auto-fix completed$(COLOR_RESET)"

api-format:
	@echo "$(COLOR_INFO)✨ Formatting backend code...$(COLOR_RESET)"
	cd $(API_DIR) && poetry run ruff format .
	@echo "$(COLOR_SUCCESS)✅ Formatting completed$(COLOR_RESET)"

api-type-check:
	@echo "$(COLOR_INFO)🔍 Running type checks...$(COLOR_RESET)"
	cd $(API_DIR) && poetry run mypy .
	@echo "$(COLOR_SUCCESS)✅ Type checking completed$(COLOR_RESET)"

# ═══════════════════════════════════════════════════════════
# Database - Migrations
# ═══════════════════════════════════════════════════════════

migrate:
	@echo "$(COLOR_INFO)🗄️  Running database migrations...$(COLOR_RESET)"
	docker exec api alembic upgrade head
	@echo "$(COLOR_SUCCESS)✅ Migrations completed$(COLOR_RESET)"

migrate-create:
	@echo "$(COLOR_INFO)📝 Creating new migration...$(COLOR_RESET)"
	@if [ -z "$(message)" ]; then \
		echo "$(COLOR_ERROR)❌ Error: Please provide a message. Usage: make migrate-create message='your description'$(COLOR_RESET)"; \
		exit 1; \
	fi
	docker exec api alembic revision --autogenerate -m "$(message)"
	@echo "$(COLOR_SUCCESS)✅ Migration created$(COLOR_RESET)"

migrate-history:
	docker exec api alembic history

migrate-current:
	docker exec api alembic current

migrate-downgrade:
	@echo "$(COLOR_WARNING)⚠️  Downgrading database by one migration...$(COLOR_RESET)"
	docker exec api alembic downgrade -1
	@echo "$(COLOR_SUCCESS)✅ Downgrade completed$(COLOR_RESET)"

migrate-rollback:
	@echo "$(COLOR_WARNING)⚠️  Rolling back to revision $(revision)...$(COLOR_RESET)"
	docker exec api alembic downgrade $(revision)
	@echo "$(COLOR_SUCCESS)✅ Rollback completed$(COLOR_RESET)"

db-shell:
	docker exec -it postgres_container psql -U postgres -d unicorn

db-reset:
	@echo "$(COLOR_ERROR)⚠️  WARNING: This will delete all data!$(COLOR_RESET)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker exec postgres_container psql -U postgres -c "DROP DATABASE IF EXISTS unicorn;"; \
		docker exec postgres_container psql -U postgres -c "CREATE DATABASE unicorn;"; \
		docker exec api alembic upgrade head; \
		echo "$(COLOR_SUCCESS)✅ Database reset and migrations applied$(COLOR_RESET)"; \
	else \
		echo "$(COLOR_INFO)Cancelled$(COLOR_RESET)"; \
	fi

# ═══════════════════════════════════════════════════════════
# Frontend - Web
# ═══════════════════════════════════════════════════════════

web-install:
	@echo "$(COLOR_INFO)📦 Installing frontend dependencies...$(COLOR_RESET)"
	cd $(WEB_DIR) && pnpm install
	@echo "$(COLOR_SUCCESS)✅ Dependencies installed$(COLOR_RESET)"

web-dev:
	@echo "$(COLOR_INFO)🚀 Starting frontend dev server...$(COLOR_RESET)"
	cd $(WEB_DIR) && pnpm run dev

web-build:
	@echo "$(COLOR_INFO)🏗️  Building frontend...$(COLOR_RESET)"
	cd $(WEB_DIR) && pnpm run build
	@echo "$(COLOR_SUCCESS)✅ Build completed$(COLOR_RESET)"

web-lint:
	@echo "$(COLOR_INFO)🔍 Linting frontend code...$(COLOR_RESET)"
	cd $(WEB_DIR) && pnpm run lint:check
	@echo "$(COLOR_SUCCESS)✅ Linting completed$(COLOR_RESET)"

web-lint-fix:
	@echo "$(COLOR_INFO)🔧 Linting and fixing frontend code...$(COLOR_RESET)"
	cd $(WEB_DIR) && pnpm run lint:fix
	@echo "$(COLOR_SUCCESS)✅ Auto-fix completed$(COLOR_RESET)"

web-test:
	@echo "$(COLOR_INFO)🧪 Running frontend tests...$(COLOR_RESET)"
	cd $(WEB_DIR) && pnpm run test
	@echo "$(COLOR_SUCCESS)✅ Tests completed$(COLOR_RESET)"

web-type-check:
	@echo "$(COLOR_INFO)🔍 Running type checks...$(COLOR_RESET)"
	cd $(WEB_DIR) && pnpm run lint:check
	@echo "$(COLOR_SUCCESS)✅ Type checking completed$(COLOR_RESET)"

# ═══════════════════════════════════════════════════════════
# Full Stack
# ═══════════════════════════════════════════════════════════

install:
	@echo "$(COLOR_INFO)📦 Installing all dependencies...$(COLOR_RESET)"
	cd $(API_DIR) && poetry install
	cd $(WEB_DIR) && pnpm install
	@echo "$(COLOR_SUCCESS)✅ All dependencies installed$(COLOR_RESET)"

lint: api-lint web-lint

lint-fix: api-lint-fix web-lint-fix

test: api-test web-test

format: api-format

type-check: api-type-check web-type-check

quality: lint type-check test

# ═══════════════════════════════════════════════════════════
# Redis
# ═══════════════════════════════════════════════════════════

redis-cli:
	docker exec -it redis_container redis-cli

redis-flush:
	@echo "$(COLOR_WARNING)⚠️  Flushing Redis data...$(COLOR_RESET)"
	docker exec redis_container redis-cli FLUSHALL
	@echo "$(COLOR_SUCCESS)✅ Redis flushed$(COLOR_RESET)"

redis-monitor:
	docker exec -it redis_container redis-cli MONITOR

# ═══════════════════════════════════════════════════════════
# Docker Management
# ═══════════════════════════════════════════════════════════

docker-prune:
	@echo "$(COLOR_WARNING)🧹 Pruning Docker resources...$(COLOR_RESET)"
	docker system prune -f
	@echo "$(COLOR_SUCCESS)✅ Pruning completed$(COLOR_RESET)"

docker-prune-all:
	@echo "$(COLOR_ERROR)⚠️  WARNING: This will remove all unused volumes!$(COLOR_RESET)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker system prune -a -f --volumes; \
		echo "$(COLOR_SUCCESS)✅ All unused resources removed$(COLOR_RESET)"; \
	else \
		echo "$(COLOR_INFO)Cancelled$(COLOR_RESET)"; \
	fi

docker-stats:
	docker stats --no-stream

docker-images:
	docker images

# ═══════════════════════════════════════════════════════════
# Production Deployment (Local Testing)
# ═══════════════════════════════════════════════════════════

prod-build:
	@echo "$(COLOR_INFO)🏗️  Building production image...$(COLOR_RESET)"
	docker build -t unicorn-app:latest -f $(API_DIR)/Dockerfile --target production .
	@echo "$(COLOR_SUCCESS)✅ Production image built$(COLOR_RESET)"

prod-test:
	@echo "$(COLOR_INFO)🧪 Testing production image...$(COLOR_RESET)"
	docker run --rm -p 8001:8000 \
		-e DATABASE_URL="postgresql+asyncpg://postgres:3578@host.docker.internal:5432/unicorn" \
		-e REDIS_URL="redis://host.docker.internal:6379/0" \
		-e SECRET_KEY="test-key" \
		-e CORS_ORIGINS="http://localhost:5173" \
		-e ENVIRONMENT="production" \
		unicorn-app:latest
	@echo "$(COLOR_INFO)Production server running on http://localhost:8001$(COLOR_RESET)"

# ═══════════════════════════════════════════════════════════
# Utilities
# ═══════════════════════════════════════════════════════════

health:
	@echo "$(COLOR_INFO)🏥 Checking service health...$(COLOR_RESET)"
	@echo "\n$(COLOR_INFO)API Health:$(COLOR_RESET)"
	@curl -s http://localhost:8000/api/v1/health | jq '.' || echo "$(COLOR_ERROR)API not responding$(COLOR_RESET)"
	@echo "\n$(COLOR_INFO)PostgreSQL:$(COLOR_RESET)"
	@docker exec postgres_container pg_isready -U postgres || echo "$(COLOR_ERROR)PostgreSQL not ready$(COLOR_RESET)"
	@echo "\n$(COLOR_INFO)Redis:$(COLOR_RESET)"
	@docker exec redis_container redis-cli ping || echo "$(COLOR_ERROR)Redis not responding$(COLOR_RESET)"

health-full:
	@echo "$(COLOR_INFO)🏥 Checking full stack health...$(COLOR_RESET)"
	@echo "\n$(COLOR_INFO)═══ Application Services ═══$(COLOR_RESET)"
	@echo "$(COLOR_INFO)API:$(COLOR_RESET)"
	@curl -s http://localhost:8000/api/v1/health | jq '.' || echo "$(COLOR_ERROR)API not responding$(COLOR_RESET)"
	@echo "\n$(COLOR_INFO)PostgreSQL:$(COLOR_RESET)"
	@docker exec postgres_container pg_isready -U postgres || echo "$(COLOR_ERROR)PostgreSQL not ready$(COLOR_RESET)"
	@echo "$(COLOR_INFO)Redis:$(COLOR_RESET)"
	@docker exec redis_container redis-cli ping || echo "$(COLOR_ERROR)Redis not responding$(COLOR_RESET)"
	@echo "\n$(COLOR_INFO)═══ Observability Stack ═══$(COLOR_RESET)"
	@echo "$(COLOR_INFO)Prometheus:$(COLOR_RESET)"
	@curl -s http://localhost:9090/-/healthy > /dev/null && echo "$(COLOR_SUCCESS)✓ Healthy$(COLOR_RESET)" || echo "$(COLOR_ERROR)✗ Unhealthy$(COLOR_RESET)"
	@echo "$(COLOR_INFO)Grafana:$(COLOR_RESET)"
	@curl -s http://localhost:3000/api/health > /dev/null && echo "$(COLOR_SUCCESS)✓ Healthy$(COLOR_RESET)" || echo "$(COLOR_ERROR)✗ Unhealthy$(COLOR_RESET)"
	@echo "$(COLOR_INFO)Loki:$(COLOR_RESET)"
	@curl -s http://localhost:3100/ready > /dev/null && echo "$(COLOR_SUCCESS)✓ Healthy$(COLOR_RESET)" || echo "$(COLOR_ERROR)✗ Unhealthy$(COLOR_RESET)"
	@echo "$(COLOR_INFO)Alertmanager:$(COLOR_RESET)"
	@curl -s http://localhost:9093/-/healthy > /dev/null && echo "$(COLOR_SUCCESS)✓ Healthy$(COLOR_RESET)" || echo "$(COLOR_ERROR)✗ Unhealthy$(COLOR_RESET)"

logs-all:
	docker-compose -f $(COMPOSE_DEV) logs -f --tail=100

ports:
	@echo "$(COLOR_INFO)📡 Active ports:$(COLOR_RESET)"
	@echo "$(COLOR_INFO)Application Services:$(COLOR_RESET)"
	@echo "  5432  - PostgreSQL"
	@echo "  6379  - Redis"
	@echo "  8000  - API"
	@echo "  5173  - Frontend (when running)"
	@echo ""
	@echo "$(COLOR_INFO)Observability Services:$(COLOR_RESET)"
	@echo "  3000  - Grafana"
	@echo "  3100  - Loki"
	@echo "  9090  - Prometheus"
	@echo "  9093  - Alertmanager"
	@echo "  9100  - Node Exporter"
	@echo "  9121  - Redis Exporter"

clean-cache:
	@echo "$(COLOR_INFO)🧹 Cleaning cache files...$(COLOR_RESET)"
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".ruff_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "node_modules" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".next" -exec rm -rf {} + 2>/dev/null || true
	@echo "$(COLOR_SUCCESS)✅ Cache cleaned$(COLOR_RESET)"

setup: install dev-up migrate
	@echo "$(COLOR_SUCCESS)🎉 Setup complete! Your environment is ready.$(COLOR_RESET)"
	@echo "$(COLOR_INFO)API: http://localhost:8000$(COLOR_RESET)"
	@echo "$(COLOR_INFO)Docs: http://localhost:8000/docs$(COLOR_RESET)"

setup-full: install dev-up-full migrate
	@echo "$(COLOR_SUCCESS)🎉 Full setup complete! Your environment is ready with observability.$(COLOR_RESET)"

# ═══════════════════════════════════════════════════════════
# CI/CD Simulation
# ═══════════════════════════════════════════════════════════

ci: lint type-check test
	@echo "$(COLOR_SUCCESS)✅ All CI checks passed!$(COLOR_RESET)"

pre-commit: api-format lint
	@echo "$(COLOR_SUCCESS)✅ Pre-commit checks passed!$(COLOR_RESET)"

pre-push: quality
	@echo "$(COLOR_SUCCESS)✅ Pre-push checks passed!$(COLOR_RESET)"

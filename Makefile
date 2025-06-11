

COMPOSE_FILE = infra/docker-compose.dev.yaml

.DEFAULT_GOAL := help

.PHONY: help dev-up dev-down logs migrate api-shell db-shell test lint format

help:
    @echo "Available targets:"
	@echo "  dev-up      Start all services (build & detach)"
	@echo "  dev-down    Stop and remove all services"
	@echo "  logs        Tail logs for all services"
	@echo "  migrate     Run Alembic migrations"
	@echo "  db-shell    Open psql shell to the Postgres container"
	@echo "  api-shell   Open a bash shell inside the API container"
	@echo "  test        Run pytest inside the API container"
	@echo "  lint        Run ruff & mypy inside the API container"
	@echo "  format      Run black & ruff --fix inside the API container"

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
	docker-compose -f $(COMPOSE_FILE) run --rm api poetry run ruff . && \
	docker-compose -f $(COMPOSE_FILE) run --rm api poetry run mypy .

format:
	docker-compose -f $(COMPOSE_FILE) run --rm api poetry run ruff --fix . && \
	docker-compose -f $(COMPOSE_FILE) run --rm api poetry run black .


web-install:
	docker-compose -f $(COMPOSE_FILE) exec web pnpm install

web-shell:
	docker-compose -f infra/docker-compose.dev.yaml exec web sh

web-lint:
	docker-compose -f infra/docker-compose.dev.yaml exec web pnpm lint

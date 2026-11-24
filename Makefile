.PHONY: help test test-backend typecheck build dev-backend dev-frontend docker-up docker-down

help: ## Show available commands
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

test: test-backend typecheck ## Run backend pytest suite and frontend TypeScript check

test-backend: ## Run all 20 FastAPI & engine unit/integration tests
	PYTHONPATH=backend .venv/bin/pytest backend/tests/ -v

typecheck: ## Run Next.js route typegen and TypeScript check
	cd frontend && npx next typegen && npx tsc --noEmit

build: ## Build production Next.js bundle (webpack)
	cd frontend && npx next build --webpack

dev-backend: ## Start FastAPI gateway on http://127.0.0.1:8000
	PYTHONPATH=backend .venv/bin/python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

dev-frontend: ## Start Next.js development server on http://localhost:3000
	cd frontend && npm run dev

docker-up: ## Start full stack (Redis + Backend + Frontend) via Docker Compose
	docker compose up --build

docker-down: ## Stop Docker Compose stack
	docker compose down

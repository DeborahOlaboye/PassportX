.PHONY: help setup install dev build test clean docker-up docker-down deploy

# Default target
.DEFAULT_GOAL := help

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

help: ## Show this help message
	@echo "$(BLUE)PassportX - Available Commands$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)%-20s$(NC) %s\n", $$1, $$2}'

setup: ## Run initial project setup
	@echo "$(BLUE)Setting up PassportX development environment...$(NC)"
	@bash scripts/setup-dev.sh

install: ## Install all dependencies
	@echo "$(BLUE)Installing dependencies...$(NC)"
	@npm install
	@cd backend && npm install
	@echo "$(GREEN)✓ Dependencies installed$(NC)"

dev: ## Start development servers
	@echo "$(BLUE)Starting development servers...$(NC)"
	@npm run dev

dev-backend: ## Start backend development server only
	@echo "$(BLUE)Starting backend server...$(NC)"
	@cd backend && npm run dev

dev-frontend: ## Start frontend development server only
	@echo "$(BLUE)Starting frontend server...$(NC)"
	@npm run dev

build: ## Build the project
	@echo "$(BLUE)Building project...$(NC)"
	@npm run build
	@cd backend && npm run build
	@echo "$(GREEN)✓ Build complete$(NC)"

test: ## Run all tests
	@echo "$(BLUE)Running all tests...$(NC)"
	@npm run test

test-unit: ## Run unit tests only
	@echo "$(BLUE)Running unit tests...$(NC)"
	@npm run test:unit

test-contracts: ## Run smart contract tests
	@echo "$(BLUE)Running contract tests...$(NC)"
	@npm run test:contracts

test-e2e: ## Run end-to-end tests
	@echo "$(BLUE)Running E2E tests...$(NC)"
	@npm run test:e2e

test-coverage: ## Run tests with coverage report
	@echo "$(BLUE)Running tests with coverage...$(NC)"
	@npm run test:coverage

lint: ## Run linters
	@echo "$(BLUE)Running linters...$(NC)"
	@npm run lint

lint-fix: ## Fix linting errors
	@echo "$(BLUE)Fixing linting errors...$(NC)"
	@npm run lint:fix

format: ## Format code with Prettier
	@echo "$(BLUE)Formatting code...$(NC)"
	@npm run format

clean: ## Clean build artifacts and dependencies
	@echo "$(YELLOW)Cleaning build artifacts...$(NC)"
	@rm -rf node_modules
	@rm -rf backend/node_modules
	@rm -rf .next
	@rm -rf backend/dist
	@rm -rf coverage
	@echo "$(GREEN)✓ Clean complete$(NC)"

docker-up: ## Start all Docker services
	@echo "$(BLUE)Starting Docker services...$(NC)"
	@docker-compose up -d
	@echo "$(GREEN)✓ Docker services started$(NC)"
	@docker-compose ps

docker-down: ## Stop all Docker services
	@echo "$(YELLOW)Stopping Docker services...$(NC)"
	@docker-compose down
	@echo "$(GREEN)✓ Docker services stopped$(NC)"

docker-logs: ## Show Docker logs
	@docker-compose logs -f

docker-rebuild: ## Rebuild and restart Docker services
	@echo "$(BLUE)Rebuilding Docker services...$(NC)"
	@docker-compose down
	@docker-compose build --no-cache
	@docker-compose up -d
	@echo "$(GREEN)✓ Docker services rebuilt$(NC)"

db-setup: ## Setup MongoDB with Docker
	@echo "$(BLUE)Setting up MongoDB...$(NC)"
	@docker-compose up -d mongodb
	@echo "$(GREEN)✓ MongoDB is running on port 27017$(NC)"

db-shell: ## Open MongoDB shell
	@docker-compose exec mongodb mongosh passportx -u admin -p password --authenticationDatabase admin

db-reset: ## Reset database (WARNING: Deletes all data)
	@echo "$(RED)⚠️  WARNING: This will delete all database data!$(NC)"
	@read -p "Are you sure? (y/N) " -n 1 -r; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		echo ""; \
		docker-compose down -v; \
		docker-compose up -d mongodb; \
		echo "$(GREEN)✓ Database reset complete$(NC)"; \
	fi

deploy-staging: ## Deploy to staging environment
	@echo "$(BLUE)Deploying to staging...$(NC)"
	@git push origin develop
	@echo "$(GREEN)✓ Deployment triggered$(NC)"

deploy-production: ## Deploy to production environment
	@echo "$(RED)⚠️  Deploying to PRODUCTION$(NC)"
	@read -p "Are you sure? (y/N) " -n 1 -r; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		echo ""; \
		git push origin main; \
		echo "$(GREEN)✓ Production deployment triggered$(NC)"; \
	fi

contracts-check: ## Check smart contracts
	@echo "$(BLUE)Checking smart contracts...$(NC)"
	@cd contracts && clarinet check
	@echo "$(GREEN)✓ Contracts validated$(NC)"

contracts-test: ## Test smart contracts
	@echo "$(BLUE)Testing smart contracts...$(NC)"
	@cd contracts && clarinet test

contracts-console: ## Open Clarinet console
	@cd contracts && clarinet console

health: ## Check service health
	@echo "$(BLUE)Checking service health...$(NC)"
	@curl -s http://localhost:3001/health | jq . || echo "$(RED)Backend not responding$(NC)"
	@curl -s http://localhost:3000 > /dev/null && echo "$(GREEN)✓ Frontend is healthy$(NC)" || echo "$(RED)✗ Frontend not responding$(NC)"

logs-backend: ## Show backend logs
	@docker-compose logs -f backend

logs-frontend: ## Show frontend logs
	@docker-compose logs -f frontend

logs-db: ## Show database logs
	@docker-compose logs -f mongodb

validate: ## Validate environment and configuration
	@echo "$(BLUE)Validating environment...$(NC)"
	@bash scripts/setup-dev.sh --validate || true

watch: ## Watch and rebuild on file changes
	@echo "$(BLUE)Watching for changes...$(NC)"
	@npm run dev

ci: lint test build ## Run CI checks locally
	@echo "$(GREEN)✓ All CI checks passed$(NC)"

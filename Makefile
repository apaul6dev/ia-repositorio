PROJECT_NAME=parcel-stack
DC=docker-compose

.PHONY: up down build logs ps clean backend-logs frontend-logs db-logs
.PHONY: test-backend test-frontend test

up:
	$(DC) up --build

down:
	$(DC) down

build:
	$(DC) build

logs:
	$(DC) logs -f

backend-logs:
	$(DC) logs -f backend

frontend-logs:
	$(DC) logs -f frontend

db-logs:
	$(DC) logs -f db

ps:
	$(DC) ps

clean:
	$(DC) down -v

purge:
	$(DC) down -v --rmi all --remove-orphans
	docker system prune -a -f
	docker volume prune -f
	docker builder prune -a -f

# Unit test helpers (ejecutan sin Docker)
test-backend:
	cd backend && npm test

test-frontend:
	cd frontend && npm test

test-backend-e2e:
	cd backend && npm run test:e2e

test-frontend-e2e:
	cd frontend && npm run e2e

test: test-backend test-frontend

PROJECT_NAME=parcel-stack
DC=docker-compose

.PHONY: up down build logs ps clean backend-logs frontend-logs db-logs

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

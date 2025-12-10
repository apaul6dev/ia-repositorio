# Sistema Web de Transporte de Paquetes con Reservas

Stack académico: **NestJS 11**, **Angular 20**, **PostgreSQL 16**, dockerizado por capas.

## Requisitos
- Docker y docker-compose
- Puertos libres: `5432` (DB), `3000` (API), `4200` (Frontend)

## Variables de entorno y configuración
Plantillas:
- `cp .env.example .env`
- `cp backend/.env.example backend/.env` (local)
- `cp backend/.env.docker backend/.env.docker` (compose principal, usa host `db`)
- `cp frontend/.env.example frontend/.env`
- `cp db/.env.example db/.env` (principal)
- `cp db/.env.test.example db/.env.test` (pruebas)

Claves por capa:
- Backend (`backend/.env`): `PORT`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`, `JWT_SECRET`  
  - Docker: `DB_HOST=db` con `.env.docker`. Local: `DB_HOST=localhost`.
- Frontend (`frontend/.env`): `API_URL`, `FRONTEND_PORT`
- BD (`db/.env`): `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `DB_PORT`
- Root opcional (`.env`): `BACKEND_PORT`, `FRONTEND_PORT`, `DB_PORT`

## Arquitectura (Mermaid)
```mermaid
flowchart LR
  A[Angular SPA] -- REST --> B[NestJS API]
  B -- TypeORM --> C[(PostgreSQL)]
  B -- JWT --> B
  B -- Webhook --> D[Pagos mock]
  B -- Notif stub --> E[Notificaciones]
```

Backend módulos:
```mermaid
flowchart TD
  Auth --> Users
  Users --> Addresses
  Quotes --> Shipments
  Shipments --> Status[Status History]
  Ops[Ops/Rutas] --> Shipments
  Payments --> Shipments
```

Diagrama entidad-relación (simplificado):
```mermaid
erDiagram
  USERS ||--o{ ADDRESSES : has
  USERS ||--o{ SHIPMENTS : creates
  USERS ||--o{ PAYMENTS : pays
  QUOTES ||--o{ SHIPMENTS : source
  SHIPMENTS ||--o{ SHIPMENT_STATUS_HISTORY : logs
  SHIPMENTS ||--o{ PAYMENTS : billed
  SHIPMENTS ||--o{ ROUTE_ASSIGNMENTS : assigned_to
  ROUTES ||--o{ ROUTE_ASSIGNMENTS : contains

  USERS {
    uuid id PK
    string email
    string passwordHash
    string role
    string name
    string phone
  }
  ADDRESSES {
    uuid id PK
    uuid userId FK
    string label
    string street
    string city
    string state
    string country
    string zip
    float lat
    float lng
  }
  QUOTES {
    uuid id PK
    string serviceType
    float weightKg
    float volumeM3
    string originZip
    string destinationZip
    float price
    int etaMinDays
    int etaMaxDays
    date shipDate
  }
  SHIPMENTS {
    uuid id PK
    string trackingCode
    uuid userId FK
    uuid quoteId FK
    string serviceType
    float weightKg
    float volumeM3
    string originAddress
    string destinationAddress
    string originZip
    string destinationZip
    date pickupDate
    string pickupSlot
    float priceQuote
    float priceFinal
    string status
  }
  SHIPMENT_STATUS_HISTORY {
    uuid id PK
    uuid shipmentId FK
    string status
    string note
    string location
  }
  PAYMENTS {
    uuid id PK
    uuid shipmentId FK
    float amount
    string currency
    string provider
    string status
    string externalRef
  }
  ROUTES {
    uuid id PK
    string name
    string region
    string vehicle
    string driver
    int capacity
    boolean active
  }
  ROUTE_ASSIGNMENTS {
    uuid id PK
    uuid routeId FK
    uuid shipmentId FK
  }
```

Frontend páginas:
```mermaid
flowchart TD
  Home --> Cotizar
  Home --> Reservar
  Reservar --> BuscarCliente
  Home --> Tracking
  Home --> Admin
  Home --> Login
  Home --> Registro
```

## Ejecución con Docker
```bash
docker compose up --build
```
Servicios:
- Frontend: http://localhost:4200
- Backend: http://localhost:3000
- Postgres: localhost:5432 (USER/PASS: parcels, DB `parcels` creada por `init-db.sql`). El backend espera a DB healthy.

Detener: `docker compose down` (agrega `-v` para borrar volumen `db-data`).

## Makefile (atalhos)
- `make up` / `make down` / `make clean` (down -v)
- `make build` (build de imágenes)
- `make logs` (todos) o `backend-logs` / `frontend-logs` / `db-logs`
- `make ps` (estado de contenedores)

## Desarrollo local (sin Docker)
Backend:
```bash
cd backend
npm install
npm run migration:run   # aplica migraciones usando .env
npm run start:dev
```
Frontend:
```bash
cd frontend
npm install
npm start
```
Ajusta `frontend/.env` (API_URL) si el backend corre en otro host/puerto.

## API (REST) principales
Base: `http://localhost:3000`
- Auth: `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`
- Perfil: `GET /users/me` (Bearer), direcciones CRUD `/users/me/addresses`
- Búsqueda de clientes: `GET /users/search?q=term`
- Cotizar: `POST /quotes` body `{ originZip, destinationZip, weightKg, volumeM3, serviceType, shipDate? }`
- Envío/reserva: `POST /shipments` body `{ originAddress, destinationAddress, originZip, destinationZip, weightKg, volumeM3, serviceType, pickupDate, pickupSlot, priceQuote, priceFinal, quoteId?, userId? }`
- Listar envíos: `GET /shipments` filtros `me=true` (token), `status`, `routeId`, `dateFrom`, `dateTo`
- Detalle: `GET /shipments/{id}`; Tracking: `GET /shipments/{id}/tracking`
- Operador/Admin: `GET /ops/shipments` (filtros), `POST /ops/shipments/{id}/status`
- Asignar operador: `POST /ops/shipments/{id}/assign-operator` body `{ operatorId }` (admin puede asignar cualquiera; operador puede autoasignarse)
- Rutas: `POST /ops/routes`, `POST /ops/routes/{routeId}/assign`, `GET /ops/routes/{routeId}/assignments`
- Pagos: `POST /payments/init`, `POST /payments/webhook`, `GET /payments/{id}`

Tokens: login/registro devuelven `accessToken` (Bearer) y `refreshToken`.

Datos seed (migración)
- 5 usuarios clientes `user1@demo.com` a `user5@demo.com` con contraseña `password123`.
- 5 envíos de ejemplo con tracking `PKG-SEED-00X` asociados a esos usuarios.
- Usuarios operativos: `operator@demo.com` (rol operador) y `admin@demo.com` (rol admin), contraseña `password123`.
- Historial de envíos seed: estados precargados en `shipment_status_history` (creado, en tránsito, entregado, etc. según cada tracking).

## Frontend (Angular)
- Páginas: Inicio, Cotizar, Reservar (incluye buscador de clientes), Tracking, Operador, Login/Registro.
- Estado de sesión con `AuthService` y `AuthInterceptor` (JWT); `LoggingInterceptor` para trazas en dev.

## Estructura
- `backend/`: NestJS + TypeORM, migraciones en `src/migrations`, módulos Auth, Users, Quotes, Shipments/Ops, Routes, Payments, Notifications.
- `frontend/`: Angular standalone components en `src/app/pages`, servicios en `src/app/services`.
- `db/`: compose de Postgres con `init-db.sql` que crea `parcels` y `parcels_test`.
- `docker-compose.yml`: orquestación principal (db/backend/frontend).

## Notas
- Migraciones activadas (`migrationsRun=true`); `synchronize` desactivado.
- Compose principal usa `backend/.env.docker` y healthcheck en DB para evitar `ECONNREFUSED`.

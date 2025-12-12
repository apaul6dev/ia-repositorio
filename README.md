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
graph LR
    A["Angular SPA (guards + interceptors)"] -->|REST| B["NestJS API"]
    B -->|TypeORM| C["PostgreSQL"]
    B -->|JWT| J["JWT Auth Module"]
    B -->|Webhook| D["Servicio de Pagos (mock)"]
    B -->|Notificacion| E["Sistema de Notificaciones (stub)"]
    O["Operadores / Admin"] -->|Asigna / Actualiza| B
```

Backend módulos:
```mermaid
flowchart TD
  Auth --> Users
  Users --> Addresses
  Users --> Quotes
  Quotes --> Shipments
  Shipments --> Status[Status History]
  Shipments --> Operator[Operator Assignment]
  Ops[Ops/Rutas] --> Shipments
  Routes --> Shipments
  Payments --> Shipments
```

Diagrama entidad-relación (simplificado):
```mermaid
erDiagram
  USERS ||--o{ ADDRESSES : has
  USERS ||--o{ QUOTES : requests
  USERS ||--o{ SHIPMENTS : creates
  USERS ||--o{ PAYMENTS : pays
  USERS ||--o{ SHIPMENTS : assigned_as_operator
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
    uuid userId FK
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
    uuid operatorId FK
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
- Búsqueda de usuarios: `GET /users/search?q=term&role=client|operator`
- Cotizar: `POST /quotes` body `{ originZip, destinationZip, weightKg, volumeM3, serviceType, shipDate?, userId? }` (si hay token, se asocia al usuario)
- Envío/reserva: `POST /shipments` body `{ quoteId, originAddress, destinationAddress, originZip, destinationZip, weightKg?, volumeM3?, serviceType?, pickupDate, pickupSlot, priceQuote?, priceFinal?, userId? }` (requiere `quoteId`; si la quote tiene dueño, se fuerza ese `userId`)
- Listar envíos: `GET /shipments` filtros `me=true` (token), `status`, `routeId`, `dateFrom`, `dateTo`
- Detalle: `GET /shipments/{id}`; Tracking: `GET /shipments/{id}/tracking`
- Operador/Admin: `GET /ops/shipments` (filtros), `POST /ops/shipments/{id}/status`
- Asignar operador: `POST /ops/shipments/{id}/assign-operator` body `{ operatorId }` (admin puede asignar cualquiera; operador puede autoasignarse)
- Rutas: `POST /ops/routes`, `POST /ops/routes/{routeId}/assign`, `GET /ops/routes/{routeId}/assignments`
- Pagos: `POST /payments/init`, `POST /payments/webhook`, `GET /payments/{id}`

Tokens: login/registro devuelven `accessToken` (Bearer) y `refreshToken`.

Flujo core (cotización → reserva → tracking → asignación):
1) `POST /quotes` genera una cotización con precio/ETA.
2) `POST /shipments` requiere `quoteId` y datos de direcciones/ventana; genera tracking, fuerza el `userId` de la cotización.
3) `GET /shipments/{id o trackingCode}/tracking` muestra historial; operadores/admin actualizan estado.
4) `POST /ops/shipments/{id}/assign-operator` asigna operador (admin) o autoasigna (operador); enviar `operatorId=null` desasigna.

## Diagramas de secuencia de procesos
Los diagramas usan los endpoints REST definidos arriba y los módulos indicados en la arquitectura.

### Autenticación (registro, login y refresh)
```mermaid
sequenceDiagram
  actor Cliente
  participant Frontend
  participant API as API NestJS (Auth)
  participant DB as DB (Postgres)

  Cliente->>Frontend: Completa formulario de registro/login
  Frontend->>API: POST /auth/register | /auth/login (credenciales)
  API->>DB: Crea o valida usuario
  DB-->>API: Usuario válido
  API->>API: Genera accessToken + refreshToken
  API-->>Frontend: Tokens y perfil
  Frontend->>API: POST /auth/refresh (refreshToken)
  API->>API: Valida refreshToken
  API-->>Frontend: accessToken renovado
```

### Cotización y creación de envío
```mermaid
sequenceDiagram
  actor Cliente
  participant Frontend
  participant API as API NestJS (Quotes/Shipments)
  participant DB as DB (Postgres)

  Cliente->>Frontend: Solicita cotización
  Frontend->>API: POST /quotes {origen, destino, peso, servicio}
  API->>DB: Calcula y guarda cotización
  DB-->>API: Cotización con precio y ETA
  API-->>Frontend: Respuesta de cotización
  Cliente->>Frontend: Confirma reserva (direcciones, ventana de retiro)
  Frontend->>API: POST /shipments {quoteId, direcciones, slot}
  API->>DB: Valida quote/usuario, crea envío y tracking
  DB-->>API: Envío creado
  API-->>Frontend: Detalle del envío + trackingCode
```

### Tracking y actualización de estados
```mermaid
sequenceDiagram
  actor Cliente
  actor Operador
  participant Frontend
  participant API as API NestJS (Shipments/Ops)
  participant DB as DB (Postgres)
  participant Notif as Notificaciones (stub)

  Cliente->>Frontend: Consulta tracking
  Frontend->>API: GET /shipments/{id|trackingCode}/tracking
  API->>DB: Lee envío e historial de estados
  DB-->>API: Historial completo
  API-->>Frontend: Timeline de tracking
  Operador->>Frontend: Actualiza estado operativo
  Frontend->>API: POST /ops/shipments/{id}/status {status, note}
  API->>DB: Inserta en historial y cambia estado actual
  DB-->>API: Estado almacenado
  API->>Notif: Envía notificación al cliente
  Notif-->>API: Ack (stub)
  API-->>Frontend: Estado nuevo confirmado
```

### Asignación de operador y rutas
```mermaid
sequenceDiagram
  actor Admin
  actor Operador
  participant Frontend
  participant API as API NestJS (Ops/Routes)
  participant DB as DB (Postgres)

  Admin->>Frontend: Busca envío para asignar
  Frontend->>API: POST /ops/shipments/{id}/assign-operator {operatorId|null}
  API->>DB: Valida rol y actualiza operatorId
  DB-->>API: Asignación guardada
  API-->>Frontend: Envío actualizado
  Operador->>Frontend: Autoasigna o consulta ruta
  Frontend->>API: POST /ops/routes/{routeId}/assign {shipmentId}
  API->>DB: Crea ROUTE_ASSIGNMENTS para el envío
  DB-->>API: Ruta asignada
  API-->>Frontend: Confirmación con ruta
```

### Pago y webhook
```mermaid
sequenceDiagram
  actor Cliente
  participant Frontend
  participant API as API NestJS (Payments)
  participant Pago as Servicio de Pago (mock)
  participant DB as DB (Postgres)
  participant Notif as Notificaciones (stub)

  Cliente->>Frontend: Inicia pago de envío
  Frontend->>API: POST /payments/init {shipmentId}
  API->>DB: Valida envío y monto
  DB-->>API: Datos verificados
  API->>Pago: Crea intento de cobro (mock)
  Pago-->>API: externalRef/redirect
  API->>DB: Guarda payment en estado pending
  API-->>Frontend: URL/orden de pago
  Pago-->>API: POST /payments/webhook (status)
  API->>DB: Actualiza payment y estado del envío
  DB-->>API: Actualización aplicada
  API->>Notif: Notifica resultado al cliente
  Notif-->>API: Ack (stub)
  API-->>Pago: 200 OK
```

Datos seed (migración)
- 5 usuarios clientes `user1@demo.com` a `user5@demo.com` con contraseña `password123`.
- 5 envíos de ejemplo con tracking `PKG-SEED-00X` asociados a esos usuarios.
- Usuarios operativos: `operator@demo.com` (rol operador) y `admin@demo.com` (rol admin), contraseña `password123`.
- Historial de envíos seed: estados precargados en `shipment_status_history` (creado, en tránsito, entregado, etc. según cada tracking).
- Cotizaciones seed: 5 cotizaciones express/standard/economic demo.
- Direcciones seed: casa y oficina para cada usuario demo.

## Frontend (Angular)
- Páginas: Cotizar, Reservar (buscador de clientes; clientes bloqueados a su usuario), Tracking (incluye lista de “Mis envíos” para usuarios logueados), Operador (tabla de envíos con detalle y asignación de operador/autoasignación), Login/Registro; Inicio/Operador solo visibles para roles operator/admin.
- Estado de sesión con `AuthService` y `AuthInterceptor` (JWT, manejo de 401/403); `LoggingInterceptor` en dev; guardas protegen todas las vistas.

## Estructura
- `backend/`: NestJS + TypeORM, migraciones en `src/migrations`, módulos Auth, Users, Quotes, Shipments/Ops, Routes, Payments, Notifications.
- `frontend/`: Angular standalone components en `src/app/pages`, servicios en `src/app/services`.
- `db/`: compose de Postgres con `init-db.sql` que crea `parcels` y `parcels_test`.
- `docker-compose.yml`: orquestación principal (db/backend/frontend).

## Pruebas automatizadas
### Backend (NestJS + Jest)
- Comandos: `cd backend && npm test` (unit + e2e) o `npm run test:coverage` (reporte en `backend/coverage`).
- Configuración: `jest.config.ts` con `ts-jest`, mapeo `src/*` y SQLite en memoria (`test/test-datasource.ts` y módulos de prueba) para no depender de Postgres; `JWT_SECRET` se inyecta en los tests.
- Casos cubiertos:
  - Auth (`test/auth.service.spec.ts`): registro devuelve payload saneado y tokens, rechaza email duplicado, login válido/inválido y refresh válido/inválido.
  - Quotes (`test/quotes.service.spec.ts`): cálculo de precio por peso volumétrico y recuperación por id.
  - Shipments (`test/shipments.service.spec.ts`): requiere quote existente y dueño correcto, genera tracking + historial inicial, agrega estados notificando, bloquea operadores no asignados, asigna/desasigna operadores.
  - E2E API (`test/app.e2e-spec.ts`): flujo completo registro → cotizar → crear envío → tracking → asignar operador → actualizar estado, y verificación de guard JWT en rutas de operador.

### Frontend (Angular + Karma/Playwright)
- Unit tests: `cd frontend && npm test` usa Karma con `ChromeHeadless` (`karma.conf.js`), cobertura en `frontend/coverage`.
- Casos: guard de auth e interceptor validan sesión/redirección; componentes `Quote`, `Reserve`, `Login`, `Tracking` y `AdminDashboard` validan envío de formularios, bloqueo de usuario cliente, búsqueda de usuarios, creación de reservas, consultas de tracking, actualizaciones de estado y asignaciones (admin/autoasignación).
- E2E UI: `npm run e2e` ejecuta Playwright (`playwright.config.ts`), `E2E_BASE_URL` opcional (por defecto `http://localhost:4200`). El flujo `e2e/shipment-flow.spec.ts` maqueta las peticiones REST y recorre login → cotizar → reservar → tracking → panel operador/admin.

## Notas
- Migraciones activadas (`migrationsRun=true`); `synchronize` desactivado.
- Compose principal usa `backend/.env.docker` y healthcheck en DB para evitar `ECONNREFUSED`.

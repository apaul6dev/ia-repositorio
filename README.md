# Sistema Web de Transporte de Paquetes con Reservas

Arquitectura académica con **NestJS 11**, **Angular 20** y **PostgreSQL 16**, dockerizada por capas.

## Requisitos
- Docker y docker-compose
- Puertos libres: `5432` (DB), `3000` (API), `4200` (Frontend)

## Variables de entorno
Ejemplos listos para copiar:
- `cp .env.example .env`
- `cp backend/.env.example backend/.env`
- `cp frontend/.env.example frontend/.env`
- `cp db/.env.example db/.env` (DB principal)
- `cp db/.env.test.example db/.env.test` (DB de pruebas)

Variables clave:
- Backend (`backend/.env`): `PORT`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`, `JWT_SECRET`
  - En Docker usar `DB_HOST=db`. En ejecución local usar `DB_HOST=localhost`.
- Frontend (`frontend/.env`): `API_URL`, `FRONTEND_PORT`
- BD (`db/.env`): `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `DB_PORT`
- Puertos externos (root `.env` opcional): `BACKEND_PORT`, `FRONTEND_PORT`, `DB_PORT`

Base de datos de pruebas (`/db`)
- `docker compose up -d` dentro de `/db` levanta Postgres en `localhost:5432`
- Ajusta `DB_HOST=localhost` y `DB_PORT=5432` en `backend/.env` para conectar al contenedor local.

## Ejecución rápida
```bash
docker-compose up --build
```

Servicios:
- Frontend (Angular + Nginx): http://localhost:4200
- Backend (NestJS): http://localhost:3000
- Postgres: localhost:5432 (DB/USER/PASS: parcels)

Para detener: `docker-compose down` (agrega `-v` si quieres eliminar el volumen de datos `db-data`).

## Variables de entorno relevantes
Se definen en `docker-compose.yml`:
- Backend: `DB_HOST=db`, `DB_PORT=5432`, `DB_USER=parcels`, `DB_PASS=parcels`, `DB_NAME=parcels`, `PORT=3000`
- Frontend: `API_URL=http://localhost:3000`

## Uso de la API (REST)
Base URL: `http://localhost:3000`

- Registro: `POST /auth/register`  
  Body: `{ "email": "...", "password": "min6", "name": "..." }`
- Login: `POST /auth/login`  
  Body: `{ "email": "...", "password": "..." }`
- Refresh token: `POST /auth/refresh`  
  Body: `{ "refreshToken": "..." }`
- Crear cotización: `POST /quotes`  
  Body: `{ "originZip": "...", "destinationZip": "...", "weightKg": 1, "volumeM3": 0.01, "serviceType": "standard", "shipDate": "YYYY-MM-DD" }`
- Crear envío/reserva: `POST /shipments`  
  Body: `{ "originAddress": "...", "destinationAddress": "...", "originZip": "...", "destinationZip": "...", "weightKg": 1, "volumeM3": 0.01, "serviceType": "standard", "pickupDate": "YYYY-MM-DD", "pickupSlot": "09:00-12:00", "priceQuote": 10, "priceFinal": 10, "quoteId": "opcional", "userId": "opcional" }`
- Listar envíos: `GET /shipments` (filtros: `me=true` requiere Bearer token, `status`, `routeId`, `dateFrom`, `dateTo`)
- Detalle envío: `GET /shipments/{id}`
- Tracking: `GET /shipments/{id}/tracking`
- Operador: actualizar estado `POST /ops/shipments/{id}/status`  
  Body: `{ "status": "pickup_scheduled", "note": "opcional", "location": "opcional" }`
- Operador: listar envíos con filtros `GET /ops/shipments`
- Rutas: crear `POST /ops/routes` Body `{ "name": "...", "region": "...", "vehicle": "...", "driver": "..." }`
- Asignar ruta: `POST /ops/routes/{routeId}/assign` Body `{ "shipmentId": "..." }`
- Pagos: iniciar `POST /payments/init` Body `{ "shipmentId": "...", "amount": 10, "currency": "USD" }` → devuelve `checkoutUrl` y `externalRef`; webhook `POST /payments/webhook` Body `{ "externalRef": "...", "status": "paid" }`
- Perfil: `GET /users/me` (token), direcciones CRUD en `/users/me/addresses` (GET/POST/PATCH/DELETE)

Tokens: se devuelve `accessToken` (Bearer) y `refreshToken` en login/registro. Usar `Authorization: Bearer <accessToken>`.

## Uso del frontend
1. Abrir http://localhost:4200
2. Navegación:
   - **Inicio:** accesos rápidos.
   - **Cotizar:** formulario para obtener precio y ETA.
   - **Reservar:** crea envío/reserva; puedes pegar `quoteId` de la cotización.
   - **Tracking:** ingresa el `id` del envío para ver historial.
   - **Operador:** lista envíos y permite actualizar estado.

## Estructura de carpetas
- `backend/`: API NestJS (Node 20, TypeORM, Postgres).
- `frontend/`: SPA Angular (Nginx en producción).
- `docker-compose.yml`: orquestación de los tres servicios.

## Desarrollo local (opcional, sin Docker)
Backend:
```bash
cd backend
npm install
npm run migration:run   # aplica migraciones (usa .env)
npm run start:dev
```
Frontend:
```bash
cd frontend
npm install
npm start
# abrir http://localhost:4200
```
Ajusta `API_URL` en `frontend/src/environments/environment.ts` si el backend corre en otro host/puerto.

## Notas y pendientes
- Desactivar `synchronize` en TypeORM y agregar migraciones para entornos serios.
- Validar direcciones y tracking por código de guía, no solo por `id` de envío.

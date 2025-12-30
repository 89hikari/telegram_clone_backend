# Telegram Clone Backend

NestJS + Sequelize + PostgreSQL backend for a lightweight Telegram-style chat service. Provides auth (local + JWT), user and message APIs, socket support, optional Redis caching, and email verification via Resend.

## Stack
- NestJS 10
- PostgreSQL with sequelize-typescript
- Passport (local / JWT)
- Redis (optional caching)
- Resend + React Email templates

## Prerequisites
- Node.js 18+ (LTS recommended)
- PostgreSQL instance
- (Optional) Redis for caching

## Setup
1. Install deps:
	```bash
	npm install
	```
2. Create `.env` (example values):
	```env
	DB_HOST=localhost
	DB_PORT=5432
	DB_USER=postgres
	DB_PASS=postgres
	DB_DIALECT=postgres
	DB_NAME_TEST=telegram_clone_test
	DB_NAME_DEVELOPMENT=telegram_clone_dev
	DB_NAME_PRODUCTION=telegram_clone_prod
	JWTKEY=change_me
	TOKEN_EXPIRATION=24h
	BEARER=Bearer
	RESEND_API_KEY=your_resend_api_key
	REDIS_HOST=127.0.0.1
	REDIS_PORT=6379
	REDIS_TTL=300
	```
3. Run database migrations and seed data:
	```bash
	npm run db:migrate
	npm run db:seed
	```

## Running
- Dev server (watch):
  ```bash
  npm run start:dev
  ```
- Production build & run:
  ```bash
  npm run build
  npm run start:prod
  ```

## Redis (optional)
The app works without Redis; caching is simply disabled. To enable caching:
```bash
redis-server  # or your platform equivalent
npm run start:dev
```
Configure host/port/ttl via the `REDIS_*` env vars.

## Useful scripts
- Lint & format: `npm run check:style`
- Tests: `npm test` (see `test/`)
- DB migrations: `npm run db:migrate`, undo with `npm run db:migrate:undo`
- Seeds: `npm run db:seed`, undo with `npm run db:seed:undo`
- Redis check: `npm run redis:check`

## Project structure (high level)
- `src/modules/auth` – auth controller/service, JWT & local strategies
- `src/modules/users` – user CRUD + optional Redis cache
- `src/modules/messages` – messaging CRUD and socket integration
- `db/migrations` – Sequelize migrations (snake_case schema)
- `db/seeders` – sample users/messages

## TODO / Future ideas
- Add end-to-end tests for auth + messaging flows
- Add rate limiting per route and IP (configurable)
- Add message attachments and media storage (S3/MinIO)
- Improve observability (structured logging, metrics, tracing)
- Dockerize app + Postgres + Redis for quick spins
- Add CI pipeline (lint, test, migration check)
- Harden auth (refresh tokens, password reset, MFA)
- Add per-conversation read receipts and typing indicators

## Troubleshooting
- "class-transformer package is missing": run `npm install class-transformer` (already added).
- Redis connection warnings: start Redis or leave it stopped; caching will stay disabled.
- DB connection errors: verify `.env` matches your Postgres instance and rerun migrations.
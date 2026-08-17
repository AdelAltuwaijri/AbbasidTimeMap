# DevOps and Environments

## Repository model
Monorepo:
```text
AbbasidTimeMap/
  frontend/
  backend/
  data/
  docs/
  AGENTS.md
```

## Environments
### Local
Developer machine.
- Next.js dev server
- FastAPI dev server
- PostgreSQL + PostGIS local/container

### Test/CI
Automated tests and linting.

### Production
Separate managed app/database infrastructure later.

## Environment variables
Backend examples:
- DATABASE_URL
- APP_ENV
- CORS_ORIGINS
- AI_PROVIDER_KEY later

Frontend examples:
- NEXT_PUBLIC_API_BASE_URL

## Database migrations
Use Alembic.
Every schema change requires a migration.

## CI baseline
On push/PR:
- frontend lint
- frontend typecheck
- frontend tests when introduced
- backend lint/format check
- backend unit tests
- migration sanity

## Local bootstrap target
Long-term provide a single documented local startup path, ideally Docker Compose for PostgreSQL/PostGIS while keeping frontend/backend developer commands transparent.

## Logging
Backend structured logs should include:
- request path
- status
- duration
- correlation/request ID when practical

Do not log secrets or full AI provider credentials.

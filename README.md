# Race ENGENEer

A personal race engineer for every ENGENE during MAMA voting. PWA (React + Vite), API (Spring Boot 3, Java 21), Postgres.

## Run locally

```bash
docker compose up -d                          # Postgres on :5432
cd backend && mvn spring-boot:run             # API on :8080
cd frontend && npm install && npm run dev     # :5173, proxies /api
```

## Deploy

Pushing to `main` builds and deploys to `my-race-engineer.rrriooo.com`.

## API

- `POST /api/crew` `{ "team": "sunoo" }` → `201 { id, team }`
- `GET /api/crew/{id}` → `200` / `404`

Teams: `jay`, `jake`, `sunghoon`, `sunoo`, `jungwon`, `niki`.

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
- `GET /api/crew/{id}/radio` → `{ phase, pitStop, messages }`
- `GET /api/race` → `{ phase, pitStop, updatedAt }`
- `PUT /api/admin/race` `{ "phase"?, "pitStop"?, "practice"? }` (basic auth)

Teams: `jay`, `jake`, `sunghoon`, `sunoo`, `jungwon`, `niki`.
Phases: `GRID`, `SPRINT_RACE`, `GRAND_PRIX`, `FINAL_LAP`, `FINISH_LINE`.
Free practice is a flag, not a phase: it can run alongside any phase, and toggling it resets the phase to `GRID`.

## Admin

Race Control panel at `/admin`. Default login `admin` / `admin`; override with `ADMIN_USER` and the `ADMIN_PASSWORD` secret.

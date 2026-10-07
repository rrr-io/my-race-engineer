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
- `GET /api/push/key` → `{ enabled, publicKey }`
- `POST /api/crew/{id}/push` a browser `PushSubscription` → `204`
- `DELETE /api/crew/{id}/push?endpoint=…` → `204`
- `GET /api/admin/push`, `POST /api/admin/push/test` (basic auth)
- `PUT /api/admin/race` `{ "phase"?, "pitStop"?, "practice"? }` (basic auth)

Teams: `jay`, `jake`, `sunghoon`, `sunoo`, `jungwon`, `niki`.
Phases: `GRID`, `SPRINT_RACE`, `GRAND_PRIX`, `FINAL_LAP`, `FINISH_LINE`.
Free practice is a flag, not a phase: it can run alongside any phase, and toggling it resets the phase to `GRID`.

## Push notifications

Phase starts and pit stops are pushed to every subscribed device in the team's own voice. They need a VAPID key pair:

```bash
npx web-push generate-vapid-keys
```

Add the two keys as GitHub secrets `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` (locally, export them as environment variables before starting the backend). Without them push stays off and the app hides the notifications card.

On iPhone, notifications only work once the app has been added to the Home Screen from Safari (iOS 16.4 or later).

## Admin

Race Control panel at `/admin`. Default login `admin` / `admin`; override with `ADMIN_USER` and the `ADMIN_PASSWORD` secret.

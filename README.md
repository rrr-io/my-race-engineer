# Race ENGENEer

A personal race engineer for every ENGENE during MAMA voting. PWA (React + Vite), API (Spring Boot 3, Java 21), Postgres.

## Run locally

```bash
docker compose up -d                          # Postgres on :5432
cd backend && mvn spring-boot:run             # API on :8080
cd frontend && npm install && npm run dev     # :5173, proxies /api
```

## Backend layout

`backend/src/main/java/org/mre/e1`, one package per layer:

- `controller`: the REST endpoints (their request and response records are nested in the controller)
- `service`: business logic, push, proofs, reminders, radio messages and the screenshot storage
- `repository`: Spring Data repositories
- `model`: JPA entities and the enums they use
- `dto`: types shared between services and the API (`ProofView`)
- `config`, `security`, `scheduler`: Spring configuration, the admin filter and the reminder timer
- `client`: the Web Push client; `util`: small helpers

## Deploy

Pushing to `main` builds and deploys to `my-race-engineer.rrriooo.com`.

## API

- `POST /api/crew` `{ "team": "sunoo" }` → `201 { id, team }`
- `GET /api/crew/{id}` → `200` / `404`
- `GET /api/crew/{id}/radio` → `{ phase, pitStop, messages }`
- `GET /api/race` → `{ phase, pitStop, updatedAt }`
- `POST /api/crew/{id}/proofs` multipart: repeated `files` with a matching `categoryIds` each → today's progress per category
- `GET /api/crew/{id}/proofs/today` → `{ done, needsAction, categories: [{ id, name, state, reason, count }] }` (`MISSING`, `PENDING`, `APPROVED`, `REJECTED`)
- `GET /api/admin/categories`, `PUT /api/admin/categories` `{ "names": [...] }` (basic auth)
- `GET /api/admin/proofs`, `GET /api/admin/proofs/{id}/image`, `POST /api/admin/proofs/{id}/approve`, `POST /api/admin/proofs/{id}/reject` `{ "reason" }` (basic auth)
- `GET /api/admin/vote-link`, `PUT /api/admin/vote-link` `{ "url" }` (basic auth)
- `GET /api/admin/reminders`, `PUT /api/admin/reminders` `{ enabled, intervalHours, windowStart, windowEnd }`, `POST /api/admin/reminders/run` (basic auth)
- `GET /api/push/key` → `{ enabled, publicKey }`
- `POST /api/crew/{id}/push` a browser `PushSubscription` → `204`
- `DELETE /api/crew/{id}/push?endpoint=…` → `204`
- `GET /api/admin/push`, `POST /api/admin/push/test` (basic auth)
- `PUT /api/admin/race` `{ "phase"?, "pitStop"?, "practice"? }` (basic auth)

Teams: `jay`, `jake`, `sunghoon`, `sunoo`, `jungwon`, `niki`.
Phases: `GRID`, `SPRINT_RACE`, `GRAND_PRIX`, `FINAL_LAP`, `FINISH_LINE`.
Free practice is a session on the `GRID`, for trying uploads and reviews for real: it starts only from the Grid, phases and pit stops are locked while it's on, and ending it can move straight to a phase (`{ "practice": false, "phase": "SPRINT_RACE" }`). Fans send a certificate from an old vote, Race Control reviews it in `/admin`, and the fan gets the same radio calls and notifications as on race day. Practice proofs are kept apart from race proofs (their own day, their own daily limit) and never count for the podium.

Uploads are open only while a race phase is live (`SPRINT_RACE`, `GRAND_PRIX`, `FINAL_LAP`) or during free practice, never in a pit stop.

The Go Kart race in the app is something else: a practice race each fan runs alone on their phone, with every phase and a scripted review. Nothing in it reaches the server.

## Proofs

Race Control sets the voting categories from `/admin` (one per line; change them at each stage). Every day (Korean time, KST) a fan sends any number of screenshots, each for one category, and needs at least one approved per category to be done. Before that the engineer briefs them on MNET+ and the categories still to do. Each screenshot is reviewed on its own in `/admin` (Under review): approved, or rejected with a reason and sent again. The fan gets a push when a screenshot is rejected and when the whole day is approved.

Limits: `PROOFS_MAX_PER_SUBMISSION` (default 10) and `PROOFS_MAX_PER_CATEGORY` per day (default 5). Screenshots are stored on disk in `PROOFS_DIR` (a Docker volume in production) and are only served to the admin.

## Buttons and what's new

The engineer's voting message has two buttons: "Open MNET+" (the link Race Control sets in `/admin`, https only, `https://mnetplus.world/` by default) and "Upload proof" (scrolls to the proof card). Reminder and rejection notifications carry the same buttons where the device shows them (Android and desktop; iPhone ignores notification buttons, and tapping the notification opens the proof card). The newest message the fan has not seen glows with a NEW tag until they tap it or leave the app.

While a pit stop is on, the stage is frozen: the phase and free practice cannot be changed until it ends.

## Reminders

While a race phase is on (not on the grid, after the finish line, or during a pit stop), a device is reminded when its fan still has categories to do (missing or rejected). Reminders arrive in the fan's own local time, only inside a window (default 10:00-22:00) and at most every few hours (default 4); `Lap N` in the message is the reminder number of the Korean day. They stop once every category has a proof in review or approved, and start again after a rejection. Race Control edits the schedule in `/admin`, which also has "Send a reminder now". The check runs every 5 minutes (`REMINDERS_TICK_MS`).

## Push notifications

Phase starts and pit stops are pushed to every subscribed device in the team's own voice. They need a VAPID key pair:

```bash
npx web-push generate-vapid-keys
```

Add the two keys as GitHub secrets `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` (locally, export them as environment variables before starting the backend). Without them push stays off and the app hides the notifications card.

On iPhone, notifications only work once the app has been added to the Home Screen from Safari (iOS 16.4 or later).

## Admin

Race Control panel at `/admin`. Default login `admin` / `admin`; override with `ADMIN_USER` and the `ADMIN_PASSWORD` secret.

## Tests

- Backend: `cd backend && mvn test`. Plain JUnit 5 unit tests (race rules, free practice, proofs, radio lines, podium, image checks) with small in-memory fakes from `TestData`: no Spring context and no database, so they run in well under a second.
- Frontend: `cd frontend && npm test` (Vitest + jsdom + Testing Library). Lap times, radio labels, splash mode, the Go Kart certificate check, read-once Paddock announcements and the Race Control switches.

Both run inside **Deploy** on every push to `main`: a red test stops the release. The **Tests** workflow runs the same tests on pull requests and on demand.


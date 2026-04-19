# Planning Malik

A planning web app with first-class **recurring tasks**, a clean UX, and a
scalable backend. NX monorepo: NestJS REST API + (Phase 2) Next.js
App Router frontend.

> 📐 **Read [ARCHITECTURE.md](./ARCHITECTURE.md) first.** It explains the
> recurrence model, auth flow, and why each stack choice was made.

## Current status

| Phase | Scope | Status |
| --- | --- | --- |
| **1** | NX workspace · Prisma schema · NestJS API (auth, users, tasks, recurrence) · seed · unit tests | ✅ |
| **2** | Next.js App Router · RSC + Server Actions · auth (login/register/logout) · task CRUD · recurrence editor · per-occurrence exceptions · dark mode | ✅ |
| 3 | Calendar view (month/week) · Kanban board · drag-and-drop · Framer Motion polish | planned |
| 4 | Playwright E2E · PWA · offline support · notifications | planned |

## Prerequisites

- **Node.js ≥ 20**
- **npm ≥ 10**
- **PostgreSQL ≥ 14** (Docker is fine — see below)

## Setup

```bash
# 1. install deps
npm install

# 2. copy env template and edit DATABASE_URL + JWT secrets
cp .env.example .env

# 3. bring up Postgres (example with docker)
docker run -d --name planning-pg \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=planning \
  -p 5432:5432 postgres:16

# 4. create schema + seed
npm run prisma:migrate     # first run will prompt for a migration name
npm run prisma:seed
```

Demo credentials after seeding: `demo@planning.app` / `demo1234`.

## Running the stack

```bash
npm run dev              # api (3333) + web (3000) in parallel
# — or individually —
npm run api:serve        # nest start --watch (ts-node), port 3333
npm run web:serve        # next dev, port 3000
```

Health check: `GET http://localhost:3333/api/health`.
Web UI: `http://localhost:3000` — middleware redirects to `/login` if you're
not signed in.

### Running the production build

```bash
npm run api:build        # @nx/webpack bundles to apps/api/dist/main.js (~70 KB)
npm run api:start        # node apps/api/dist/main.js
npm run web:build        # next build
npm run web:start        # next start
```

> **Heads up:** don't run `nest start` (without `--watch`) directly from
> `apps/api/` — Nest CLI's tsc mode doesn't resolve the `@planning/*` path
> aliases into a runnable bundle. Always go through `npm run api:serve`
> (dev) or `npm run api:build` + `npm run api:start` (prod). The webpack
> build at `apps/api/webpack.config.js` is what produces a self-contained
> `main.js`.

## Scripts

| Command | What |
| --- | --- |
| `npm run dev` | start API + web in parallel |
| `npm run api:serve` / `web:serve` | start one app with hot-reload |
| `npm run api:build` / `web:build` | production build |
| `npm test` | run all Jest projects |
| `nx test api` | only the API tests |
| `nx test utils` | only the utils (RRULE helper) tests |
| `npm run lint` | lint all projects |
| `npm run prisma:generate` | regenerate Prisma client |
| `npm run prisma:migrate` | create + apply a dev migration |
| `npm run prisma:seed` | reset + seed demo data |
| `npm run prisma:studio` | open Prisma Studio |

## API surface (Phase 1)

All routes are mounted under `/api` and require a `Bearer <accessToken>`
header unless marked public.

| Method | Path | Auth | Body / Query | Notes |
| --- | --- | --- | --- | --- |
| `POST` | `/auth/register` | public | `{ email, password, displayName?, timezone? }` | returns `{ user, tokens }` |
| `POST` | `/auth/login` | public | `{ email, password }` | returns `{ user, tokens }` |
| `POST` | `/auth/refresh` | refresh JWT in body | `{ refreshToken }` | rotates pair; reuse detection |
| `POST` | `/auth/logout` | access JWT | `{ refreshToken }` | revokes the refresh row |
| `GET` | `/users/me` | ✓ | — | current profile |
| `GET` | `/tasks` | ✓ | `?rangeStart&rangeEnd` (ISO) | returns **occurrences** (expansion + exceptions applied) |
| `GET` | `/tasks/:id` | ✓ | — | returns the task template (not expanded) |
| `POST` | `/tasks` | ✓ | `CreateTaskDto` | optional `recurrence` block |
| `PATCH` | `/tasks/:id` | ✓ | `UpdateTaskDto` | edits the **entire series** |
| `DELETE` | `/tasks/:id` | ✓ | — | deletes template + recurrence + exceptions |
| `PUT` | `/tasks/:id/exceptions` | ✓ | `UpsertExceptionDto` | edit one occurrence — `SKIP` or `MODIFY` |
| `DELETE` | `/tasks/:id/exceptions/:originalDate` | ✓ | — | re-adopts the rule for that date |
| `GET` | `/health` | public | — | liveness |

### Example: create a weekly recurring task

```bash
curl -X POST http://localhost:3333/api/tasks \
  -H "Authorization: Bearer $ACCESS" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Team retro",
    "dueDate": "2026-05-01T16:00:00Z",
    "priority": "MEDIUM",
    "tags": ["work"],
    "recurrence": {
      "freq": "WEEKLY",
      "byWeekday": [4],
      "startsOn": "2026-05-01T16:00:00Z"
    }
  }'
```

### Example: skip a single occurrence

```bash
curl -X PUT http://localhost:3333/api/tasks/$TASK_ID/exceptions \
  -H "Authorization: Bearer $ACCESS" \
  -H "Content-Type: application/json" \
  -d '{ "originalDate": "2026-05-08T16:00:00Z", "action": "SKIP" }'
```

## Repository layout

```text
apps/
  api/              NestJS REST API (port 3333)
  web/              Next.js 15 App Router frontend (port 3000)
libs/
  data-access/      Prisma client + PrismaModule + schema + seed
  types/            Shared TS types (no runtime deps — edge-safe)
  utils/            Pure helpers (RRULE builder, date math)
```

Path aliases (see `tsconfig.base.json`):

- `@planning/data-access`
- `@planning/types`
- `@planning/utils`

## Frontend tour (Phase 2)

Sign in with the seed credentials (`demo@planning.app` / `demo1234`) and land
on **`/tasks`**. What's there:

- **List view** grouped by day, with relative labels ("Today", "Tomorrow",
  "Mon, May 5").
- **One-click status toggle** (circle on the left of each card).
- **Per-occurrence menu** (three dots on hover) with:
  - *Edit series* (changes apply to every instance)
  - *Edit this occurrence* (creates a `MODIFY` exception)
  - *Skip this occurrence* (creates a `SKIP` exception)
  - *Restore original occurrence* (if already edited)
  - *Delete* (the entire series for recurring tasks)
- **Create / edit forms** at `/tasks/new` and `/tasks/[id]/edit`, with a
  **`RecurrenceEditor`** supporting daily / weekly / monthly rules + weekday
  picker + month-day picker.
- **Dark mode** toggle in the header (persisted by `next-themes`, respects OS).

### Auth architecture

- Login / register are **Server Actions** that call the API and write
  httpOnly cookies (`pm_access`, `pm_refresh`, `pm_user`). Client JS never
  sees the tokens.
- **Middleware** redirects unauthenticated requests to `/login` and bounces
  authenticated users away from `/login` and `/register`.
- **Server-side fetches** from RSC use [`apiGet`](apps/web/src/lib/api.ts);
  Server Actions use `apiAction`, which auto-refreshes on 401 and retries.
- Expired access → cookies cleared, redirect to `/login?reauth=1`.

### Data flow

```text
  Browser
     │  Server Action (POST /auth/login form)
     ▼
  Next.js ──apiAnonymous──► NestJS /auth/login
     │                                │
     │◄─── AuthTokens ────────────────┘
     │  setSession() writes httpOnly cookies
     ▼
  redirect('/tasks')   (middleware allows it because cookies are present)
     │
     ▼
  /tasks RSC ──apiGet('/tasks?range…')──► NestJS /tasks
     │                                              │
     │                         expanded occurrences │
     │◄─────────────────────────────────────────────┘
     ▼
  <TaskList> rendered server-side, streamed to browser
```

## Testing

```bash
npm test                # everything
nx test api             # the API suite (includes recurrence engine)
nx test utils           # RRULE builder edge cases
```

Only the recurrence engine has unit tests so far — it's the one piece with
non-trivial logic. Everything else (auth, CRUD, form submissions) will be
covered by Playwright in Phase 4.

## Design notes to read before contributing

1. [`ARCHITECTURE.md`](./ARCHITECTURE.md) — data model and stack decisions
2. [`libs/data-access/prisma/schema.prisma`](./libs/data-access/prisma/schema.prisma) — canonical data shapes
3. [`apps/api/src/recurrence/recurrence.service.ts`](./apps/api/src/recurrence/recurrence.service.ts) — the expansion engine
4. [`apps/api/src/auth/auth.service.ts`](./apps/api/src/auth/auth.service.ts) — refresh token rotation + reuse detection
5. [`apps/web/src/lib/api.ts`](./apps/web/src/lib/api.ts) — server-side fetch wrapper + auto-refresh
6. [`apps/web/src/middleware.ts`](./apps/web/src/middleware.ts) — auth-gated routing

# Architecture

## 1. Goals

Build a planning web app with first-class **recurring tasks** and three views
(list / calendar / kanban). The hard parts are:

1. **Recurrence storage** — "every Tuesday and Thursday" must not produce
   10,000 rows.
2. **Edit one vs. edit series** — must be an O(1) write, not a rewrite of the
   series.
3. **Date-range queries** — "give me all tasks visible on screen for week W"
   must be fast enough to feel instant on the calendar view.

Everything else (auth, CRUD, views) is well-trodden territory.

## 2. Stack decisions

| Choice | Why |
| --- | --- |
| **REST over GraphQL** | Task domain is simple CRUD + date-range reads. GraphQL's schema/resolver/N+1 overhead is not justified. If the frontend grows dashboard-like aggregation needs later, we add a `/graphql` endpoint alongside REST, not instead of it. |
| **NX monorepo (npm)** | Shared `types` and `data-access` libs between `api` and `web`. `npm` per user request. |
| **NestJS modular** | Clean module boundaries (`auth`, `users`, `tasks`, `recurrence`) map cleanly to DDD bounded contexts. |
| **Prisma + Postgres** | Type-safe queries, good migration story, reusable `@prisma/client` in a shared lib. Postgres has what we need (timezone-aware timestamps, JSONB for recurrence metadata if needed). |
| **JWT access + refresh** | Access token: 15 min, stateless. Refresh token: 7 days, stored hashed in DB (`RefreshToken` table) so it can be revoked. Rotation on every refresh. |
| **RRULE (RFC 5545) shape** | Industry-standard recurrence grammar — survives export to iCal, well-understood edge cases, libraries exist (`rrule` on npm). We store the rule string + a small normalized form for indexing. |
| **Zod (fe) + class-validator (be)** | DTOs on both sides, same shapes. Types generated from Prisma flow through the `types` lib. |

## 3. Repository layout

```
apps/
  api/        NestJS REST API
  web/        Next.js 15 App Router (Phase 2+)
libs/
  data-access/   Prisma schema, client, PrismaModule
  types/         Shared TS types, Zod schemas, enums
  utils/         Pure functions (date math, rrule helpers)
  ui/            Shared React components (Phase 2+)
```

Why these boundaries:

- `data-access` is the **only** place that imports `@prisma/client`. Both the
  API and any future worker can depend on it.
- `types` has **zero runtime dependencies** — safe to import from the Next.js
  edge runtime.
- `utils` is pure TS. No Nest decorators, no React.

## 4. Data model — the recurrence problem

```
User ─┬─< Task ─┬─? RecurrenceRule   (0..1, owned)
      │         └─< TaskException    (0..n, only for recurring tasks)
      └─< RefreshToken
```

### Non-recurring task
A row in `Task` with `recurrenceRuleId = null`, `dueDate` set. Simple.

### Recurring task
A row in `Task` + a row in `RecurrenceRule`. The task row holds the **template**
(title, description, priority, tags, first occurrence date). The rule holds:

```
RecurrenceRule {
  id             String
  taskId         String   (unique — 1:1)
  freq           Enum     DAILY | WEEKLY | MONTHLY | CUSTOM
  interval       Int      every N units (default 1)
  byWeekday      Int[]    0..6, used when WEEKLY
  byMonthDay     Int[]    used when MONTHLY
  startsOn       DateTime
  endsOn         DateTime?  null = open-ended
  count          Int?       null = open-ended
  rruleString    String    canonical RFC 5545 form (source of truth for expansion)
}
```

`rruleString` is the source of truth — the structured columns exist for
querying/filtering, not expansion. Expansion uses the `rrule` library on
`rruleString`.

### Occurrence edits
Per-occurrence edits live in `TaskException`:

```
TaskException {
  id             String
  taskId         String
  originalDate   DateTime  // the date this exception overrides
  action         Enum      SKIP | MODIFY
  // when MODIFY, these override the parent task for that one occurrence:
  title          String?
  description    String?
  dueDate        DateTime?
  status         Enum?
  priority       Enum?
  // (nulls mean "inherit from parent")
}
```

This gives us:
- **"skip this occurrence"** → one row, `action=SKIP`.
- **"edit only this one"** → one row, `action=MODIFY`, with overrides.
- **"edit all future"** → end the current rule on the edit date, create a new
  `Task` + `RecurrenceRule` starting that date.
- **"edit whole series"** → update the parent `Task` / `RecurrenceRule`.

No row explosion. Exceptions are O(user_edits), not O(occurrences).

### Query: "tasks for day D"
```
1. SELECT non-recurring tasks WHERE dueDate::date = D
2. SELECT recurring tasks WHERE startsOn <= D AND (endsOn IS NULL OR endsOn >= D)
3. For each recurring task, expand rruleString between [D, D+1)
4. LEFT JOIN TaskException on (taskId, originalDate) to apply SKIP/MODIFY
5. Merge
```

This is O(recurring tasks user has) per range query. In practice that's
dozens, not thousands. Fast.

### Indexes
- `Task(userId, dueDate)` — non-recurring day lookups
- `RecurrenceRule(startsOn, endsOn)` — range overlap filter
- `TaskException(taskId, originalDate)` — exception lookup during expansion

## 5. Auth flow

```
POST /auth/register  →  { accessToken, refreshToken }
POST /auth/login     →  { accessToken, refreshToken }
POST /auth/refresh   →  { accessToken, refreshToken }   (rotates refresh)
POST /auth/logout    →  revoke refresh token
GET  /users/me       →  current user profile
```

- Access tokens signed with `JWT_ACCESS_SECRET`, 15 min TTL.
- Refresh tokens signed with `JWT_REFRESH_SECRET`, 7 day TTL. Stored as
  `bcrypt(token)` in `RefreshToken` so we can revoke and also detect reuse
  (reuse → revoke all sessions for user, classic detection pattern).
- All `/tasks/*` and `/users/me` protected by `JwtAuthGuard`.

## 6. Scaling notes (not built, but designed for)

- **Expansion caching**: if recurrence expansion becomes a hotspot, cache
  expanded occurrences per `(userId, monthStart)` in Redis with invalidation
  on `Task` / `RecurrenceRule` / `TaskException` writes.
- **Timezones**: `rruleString` is stored in user's timezone. `User.timezone`
  field. All expansions happen in user TZ then converted to UTC for the API
  response.
- **Sharding**: primary query key is `userId`. Natural shard key later.

## 7. What Phase 1 delivers

- ✅ NX workspace, npm, TS config
- ✅ Prisma schema + migrations + seed
- ✅ NestJS `auth` (register/login/refresh/logout) with JWT + refresh rotation
- ✅ NestJS `users` (`/users/me`)
- ✅ NestJS `tasks` (CRUD + date-range list)
- ✅ NestJS `recurrence` (expansion engine + exception application)
- ✅ Unit tests for the recurrence engine (the only piece with real logic)
- ✅ README with setup

Phases 2–4 (Next.js, Playwright, PWA) are explicitly **out of scope** for
this session and tracked in `README.md`.

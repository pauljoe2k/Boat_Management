# Harbour Desk — Backend Implementation Plan

Status labels used in this document follow the build prompt:
**PRINTED** (code is in the repository), **RUN-BY-YOU** (a command you run),
**CONFIRMED** (executed here with observed output), **UNVERIFIED**, **NEEDS-CREDENTIALS**.

---

## 1. Objective and "done when"

**Objective:** a PERN backend under `server/` that a frontend already written against
`docs/api-contract.yaml` can use with **no frontend changes**.

**Done when:**

1. Every 200/201 response body validates against the matching schema in `docs/api-contract.yaml`
   (Ajv, non-strict, `nullable` honoured, `$ref` resolved against the same document) — the
   contract-conformance test fails the build on any mismatch.
2. `GET /dashboard/stats` equals the counts derived from an unfiltered `GET /documents`.
3. Every query is user-scoped; a foreign resource returns 404, never 403.
4. `GET /documents/export-csv` is registered before `GET /documents/:id`.
5. All non-2xx responses use the `{error:{code,message,details?}}` envelope with no stack traces,
   SQL or file paths.
6. The reminder worker is a `setInterval` DB poll — no cron/Redis/queues.

---

## 2. Layout (only what the prompt's structure allows)

```
harbour-desk/
├── client/                       # frontend — untouched
├── docs/
│   ├── api-contract.yaml         # source of truth for the wire (+ marked extensions)
│   ├── requirements.md           # verified prototype facts, mismatches, assumptions
│   ├── implementation-plan.md    # this file
│   └── frontend-integration.md   # how the frontend connects
├── docker-compose.yml            # local PostgreSQL 16 only
└── server/
    ├── .env.example
    ├── package.json              # independent package (root package.json has no workspaces)
    ├── tsconfig.json             # strict
    ├── vitest.config.ts
    ├── prisma/{schema.prisma,seed.ts,migrations/}
    ├── src/
    │   ├── config/env.ts
    │   ├── middleware/{auth,error,rateLimit,validate}.ts
    │   ├── modules/{auth,boats,documents,attachments,reminders,settings,dashboard}/
    │   ├── jobs/reminderWorker.ts
    │   ├── services/{jwt,otp}.ts
    │   ├── utils/{dates,errors,logger,prisma,serializers}.ts
    │   ├── app.ts
    │   └── server.ts
    └── tests/{helpers.ts,contract.test.ts,api.test.ts}
```

## 3. Dependency versions (installed majors, `npm ls --depth=0`)

Runtime: `express@4`, `cors@2`, `helmet@8`, `express-rate-limit@7`, `multer@2`, `jsonwebtoken@9`,
`pino@9`, `zod@3`, `dotenv@16`, `@prisma/client@6`.
Dev: `prisma@6`, `typescript@5.7`, `tsx@4`, `vitest@3`, `supertest@7`, `yaml@2`, `ajv@8`,
`ajv-formats@3`, plus `@types/*`.

Two dependencies need a one-line justification:

- **dotenv** — loads `server/.env`; the prompt's structure mandates a `.env.example`.
- **tsx** — runs/seed-watches TypeScript directly in development; `ts-node` does not handle the
  project's module settings without extra configuration.

No other dependency was added (no node-cron, Redis, queue, file-type or validation libraries).

## 4. Data model (Prisma → PostgreSQL)

| Model | Key columns | Notes |
|---|---|---|
| `User` | `id` cuid (string on the wire), `phone` unique, `name`, `role`, `initials` | identity comes from the OTP flow |
| `Boat` | `id` serial **integer**, `userId`, `name`, `reg`, `owner`, `kind`, `icon`, `color` | no uniqueness on `reg` (A12) |
| `Document` | `id` integer, `userId`, `boatId`, `type`, `expiryDate @db.Date`, `submitted`, `fileName/fileType/fileData` | attachment stored as `bytea` |
| `Reminder` | `id` integer (string on the wire), `documentId`, `daysThreshold`, `triggerDate`, `sent`, `sentAt` | unique `(documentId, daysThreshold)` |
| `Settings` | `userId` pk, `schedule60/30/14/7`, `channelPush/Email/Sms` | prototype defaults, SMS off |

All FKs are `onDelete: Cascade`, so deleting a user removes their rows (used by test cleanup).

## 5. Routes

| Method + path | Source | Notes |
|---|---|---|
| `POST /auth/otp/send` | contract | rate-limited 5/15min/IP; `devCode` only outside production |
| `POST /auth/otp/verify` | contract | rate-limited 10/15min/IP; returns `{user, token}` |
| `GET /auth/me`, `POST /auth/logout` | contract | logout is stateless (A9) |
| `GET/POST /boats` | contract | counts included |
| `GET /boats/{id}` | contract | `BoatDetail`, documents sorted by days-left |
| `PATCH /boats/{id}` | **extension #2** | partial update of name/reg/owner/kind/icon/color |
| `GET/POST /documents` | contract | filters reproduced from prototype `filtered()` |
| `GET /documents/export-csv` | contract | registered **before** `:id` |
| `PATCH /documents/{id}/status` | contract | the "Mark submitted" toggle |
| `GET /documents/{id}` | **extension #3** | |
| `PATCH /documents/{id}` | **extension #4** | `type`/`expiryDate` only, re-syncs reminders |
| `GET /documents/{id}/file` | **extension #5** | authorized private download |
| `GET /reminders`, `POST /reminders/test-push` | contract | derived timeline + `deliveryStatus` |
| `GET/PUT /settings` | contract | PUT re-syncs reminders |
| `GET /dashboard/stats` | **extension #1** | equals unfiltered `GET /documents` counts |
| `GET /health` | **extension #6** | `{status:"ok"}` + `SELECT 1` (503 when down) |

## 6. Security posture

- Bearer JWT (HS256, 7d) on every route except `/auth/otp/send`, `/auth/otp/verify`, `/health`.
- **No CSRF protection is required or implemented**: the token travels in an `Authorization`
  header, never in a cookie, so there is no ambient credential for a cross-site request to ride.
- Guessable integer ids ⇒ every query carries `userId`; foreign rows return **404**.
- helmet, CORS from `CORS_ORIGIN` (default `*`, safe because there are no cookies/credentials),
  rate limits on both OTP routes, upload cap 5 MiB, MIME allow-list `image/*` + `application/pdf`.
- Error handler strips everything internal: responses contain only `code`, `message`, `details`.

## 7. Reminder worker

`server/src/jobs/reminderWorker.ts` — `setInterval` (default 60 s, `REMINDER_POLL_MS`), `unref()`ed.
Each tick selects reminders with `sent:false`, `triggerDate <= today`, document not submitted,
threshold still enabled in that user's settings, marks them `sent`/`sentAt` and logs the dispatch.
Started only by `server.ts`, so tests never race it.

## 8. Verification

| Step | Command (run from `server/` unless stated) | Status |
|---|---|---|
| Install | `npm install` | **CONFIRMED** — 244 packages |
| Prisma client | `npx prisma generate` | **CONFIRMED** — v6.19.3 (needs the TLS workaround below) |
| Typecheck | `npm run typecheck` | **CONFIRMED** — exit 0 |
| Database (standard path) | `docker compose up -d` (repo root) | **UNVERIFIED** — Docker Desktop's engine never came up on this machine (CLI timed out on `npipe:////./pipe/dockerDesktopLinuxEngine` even after a restart), so the compose file was not exercised here. It is kept as the documented path. |
| Database (used instead) | an already-running PostgreSQL on `127.0.0.1:5432` | **CONFIRMED** — a dedicated `harbour_desk` database was created on it; credentials live only in the gitignored `server/.env` |
| Migration | `npm run db:migrate -- --name init` | **CONFIRMED** — CLI-generated `prisma/migrations/20261029044459_init/migration.sql`, applied |
| Seed | `npm run db:seed` | **CONFIRMED** — `Seeded 5 boats, 11 documents, 28 reminders for +91 98450 11223` |
| Tests | `npm test` | **CONFIRMED** — 2 files, **28/28 passed** (19 contract + 9 behaviour), exit 0 |
| Build | `npm run build` | **CONFIRMED** — emits `dist/src/server.js` |
| Run | `npm run dev` | **CONFIRMED** — `Harbour Desk API listening on http://localhost:4000/api` |

**Network note (CONFIRMED):** this machine's TLS interception blocks Prisma's engine download with
`unable to verify the first certificate`. The workaround already documented in the project README
works here too:

```bash
NODE_TLS_REJECT_UNAUTHORIZED=0 npx prisma generate
```

### Smoke test against the running server (CONFIRMED)

| Request | Result |
|---|---|
| `GET /api/health` | `200 {"status":"ok"}` |
| `GET /api/boats` (no token) | `401 {"error":{"code":"UNAUTHORIZED",...}}` |
| `POST /api/auth/otp/send` | `200 {"success":true,"message":"OTP sent to +91 98450 11223","devCode":"123456"}` |
| `POST /api/auth/otp/verify` | `200`, JWT returned |
| `GET /api/auth/me` | `Ravi Naik / Admin / RN` (seeded identity) |
| `GET /api/dashboard/stats` | `{total:11, submitted:4, notSubmitted:7, dueSoon:6, overdue:1}` |
| `GET /api/boats` | 5 boats, `icon`/`color` **and** `ic`/`c` present, counts included |
| `GET /api/documents` | 11 rows, `expiryDate: "2026-10-23"`, `daysLeft: -6`, `fileName: null`, nested `boat` |
| `GET /api/documents?status=over` | 1 row (Survey certificate, daysLeft −6) |
| `GET /api/documents/export-csv` | header + en-GB dates (`19 Dec 2027`), prototype column order |
| `GET /api/reminders` | 28 rows, 12 `sent`, `deliveryStatus` present |
| `PUT /api/settings` (30-day off) | reminders drop 28 → 21, restored on re-enable |
| `POST /api/reminders/test-push` | `{"sent":true,"message":"Test notification simulated"}` |
| `GET /api/nope` | `404 {"error":{"code":"NOT_FOUND",...}}` |
| Worker log | `{"count":12,"msg":"reminder dispatch"}` after the first tick |

## 9. Explicit non-goals

No payments, maps, finance dashboards, regulatory integrations, delete endpoints, snooze
persistence, profile editing, password login, pagination, websockets, or delivery providers
(push/e-mail/SMS remain **NEEDS-CREDENTIALS**).

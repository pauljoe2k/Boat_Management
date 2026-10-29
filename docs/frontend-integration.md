# Harbour Desk — Frontend ↔ Backend Integration

The frontend under `client/` and `src/` is **not modified** by this work. Everything below is
what it needs to know to talk to the backend.

---

## 1. Connect the frontend

In the repository-root `.env` (the frontend's own env file, untouched by the backend):

```bash
VITE_API_BASE_URL=http://localhost:4000/api
VITE_USE_MOCK_API=false
```

Then start both:

```bash
docker compose up -d          # repo root — PostgreSQL 16
cd server && npm install && npm run db:push && npm run db:seed && npm run dev   # API on :4000
# in another shell, repo root:
npm install && npm run dev    # Vite dev server
```

The contract's base URL is `http://localhost:4000/api` — there is no `/v1` segment.

## 2. Sign-in flow against the real API

1. `POST /auth/otp/send` returns `{ success, message, devCode }` — `devCode` is present whenever
   `NODE_ENV !== 'production'` and is `123456`, which is exactly what `OtpPage` pre-fills from
   `location.state.devCode || '123456'`.
2. `POST /auth/otp/verify` returns `{ user, token }`; `setSessionToken(token)` then sends
   `Authorization: Bearer <token>` on every call.
3. The demo number from the prototype (`+91 98450 11223`) is seeded as **Ravi Naik / Admin / RN**,
   so the sidebar identity matches the prototype. Any other number creates a new user
   (name `Harbour User`, initials `HU`) with its own empty workspace.
4. `POST /auth/logout` returns 200 but does not invalidate the token server-side (stateless JWT,
   7-day expiry) — the client already discards it.

## 3. Field-by-field compatibility notes

| Topic | Detail |
|---|---|
| Boat `ic` / `c` | The contract mandates `icon` / `color`; the shipped frontend reads `boat.ic` and `boat.c`. The API returns **both**, and accepts either on `POST /boats` / `PATCH /boats/{id}`. This is additive extension #9 and is the one open decision (see `requirements.md` §5). |
| `documentCount` / `submittedCount` | Always present on boat responses (the contract marks them optional; `BoatCard` reads them). |
| `fileName` | `string \| null` on every `DocumentItem` — `null` when no attachment exists, so `fileName?: string \| null` type-checks. |
| Reminder `deliveryStatus` | Extra property (`sent` \| `scheduled`) beyond `ReminderItem`; harmless to the existing TS interface. `sent` itself is derived from the trigger date exactly like the prototype. |
| Filters | `search`, `boatId`, `status`, `sort` are honoured with the prototype's semantics; `status=all` and `boatId=all` are simply omitted by the client already. |
| CSV | `GET /documents/export-csv` returns `text/csv; charset=utf-8` with `Content-Disposition: attachment; filename="boat-documents.csv"`; `useExportCsv` wraps it in a Blob unchanged. |
| Attachments | The client's `accept="image/*,application/pdf"` matches the server allow-list: anything else is `415`, over 5 MiB is `413`. |
| Error bodies | The server returns `{ error: { code, message, details? } }`. `apiClient.ts` reads a **top-level** `message`, so on failures it falls back to `HTTP error <status>: <statusText>`; additionally most services `catch` and fall back to the mock adapter. Nothing breaks — but that is why a failed call shows a generic message. No frontend change was made. |
| Rate limits | 5 OTP sends and 10 verifications per 15 minutes per IP. Exceeding it returns `429 RATE_LIMITED`. |
| CORS | Default `CORS_ORIGIN=*` (no cookies, no credentials) — any dev origin works. |
| Unused-by-frontend extensions | `GET /dashboard/stats`, `GET /documents/{id}`, `PATCH /documents/{id}`, `PATCH /boats/{id}`, `GET /documents/{id}/file`, `GET /health` are implemented and contract-tested even though the current client computes stats locally. |

## 4. Expected numbers (prototype parity)

With the seed loaded (`npm run db:seed`), `GET /dashboard/stats` returns:

- `total` 11, `submitted` 4, `notSubmitted` 7
- `dueSoon` 6 — the six unsubmitted rows with `daysLeft <= 60` (expired rows included, prototype `due()`);
  the Survey certificate on *Harbour Queen* at 81 days is outside the window
- `overdue` 1 — the Survey certificate on *Sea Falcon*, 6 days past expiry
- `GET /reminders` shows 28 rows (7 unsubmitted documents × 4 thresholds), 12 of them `sent`

`GET /reminders` returns one row per non-submitted document × enabled threshold while
`daysLeft - threshold > -90`, sorted by `triggerDate`, with `sent` already `true` for the rows
whose trigger date has arrived. Disabling the 30-day threshold drops it to 21 rows.

## 5. Verification checklist for the browser

1. `VITE_USE_MOCK_API=false`, both servers running, open the app.
2. Log in with `+91 98450 11223` and code `123456`.
3. Dashboard shows 11 documents, 4 submitted, boat cards show their emoji avatars.
4. Toggle a document's status → toast, and the value persists after a reload (it is in PostgreSQL).
5. Export CSV → file downloads with the prototype's seven columns.
6. Register a second boat and a document → both appear for **that user only** after re-login.

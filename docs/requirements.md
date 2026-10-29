# Harbour Desk — Backend Requirements

Sources, in precedence order:

1. **Wire format** — `docs/api-contract.yaml` (OpenAPI 3.0.3). Wins on paths, methods, field names, types, enums, status codes, response shapes.
2. **Product behavior** — `reference/Harbour Desk_ MVP prototype.html`. Wins on business logic; where silent, sections 6–8 of the build prompt apply.
3. **Engineering / security** — the build prompt.

Every fact below was re-read from the attached prototype HTML in this conversation. The citation
is the JavaScript identifier (or inline handler) where the behavior lives, with the line number in
the source file.

---

## 1. Verified prototype facts

### P1 — Login, session, sidebar identity

| Fact | Citation |
|---|---|
| Welcome screen pre-fills the phone `+91 98450 11223` in `<input id="ph">` | `render()`, line 124 |
| "Get started" is `data-a="login"`; the handler only does `S.auth=true; toast("Welcome aboard")` — **there is no OTP step** | click delegate, line 128 (`if(a=="login"){S.auth=true;...}`) |
| Sidebar identity is hard-coded: initials `RN`, name `Ravi Naik`, role `Admin` | `render()`, line 125 (`<div class="av">RN</div>...<b>Ravi Naik</b><br><small>Admin</small>`) |
| "Exit" is `data-a="out"` → `S.auth=false` | click delegate, line 129 |

### P2 — Document types

`var TYPES=[...]` (line 84) contains exactly eight values:

1. Registration certificate
2. Insurance
3. Survey certificate
4. Fishing licence
5. Pollution certificate
6. Crew licence
7. Passenger licence
8. Fire safety certificate

### P3 — Days-left, due and overdue arithmetic

| Rule | Citation |
|---|---|
| `days = d => d.off` — the day offset *is* the days-to-go value | line 88 |
| `due = d => !d.sub && d.off <= 60` — **due includes already-overdue rows** | line 90 |
| `dtxt(n)`: `n<0 → "N days overdue"`, `n===0 → "Expires today"`, else `"N days left"` | line 92 |
| Stat cards: `n = docs.length`, `s = docs.filter(sub).length`, `du = docs.filter(due).length` | `V.dash`, line 104 |
| Sidebar badge counts `late = docs.filter(d => !d.sub && d.off < 0).length` | `nav()`, line 119 |
| Row class: `late` when `off<0 && !sub`, else `soon` when `due(d)` | `rowH()`, line 93 |

### P4 — Filtering and sorting (`filtered()`, lines 98–99)

- Boat filter: `S.bf !== "all" && d.b !== S.bf`.
- Search `q` matches `d.t + " " + b.name + " " + b.reg + " " + b.owner` (case-insensitive substring).
- Status chips: `yes → d.sub`, `no → !d.sub`, `due → due(d)`, `over → !d.sub && d.off<0`, `all → true`.
- Sort: `days → a.off-b.off`, `boat → a.b-b.b` (**boat id**, not boat name), `status → Number(a.sub)-Number(b.sub)`.
- Prototype sort is a stable sort, so equal keys keep document-id order.

### P5 — Boats

- `V.boats` (line 110) computes `documentCount`/`submittedCount` locally and renders `background: var(--<b.c>)` with `<b.ic>` as the avatar glyph.
- Register-boat handler `nb` (line 134): name and registration are required (`Enter a name and registration number`), owner falls back to `"New owner"`, and new boats are created as `kind:"Vessel", ic:"⛵", c:"s"`.
- `V.boat` (line 111) lists only that boat's documents sorted by `off` ascending.

### P6 — Adding a document

- `save` handler (line 135): expiry date is required (`Pick an expiry date`), `off = Math.round((new Date(dt+"T00:00:00") - T) / 864e5)`, the new row starts `sub:false`.
- Toast: `off<=60 ? "Saved. Reminder sent now, as expiry is within 60 days" : "Saved. First reminder on " + fmt(D(off-60))`.
- Attachment UI is `📎 Tap to attach photo or PDF` with `<input id="fi" type="file" hidden>`; `accept="image/*,application/pdf"` in the shipped frontend (`AddDocumentPage.tsx`).

### P7 — Reminder timeline (`V.rem`, line 113)

- Iterates `docs`, **skips submitted documents** (`if(d.sub)return`).
- For each of `[60,30,14,7]`, skips thresholds whose setting is off (`if(!set[k])return`).
- `at = d.off - k` (days from today until the reminder fires); the row is included only when `at > -90`.
- Sorted by `at` ascending; `sent = at <= 0`; labels are `Sent` / `Scheduled`; the view renders `items.slice(0,14)`.

### P8 — Test push and renewal (`modal()`, lines 121–122)

- Picks the most urgent unsubmitted document: `docs.filter(d => !d.sub).sort((a,b) => a.off-b.off)[0]`.
- Empty case renders **"All caught up" / "Every document is submitted."**
- `ren` marks the document submitted (`d.sub=true`); `snz` only closes the modal with a toast — **snooze has no persistence**.

### P9 — Settings defaults

`S = {..., set:{60:1,30:1,14:1,7:1,push:1,email:1,sms:0}}` (line 87): all four thresholds on, push on, email on, **SMS off**. `V.set` (line 116) toggles them; save is a toast only.

### P10 — CSV export (`csv()`, line 126)

Header `Boat,Registration,Owner,Document,Expiry,Days to go,Status`; rows are boat name, registration, owner, document type, `fmt(D(d.off))` (en-GB `dd MMM yyyy`), the raw day offset, and `Submitted` / `Not submitted`. Download name in the prototype is `boat-documents.csv`.

### P11 — Status toggle

`data-a="tog"` flips `d.sub` and toasts `Marked as submitted` / `Moved back to not submitted` (line 131).

---

## 2. Mismatches and how they were resolved

| # | Mismatch | Resolution |
|---|---|---|
| M1 | Prototype login has no OTP (`S.auth=true` only); the contract defines `POST /auth/otp/send` and `POST /auth/otp/verify`. | **YAML wins on wire.** Both endpoints are implemented. The prototype's zero-friction feel is preserved in development with the fixed code `123456` (the value the shipped frontend already shows as its development helper code). |
| M2 | Sidebar identity is hard-coded (`Ravi Naik` / `Admin` / `RN`); the backend has real user rows. | The seed assigns that exact identity to the pre-filled number `+91 98450 11223`, so the demo UI is unchanged. Other phone numbers create their own user (see assumption A4). |
| M3 | **Boat fields:** prototype and shipped frontend use `ic` / `c`; the contract requires `icon` / `color`. | Contract fields `icon` / `color` are always emitted and are the canonical input names. `ic` / `c` are additionally emitted and accepted as aliases so the **unchanged** frontend still renders its avatar glyph and colour token. This is flagged as additive extension #9 in the YAML and needs your decision (see §5). |
| M4 | Prototype keeps everything in browser memory with no user scoping. | Every query is scoped to the authenticated user; another user's boat/document/reminder returns **404**, never 403. |
| M5 | Prototype CSV values are unquoted. | Values are quoted only when they contain `,` `"` or a newline (RFC 4180 minimal quoting) — byte-identical to the prototype for prototype data, and safe for owners named `D'Souza, Anita`. |
| M6 | Prototype derives reminders at render time from documents + settings; nothing is stored. | `Reminder` rows are persisted and **re-synced on every mutation** (document create/update/status change, settings change) so `GET /reminders` returns exactly the derived view, while still giving the polling worker a durable queue. |
| M7 | Prototype sorts `boat` by boat id (`a.b-b.b`); the frontend mock adapter sorts by boat name. | **Prototype wins:** `boatId` ascending, then document id ascending (prototype sort is stable). |
| M8 | `due` (`!sub && off<=60`) includes overdue rows in the "Reminders due (60 days)" card. | `GET /dashboard/stats.dueSoon` reproduces that exact definition; `overdue` is `!sub && daysLeft<0`. |
| M9 | Prototype has no storage and no delivery channels (the file input is never uploaded; "notifications" are a modal). | Attachments are stored in PostgreSQL (`bytea`). The worker marks due reminders `sent` and logs them; actual push/e-mail/SMS dispatch needs a provider (NEEDS-CREDENTIALS, out of scope). |
| M10 | Prototype "Snooze" is a toast with no persistence; "I've renewed" toggles `sub`. | No snooze endpoint (excluded by the prompt). Renewal maps to `PATCH /documents/{id}/status`. |
| M11 | CSV dates use `fmt()` (`05 Nov 2026`) while the contract requires `expiryDate` as `YYYY-MM-DD`. | JSON bodies use `YYYY-MM-DD`; the CSV column uses the prototype's en-GB `dd MMM yyyy` format. |
| M12 | Prototype accepts any string in the phone field with no validation. | The backend validates a permissive phone pattern (assumption A10) and returns `VALIDATION_ERROR` otherwise. |

---

## 3. Business rules the backend must implement

1. **daysLeft** = whole calendar days from *today* to `expiryDate`, computed at UTC midnight (A2).
2. **dueSoon** = `!submitted && daysLeft <= 60`. **overdue** = `!submitted && daysLeft < 0`.
3. **List filters** on `GET /documents` reproduce `filtered()` exactly (P4), including `boatId` and `status` semantics and the three sort orders.
4. **Reminder rows** exist for every non-submitted document × enabled threshold with `daysLeft - threshold > -90`, with `triggerDate = expiryDate - threshold` days.
5. **`sent`** in `GET /reminders` is derived (`triggerDate <= today`), matching `sent = at<=0` in the prototype; `deliveryStatus` reports what the worker actually dispatched.
6. **Settings** defaults follow P9 and a `PUT /settings` replaces the whole object and re-syncs reminders.
7. **`GET /dashboard/stats`** must equal the counts derived from an unfiltered `GET /documents` (verified by a test).
8. **CSV** follows P10 including column order and label wording.

---

## 4. Labeled assumptions (safe defaults, no stall)

- **A1** Reminder `expiryDate` and `triggerDate` are `YYYY-MM-DD` strings (the contract only says `string`).
- **A2** Day arithmetic uses the UTC calendar-day boundary; a server east of UTC sees the same value as the prototype except between local midnight and 00:00 UTC.
- **A3** JWTs are HS256 with a 7-day expiry, secret from `JWT_SECRET`; the token payload is `{ sub, phone }`.
- **A4** A phone number that has never signed in creates a user with `name: "Harbour User"`, `initials: "HU"`, `role: "Admin"` (the prototype only ever shows one hard-coded identity).
- **A5** In development the OTP is always `123456` (5-minute TTL, 5 attempts). In production a random 6-digit code is generated and **no delivery provider is configured** — login in production therefore requires SMS credentials (NEEDS-CREDENTIALS).
- **A6** Attachments live in PostgreSQL as `Bytes`, capped at 5 MiB; allowed types are `image/*` and `application/pdf`, taken from the client-supplied part content type (a file-signature library was explicitly excluded by the prompt).
- **A7** Filtering, searching, sorting and counting run in application memory over the single user's document set — the contract defines no pagination, and per-user volume is small.
- **A8** `GET /documents` with `status=due` uses the prototype's `due()` (overdue included), consistent with `dueSoon`.
- **A9** `POST /auth/logout` is stateless: the JWT stays valid until expiry, the client discards it.
- **A10** Phone validation accepts `+`, digits and spaces/dashes/parentheses, 7–20 characters.
- **A11** Rate limits: 5 OTP sends and 10 verifications per 15 minutes per IP; disabled under `NODE_ENV=test`.
- **A12** Duplicate registrations (same registration number, same document type) are allowed — the prototype never rejects them, so no unique constraint exists and `CONFLICT` is reserved for genuine uniqueness violations.

---

## 5. Open question needing your decision

**Boat icon/colour field names.** The contract mandates `icon` / `color`; the prototype and the
shipped, unchangeable frontend read `ic` / `c`. The build currently emits and accepts **both**
(marked `x-extension: true` as additive extension #9). Alternatives:

- keep both (current behaviour — frontend renders correctly, one extra documented extension), or
- drop `ic` / `c` (contract purist, but boat cards render an empty glyph and `var(--undefined)`
  background until the frontend is fixed).

---

## 6. Explicit non-goals

Payments, maps, finance dashboards, regulatory integrations, delete endpoints, snooze
persistence, profile editing, password login, pagination, websockets, e-mail/SMS/push delivery
providers, node-cron/Redis/queues, and any dependency not listed in the build prompt's stack.

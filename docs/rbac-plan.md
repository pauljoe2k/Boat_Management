# Harbour Desk — Role-Based Access Control (RBAC) Architecture & Implementation Plan

## 1. Executive Summary & Current State Audit

### 1.1 How Roles & Scoping Work Today
- **Model & Database**: In `server/prisma/schema.prisma`, `User.role` is defined as `String @default("Admin")`.
- **User Creation**: In `server/src/modules/auth/auth.service.ts` (`verifyOtp`), every new user is upserted with:
  ```ts
  create: { phone, name: 'Harbour User', initials: 'HU', role: 'Admin' }
  ```
- **Consequence (F1)**: **Every user created today is an "Admin"**. There is no distinction between accounts, but because every query hardcodes `where: { userId: user.id }`, each user is confined to their own silo while presenting the title "Admin" in `/auth/me`.
- **Auth Middleware**: In `server/src/middleware/auth.ts`, `requireAuth` extracts the Bearer JWT, reads `sub` (user id), and performs `prisma.user.findUnique({ where: { id: payload.sub } })` on **every single request**. This means session-level DB lookup already exists (F3), and role changes made in PostgreSQL will take effect immediately on the next HTTP request (R2).
- **Error Codes**: `server/src/utils/errors.ts` supports `VALIDATION_ERROR` (400), `UNAUTHORIZED` (401), `NOT_FOUND` (404), `CONFLICT` (409), `PAYLOAD_TOO_LARGE` (413), `UNSUPPORTED_MEDIA_TYPE` (415), `RATE_LIMITED` (429), `INTERNAL_ERROR` (500). There is **no 403 status or `FORBIDDEN` error code today** (F5).
- **Ownership Scoping**: All cross-account resource requests today fail closed with `404 NOT_FOUND` (never leaking existence).

### 1.2 Query-Site Audit Table
The following table documents every site in `server/src/` that reads or writes boats, documents, attachments, reminders, settings, or statistics:

| Resource & Route | File & Handler / Function | Operation | Current Scoping (Today) | Proposed RBAC Scoping (Phase 3) |
| :--- | :--- | :--- | :--- | :--- |
| **Boats: List**<br>`GET /boats` | `server/src/modules/boats/boats.routes.ts`<br>`GET /boats` | Read (many) | `where: { userId: user.id }` | `where: policy.boatScope(viewer)`<br>(USER: own; ADMIN: all boats across accounts) |
| **Boats: Create**<br>`POST /boats` | `server/src/modules/boats/boats.routes.ts`<br>`POST /boats` | Create (one) | `data: { userId: user.id, ... }` | `data: { userId: viewer.id, ... }`<br>(Both USER and ADMIN create boats owned by self) |
| **Boats: Get**<br>`GET /boats/:id` | `server/src/modules/boats/boats.routes.ts`<br>`GET /boats/:id` | Read (one) | `where: { id, userId: user.id }` | USER: `where: { id, userId: viewer.id }`<br>ADMIN: `where: { id }` (attach `account` info) |
| **Boats: Patch**<br>`PATCH /boats/:id` | `server/src/modules/boats/boats.routes.ts`<br>`PATCH /boats/:id` | Update (one) | `updateMany({ where: { id, userId: user.id } })` | USER on other: 404<br>ADMIN on other: **403 FORBIDDEN** (R5/R6) |
| **Documents: List**<br>`GET /documents` | `server/src/modules/documents/documents.service.ts`<br>`listDocuments(viewer, filters)` | Read (many) | `where: { userId, ...(boatId) }` | `where: { ...policy.documentScope(viewer), ...(boatId) }`<br>(ADMIN sees all docs across accounts; attach `boat.account`) |
| **Documents: Create**<br>`POST /documents` | `server/src/modules/documents/documents.service.ts`<br>`createDocument(viewer, input)` | Create (one) | `boat.findFirst({ where: { id: boatId, userId } })`<br>`doc.create({ data: { userId, boatId } })` | Check boat existence across all accounts:<br>- Boat missing: 404<br>- Boat owned by stranger (USER): 404<br>- Boat owned by stranger (ADMIN): **403 FORBIDDEN**<br>- Boat owned by self: create document |
| **Documents: Export CSV**<br>`GET /documents/export-csv` | `server/src/modules/documents/documents.service.ts`<br>`exportCsv(viewer, formatCsv)` | Read (many) | `where: { userId }` | `where: policy.documentScope(viewer)`<br>(ADMIN exports all accounts' rows; USER exports own) |
| **Documents: Get**<br>`GET /documents/:id` | `server/src/modules/documents/documents.service.ts`<br>`getDocument(viewer, id)` | Read (one) | `findFirst({ where: { id, userId } })` | USER: own doc only (other = 404)<br>ADMIN: any doc (other = allowed, attach `boat.account`) |
| **Documents: Patch Meta**<br>`PATCH /documents/:id` | `server/src/modules/documents/documents.service.ts`<br>`updateDocument(viewer, id, input)` | Update (one) | `updateMany({ where: { id, userId } })` | USER on other: 404<br>ADMIN on other: **403 FORBIDDEN** |
| **Documents: Patch Status**<br>`PATCH /documents/:id/status` | `server/src/modules/documents/documents.service.ts`<br>`updateDocumentStatus(viewer, id, submitted)` | Update (one) | `updateMany({ where: { id, userId } })` | USER on other: 404<br>ADMIN on other: **403 FORBIDDEN** |
| **Attachments: Download**<br>`GET /documents/:id/file` | `server/src/modules/attachments/attachments.routes.ts`<br>`GET /documents/:id/file` | Read (one blob) | `findFirst({ where: { id, userId: user.id } })` | USER: own only (other = 404)<br>ADMIN: allowed across accounts; logs `admin_access` event via pino (R9) |
| **Reminders: List**<br>`GET /reminders` | `server/src/modules/reminders/reminders.service.ts`<br>`listReminders(viewer)` | Read (many) | `where: { userId, document: { submitted: false } }` | USER: own reminders with own settings (R8)<br>ADMIN: all reminders across accounts, each evaluated with its boat owner's settings (R8) |
| **Reminders: Test Push**<br>`POST /reminders/test-push` | `server/src/modules/reminders/reminders.routes.ts`<br>`POST /reminders/test-push` | Mock action | None | Own account simulation only |
| **Reminders: Sync**<br>`syncRemindersForUser(userId)` | `server/src/modules/reminders/reminders.service.ts`<br>`syncRemindersForUser(userId)` | Sync job | Scoped to the target `userId` | Unchanged: always syncs reminders for the specific owning user |
| **Reminders: Worker**<br>`reminderTick()` | `server/src/jobs/reminderWorker.ts`<br>`reminderTick()` | Background batch | Scans all due un-sent reminders globally | Unchanged: worker evaluates recipient and settings by boat owner (R4/R8) |
| **Settings: Get**<br>`GET /settings` | `server/src/modules/settings/settings.routes.ts`<br>`GET /settings` | Read (one) | `where: { userId: user.id }` | Always the viewer's own settings (`user.id`) |
| **Settings: Update**<br>`PUT /settings` | `server/src/modules/settings/settings.routes.ts`<br>`PUT /settings` | Upsert (one) | `upsert({ where: { userId: user.id } })` | Always the viewer's own settings (`user.id`) |
| **Dashboard: Stats**<br>`GET /dashboard/stats` | `server/src/modules/dashboard/dashboard.routes.ts`<br>`GET /dashboard/stats` | Read (aggregated) | Calls `listDocuments(user.id, {})` | Calls `listDocuments(viewer, {})`<br>(Matches viewer's document visibility) |

---

## 2. Policy Module Architecture (`server/src/modules/auth/policy.ts`)

To satisfy R5, **no inline `role === ...` checks will exist in route handlers or data services**. All scoping and permission decisions are centralized in `server/src/modules/auth/policy.ts`.

### Proposed Policy API
```ts
import type { Prisma, Role } from '@prisma/client';
import type { AuthUser } from '../../middleware/auth';

export const isViewerAdmin = (viewer: AuthUser): boolean => viewer.role === 'ADMIN';

/** Scoping filters for Prisma queries */
export const boatScope = (viewer: AuthUser): Prisma.BoatWhereInput =>
  isViewerAdmin(viewer) ? {} : { userId: viewer.id };

export const documentScope = (viewer: AuthUser): Prisma.DocumentWhereInput =>
  isViewerAdmin(viewer) ? {} : { userId: viewer.id };

export const reminderScope = (viewer: AuthUser): Prisma.ReminderWhereInput =>
  isViewerAdmin(viewer) ? {} : { userId: viewer.id };

/** Permission assertion guards */
export function assertCanReadResource(viewer: AuthUser, resourceOwnerId: string): void;
export function assertCanMutateBoat(viewer: AuthUser, boatOwnerId: string): void;
export function assertCanMutateDocument(viewer: AuthUser, docOwnerId: string): void;
export function assertCanCreateDocumentOnBoat(viewer: AuthUser, boatOwnerId: string): void;

/** Wire mapping: converts internal enum (ADMIN/USER) to contract string ("Admin"/"User") */
export const toWireRole = (role: Role | string): 'Admin' | 'User';
```

---

## 3. Schema & Database Migration Strategy

### 3.1 Prisma Enum Definition
```prisma
enum Role {
  USER
  ADMIN
}

model User {
  id        String   @id @default(cuid())
  phone     String   @unique
  name      String
  role      Role     @default(USER)
  initials  String
  createdAt DateTime @default(now())
  ...
}
```

### 3.2 Two-Step Safe Data Migration (`add_roles`)
Existing users currently have string `"Admin"`. To avoid leaving everyone as an Admin (F1 / Section 5 Phase 2):
1. Create migration file via `prisma migrate dev --create-only --name add_roles`.
2. Review and adjust SQL:
   - Create `CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');`
   - Convert column: `ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;`
   - Set all existing users to `'USER'::"Role"`:
     ```sql
     ALTER TABLE "users" ALTER COLUMN "role" TYPE "Role" USING 'USER'::"Role";
     ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'USER'::"Role";
     ```
3. Admins are then promoted strictly through `ADMIN_PHONES` at startup/verify or via `npm run set-role`.

---

## 4. Bootstrap & CLI Role Management Tool

### 4.1 `ADMIN_PHONES` Environment Variable
- Added to `server/.env.example` and validated via Zod in `server/src/config/env.ts`.
- Normalized by stripping extraneous spaces and ensuring standard leading `+` phone formatting.
- Evaluated at:
  1. **Server startup**: Runs an upsert/update promotion query for all listed phones.
  2. **OTP verification (`verifyOtp`)**: If the logging-in phone is in `ADMIN_PHONES`, it is assigned `ADMIN`.

### 4.2 CLI Script: `server/src/scripts/setRole.ts`
- **Justification**: Section 4 R4(b) requires an administrative CLI to promote/demote phones without direct database SQL access.
- Registered in `server/package.json` as:
  ```json
  "set-role": "tsx src/scripts/setRole.ts"
  ```
- **Usage**:
  - `npm run set-role -- <phone> <ADMIN|USER>`
  - Flags: `--force`
- **Safety Guards**:
  - Validates phone exists in `users` table; fails with error message if unknown.
  - Refuses to demote the sole remaining `ADMIN` to `USER` unless `--force` is provided.
  - Emits structured pino logs without leaking credentials or tokens.

---

## 5. File Manifest Across Phases

| Phase | Path | Action | Description |
| :--- | :--- | :--- | :--- |
| **Phase 1** | `docs/rbac-plan.md` | NEW | RBAC architecture and audit plan (this document). |
| **Phase 2** | `server/prisma/schema.prisma` | REPLACE | Replace `String` role with `Role` enum (`USER`, `ADMIN`). |
| **Phase 2** | `server/prisma/migrations/<timestamp>_add_roles/migration.sql` | NEW | SQL migration with data conversion step. |
| **Phase 2** | `server/.env.example` | REPLACE | Add `ADMIN_PHONES`. |
| **Phase 2** | `server/src/config/env.ts` | REPLACE | Add `ADMIN_PHONES` parsing and phone normalization. |
| **Phase 2** | `server/src/middleware/auth.ts` | REPLACE | Type `role` with enum, load fresh from DB on every request. |
| **Phase 2** | `server/src/modules/auth/auth.service.ts` | REPLACE | Default role `USER`, promote if in `ADMIN_PHONES`. |
| **Phase 2** | `server/src/scripts/setRole.ts` | NEW | CLI role assignment tool (`npm run set-role`). |
| **Phase 2** | `server/package.json` | REPLACE | Add `"set-role"` npm script. |
| **Phase 2** | `server/prisma/seed.ts` | REPLACE | Seed demo user as `USER`, add `SEED_ADMIN_PHONE`. |
| **Phase 3** | `server/src/utils/errors.ts` | REPLACE | Add `FORBIDDEN` (403) to `ErrorCode` and `forbidden()` helper. |
| **Phase 3** | `server/src/modules/auth/policy.ts` | NEW | Centralized policy decisions and scope helpers. |
| **Phase 3** | `server/src/utils/serializers.ts` | REPLACE | Add optional `account` (`{id, name, phone}`) field (R7). |
| **Phase 3** | `server/src/modules/boats/boats.routes.ts` | REPLACE | Apply policy scoping, 403 checks, and account payload. |
| **Phase 3** | `server/src/modules/documents/documents.service.ts` | REPLACE | Apply policy scoping, 403 checks, and global CSV export. |
| **Phase 3** | `server/src/modules/documents/documents.routes.ts` | REPLACE | Connect policy to route handlers. |
| **Phase 3** | `server/src/modules/attachments/attachments.routes.ts` | REPLACE | Admin file download with pino `admin_access` log (R9). |
| **Phase 3** | `server/src/modules/reminders/reminders.service.ts` | REPLACE | Admin global reminders evaluated against boat owner settings. |
| **Phase 3** | `server/src/modules/dashboard/dashboard.routes.ts` | REPLACE | Stats calculated against viewer-scoped documents. |
| **Phase 4** | `server/tests/api.test.ts` | REPLACE | Matrix tests: USER A, USER B, ADMIN, 403 forbidden, etc. |
| **Phase 4** | `server/tests/contract.test.ts` | REPLACE | OpenAPI conformance tests including 403 and `account`. |
| **Phase 4** | `server/tests/helpers.ts` | REPLACE | Support for creating admin test sessions. |
| **Phase 4** | `docs/api-contract.yaml` | REPLACE | Additive-only (`x-extension: true`) for 403 and `account`. |
| **Phase 4** | `docs/requirements.md` | REPLACE | Document RBAC decisions R1-R12 and policy table. |
| **Phase 4** | `docs/frontend-integration.md` | REPLACE | Document role strings, `account` object, and 403 handling. |
| **Phase 5** | `client/src/...` (minimal) | REPLACE | Display owner badge for admins; disable edit on other accounts. |

---

## 6. Risks & Performance Analysis

1. **Mass Admin Downgrade / Privilege Inversion**:
   - *Risk*: Every existing account in PostgreSQL is currently an Admin. If a migration is not carefully sequenced, existing users might inadvertently retain admin powers or valid operators might lose administrative access without a bootstrap phone.
   - *Mitigation*: The migration script explicitly converts all existing records to `USER`. `ADMIN_PHONES` automatically elevates authorized numbers upon first startup.
2. **Admin List Performance & Indexing (R12)**:
   - *Status*: **UNVERIFIED (Performance at scale)**.
   - *Audit*: `Boat` has `@@index([userId])`, and `Document` has `@@index([userId])`, `@@index([boatId])`.
   - *Analysis*: When a USER queries documents, Postgres uses the index on `userId`. When an ADMIN queries all documents without a `userId` filter, Postgres executes a sequential scan across `documents` and joins `boats`. Because the contract does not implement pagination (R12), a database with tens of thousands of records could experience high query latency and memory consumption when serialized into memory.
   - *Recommendation*: As stated in R12, keep as-is for the current contract, but note as a known scaling constraint.
3. **Information Disclosure (Privacy & 404 vs 403)**:
   - *Risk*: Returning 403 to a USER would reveal that a boat or document exists under another account.
   - *Mitigation*: USERS strictly receive `404 NOT_FOUND` for any resource they do not own (existence hidden). `403 FORBIDDEN` is returned **only** when an authenticated ADMIN attempts a mutation on a resource belonging to another account.

---

## 7. UNKNOWN List & Assumptions

- **UNKNOWN-1**: Production deployment database status — does production already hold live customer data, or is it pre-launch? (Addressed in Question 4).
- **UNKNOWN-2**: Phone normalization formatting in `.env` — is E.164 without whitespace (e.g. `+919845011223`) or display format (e.g. `+91 98450 11223`) preferred?
  - *Assumption*: Normalizer will strip whitespace, hyphens, and parentheses, matching against standard digits with leading `+`.
- **UNKNOWN-3**: Target initial admin phone numbers for `ADMIN_PHONES`.
  - *Assumption*: Default to demo number `+919845011223` for development until specified.

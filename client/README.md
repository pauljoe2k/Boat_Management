# Harbour Desk — Frontend Application

Harbour Desk is a maritime vessel document compliance and reminder management system for boat owners, operators, and harbour administrators.

This repository contains the production-ready React + TypeScript frontend engineered from the original Harbour Desk functional prototype, fully aligned with the REST API contract defined in `docs/api-contract.yaml`.

---

## 1. Tech Stack

- **Framework**: React 19 with TypeScript in strict mode
- **Bundler & Tooling**: Vite 6
- **Routing**: React Router DOM v6 with protected routes and nested layouts
- **Server State & Mutations**: TanStack Query (`@tanstack/react-query` v5)
- **Forms & Validation**: React Hook Form with Zod schemas
- **Styling**: Vanilla CSS using custom properties (`--bg`, `--sf`, `--ink`, `--pri`, `--g`, `--r`, `--a`, etc.) matching the nautical design language
- **Themes**: Automatic and togglable Light / Dark themes with local persistence
- **Testing**: Vitest + React Testing Library + JSDOM

---

## 2. Getting Started

### Prerequisites

- Node.js (v18+ recommended, developed on v22)
- npm (v9+ recommended)

### Installation

```bash
# Clone the repository
git clone https://github.com/pauljoe2k/Boat_Management.git
cd Boat_Management

# Install dependencies
npm install
```

> **Note**: If your network inspects SSL certificates (resulting in `UNABLE_TO_VERIFY_LEAF_SIGNATURE`), run `npm config set strict-ssl false` or pass `$env:NODE_TLS_REJECT_UNAUTHORIZED="0"`.

### Environment Configuration

Copy the sample environment file:

```bash
cp .env.example .env
```

Available environment variables:
- `VITE_API_BASE_URL`: Base URL of the backend REST API (default: `http://localhost:4000/api`).
- `VITE_USE_MOCK_API`: Set to `true` to use the development-only in-memory mock adapter replicating the prototype data; set to `false` when connecting to Claude's live Node.js/Express backend.

---

## 3. Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the Vite development server (typically on `http://localhost:3000` or `3001`) |
| `npm run build` | Runs type checks with `tsc -b` and builds the production bundle into `/dist` |
| `npm run preview` | Previews the production build locally |
| `npm run test` | Runs the full Vitest test suite in non-watch mode |
| `npm run lint` | Runs oxlint across the project |

---

## 4. Key Screens & Features

1. **Authentication Flow (`/login` & `/auth/otp`)**:
   - Phone number login screen with nautical welcome hero.
   - 6-digit OTP verification with countdown timer, resend action, and development helper code (`123456`).
   - In-memory session token tracking; credentials and tokens are kept out of localStorage.

2. **Compliance Dashboard (`/`)**:
   - Four interactive metric cards: Documents tracked, Submitted, Not submitted, and Reminders due (60 days).
   - Filter chips: All, Not submitted, Submitted, Due in 60 days, Overdue.
   - Search bar across boat name, registration, owner, and document type.
   - Sorter: Soonest first, By boat, Not submitted first.
   - Real-time status toggling with optimistic UI updates and toast feedback.
   - CSV export downloaded directly via client generator or API endpoint.

3. **Vessel Directory (`/boats` & `/boats/:id`)**:
   - Responsive card grid displaying vessel avatars, registration, vessel type, and document completion progress bars.
   - Boat registration modal with client-side Zod validation.
   - Detailed vessel view showing only documents pertaining to that boat.

4. **Document Registration (`/add`)**:
   - Vessel selector (pre-selected when navigated from a boat detail screen).
   - Standard 8 document types matching maritime prototype standards.
   - Expiry date picker with live preview helper calculating immediate vs. future reminder trigger dates.
   - Attachment dropzone with file size display and file picker integration.

5. **Compliance Reminders (`/reminders`)**:
   - Multi-threshold delivery schedule timeline (60d, 30d, 14d, 7d).
   - Delivery status indicators (Sent vs. Scheduled) and trigger dates.
   - "Send test push" modal simulating an iOS lock screen notification (9:41 lock screen preview, renewal prompt, and snooze action).

6. **Settings & Themes (`/settings`)**:
   - Reminder threshold schedule toggles (60, 30, 14, 7 days).
   - Notification channel switches (Push, Email, SMS fallback).
   - Light / Dark mode toggle respecting system preferences and persisting user choice.

---

## 5. API Integration & Backend Coordination

All network communication is centralized in `src/services/apiClient.ts` and typed services:
- `authService.ts`
- `boatService.ts`
- `documentService.ts`
- `reminderService.ts`
- `settingsService.ts`

The API contracts, schemas, and endpoints are documented in `docs/api-contract.yaml`.

When Claude's backend in `/server` is started on `http://localhost:4000/api`, simply set `VITE_USE_MOCK_API=false` in `.env`.

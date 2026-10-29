const DAY_MS = 86_400_000;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Midnight UTC of the current calendar day — the reference point for all day arithmetic. */
export const startOfUtcToday = (): Date => {
  const t = new Date();
  t.setUTCHours(0, 0, 0, 0);
  return t;
};

/** `YYYY-MM-DD` for any Date we store (Prisma @db.Date values are UTC midnight). */
export const toIsoDate = (d: Date): string => d.toISOString().slice(0, 10);

export const todayIso = (): string => toIsoDate(startOfUtcToday());

/** Strict calendar-date check: shape, real month/day, and a stable round trip. */
export const isIsoDate = (value: string): boolean => {
  if (!ISO_DATE.test(value)) return false;
  const parsed = Date.parse(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed)) return false;
  return new Date(parsed).toISOString().slice(0, 10) === value;
};

/** Whole calendar days from today until `iso` (prototype: `off`). */
export const daysUntil = (iso: string): number =>
  Math.round((Date.parse(`${iso}T00:00:00Z`) - startOfUtcToday().getTime()) / DAY_MS);

/** Date at `days` offset from today. */
export const dateAtOffset = (days: number): Date =>
  new Date(startOfUtcToday().getTime() + days * DAY_MS);

/** `YYYY-MM-DD` at `days` offset from `iso`. */
export const shiftIso = (iso: string, days: number): string => toIsoDate(dateAtOffset(daysUntil(iso) + days));

/** Prototype `fmt()` — en-GB `05 Nov 2026`, used by the CSV export only. */
export const formatCsvDate = (iso: string): string =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });

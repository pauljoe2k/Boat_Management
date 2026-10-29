import { prisma } from '../../utils/prisma';
import { daysUntil, shiftIso, startOfUtcToday, toIsoDate } from '../../utils/dates';
import {
  DEFAULT_SETTINGS,
  reminderJson,
  scheduleFlags,
  THRESHOLDS,
  type SettingsRow,
  type Threshold,
} from '../../utils/serializers';

export async function getSettings(userId: string): Promise<SettingsRow> {
  const row = await prisma.settings.findUnique({ where: { userId } });
  return row ?? DEFAULT_SETTINGS;
}

/**
 * Keeps Reminder rows equal to what the prototype derives at render time
 * (`V.rem`): non-submitted documents x enabled thresholds, only while
 * `daysLeft - threshold > -90`, with `triggerDate = expiryDate - threshold`.
 * Called after every mutation that can change the derived set.
 */
export async function syncRemindersForUser(userId: string): Promise<void> {
  const [settings, docs] = await Promise.all([
    getSettings(userId),
    prisma.document.findMany({
      where: { userId, submitted: false },
      select: { id: true, expiryDate: true },
    }),
  ]);
  const flags = scheduleFlags(settings);

  const desired = new Map<string, { documentId: number; daysThreshold: number; triggerDate: Date }>();
  for (const doc of docs) {
    const iso = toIsoDate(doc.expiryDate);
    const left = daysUntil(iso);
    for (const k of THRESHOLDS) {
      if (!flags[k]) continue;
      if (left - k <= -90) continue;
      desired.set(`${doc.id}:${k}`, {
        documentId: doc.id,
        daysThreshold: k,
        triggerDate: new Date(`${shiftIso(iso, -k)}T00:00:00.000Z`),
      });
    }
  }

  const existing = await prisma.reminder.findMany({
    where: { userId },
    select: { id: true, documentId: true, daysThreshold: true },
  });

  const toDelete: number[] = [];
  const kept = new Set<string>();
  for (const row of existing) {
    const key = `${row.documentId}:${row.daysThreshold}`;
    if (desired.has(key)) kept.add(key);
    else toDelete.push(row.id);
  }
  const toCreate = [...desired.entries()].filter(([key]) => !kept.has(key)).map(([, value]) => value);

  const ops = [];
  if (toDelete.length > 0) ops.push(prisma.reminder.deleteMany({ where: { id: { in: toDelete } } }));
  if (toCreate.length > 0) {
    ops.push(prisma.reminder.createMany({ data: toCreate.map((d) => ({ userId, ...d })) }));
  }
  if (ops.length > 0) await prisma.$transaction(ops);
}

/**
 * `GET /reminders` — the derived prototype timeline. `sent` is derived from the
 * trigger date (prototype: `sent = at <= 0`), while `deliveryStatus` reports what
 * the polling worker has actually dispatched (additive extension #7).
 */
export async function listReminders(userId: string): Promise<ReturnType<typeof reminderJson>[]> {
  const [settings, rows] = await Promise.all([
    getSettings(userId),
    prisma.reminder.findMany({
      where: { userId, document: { submitted: false } },
      include: {
        document: {
          select: {
            type: true,
            expiryDate: true,
            boat: { select: { name: true } },
          },
        },
      },
    }),
  ]);

  const flags = scheduleFlags(settings);
  const today = startOfUtcToday().getTime();

  const items = rows
    .filter((r) => flags[r.daysThreshold as Threshold] === true)
    .filter((r) => daysUntil(toIsoDate(r.document.expiryDate)) - r.daysThreshold > -90)
    .map((r) =>
      reminderJson(
        {
          id: r.id,
          documentId: r.documentId,
          daysThreshold: r.daysThreshold,
          triggerDate: r.triggerDate,
          sent: r.sent,
          boatName: r.document.boat?.name ?? 'Vessel',
          documentType: r.document.type,
          expiryDate: r.document.expiryDate,
        },
        r.triggerDate.getTime() <= today,
      ),
    );

  items.sort((a, b) => a.triggerDate.localeCompare(b.triggerDate) || Number(a.id) - Number(b.id));
  return items;
}

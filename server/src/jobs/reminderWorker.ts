/**
 * Reminder worker — a plain DB-polling setInterval loop (no node-cron, no queue).
 *
 * Each tick marks reminders whose trigger date has arrived as `sent`, provided
 * the owning user still has that threshold enabled and the document has not
 * been submitted. Actual push/e-mail/SMS delivery needs a provider and is out
 * of scope (requirements.md M9 / A5); dispatch is logged instead.
 */
import { env } from '../config/env';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import { DEFAULT_SETTINGS, scheduleFlags, THRESHOLDS, type SettingsRow } from '../utils/serializers';

let timer: NodeJS.Timeout | null = null;

export async function reminderTick(): Promise<number> {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const due = await prisma.reminder.findMany({
    where: { sent: false, triggerDate: { lte: today }, document: { submitted: false } },
    select: { id: true, userId: true, daysThreshold: true },
  });
  if (due.length === 0) return 0;

  const userIds = [...new Set(due.map((r) => r.userId))];
  const settingsRows = await prisma.settings.findMany({ where: { userId: { in: userIds } } });
  const settingsByUser = new Map<string, SettingsRow>(settingsRows.map((s) => [s.userId, s]));

  const sendable = due.filter((r) => {
    const settings = settingsByUser.get(r.userId) ?? DEFAULT_SETTINGS;
    const flags = scheduleFlags(settings);
    return (THRESHOLDS as readonly number[]).includes(r.daysThreshold) && flags[r.daysThreshold as (typeof THRESHOLDS)[number]];
  });

  if (sendable.length === 0) return 0;

  await prisma.reminder.updateMany({
    where: { id: { in: sendable.map((r) => r.id) } },
    data: { sent: true, sentAt: new Date() },
  });

  logger.info({ count: sendable.length }, 'reminder dispatch');
  return sendable.length;
}

export function startReminderWorker(): void {
  if (timer) return;
  timer = setInterval(() => {
    void reminderTick().catch((err) => logger.error({ err }, 'reminder worker tick failed'));
  }, env.REMINDER_POLL_MS);
  timer.unref();
  logger.info({ intervalMs: env.REMINDER_POLL_MS }, 'reminder worker started');
}

export function stopReminderWorker(): void {
  if (timer) clearInterval(timer);
  timer = null;
}

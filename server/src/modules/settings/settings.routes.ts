import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, parseBody } from '../../middleware/validate';
import { currentUser, requireAuth } from '../../middleware/auth';
import { prisma } from '../../utils/prisma';
import { settingsJson, type SettingsRow } from '../../utils/serializers';
import { getSettings, syncRemindersForUser } from '../reminders/reminders.service';

export const settingsRouter = Router();

const settingsSchema = z.object({
  schedule: z
    .object({
      '60': z.boolean().optional(),
      '30': z.boolean().optional(),
      '14': z.boolean().optional(),
      '7': z.boolean().optional(),
    })
    .optional(),
  channels: z
    .object({
      push: z.boolean().optional(),
      email: z.boolean().optional(),
      sms: z.boolean().optional(),
    })
    .optional(),
});

settingsRouter.get(
  '/settings',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    res.json(settingsJson(await getSettings(user.id)));
  }),
);

settingsRouter.put(
  '/settings',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const body = parseBody(req, settingsSchema);
    const current = await getSettings(user.id);

    const next: SettingsRow = {
      schedule60: body.schedule?.['60'] ?? current.schedule60,
      schedule30: body.schedule?.['30'] ?? current.schedule30,
      schedule14: body.schedule?.['14'] ?? current.schedule14,
      schedule7: body.schedule?.['7'] ?? current.schedule7,
      channelPush: body.channels?.push ?? current.channelPush,
      channelEmail: body.channels?.email ?? current.channelEmail,
      channelSms: body.channels?.sms ?? current.channelSms,
    };

    await prisma.settings.upsert({
      where: { userId: user.id },
      update: next,
      create: { userId: user.id, ...next },
    });

    // The reminder timeline is derived from these flags — re-sync so the next
    // GET /reminders matches (prototype re-derives on every render).
    await syncRemindersForUser(user.id);

    res.json(settingsJson(next));
  }),
);

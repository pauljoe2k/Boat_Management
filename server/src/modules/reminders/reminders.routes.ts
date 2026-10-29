import { Router } from 'express';
import { asyncHandler } from '../../middleware/validate';
import { currentUser, requireAuth } from '../../middleware/auth';
import { listReminders } from './reminders.service';

export const remindersRouter = Router();

remindersRouter.get(
  '/reminders',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    res.json(await listReminders(user.id));
  }),
);

remindersRouter.post(
  '/reminders/test-push',
  requireAuth,
  asyncHandler(async (_req, res) => {
    // No push provider is configured (see requirements.md A5/M9): the endpoint
    // acknowledges the request exactly like the prototype's mock behaviour.
    res.json({ sent: true, message: 'Test notification simulated' });
  }),
);

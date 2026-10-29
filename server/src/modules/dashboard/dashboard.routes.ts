import { Router } from 'express';
import { asyncHandler } from '../../middleware/validate';
import { currentUser, requireAuth } from '../../middleware/auth';
import { listDocuments } from '../documents/documents.service';

export const dashboardRouter = Router();

/**
 * Additive extension #1. Computed over the user's full, unfiltered document set
 * so the numbers always equal the counts derived from an unfiltered
 * `GET /documents` (verified by tests/contract.test.ts).
 */
dashboardRouter.get(
  '/dashboard/stats',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const items = await listDocuments(user.id, {});

    const submitted = items.filter((d) => d.submitted).length;
    const notSubmittedItems = items.filter((d) => !d.submitted);

    res.json({
      total: items.length,
      submitted,
      notSubmitted: items.length - submitted,
      // prototype `due()` — overdue rows are included in "due within 60 days"
      dueSoon: notSubmittedItems.filter((d) => d.daysLeft <= 60).length,
      overdue: notSubmittedItems.filter((d) => d.daysLeft < 0).length,
    });
  }),
);

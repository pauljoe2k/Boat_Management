import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { env } from '../../config/env';
import { asyncHandler, parseBody, parseParams, parseQuery } from '../../middleware/validate';
import { currentUser, requireAuth } from '../../middleware/auth';
import { AppError } from '../../utils/errors';
import { isIsoDate } from '../../utils/dates';
import { csvDate } from '../../utils/serializers';
import {
  createDocument,
  exportCsv,
  getDocument,
  listDocuments,
  updateDocument,
  updateDocumentStatus,
  type StatusFilter,
  type SortOption,
} from './documents.service';

export const documentsRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.UPLOAD_MAX_BYTES, files: 1 },
});

const idParamSchema = z.object({ id: z.coerce.number().int().positive() });

const listQuerySchema = z.object({
  search: z.string().optional(),
  boatId: z.preprocess(
    (v) => (v === undefined || v === '' ? undefined : Number(v)),
    z.number().int().positive().optional(),
  ),
  status: z.enum(['all', 'yes', 'no', 'due', 'over']).optional(),
  sort: z.enum(['days', 'boat', 'status']).optional(),
});

const createDocumentSchema = z.object({
  boatId: z.coerce.number().int().positive({ message: 'boatId must be a positive integer' }),
  type: z.string().trim().min(1, 'type is required'),
  expiryDate: z.string().min(1, 'expiryDate is required'),
});

const statusSchema = z.object({ submitted: z.boolean() });

const updateSchema = z.object({
  type: z.string().trim().min(1).optional(),
  expiryDate: z.string().min(1).optional(),
});

const allowedMime = (mimetype: string): boolean =>
  mimetype.startsWith('image/') || mimetype === 'application/pdf';

documentsRouter.get(
  '/documents',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const q = parseQuery(req, listQuerySchema);
    const items = await listDocuments(user.id, {
      search: q.search,
      boatId: q.boatId,
      status: q.status as StatusFilter | undefined,
      sort: q.sort as SortOption | undefined,
    });
    res.json(items);
  }),
);

documentsRouter.post(
  '/documents',
  requireAuth,
  upload.single('file'),
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const body = parseBody(req, createDocumentSchema);

    if (req.file && !allowedMime(req.file.mimetype)) {
      throw new AppError('UNSUPPORTED_MEDIA_TYPE', 'Only image or PDF attachments are supported');
    }

    const doc = await createDocument(user.id, {
      boatId: body.boatId,
      type: body.type,
      expiryDate: body.expiryDate,
      file: req.file ? { originalname: req.file.originalname, mimetype: req.file.mimetype, buffer: req.file.buffer } : undefined,
    });
    res.status(201).json(doc);
  }),
);

// Route-order trap from the contract: /documents/export-csv must be registered
// before /documents/:id, otherwise it is swallowed by the id route.
documentsRouter.get(
  '/documents/export-csv',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const csv = await exportCsv(user.id, csvDate);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="boat-documents.csv"');
    res.send(csv);
  }),
);

// Additive extension #3
documentsRouter.get(
  '/documents/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const { id } = parseParams(req, idParamSchema);
    res.json(await getDocument(user.id, id));
  }),
);

// Additive extension #4 — type / expiryDate only, never `submitted`
documentsRouter.patch(
  '/documents/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const { id } = parseParams(req, idParamSchema);
    const body = parseBody(req, updateSchema);
    if (body.expiryDate !== undefined && !isIsoDate(body.expiryDate)) {
      throw new AppError('VALIDATION_ERROR', 'Invalid request body', [
        { path: 'expiryDate', message: 'expiryDate must be a valid date in YYYY-MM-DD format' },
      ]);
    }
    res.json(await updateDocument(user.id, id, body));
  }),
);

documentsRouter.patch(
  '/documents/:id/status',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const { id } = parseParams(req, idParamSchema);
    const body = parseBody(req, statusSchema);
    res.json(await updateDocumentStatus(user.id, id, body.submitted));
  }),
);

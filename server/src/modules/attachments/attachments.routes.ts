import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, parseParams } from '../../middleware/validate';
import { currentUser, requireAuth } from '../../middleware/auth';
import { prisma } from '../../utils/prisma';
import { notFound } from '../../utils/errors';

export const attachmentsRouter = Router();

const idParamSchema = z.object({ id: z.coerce.number().int().positive() });

const safeFileName = (name: string): string => name.replace(/["\r\n]/g, '');

/** Additive extension #5 — authorized private download of a stored attachment. */
attachmentsRouter.get(
  '/documents/:id/file',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const { id } = parseParams(req, idParamSchema);

    const doc = await prisma.document.findFirst({
      where: { id, userId: user.id },
      select: { fileName: true, fileType: true, fileData: true },
    });
    if (!doc) throw notFound('Document not found');
    if (!doc.fileData || !doc.fileName) throw notFound('This document has no attachment');

    const buffer = Buffer.from(doc.fileData);
    const fileName = safeFileName(doc.fileName);

    res.setHeader('Content-Type', doc.fileType || 'application/octet-stream');
    res.setHeader('Content-Length', String(buffer.byteLength));
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    );
    res.send(buffer);
  }),
);

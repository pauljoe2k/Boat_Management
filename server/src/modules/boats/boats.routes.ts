import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, parseBody, parseParams } from '../../middleware/validate';
import { currentUser, requireAuth } from '../../middleware/auth';
import { prisma } from '../../utils/prisma';
import { notFound } from '../../utils/errors';
import { boatJson, documentJson, type DocumentRow } from '../../utils/serializers';

export const boatsRouter = Router();

const idParamSchema = z.object({ id: z.coerce.number().int().positive() });

const createBoatSchema = z.object({
  name: z.string().trim().min(1, 'Enter a name'),
  reg: z.string().trim().min(1, 'Enter a registration number'),
  // Required by the contract; the prototype falls back to "New owner" when blank.
  owner: z.string().transform((v) => v.trim() || 'New owner'),
  kind: z.string().trim().min(1).optional(),
  icon: z.string().trim().min(1).optional(), // contract name
  ic: z.string().trim().min(1).optional(), // prototype / frontend alias
  color: z.string().trim().min(1).optional(), // contract name
  c: z.string().trim().min(1).optional(), // prototype / frontend alias
});

const patchBoatSchema = createBoatSchema.partial();

const documentSelect = {
  id: true,
  boatId: true,
  type: true,
  expiryDate: true,
  submitted: true,
  fileName: true,
  boat: { select: { id: true, name: true, reg: true, owner: true } },
} as const;

const countsOf = (documents: { submitted: boolean }[]) => ({
  documentCount: documents.length,
  submittedCount: documents.filter((d) => d.submitted).length,
});

boatsRouter.get(
  '/boats',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const boats = await prisma.boat.findMany({
      where: { userId: user.id },
      orderBy: { id: 'asc' },
      include: { documents: { select: { submitted: true } } },
    });
    res.json(boats.map((b) => boatJson(b, countsOf(b.documents))));
  }),
);

boatsRouter.post(
  '/boats',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const body = parseBody(req, createBoatSchema);

    const boat = await prisma.boat.create({
      data: {
        userId: user.id,
        name: body.name,
        reg: body.reg,
        owner: body.owner,
        // Prototype `nb` handler defaults
        kind: body.kind ?? 'Vessel',
        icon: body.icon ?? body.ic ?? '⛵',
        color: body.color ?? body.c ?? 's',
      },
    });

    res.status(201).json(boatJson(boat, { documentCount: 0, submittedCount: 0 }));
  }),
);

boatsRouter.get(
  '/boats/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const { id } = parseParams(req, idParamSchema);

    const boat = await prisma.boat.findFirst({
      where: { id, userId: user.id },
      include: { documents: { select: documentSelect, orderBy: { id: 'asc' } } },
    });
    if (!boat) throw notFound('Boat not found');

    const documents = boat.documents
      .map((d) => documentJson(d as DocumentRow))
      .sort((a, b) => a.daysLeft - b.daysLeft || a.id - b.id);

    res.json({ ...boatJson(boat, countsOf(boat.documents)), documents });
  }),
);

// Additive extension #2
boatsRouter.patch(
  '/boats/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const { id } = parseParams(req, idParamSchema);
    const body = parseBody(req, patchBoatSchema);

    const data: Record<string, string> = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.reg !== undefined) data.reg = body.reg;
    if (body.owner !== undefined) data.owner = body.owner;
    if (body.kind !== undefined) data.kind = body.kind;
    const icon = body.icon ?? body.ic;
    if (icon !== undefined) data.icon = icon;
    const color = body.color ?? body.c;
    if (color !== undefined) data.color = color;

    const updated = await prisma.boat.updateMany({ where: { id, userId: user.id }, data });
    if (updated.count === 0) throw notFound('Boat not found');

    const boat = await prisma.boat.findFirst({
      where: { id, userId: user.id },
      include: { documents: { select: { submitted: true } } },
    });
    if (!boat) throw notFound('Boat not found');

    res.json(boatJson(boat, countsOf(boat.documents)));
  }),
);

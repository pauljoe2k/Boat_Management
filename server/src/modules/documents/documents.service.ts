import type { Prisma } from '@prisma/client';
import { prisma } from '../../utils/prisma';
import { notFound } from '../../utils/errors';
import { documentJson, type DocumentRow } from '../../utils/serializers';
import { syncRemindersForUser } from '../reminders/reminders.service';

export type StatusFilter = 'all' | 'yes' | 'no' | 'due' | 'over';
export type SortOption = 'days' | 'boat' | 'status';

export interface DocumentFilters {
  search?: string;
  boatId?: number;
  status?: StatusFilter;
  sort?: SortOption;
}

export interface UploadedFile {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
}

const documentSelect = {
  id: true,
  boatId: true,
  type: true,
  expiryDate: true,
  submitted: true,
  fileName: true,
  boat: { select: { id: true, name: true, reg: true, owner: true } },
} satisfies Prisma.DocumentSelect;

type DocumentWithBoat = Prisma.DocumentGetPayload<{ select: typeof documentSelect }>;

/**
 * Filtering, searching, sorting and counting all happen in memory over the
 * authenticated user's own document set — the contract defines no pagination
 * and no cross-user queries exist (rules reproduced from the prototype's
 * `filtered()` helper).
 */
export async function listDocuments(userId: string, filters: DocumentFilters = {}): Promise<ReturnType<typeof documentJson>[]> {
  const rows = await prisma.document.findMany({
    where: {
      userId,
      ...(filters.boatId !== undefined ? { boatId: filters.boatId } : {}),
    },
    select: documentSelect,
  });

  let items = rows.map((r: DocumentWithBoat) => documentJson(r as DocumentRow));

  if (filters.search && filters.search.trim() !== '') {
    const q = filters.search.toLowerCase().trim();
    items = items.filter((item) => {
      const haystack = [item.type, item.boat?.name, item.boat?.reg, item.boat?.owner]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }

  if (filters.status && filters.status !== 'all') {
    items = items.filter((item) => {
      switch (filters.status) {
        case 'yes':
          return item.submitted;
        case 'no':
          return !item.submitted;
        case 'due':
          return !item.submitted && item.daysLeft <= 60; // prototype `due()`
        case 'over':
          return !item.submitted && item.daysLeft < 0;
        default:
          return true;
      }
    });
  }

  const sort = filters.sort ?? 'days';
  items.sort((a, b) => {
    if (sort === 'days') return a.daysLeft - b.daysLeft || a.id - b.id;
    if (sort === 'boat') return a.boatId - b.boatId || a.id - b.id;
    return Number(a.submitted) - Number(b.submitted) || a.id - b.id;
  });

  return items;
}

export async function getDocument(userId: string, id: number): Promise<ReturnType<typeof documentJson>> {
  const row = await prisma.document.findFirst({ where: { id, userId }, select: documentSelect });
  if (!row) throw notFound('Document not found');
  return documentJson(row as DocumentRow);
}

export interface CreateDocumentInput {
  boatId: number;
  type: string;
  expiryDate: string;
  file?: UploadedFile;
}

export async function createDocument(userId: string, input: CreateDocumentInput): Promise<ReturnType<typeof documentJson>> {
  const boat = await prisma.boat.findFirst({ where: { id: input.boatId, userId }, select: { id: true } });
  if (!boat) throw notFound('Boat not found');

  const row = await prisma.document.create({
    data: {
      userId,
      boatId: input.boatId,
      type: input.type,
      expiryDate: new Date(`${input.expiryDate}T00:00:00.000Z`),
      ...(input.file
        ? { fileName: input.file.originalname, fileType: input.file.mimetype, fileData: input.file.buffer }
        : {}),
    },
  });

  await syncRemindersForUser(userId);
  return getDocument(userId, row.id);
}

export async function updateDocumentStatus(userId: string, id: number, submitted: boolean): Promise<ReturnType<typeof documentJson>> {
  const result = await prisma.document.updateMany({ where: { id, userId }, data: { submitted } });
  if (result.count === 0) throw notFound('Document not found');
  await syncRemindersForUser(userId);
  return getDocument(userId, id);
}

export interface UpdateDocumentInput {
  type?: string;
  expiryDate?: string;
}

/** Additive extension #4 — never touches `submitted`. */
export async function updateDocument(userId: string, id: number, input: UpdateDocumentInput): Promise<ReturnType<typeof documentJson>> {
  const data: Prisma.DocumentUpdateManyMutationInput = {};
  if (input.type !== undefined) data.type = input.type;
  if (input.expiryDate !== undefined) data.expiryDate = new Date(`${input.expiryDate}T00:00:00.000Z`);

  const result = await prisma.document.updateMany({ where: { id, userId }, data });
  if (result.count === 0) throw notFound('Document not found');

  if (input.expiryDate !== undefined) await syncRemindersForUser(userId);
  return getDocument(userId, id);
}

const csvCell = (value: string): string =>
  /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

/** Prototype `csv()` — fixed column order and labels, insertion (id) order. */
export async function exportCsv(userId: string, formatCsv: (iso: string) => string): Promise<string> {
  const rows = await prisma.document.findMany({
    where: { userId },
    select: documentSelect,
    orderBy: { id: 'asc' },
  });

  const header = 'Boat,Registration,Owner,Document,Expiry,Days to go,Status';
  const lines = rows.map((row) => {
    const doc = documentJson(row as DocumentRow);
    return [
      doc.boat?.name ?? '',
      doc.boat?.reg ?? '',
      doc.boat?.owner ?? '',
      doc.type,
      formatCsv(doc.expiryDate),
      String(doc.daysLeft),
      doc.submitted ? 'Submitted' : 'Not submitted',
    ]
      .map(csvCell)
      .join(',');
  });

  return [header, ...lines].join('\n');
}

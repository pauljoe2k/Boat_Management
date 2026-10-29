import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Express } from 'express';
import request from 'supertest';
import { createApp } from '../src/app';
import { env } from '../src/config/env';
import { auth, createSession, destroySession, isoIn, type TestSession } from './helpers';

describe('API behaviour', () => {
  let app: Express;
  let session: TestSession;
  let stranger: TestSession;
  let boatId: number;
  let docId: number;

  beforeAll(async () => {
    app = createApp();
    session = await createSession(app);
    stranger = await createSession(app);

    const boat = await request(app)
      .post('/api/boats')
      .set(auth(session.token))
      .send({ name: 'Sea Falcon', reg: 'KA-MNG-0412', owner: 'Ravi Naik' });
    expect(boat.status).toBe(201);
    boatId = boat.body.id;

    const doc = await request(app)
      .post('/api/documents')
      .set(auth(session.token))
      .send({ boatId, type: 'Insurance', expiryDate: isoIn(47) });
    expect(doc.status).toBe(201);
    docId = doc.body.id;
  });

  afterAll(async () => {
    await destroySession(session);
    await destroySession(stranger);
  });

  it('rejects protected routes without a bearer token using the error envelope', async () => {
    const res = await request(app).get('/api/boats');
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: { code: 'UNAUTHORIZED', message: expect.any(String) } });
  });

  it('returns the error envelope for unknown routes', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(JSON.stringify(res.body)).not.toContain('stack');
  });

  it('returns VALIDATION_ERROR with details for a bad payload', async () => {
    const res = await request(app).post('/api/boats').set(auth(session.token)).send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(Array.isArray(res.body.error.details)).toBe(true);
    expect(res.body.error.details.length).toBeGreaterThan(0);
  });

  it('keeps every resource scoped to its owner (404, never 403)', async () => {
    const cases = [
      await request(app).get(`/api/boats/${boatId}`).set(auth(stranger.token)),
      await request(app).patch(`/api/boats/${boatId}`).set(auth(stranger.token)).send({ name: 'Stolen' }),
      await request(app).get(`/api/documents/${docId}`).set(auth(stranger.token)),
      await request(app).patch(`/api/documents/${docId}`).set(auth(stranger.token)).send({ type: 'Insurance' }),
      await request(app).patch(`/api/documents/${docId}/status`).set(auth(stranger.token)).send({ submitted: true }),
      await request(app).get(`/api/documents/${docId}/file`).set(auth(stranger.token)),
    ];

    for (const res of cases) {
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    }

    const strangerBoats = await request(app).get('/api/boats').set(auth(stranger.token));
    expect(strangerBoats.body).toEqual([]);
  });

  it('registers GET /documents/export-csv before GET /documents/:id', async () => {
    const csv = await request(app).get('/api/documents/export-csv').set(auth(session.token));
    expect(csv.status).toBe(200);
    expect(csv.headers['content-type']).toContain('text/csv');
    expect(csv.headers['content-disposition']).toContain('boat-documents.csv');
    expect(csv.text.split('\n')[0]).toBe('Boat,Registration,Owner,Document,Expiry,Days to go,Status');
    expect(csv.text).toContain('Sea Falcon,KA-MNG-0412,Ravi Naik,Insurance');

    const doc = await request(app).get(`/api/documents/${docId}`).set(auth(session.token));
    expect(doc.status).toBe(200);
    expect(doc.headers['content-type']).toContain('application/json');
    expect(doc.body).toMatchObject({ id: docId, boatId, type: 'Insurance' });
  });

  it('computes /dashboard/stats that exactly match an unfiltered GET /documents', async () => {
    const soon = await request(app)
      .post('/api/documents')
      .set(auth(session.token))
      .send({ boatId, type: 'Crew licence', expiryDate: isoIn(30) });
    expect(soon.status).toBe(201);

    const expired = await request(app)
      .post('/api/documents')
      .set(auth(session.token))
      .send({ boatId, type: 'Fishing licence', expiryDate: isoIn(-5) });
    expect(expired.status).toBe(201);

    const far = await request(app)
      .post('/api/documents')
      .set(auth(session.token))
      .send({ boatId, type: 'Pollution certificate', expiryDate: isoIn(200) });
    expect(far.status).toBe(201);

    const submitted = await request(app)
      .post('/api/documents')
      .set(auth(session.token))
      .send({ boatId, type: 'Fire safety certificate', expiryDate: isoIn(-30) });
    expect(submitted.status).toBe(201);
    await request(app).patch(`/api/documents/${submitted.body.id}/status`).set(auth(session.token)).send({ submitted: true });

    const list = await request(app).get('/api/documents').set(auth(session.token));
    expect(list.status).toBe(200);

    const stats = await request(app).get('/api/dashboard/stats').set(auth(session.token));
    expect(stats.status).toBe(200);

    const rows = list.body as Array<{ submitted: boolean; daysLeft: number }>;
    expect(stats.body).toEqual({
      total: rows.length,
      submitted: rows.filter((d) => d.submitted).length,
      notSubmitted: rows.filter((d) => !d.submitted).length,
      dueSoon: rows.filter((d) => !d.submitted && d.daysLeft <= 60).length,
      overdue: rows.filter((d) => !d.submitted && d.daysLeft < 0).length,
    });

    // the expired, unsubmitted document counts as both dueSoon and overdue
    expect(stats.body.overdue).toBeGreaterThanOrEqual(1);
    expect(stats.body.dueSoon).toBeGreaterThanOrEqual(stats.body.overdue);
  });

  it('filters, searches and sorts exactly like the prototype', async () => {
    const notSubmitted = await request(app).get('/api/documents?status=no').set(auth(session.token));
    expect(notSubmitted.status).toBe(200);
    expect(notSubmitted.body.every((d: { submitted: boolean }) => !d.submitted)).toBe(true);
    expect(notSubmitted.body.length).toBeGreaterThan(0);

    const overdue = await request(app).get('/api/documents?status=over').set(auth(session.token));
    expect(overdue.body.every((d: { submitted: boolean; daysLeft: number }) => !d.submitted && d.daysLeft < 0)).toBe(true);

    const byDay = await request(app).get('/api/documents?sort=days').set(auth(session.token));
    const days = byDay.body.map((d: { daysLeft: number }) => d.daysLeft);
    expect([...days].sort((a, b) => a - b)).toEqual(days);

    const byBoat = await request(app).get('/api/documents?sort=boat').set(auth(session.token));
    const boatIds = byBoat.body.map((d: { boatId: number }) => d.boatId);
    expect([...boatIds].sort((a, b) => a - b)).toEqual(boatIds);

    const search = await request(app).get('/api/documents?search=ravi').set(auth(session.token));
    expect(search.status).toBe(200);
    expect(search.body.length).toBeGreaterThan(0);
    expect(search.body.every((d: { boat?: { owner: string } }) => d.boat?.owner === 'Ravi Naik')).toBe(true);

    const invalid = await request(app).get('/api/documents?status=bogus').set(auth(session.token));
    expect(invalid.status).toBe(400);
    expect(invalid.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('stores, serves and validates attachments', async () => {
    const pdfBytes = Buffer.from('%PDF-1.4\nharbour-desk contract test payload\n');

    const created = await request(app)
      .post('/api/documents')
      .set(auth(session.token))
      .field('boatId', String(boatId))
      .field('type', 'Survey certificate')
      .field('expiryDate', isoIn(90))
      .attach('file', pdfBytes, { filename: 'survey.pdf', contentType: 'application/pdf' });
    expect(created.status).toBe(201);
    expect(created.body.fileName).toBe('survey.pdf');

    const download = await request(app)
      .get(`/api/documents/${created.body.id}/file`)
      .set(auth(session.token))
      .buffer(true);
    expect(download.status).toBe(200);
    expect(download.headers['content-type']).toContain('application/pdf');
    expect(download.headers['content-disposition']).toContain('survey.pdf');
    expect(Buffer.from(download.body).equals(pdfBytes)).toBe(true);

    const wrongType = await request(app)
      .post('/api/documents')
      .set(auth(session.token))
      .field('boatId', String(boatId))
      .field('type', 'Insurance')
      .field('expiryDate', isoIn(90))
      .attach('file', Buffer.from('not an image'), { filename: 'notes.txt', contentType: 'text/plain' });
    expect(wrongType.status).toBe(415);
    expect(wrongType.body.error.code).toBe('UNSUPPORTED_MEDIA_TYPE');

    const tooBig = await request(app)
      .post('/api/documents')
      .set(auth(session.token))
      .field('boatId', String(boatId))
      .field('type', 'Insurance')
      .field('expiryDate', isoIn(90))
      .attach('file', Buffer.alloc(env.UPLOAD_MAX_BYTES + 1024), { filename: 'huge.pdf', contentType: 'application/pdf' });
    expect(tooBig.status).toBe(413);
    expect(tooBig.body.error.code).toBe('PAYLOAD_TOO_LARGE');
  });

  it('derives the reminder timeline and honours schedule settings', async () => {
    const doc = await request(app)
      .post('/api/documents')
      .set(auth(session.token))
      .send({ boatId, type: 'Passenger licence', expiryDate: isoIn(20) });
    expect(doc.status).toBe(201);

    const res = await request(app).get('/api/reminders').set(auth(session.token));
    expect(res.status).toBe(200);

    const mine = res.body.filter((r: { documentId: number }) => r.documentId === doc.body.id);
    expect(mine).toHaveLength(4);

    const byThreshold = new Map<number, Record<string, unknown>>(mine.map((r: { daysThreshold: number }) => [r.daysThreshold, r]));
    expect((byThreshold.get(60) as { triggerDate: string }).triggerDate).toBe(isoIn(-40));
    expect((byThreshold.get(60) as { sent: boolean }).sent).toBe(true);
    expect((byThreshold.get(30) as { sent: boolean }).sent).toBe(true);
    expect((byThreshold.get(14) as { sent: boolean }).sent).toBe(false);
    expect((byThreshold.get(7) as { sent: boolean }).sent).toBe(false);
    expect(typeof (byThreshold.get(60) as { id: unknown }).id).toBe('string');

    const updated = await request(app)
      .put('/api/settings')
      .set(auth(session.token))
      .send({ schedule: { '60': true, '30': false, '14': true, '7': true }, channels: { push: true, email: true, sms: false } });
    expect(updated.status).toBe(200);
    expect(updated.body.schedule['30']).toBe(false);

    const after = await request(app).get('/api/reminders').set(auth(session.token));
    const stillMine = after.body.filter((r: { documentId: number }) => r.documentId === doc.body.id);
    const thresholds = stillMine.map((r: { daysThreshold: number }) => r.daysThreshold).sort((a: number, b: number) => b - a);
    expect(thresholds).toEqual([60, 14, 7]);
  });
});

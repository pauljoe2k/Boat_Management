import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Express } from 'express';
import request from 'supertest';
import yaml from 'yaml';
import Ajv, { type ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import { createApp } from '../src/app';
import { auth, createSession, destroySession, isoIn, type TestSession } from './helpers';

type Json = Record<string, unknown>;

const candidates = [
  path.resolve(process.cwd(), '../docs/api-contract.yaml'),
  path.resolve(process.cwd(), 'docs/api-contract.yaml'),
];
const CONTRACT_PATH = candidates.find((p) => existsSync(p));
if (!CONTRACT_PATH) {
  throw new Error(`api-contract.yaml not found. Looked in:\n  ${candidates.join('\n  ')}`);
}

const spec = yaml.parse(readFileSync(CONTRACT_PATH, 'utf8')) as {
  paths: Record<string, Record<string, { responses: Record<string, { content?: Record<string, { schema?: Json }> }> }>>;
  components: Json;
};

/**
 * OpenAPI `nullable: true` is not JSON Schema — Ajv would reject a null
 * `fileName` without this rewrite.
 */
const toAjv = (node: unknown): unknown => {
  if (Array.isArray(node)) return node.map(toAjv);
  if (node === null || typeof node !== 'object') return node;
  const source = node as Json;
  const out: Json = {};
  for (const [key, value] of Object.entries(source)) {
    if (key === 'nullable') continue;
    out[key] = toAjv(value);
  }
  if (source.nullable === true) {
    if (typeof out.type === 'string') out.type = [out.type, 'null'];
    else if (Array.isArray(out.type) && !out.type.includes('null')) out.type.push('null');
  }
  return out;
};

const ajv = new Ajv({ allErrors: true, strict: false, validateFormats: true });
addFormats(ajv);

const cache = new Map<string, ValidateFunction>();

/** Compiles one response schema out of the same YAML document (`$ref` resolves against it). */
const validator = (pathKey: string, method: string, status: string, media = 'application/json'): ValidateFunction => {
  const key = `${method} ${pathKey} ${status} ${media}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const schema = spec.paths[pathKey]?.[method]?.responses[status]?.content?.[media]?.schema;
  if (!schema) throw new Error(`Contract has no ${status} ${media} schema for ${method.toUpperCase()} ${pathKey}`);

  const validate = ajv.compile({ ...(toAjv(schema) as Json), components: toAjv(spec.components) as Json });
  cache.set(key, validate);
  return validate;
};

const expectBody = (validate: ValidateFunction, body: unknown): void => {
  const ok = validate(body);
  expect(ok, `response did not match the OpenAPI schema:\n${JSON.stringify(validate.errors, null, 2)}`).toBe(true);
};

describe('OpenAPI contract conformance', () => {
  let app: Express;
  let session: TestSession;
  let boatId: number;
  let docId: number;

  beforeAll(async () => {
    app = createApp();
    session = await createSession(app);

    const boat = await request(app)
      .post('/api/boats')
      .set(auth(session.token))
      .send({ name: 'Contract Vessel', reg: 'CT-0001', owner: 'Contract Owner' });
    expect(boat.status).toBe(201);
    boatId = boat.body.id;

    const doc = await request(app)
      .post('/api/documents')
      .set(auth(session.token))
      .send({ boatId, type: 'Insurance', expiryDate: isoIn(45) });
    expect(doc.status).toBe(201);
    docId = doc.body.id;
  });

  afterAll(async () => {
    await destroySession(session);
  });

  it('POST /auth/otp/send → 200', async () => {
    const res = await request(app).post('/api/auth/otp/send').send({ phone: '+91 98450 11999' });
    expect(res.status).toBe(200);
    expectBody(validator('/auth/otp/send', 'post', '200'), res.body);
  });

  it('POST /auth/otp/verify → 200', async () => {
    await request(app).post('/api/auth/otp/send').send({ phone: session.phone });
    const res = await request(app).post('/api/auth/otp/verify').send({ phone: session.phone, code: '123456' });
    expect(res.status).toBe(200);
    expectBody(validator('/auth/otp/verify', 'post', '200'), res.body);
  });

  it('GET /auth/me → 200', async () => {
    const res = await request(app).get('/api/auth/me').set(auth(session.token));
    expect(res.status).toBe(200);
    expectBody(validator('/auth/me', 'get', '200'), res.body);
  });

  it('POST /boats → 201', async () => {
    const res = await request(app)
      .post('/api/boats')
      .set(auth(session.token))
      .send({ name: 'Second Vessel', reg: 'CT-0002', owner: 'Contract Owner', kind: 'Vessel' });
    expect(res.status).toBe(201);
    expectBody(validator('/boats', 'post', '201'), res.body);
  });

  it('GET /boats → 200', async () => {
    const res = await request(app).get('/api/boats').set(auth(session.token));
    expect(res.status).toBe(200);
    expectBody(validator('/boats', 'get', '200'), res.body);
  });

  it('GET /boats/{id} → 200', async () => {
    const res = await request(app).get(`/api/boats/${boatId}`).set(auth(session.token));
    expect(res.status).toBe(200);
    expectBody(validator('/boats/{id}', 'get', '200'), res.body);
  });

  it('PATCH /boats/{id} → 200 (extension #2)', async () => {
    const res = await request(app)
      .patch(`/api/boats/${boatId}`)
      .set(auth(session.token))
      .send({ owner: 'Renamed Owner', color: 'g' });
    expect(res.status).toBe(200);
    expectBody(validator('/boats/{id}', 'patch', '200'), res.body);
    expect(res.body.owner).toBe('Renamed Owner');
    expect(res.body.color).toBe('g');
    expect(res.body.c).toBe('g'); // frontend alias stays in sync
  });

  it('POST /documents → 201', async () => {
    const res = await request(app)
      .post('/api/documents')
      .set(auth(session.token))
      .send({ boatId, type: 'Survey certificate', expiryDate: isoIn(120) });
    expect(res.status).toBe(201);
    expectBody(validator('/documents', 'post', '201'), res.body);
  });

  it('GET /documents → 200', async () => {
    const res = await request(app).get('/api/documents').set(auth(session.token));
    expect(res.status).toBe(200);
    expectBody(validator('/documents', 'get', '200'), res.body);
  });

  it('GET /documents/{id} → 200 (extension #3)', async () => {
    const res = await request(app).get(`/api/documents/${docId}`).set(auth(session.token));
    expect(res.status).toBe(200);
    expectBody(validator('/documents/{id}', 'get', '200'), res.body);
  });

  it('PATCH /documents/{id} → 200 (extension #4)', async () => {
    const res = await request(app)
      .patch(`/api/documents/${docId}`)
      .set(auth(session.token))
      .send({ expiryDate: isoIn(60) });
    expect(res.status).toBe(200);
    expectBody(validator('/documents/{id}', 'patch', '200'), res.body);
    expect(res.body.submitted).toBe(false); // never touches `submitted`
  });

  it('PATCH /documents/{id}/status → 200', async () => {
    const res = await request(app)
      .patch(`/api/documents/${docId}/status`)
      .set(auth(session.token))
      .send({ submitted: true });
    expect(res.status).toBe(200);
    expectBody(validator('/documents/{id}/status', 'patch', '200'), res.body);
    expect(res.body.submitted).toBe(true);

    await request(app)
      .patch(`/api/documents/${docId}/status`)
      .set(auth(session.token))
      .send({ submitted: false });
  });

  it('GET /documents/export-csv → 200 text/csv', async () => {
    const res = await request(app).get('/api/documents/export-csv').set(auth(session.token));
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expectBody(validator('/documents/export-csv', 'get', '200', 'text/csv'), res.text);
    expect(res.text.split('\n')[0]).toBe('Boat,Registration,Owner,Document,Expiry,Days to go,Status');
  });

  it('GET /reminders → 200', async () => {
    const res = await request(app).get('/api/reminders').set(auth(session.token));
    expect(res.status).toBe(200);
    expectBody(validator('/reminders', 'get', '200'), res.body);
  });

  it('POST /reminders/test-push → 200', async () => {
    const res = await request(app).post('/api/reminders/test-push').set(auth(session.token));
    expect(res.status).toBe(200);
    expectBody(validator('/reminders/test-push', 'post', '200'), res.body);
  });

  it('GET /settings → 200', async () => {
    const res = await request(app).get('/api/settings').set(auth(session.token));
    expect(res.status).toBe(200);
    expectBody(validator('/settings', 'get', '200'), res.body);
  });

  it('PUT /settings → 200', async () => {
    const res = await request(app)
      .put('/api/settings')
      .set(auth(session.token))
      .send({ schedule: { '60': true, '30': true, '14': true, '7': true }, channels: { push: true, email: true, sms: false } });
    expect(res.status).toBe(200);
    expectBody(validator('/settings', 'put', '200'), res.body);
  });

  it('GET /dashboard/stats → 200 (extension #1)', async () => {
    const res = await request(app).get('/api/dashboard/stats').set(auth(session.token));
    expect(res.status).toBe(200);
    expectBody(validator('/dashboard/stats', 'get', '200'), res.body);
  });

  it('GET /health → 200 (extension #6)', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expectBody(validator('/health', 'get', '200'), res.body);
  });
});

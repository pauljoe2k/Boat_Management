import { describe, it, expect, beforeEach } from 'vitest';
import { mockAdapter } from '../services/mock/mockAdapter';

describe('MockAdapter (API Contract compliance)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('authenticates user with OTP dev code', async () => {
    const sendRes = await mockAdapter.sendOtp('+91 98450 11223');
    expect(sendRes.success).toBe(true);
    expect(sendRes.devCode).toBe('123456');

    const verifyRes = await mockAdapter.verifyOtp('+91 98450 11223', '123456');
    expect(verifyRes.user.phone).toBe('+91 98450 11223');
    expect(verifyRes.token).toBeDefined();

    const currentUser = await mockAdapter.getCurrentUser();
    expect(currentUser?.phone).toBe('+91 98450 11223');
  });

  it('rejects invalid OTP codes', async () => {
    await expect(mockAdapter.verifyOtp('+91 98450 11223', '000000')).rejects.toThrow();
  });

  it('returns boats with calculated document counts', async () => {
    const boats = await mockAdapter.getBoats();
    expect(boats.length).toBeGreaterThanOrEqual(5);
    expect(boats[0].name).toBe('Sea Falcon');
    expect(boats[0].documentCount).toBeDefined();
    expect(boats[0].submittedCount).toBeDefined();
  });

  it('registers a new vessel successfully', async () => {
    const newBoat = await mockAdapter.createBoat({
      name: 'Southern Cross',
      reg: 'KA-MNG-9999',
      owner: 'Captain Haddock',
      kind: 'Trawler',
    });
    expect(newBoat.id).toBeDefined();
    expect(newBoat.name).toBe('Southern Cross');

    const boats = await mockAdapter.getBoats();
    expect(boats.some((b) => b.name === 'Southern Cross')).toBe(true);
  });

  it('filters documents by status correctly', async () => {
    const allDocs = await mockAdapter.getDocuments({ status: 'all' });
    const submittedDocs = await mockAdapter.getDocuments({ status: 'yes' });
    const notSubmittedDocs = await mockAdapter.getDocuments({ status: 'no' });

    expect(allDocs.length).toBe(submittedDocs.length + notSubmittedDocs.length);
    expect(submittedDocs.every((d) => d.submitted)).toBe(true);
    expect(notSubmittedDocs.every((d) => !d.submitted)).toBe(true);
  });

  it('toggles document status back and forth', async () => {
    const docs = await mockAdapter.getDocuments();
    const target = docs[0];
    const initialStatus = target.submitted;

    const updated = await mockAdapter.updateDocumentStatus(target.id, !initialStatus);
    expect(updated.submitted).toBe(!initialStatus);

    const reverted = await mockAdapter.updateDocumentStatus(target.id, initialStatus);
    expect(reverted.submitted).toBe(initialStatus);
  });

  it('exports documents as well-formatted CSV', async () => {
    const csv = await mockAdapter.exportCsv();
    expect(csv).toContain('Boat,Registration,Owner,Document,Expiry,Days to go,Status');
    expect(csv).toContain('Sea Falcon');
  });

  it('calculates reminders based on expiry thresholds and settings', async () => {
    const reminders = await mockAdapter.getReminders();
    expect(reminders.length).toBeGreaterThan(0);
    expect([60, 30, 14, 7]).toContain(reminders[0].daysThreshold);
  });
});

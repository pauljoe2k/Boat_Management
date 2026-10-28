import { INITIAL_BOATS, INITIAL_DOCUMENTS, INITIAL_SETTINGS, INITIAL_USER, offsetDateString } from './mockData';
import type { Boat, BoatDetail, CreateBoatInput } from '../../types/boat';
import type { CreateDocumentInput, DocumentFilterParams, DocumentItem } from '../../types/document';
import type { AppSettings } from '../../types/settings';
import type { ReminderItem } from '../../types/reminder';
import type { User, SendOtpResponse, VerifyOtpResponse } from '../../types/auth';

const STORAGE_KEYS = {
  BOATS: 'harbour_mock_boats_v1',
  DOCS: 'harbour_mock_docs_v1',
  SETTINGS: 'harbour_mock_settings_v1',
  USER: 'harbour_mock_user_v1',
};

class MockAdapter {
  private boats: Boat[];
  private documents: DocumentItem[];
  private settings: AppSettings;
  private currentUser: User | null;

  constructor() {
    this.boats = this.loadFromStorage(STORAGE_KEYS.BOATS, INITIAL_BOATS);
    this.documents = this.loadFromStorage(STORAGE_KEYS.DOCS, INITIAL_DOCUMENTS);
    this.settings = this.loadFromStorage(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    this.currentUser = this.loadFromStorage(STORAGE_KEYS.USER, INITIAL_USER);
  }

  private loadFromStorage<T>(key: string, fallback: T): T {
    try {
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return JSON.parse(JSON.stringify(fallback));
  }

  private saveToStorage<T>(key: string, data: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {
      // ignore
    }
  }

  private calculateDaysLeft(expiryDateStr: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(expiryDateStr + 'T00:00:00');
    return Math.round((exp.getTime() - today.getTime()) / 86400000);
  }

  private enrichDocument(doc: DocumentItem): DocumentItem {
    const b = this.boats.find((boat) => boat.id === doc.boatId);
    const daysLeft = this.calculateDaysLeft(doc.expiryDate);
    return {
      ...doc,
      daysLeft,
      boat: b
        ? {
            id: b.id,
            name: b.name,
            reg: b.reg,
            owner: b.owner,
          }
        : undefined,
    };
  }

  // --- Auth ---
  async sendOtp(phone: string): Promise<SendOtpResponse> {
    await this.delay(200);
    return {
      success: true,
      message: `OTP sent to ${phone}`,
      devCode: '123456',
    };
  }

  async verifyOtp(phone: string, code: string): Promise<VerifyOtpResponse> {
    await this.delay(300);
    if (code !== '123456') {
      throw new Error('Invalid verification code. Use 123456 in dev mode.');
    }
    const user: User = {
      ...INITIAL_USER,
      phone,
    };
    this.currentUser = user;
    this.saveToStorage(STORAGE_KEYS.USER, user);
    return {
      user,
      token: 'mock_jwt_session_token_' + Date.now(),
    };
  }

  async getCurrentUser(): Promise<User | null> {
    await this.delay(100);
    return this.currentUser;
  }

  async logout(): Promise<void> {
    await this.delay(100);
    this.currentUser = null;
    localStorage.removeItem(STORAGE_KEYS.USER);
  }

  // --- Boats ---
  async getBoats(): Promise<Boat[]> {
    await this.delay(150);
    return this.boats.map((b) => {
      const docsForBoat = this.documents.filter((d) => d.boatId === b.id);
      const submitted = docsForBoat.filter((d) => d.submitted).length;
      return {
        ...b,
        documentCount: docsForBoat.length,
        submittedCount: submitted,
      };
    });
  }

  async getBoatById(id: number): Promise<BoatDetail> {
    await this.delay(150);
    const boat = this.boats.find((b) => b.id === id);
    if (!boat) throw new Error('Boat not found');
    const docs = this.documents
      .filter((d) => d.boatId === id)
      .map((d) => this.enrichDocument(d))
      .sort((a, b) => a.daysLeft - b.daysLeft);

    const submitted = docs.filter((d) => d.submitted).length;
    return {
      ...boat,
      documentCount: docs.length,
      submittedCount: submitted,
      documents: docs,
    };
  }

  async createBoat(input: CreateBoatInput): Promise<Boat> {
    await this.delay(250);
    const newId = this.boats.length > 0 ? Math.max(...this.boats.map((b) => b.id)) + 1 : 1;
    const newBoat: Boat = {
      id: newId,
      name: input.name.trim(),
      reg: input.reg.trim(),
      owner: input.owner.trim() || 'Vessel Owner',
      kind: input.kind || 'Vessel',
      ic: input.ic || '⛵',
      c: input.c || 's',
      documentCount: 0,
      submittedCount: 0,
    };
    this.boats.push(newBoat);
    this.saveToStorage(STORAGE_KEYS.BOATS, this.boats);
    return newBoat;
  }

  // --- Documents ---
  async getDocuments(params?: DocumentFilterParams): Promise<DocumentItem[]> {
    await this.delay(150);
    let list = this.documents.map((d) => this.enrichDocument(d));

    if (params?.boatId && params.boatId !== 'all') {
      const bid = Number(params.boatId);
      list = list.filter((d) => d.boatId === bid);
    }

    if (params?.search) {
      const q = params.search.toLowerCase().trim();
      list = list.filter((d) => {
        const text = `${d.type} ${d.boat?.name ?? ''} ${d.boat?.reg ?? ''} ${d.boat?.owner ?? ''}`.toLowerCase();
        return text.includes(q);
      });
    }

    if (params?.status && params.status !== 'all') {
      if (params.status === 'yes') list = list.filter((d) => d.submitted);
      if (params.status === 'no') list = list.filter((d) => !d.submitted);
      if (params.status === 'due') list = list.filter((d) => !d.submitted && d.daysLeft <= 60);
      if (params.status === 'over') list = list.filter((d) => !d.submitted && d.daysLeft < 0);
    }

    const sort = params?.sort ?? 'days';
    list.sort((a, b) => {
      if (sort === 'days') return a.daysLeft - b.daysLeft;
      if (sort === 'boat') return (a.boat?.name ?? '').localeCompare(b.boat?.name ?? '');
      if (sort === 'status') return Number(a.submitted) - Number(b.submitted);
      return 0;
    });

    return list;
  }

  async createDocument(input: CreateDocumentInput): Promise<DocumentItem> {
    await this.delay(250);
    const newId = this.documents.length > 0 ? Math.max(...this.documents.map((d) => d.id)) + 1 : 1;
    const daysLeft = this.calculateDaysLeft(input.expiryDate);
    const newDoc: DocumentItem = {
      id: newId,
      boatId: input.boatId,
      type: input.type,
      expiryDate: input.expiryDate,
      daysLeft,
      submitted: false,
      fileName: input.file?.name ?? null,
    };
    this.documents.push(newDoc);
    this.saveToStorage(STORAGE_KEYS.DOCS, this.documents);
    return this.enrichDocument(newDoc);
  }

  async updateDocumentStatus(id: number, submitted: boolean): Promise<DocumentItem> {
    await this.delay(100);
    const index = this.documents.findIndex((d) => d.id === id);
    if (index === -1) throw new Error('Document not found');
    this.documents[index].submitted = submitted;
    this.saveToStorage(STORAGE_KEYS.DOCS, this.documents);
    return this.enrichDocument(this.documents[index]);
  }

  async exportCsv(): Promise<string> {
    await this.delay(200);
    const enriched = this.documents.map((d) => this.enrichDocument(d));
    const header = ['Boat', 'Registration', 'Owner', 'Document', 'Expiry', 'Days to go', 'Status'];
    const rows = enriched.map((d) => [
      `"${d.boat?.name ?? ''}"`,
      `"${d.boat?.reg ?? ''}"`,
      `"${d.boat?.owner ?? ''}"`,
      `"${d.type}"`,
      d.expiryDate,
      d.daysLeft,
      d.submitted ? 'Submitted' : 'Not submitted',
    ]);
    return [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  // --- Reminders ---
  async getReminders(): Promise<ReminderItem[]> {
    await this.delay(150);
    const items: ReminderItem[] = [];
    const thresholds = [60, 30, 14, 7] as const;

    this.documents.forEach((d) => {
      if (d.submitted) return;
      const daysLeft = this.calculateDaysLeft(d.expiryDate);
      const b = this.boats.find((boat) => boat.id === d.boatId);

      thresholds.forEach((k) => {
        if (!this.settings.schedule[k]) return;
        const triggerOffset = daysLeft - k;
        if (triggerOffset > -90) {
          items.push({
            id: `rem_${d.id}_${k}`,
            documentId: d.id,
            boatName: b?.name ?? 'Vessel',
            documentType: d.type,
            daysThreshold: k,
            expiryDate: d.expiryDate,
            triggerDate: offsetDateString(triggerOffset),
            sent: triggerOffset <= 0,
          });
        }
      });
    });

    items.sort((a, b) => new Date(a.triggerDate).getTime() - new Date(b.triggerDate).getTime());
    return items;
  }

  async sendTestPush(): Promise<{ sent: boolean; message: string }> {
    await this.delay(200);
    return {
      sent: true,
      message: 'Test notification simulated',
    };
  }

  // --- Settings ---
  async getSettings(): Promise<AppSettings> {
    await this.delay(100);
    return JSON.parse(JSON.stringify(this.settings));
  }

  async updateSettings(newSettings: AppSettings): Promise<AppSettings> {
    await this.delay(200);
    this.settings = JSON.parse(JSON.stringify(newSettings));
    this.saveToStorage(STORAGE_KEYS.SETTINGS, this.settings);
    return this.settings;
  }

  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const mockAdapter = new MockAdapter();

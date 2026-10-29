import { daysUntil, formatCsvDate, toIsoDate } from './dates';

/** Shape returned for every `User` in the contract. */
export interface UserJson {
  id: string;
  name: string;
  phone: string;
  role: string;
  initials: string;
}

export const userJson = (u: {
  id: string;
  name: string;
  phone: string;
  role: string;
  initials: string;
}): UserJson => ({
  id: u.id,
  name: u.name,
  phone: u.phone,
  role: u.role,
  initials: u.initials,
});

export interface BoatRow {
  id: number;
  name: string;
  reg: string;
  owner: string;
  kind: string;
  icon: string;
  color: string;
}

/**
 * Contract fields are `icon` / `color` (api-contract.yaml). `ic` / `c` are the
 * names the prototype and the shipped frontend use, so they are echoed as
 * aliases — additive extension #9, marked `x-extension: true` in the YAML.
 */
export interface BoatJson {
  id: number;
  name: string;
  reg: string;
  owner: string;
  kind: string;
  icon: string;
  color: string;
  ic: string;
  c: string;
  documentCount?: number;
  submittedCount?: number;
}

export const boatJson = (
  b: BoatRow,
  counts?: { documentCount: number; submittedCount: number },
): BoatJson => ({
  id: b.id,
  name: b.name,
  reg: b.reg,
  owner: b.owner,
  kind: b.kind,
  icon: b.icon,
  color: b.color,
  ic: b.icon,
  c: b.color,
  ...(counts ? { documentCount: counts.documentCount, submittedCount: counts.submittedCount } : {}),
});

export interface DocumentRow {
  id: number;
  boatId: number;
  type: string;
  expiryDate: Date;
  submitted: boolean;
  fileName: string | null;
  boat?: { id: number; name: string; reg: string; owner: string } | null;
}

export const documentJson = (d: DocumentRow) => {
  const iso = toIsoDate(d.expiryDate);
  return {
    id: d.id,
    boatId: d.boatId,
    type: d.type,
    expiryDate: iso,
    daysLeft: daysUntil(iso),
    submitted: d.submitted,
    fileName: d.fileName ?? null,
    ...(d.boat ? { boat: d.boat } : {}),
  };
};

export const csvDate = formatCsvDate;

export interface ReminderRow {
  id: number;
  documentId: number;
  daysThreshold: number;
  triggerDate: Date;
  sent: boolean;
  boatName: string;
  documentType: string;
  expiryDate: Date;
}

export const reminderJson = (
  r: ReminderRow,
  sentNow: boolean,
): {
  id: string;
  documentId: number;
  boatName: string;
  documentType: string;
  daysThreshold: number;
  expiryDate: string;
  triggerDate: string;
  sent: boolean;
  deliveryStatus: 'sent' | 'scheduled';
} => ({
  id: String(r.id),
  documentId: r.documentId,
  boatName: r.boatName,
  documentType: r.documentType,
  daysThreshold: r.daysThreshold,
  expiryDate: toIsoDate(r.expiryDate),
  triggerDate: toIsoDate(r.triggerDate),
  sent: sentNow,
  // additive extension #7: what the polling worker has actually dispatched
  deliveryStatus: r.sent ? 'sent' : 'scheduled',
});

export interface SettingsRow {
  schedule60: boolean;
  schedule30: boolean;
  schedule14: boolean;
  schedule7: boolean;
  channelPush: boolean;
  channelEmail: boolean;
  channelSms: boolean;
}

export const DEFAULT_SETTINGS: SettingsRow = {
  // prototype `S.set` — all thresholds on, push/email on, sms off
  schedule60: true,
  schedule30: true,
  schedule14: true,
  schedule7: true,
  channelPush: true,
  channelEmail: true,
  channelSms: false,
};

export const settingsJson = (s: SettingsRow) => ({
  schedule: {
    '60': s.schedule60,
    '30': s.schedule30,
    '14': s.schedule14,
    '7': s.schedule7,
  },
  channels: {
    push: s.channelPush,
    email: s.channelEmail,
    sms: s.channelSms,
  },
});

export const THRESHOLDS = [60, 30, 14, 7] as const;
export type Threshold = (typeof THRESHOLDS)[number];

export const isThreshold = (n: number): n is Threshold => (THRESHOLDS as readonly number[]).includes(n);

export const scheduleFlags = (s: SettingsRow): Record<Threshold, boolean> => ({
  60: s.schedule60,
  30: s.schedule30,
  14: s.schedule14,
  7: s.schedule7,
});

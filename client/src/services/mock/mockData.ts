import type { Boat } from '../../types/boat';
import type { DocumentItem } from '../../types/document';
import type { AppSettings } from '../../types/settings';
import type { User } from '../../types/auth';

const getToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const offsetDateString = (offsetDays: number): string => {
  const t = getToday();
  const target = new Date(t.getTime() + offsetDays * 86400000);
  return target.toISOString().slice(0, 10);
};

export const INITIAL_USER: User = {
  id: 'usr_ravi_1',
  name: 'Ravi Naik',
  phone: '+91 98450 11223',
  role: 'Admin',
  initials: 'RN',
};

export const INITIAL_BOATS: Boat[] = [
  { id: 1, name: 'Sea Falcon', reg: 'KA-MNG-0412', owner: 'Ravi Naik', kind: 'Fishing trawler', ic: '🎣', c: 's' },
  { id: 2, name: 'Blue Pearl', reg: 'KA-MNG-0877', owner: 'Ravi Naik', kind: 'Fishing boat', ic: '🐟', c: 'g' },
  { id: 3, name: 'Santa Maria', reg: 'GA-PNJ-0231', owner: 'Anita D’Souza', kind: 'Cargo dhow', ic: '⚓', c: 'l' },
  { id: 4, name: 'Wave Rider', reg: 'KA-KWR-1120', owner: 'Coastal Charters', kind: 'Charter boat', ic: '⛵', c: 'a' },
  { id: 5, name: 'Harbour Queen', reg: 'KA-KWR-1203', owner: 'Coastal Charters', kind: 'Ferry', ic: '🚢', c: 'r' },
];

export const INITIAL_DOCUMENTS: DocumentItem[] = [
  { id: 1, boatId: 1, type: 'Registration certificate', expiryDate: offsetDateString(416), daysLeft: 416, submitted: true },
  { id: 2, boatId: 1, type: 'Insurance', expiryDate: offsetDateString(47), daysLeft: 47, submitted: false },
  { id: 3, boatId: 1, type: 'Survey certificate', expiryDate: offsetDateString(-6), daysLeft: -6, submitted: false },
  { id: 4, boatId: 2, type: 'Fishing licence', expiryDate: offsetDateString(44), daysLeft: 44, submitted: false },
  { id: 5, boatId: 2, type: 'Registration certificate', expiryDate: offsetDateString(300), daysLeft: 300, submitted: true },
  { id: 6, boatId: 3, type: 'Crew licence', expiryDate: offsetDateString(28), daysLeft: 28, submitted: false },
  { id: 7, boatId: 3, type: 'Insurance', expiryDate: offsetDateString(75), daysLeft: 75, submitted: true },
  { id: 8, boatId: 4, type: 'Passenger licence', expiryDate: offsetDateString(58), daysLeft: 58, submitted: false },
  { id: 9, boatId: 4, type: 'Insurance', expiryDate: offsetDateString(12), daysLeft: 12, submitted: false },
  { id: 10, boatId: 5, type: 'Fire safety certificate', expiryDate: offsetDateString(23), daysLeft: 23, submitted: true },
  { id: 11, boatId: 5, type: 'Survey certificate', expiryDate: offsetDateString(81), daysLeft: 81, submitted: false },
];

export const INITIAL_SETTINGS: AppSettings = {
  schedule: {
    60: true,
    30: true,
    14: true,
    7: true,
  },
  channels: {
    push: true,
    email: true,
    sms: false,
  },
};

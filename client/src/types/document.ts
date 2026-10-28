export const DOCUMENT_TYPES = [
  'Registration certificate',
  'Insurance',
  'Survey certificate',
  'Fishing licence',
  'Pollution certificate',
  'Crew licence',
  'Passenger licence',
  'Fire safety certificate',
] as const;

export type DocumentType = typeof DOCUMENT_TYPES[number];

export interface DocumentItem {
  id: number;
  boatId: number;
  type: string;
  expiryDate: string; // ISO date YYYY-MM-DD
  daysLeft: number;
  submitted: boolean;
  fileName?: string | null;
  boat?: {
    id: number;
    name: string;
    reg: string;
    owner: string;
  };
}

export interface CreateDocumentInput {
  boatId: number;
  type: string;
  expiryDate: string;
  file?: File | null;
}

export type DocumentFilterStatus = 'all' | 'yes' | 'no' | 'due' | 'over';
export type DocumentSortOption = 'days' | 'boat' | 'status';

export interface DocumentFilterParams {
  search?: string;
  boatId?: string | number;
  status?: DocumentFilterStatus;
  sort?: DocumentSortOption;
}

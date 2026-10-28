import type { DocumentItem } from './document';

export interface Boat {
  id: number;
  name: string;
  reg: string;
  owner: string;
  kind: string;
  ic: string;
  c: 's' | 'g' | 'l' | 'a' | 'r';
  documentCount?: number;
  submittedCount?: number;
}

export interface BoatDetail extends Boat {
  documents: DocumentItem[];
}

export interface CreateBoatInput {
  name: string;
  reg: string;
  owner: string;
  kind?: string;
  ic?: string;
  c?: 's' | 'g' | 'l' | 'a' | 'r';
}

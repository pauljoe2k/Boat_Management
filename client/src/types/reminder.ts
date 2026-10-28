export interface ReminderItem {
  id: string;
  documentId: number;
  boatName: string;
  documentType: string;
  daysThreshold: number; // 60, 30, 14, 7
  expiryDate: string; // ISO date
  triggerDate: string; // ISO date
  sent: boolean;
}

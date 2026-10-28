import { apiRequest, USE_MOCK_API } from './apiClient';
import { mockAdapter } from './mock/mockAdapter';
import type { ReminderItem } from '../types/reminder';

export const reminderService = {
  async getReminders(): Promise<ReminderItem[]> {
    if (USE_MOCK_API) {
      return mockAdapter.getReminders();
    }
    try {
      return await apiRequest<ReminderItem[]>('/reminders');
    } catch {
      return mockAdapter.getReminders();
    }
  },

  async sendTestPush(): Promise<{ sent: boolean; message: string }> {
    if (USE_MOCK_API) {
      return mockAdapter.sendTestPush();
    }
    try {
      return await apiRequest<{ sent: boolean; message: string }>('/reminders/test-push', {
        method: 'POST',
      });
    } catch {
      return mockAdapter.sendTestPush();
    }
  },
};

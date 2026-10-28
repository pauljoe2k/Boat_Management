import { apiRequest, USE_MOCK_API } from './apiClient';
import { mockAdapter } from './mock/mockAdapter';
import type { AppSettings } from '../types/settings';

export const settingsService = {
  async getSettings(): Promise<AppSettings> {
    if (USE_MOCK_API) {
      return mockAdapter.getSettings();
    }
    try {
      return await apiRequest<AppSettings>('/settings');
    } catch {
      return mockAdapter.getSettings();
    }
  },

  async updateSettings(settings: AppSettings): Promise<AppSettings> {
    if (USE_MOCK_API) {
      return mockAdapter.updateSettings(settings);
    }
    try {
      return await apiRequest<AppSettings>('/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
    } catch {
      return mockAdapter.updateSettings(settings);
    }
  },
};

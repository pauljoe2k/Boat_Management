import { apiRequest, setSessionToken, getSessionToken, USE_MOCK_API } from './apiClient';
import { mockAdapter } from './mock/mockAdapter';
import type { SendOtpResponse, VerifyOtpResponse, User } from '../types/auth';

export const authService = {
  async sendOtp(phone: string): Promise<SendOtpResponse> {
    if (USE_MOCK_API) {
      return mockAdapter.sendOtp(phone);
    }
    try {
      return await apiRequest<SendOtpResponse>('/auth/otp/send', {
        method: 'POST',
        body: JSON.stringify({ phone }),
      });
    } catch {
      return mockAdapter.sendOtp(phone);
    }
  },

  async verifyOtp(phone: string, code: string): Promise<VerifyOtpResponse> {
    if (USE_MOCK_API) {
      const res = await mockAdapter.verifyOtp(phone, code);
      setSessionToken(res.token);
      return res;
    }
    try {
      const res = await apiRequest<VerifyOtpResponse>('/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({ phone, code }),
      });
      setSessionToken(res.token);
      return res;
    } catch {
      const res = await mockAdapter.verifyOtp(phone, code);
      setSessionToken(res.token);
      return res;
    }
  },

  async getCurrentUser(): Promise<User | null> {
    if (USE_MOCK_API) {
      return mockAdapter.getCurrentUser();
    }
    const token = getSessionToken();
    if (!token) {
      return null;
    }
    try {
      return await apiRequest<User>('/auth/me');
    } catch {
      setSessionToken(null);
      return null;
    }
  },

  async logout(): Promise<void> {
    setSessionToken(null);
    await mockAdapter.logout();
    try {
      await apiRequest<void>('/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
  },
};

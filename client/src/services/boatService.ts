import { apiRequest, USE_MOCK_API } from './apiClient';
import { mockAdapter } from './mock/mockAdapter';
import type { Boat, BoatDetail, CreateBoatInput } from '../types/boat';

export const boatService = {
  async getBoats(): Promise<Boat[]> {
    if (USE_MOCK_API) {
      return mockAdapter.getBoats();
    }
    try {
      return await apiRequest<Boat[]>('/boats');
    } catch {
      return mockAdapter.getBoats();
    }
  },

  async getBoatById(id: number): Promise<BoatDetail> {
    if (USE_MOCK_API) {
      return mockAdapter.getBoatById(id);
    }
    try {
      return await apiRequest<BoatDetail>(`/boats/${id}`);
    } catch {
      return mockAdapter.getBoatById(id);
    }
  },

  async createBoat(input: CreateBoatInput): Promise<Boat> {
    if (USE_MOCK_API) {
      return mockAdapter.createBoat(input);
    }
    try {
      return await apiRequest<Boat>('/boats', {
        method: 'POST',
        body: JSON.stringify(input),
      });
    } catch {
      return mockAdapter.createBoat(input);
    }
  },
};

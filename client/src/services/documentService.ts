import { apiRequest, USE_MOCK_API } from './apiClient';
import { mockAdapter } from './mock/mockAdapter';
import type { CreateDocumentInput, DocumentFilterParams, DocumentItem } from '../types/document';

export const documentService = {
  async getDocuments(params?: DocumentFilterParams): Promise<DocumentItem[]> {
    if (USE_MOCK_API) {
      return mockAdapter.getDocuments(params);
    }
    try {
      return await apiRequest<DocumentItem[]>('/documents', {
        params: {
          search: params?.search,
          boatId: params?.boatId === 'all' ? undefined : params?.boatId,
          status: params?.status === 'all' ? undefined : params?.status,
          sort: params?.sort,
        },
      });
    } catch {
      return mockAdapter.getDocuments(params);
    }
  },

  async createDocument(input: CreateDocumentInput): Promise<DocumentItem> {
    if (USE_MOCK_API) {
      return mockAdapter.createDocument(input);
    }
    try {
      if (input.file) {
        const formData = new FormData();
        formData.append('boatId', String(input.boatId));
        formData.append('type', input.type);
        formData.append('expiryDate', input.expiryDate);
        formData.append('file', input.file);

        return await apiRequest<DocumentItem>('/documents', {
          method: 'POST',
          body: formData,
        });
      }

      return await apiRequest<DocumentItem>('/documents', {
        method: 'POST',
        body: JSON.stringify({
          boatId: input.boatId,
          type: input.type,
          expiryDate: input.expiryDate,
        }),
      });
    } catch {
      return mockAdapter.createDocument(input);
    }
  },

  async updateDocumentStatus(id: number, submitted: boolean): Promise<DocumentItem> {
    if (USE_MOCK_API) {
      return mockAdapter.updateDocumentStatus(id, submitted);
    }
    try {
      return await apiRequest<DocumentItem>(`/documents/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ submitted }),
      });
    } catch {
      return mockAdapter.updateDocumentStatus(id, submitted);
    }
  },

  async exportCsv(): Promise<string> {
    if (USE_MOCK_API) {
      return mockAdapter.exportCsv();
    }
    try {
      return await apiRequest<string>('/documents/export-csv');
    } catch {
      return mockAdapter.exportCsv();
    }
  },
};

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentService } from '../services/documentService';
import type { CreateDocumentInput, DocumentFilterParams, DocumentItem } from '../types/document';

export const useDocuments = (params?: DocumentFilterParams) => {
  return useQuery<DocumentItem[]>({
    queryKey: ['documents', params],
    queryFn: () => documentService.getDocuments(params),
  });
};

export const useCreateDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateDocumentInput) => documentService.createDocument(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['boats'] });
      queryClient.invalidateQueries({ queryKey: ['boat'] });
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });
};

export const useUpdateDocumentStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, submitted }: { id: number; submitted: boolean }) =>
      documentService.updateDocumentStatus(id, submitted),
    onMutate: async ({ id, submitted }) => {
      // Cancel outgoing refetches so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey: ['documents'] });

      // Snapshot previous documents
      const previousDocuments = queryClient.getQueriesData<DocumentItem[]>({ queryKey: ['documents'] });

      // Optimistically update every documents query in cache
      queryClient.setQueriesData<DocumentItem[]>({ queryKey: ['documents'] }, (old) => {
        if (!old) return [];
        return old.map((d) => (d.id === id ? { ...d, submitted } : d));
      });

      return { previousDocuments };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousDocuments) {
        context.previousDocuments.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['boats'] });
      queryClient.invalidateQueries({ queryKey: ['boat'] });
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });
};

export const useExportCsv = () => {
  return useMutation({
    mutationFn: () => documentService.exportCsv(),
    onSuccess: (csvContent) => {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `harbour-desk-documents-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
  });
};

import React, { useState, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useBoats } from '../hooks/useBoats';
import { useCreateDocument } from '../hooks/useDocuments';
import { useToast } from '../context/ToastContext';
import { Header } from '../components/layout/Header';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { DOCUMENT_TYPES } from '../types/document';
import { formatDate } from '../components/documents/DocumentRow';
import type { Boat } from '../types/boat';

const documentSchema = z.object({
  boatId: z.coerce.number().min(1, 'Please select a boat'),
  type: z.string().min(1, 'Please select a document type'),
  expiryDate: z.string().min(1, 'Please choose an expiry date'),
});

type DocumentFormData = z.infer<typeof documentSchema>;

const getDefaultExpiry = () => {
  const d = new Date();
  d.setDate(d.getDate() + 60);
  return d.toISOString().slice(0, 10);
};

export const AddDocumentPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const preselectedBoatId = searchParams.get('boatId');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const navigate = useNavigate();
  const { showToast } = useToast();
  const { data: boats = [] } = useBoats();
  const { mutateAsync: createDoc, isPending: isSubmitting } = useCreateDocument();

  const defaultBoatId = useMemo(() => {
    if (preselectedBoatId) return Number(preselectedBoatId);
    return boats.length > 0 ? boats[0].id : 1;
  }, [preselectedBoatId, boats]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<DocumentFormData>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      boatId: defaultBoatId,
      type: DOCUMENT_TYPES[0],
      expiryDate: getDefaultExpiry(),
    },
  });

  const watchedExpiry = watch('expiryDate');

  // Compute live preview reminder text matching prototype
  const reminderPreviewText = useMemo(() => {
    if (!watchedExpiry) return '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(watchedExpiry + 'T00:00:00');
    const offset = Math.round((exp.getTime() - today.getTime()) / 86400000);

    if (isNaN(offset)) return '';
    if (offset <= 60) {
      return `Expires in ${offset} days: first reminder goes out immediately.`;
    }
    const firstReminderDate = new Date(today.getTime() + (offset - 60) * 86400000);
    return `First reminder on ${formatDate(firstReminderDate.toISOString().slice(0, 10))}.`;
  }, [watchedExpiry]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const onSubmit = async (data: DocumentFormData) => {
    try {
      await createDoc({
        boatId: data.boatId,
        type: data.type,
        expiryDate: data.expiryDate,
        file: selectedFile,
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const exp = new Date(data.expiryDate + 'T00:00:00');
      const offset = Math.round((exp.getTime() - today.getTime()) / 86400000);

      if (offset <= 60) {
        showToast('Saved. Reminder sent now, as expiry is within 60 days');
      } else {
        const firstDate = new Date(today.getTime() + (offset - 60) * 86400000);
        showToast(`Saved. First reminder on ${formatDate(firstDate.toISOString().slice(0, 10))}`);
      }

      navigate('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save document';
      showToast(msg);
    }
  };

  return (
    <div>
      <Header
        title="Add document"
        subtitle="Reminders are created automatically from the expiry date"
      />

      <Card
        className="form"
        style={{
          maxWidth: '520px',
          padding: '24px',
          display: 'grid',
          gap: '16px',
        }}
      >
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'grid', gap: '16px' }}>
          {/* Boat Selection */}
          <label>
            Boat
            <select {...register('boatId')} defaultValue={defaultBoatId}>
              {boats.map((b: Boat) => (
                <option key={b.id} value={b.id}>
                  {b.name} · {b.reg}
                </option>
              ))}
            </select>
            {errors.boatId && <span className="field-error">{errors.boatId.message}</span>}
          </label>

          {/* Document Type Selection */}
          <label>
            Document type
            <select {...register('type')}>
              {DOCUMENT_TYPES.map((t: string) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            {errors.type && <span className="field-error">{errors.type.message}</span>}
          </label>

          {/* Expiry Date */}
          <label>
            Expiry date
            <input
              type="date"
              {...register('expiryDate')}
              aria-label="Document expiry date"
            />
            {errors.expiryDate && <span className="field-error">{errors.expiryDate.message}</span>}
          </label>

          {/* File Attachment Dropzone */}
          <div>
            <div
              className={`drop ${selectedFile ? 'active' : ''}`.trim()}
              tabIndex={0}
              role="button"
              aria-label="Upload document attachment"
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
            >
              {selectedFile ? (
                <span>📎 {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
              ) : (
                <span>📎 Tap to attach photo or PDF</span>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>

          {/* Dynamic Reminder Live Preview Helper */}
          {reminderPreviewText && (
            <div
              className="mu"
              style={{
                background: 'var(--bg)',
                padding: '10px 14px',
                borderRadius: '10px',
                fontSize: '12px',
                lineHeight: 1.4,
              }}
            >
              {reminderPreviewText}
            </div>
          )}

          <Button type="submit" isLoading={isSubmitting} style={{ padding: '12px' }}>
            Save document
          </Button>
        </form>
      </Card>
    </div>
  );
};

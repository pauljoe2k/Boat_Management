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

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

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
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
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

  // Compute live preview reminder text matching prototype and explicitly label as local calculation
  const reminderPreviewInfo = useMemo(() => {
    if (!watchedExpiry) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(watchedExpiry + 'T00:00:00');
    const offset = Math.round((exp.getTime() - today.getTime()) / 86400000);

    if (isNaN(offset)) return null;

    if (offset < 0) {
      return {
        isImmediate: true,
        text: `This document is already ${Math.abs(offset)} days overdue. Immediate escalation will be dispatched.`,
      };
    }
    if (offset <= 60) {
      return {
        isImmediate: true,
        text: `Expires in ${offset} days: first reminder goes out immediately, followed by 30, 14, and 7 day alerts.`,
      };
    }
    const firstReminderDate = new Date(today.getTime() + (offset - 60) * 86400000);
    return {
      isImmediate: false,
      text: `First reminder on ${formatDate(firstReminderDate.toISOString().slice(0, 10))} (60 days prior to expiry). Subsequent reminders at 30, 14, and 7 days.`,
    };
  }, [watchedExpiry]);

  const validateAndSetFile = (file: File) => {
    setFileError(null);
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setFileError('Supported formats: PDF, JPG, PNG or WEBP');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setFileError('File size exceeds the 10 MB limit');
      return;
    }
    setSelectedFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
        showToast('Saved. Reminder scheduled now as expiry is within 60 days');
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

          {/* Attachment Drag-and-Drop Dropzone */}
          <div>
            <div
              className={`drop ${selectedFile ? 'active' : ''} ${isDragOver ? 'drag-over' : ''}`.trim()}
              tabIndex={0}
              role="button"
              aria-label="Upload document attachment (photo or PDF)"
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              style={{
                position: 'relative',
                borderWidth: isDragOver ? '2px' : undefined,
                borderStyle: 'dashed',
              }}
            >
              {selectedFile ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span>📎 {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    title="Remove attachment"
                    style={{
                      background: 'var(--r)',
                      color: 'var(--rt)',
                      border: 0,
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      fontSize: '11px',
                      fontWeight: 700,
                      display: 'inline-grid',
                      placeItems: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <span>📎 Drag & drop photo or PDF, or tap to browse</span>
              )}
            </div>
            {fileError && <span className="field-error" style={{ display: 'block', marginTop: '6px' }}>{fileError}</span>}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>

          {/* Dynamic Expected Reminder Timing (Labeled Preview) */}
          {reminderPreviewInfo && (
            <div
              className="mu"
              style={{
                background: 'var(--bg)',
                padding: '12px 14px',
                borderRadius: '12px',
                fontSize: '12px',
                lineHeight: 1.5,
                borderLeft: `4px solid ${reminderPreviewInfo.isImmediate ? 'var(--at)' : 'var(--pt)'}`,
              }}
            >
              <div style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: '2px' }}>
                Expected reminder timing (Calculated preview)
              </div>
              <div>{reminderPreviewInfo.text}</div>
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

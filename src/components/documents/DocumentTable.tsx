import React from 'react';
import type { DocumentItem } from '../../types/document';
import { DocumentRow } from './DocumentRow';
import { Card } from '../common/Card';
import { Button } from '../common/Button';

export interface DocumentTableProps {
  documents: DocumentItem[];
  onToggleStatus: (id: number, currentSubmitted: boolean) => void;
  onClearFilters?: () => void;
  updatingDocId?: number | null;
  emptyMessage?: string;
  showClearButton?: boolean;
}

export const DocumentTable: React.FC<DocumentTableProps> = ({
  documents,
  onToggleStatus,
  onClearFilters,
  updatingDocId,
  emptyMessage = 'No documents match these filters.',
  showClearButton = true,
}) => {
  return (
    <Card>
      {/* Table Header */}
      <div
        className="row h"
        style={{
          display: 'grid',
          gridTemplateColumns: '2.2fr 1.1fr 1.1fr 1.4fr 1.2fr',
          gap: '10px',
          alignItems: 'center',
          padding: '13px 20px',
          borderBottom: '1px solid var(--ln)',
          fontSize: '12px',
          color: 'var(--mu)',
          fontWeight: 600,
          userSelect: 'none',
        }}
      >
        <div>Document · Boat</div>
        <div>Expiry date</div>
        <div>Days to go</div>
        <div>Status</div>
        <div style={{ textAlign: 'right' }}>Action</div>
      </div>

      {/* Rows or Empty State */}
      {documents.length > 0 ? (
        documents.map((doc) => (
          <DocumentRow
            key={doc.id}
            document={doc}
            onToggleStatus={onToggleStatus}
            isUpdating={updatingDocId === doc.id}
          />
        ))
      ) : (
        <div className="empty">
          <p>{emptyMessage}</p>
          {showClearButton && onClearFilters && (
            <Button size="sm" onClick={onClearFilters} style={{ marginTop: '12px' }}>
              Clear filters
            </Button>
          )}
        </div>
      )}
    </Card>
  );
};

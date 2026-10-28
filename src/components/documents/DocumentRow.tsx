import React from 'react';
import type { DocumentItem } from '../../types/document';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';

export interface DocumentRowProps {
  document: DocumentItem;
  onToggleStatus: (id: number, currentSubmitted: boolean) => void;
  isUpdating?: boolean;
}

export const formatDate = (isoDate: string): string => {
  try {
    const d = new Date(isoDate + 'T00:00:00');
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return isoDate;
  }
};

export const getDaysText = (daysLeft: number): string => {
  if (daysLeft < 0) return `${Math.abs(daysLeft)} days overdue`;
  if (daysLeft === 0) return 'Expires today';
  return `${daysLeft} days left`;
};

export const DocumentRow: React.FC<DocumentRowProps> = ({
  document: doc,
  onToggleStatus,
  isUpdating = false,
}) => {
  const isOverdue = doc.daysLeft < 0 && !doc.submitted;
  const isExpiringSoon = !doc.submitted && doc.daysLeft >= 0 && doc.daysLeft <= 60;

  const daysClass = isOverdue ? 'late' : isExpiringSoon ? 'soon' : '';

  return (
    <div
      className="row"
      style={{
        display: 'grid',
        gridTemplateColumns: '2.2fr 1.1fr 1.1fr 1.4fr 1.2fr',
        gap: '10px',
        alignItems: 'center',
        padding: '13px 20px',
        borderBottom: '1px solid var(--ln)',
      }}
    >
      {/* Document title & Boat Name / Reg */}
      <div>
        <b style={{ fontSize: '14px' }}>{doc.type}</b>
        <br />
        <small className="mu">
          {doc.boat?.name ?? 'Vessel'} · {doc.boat?.reg ?? ''}
        </small>
      </div>

      {/* Expiry Date */}
      <div className="x" style={{ fontSize: '13px' }}>
        {formatDate(doc.expiryDate)}
      </div>

      {/* Days to go */}
      <div className={`x ${daysClass}`} style={{ fontSize: '13px' }}>
        {getDaysText(doc.daysLeft)}
      </div>

      {/* Status Pill */}
      <div className="x">
        <Badge
          variant={doc.submitted ? 'green' : 'red'}
          label={doc.submitted ? 'Submitted' : 'Not submitted'}
        />
      </div>

      {/* Action button */}
      <div className="act x" style={{ textAlign: 'right' }}>
        <Button
          size="sm"
          variant={doc.submitted ? 'outline' : 'primary'}
          onClick={() => onToggleStatus(doc.id, doc.submitted)}
          isLoading={isUpdating}
          aria-label={doc.submitted ? `Mark ${doc.type} as not submitted` : `Mark ${doc.type} as submitted`}
        >
          {doc.submitted ? 'Undo' : 'Mark submitted'}
        </Button>
      </div>
    </div>
  );
};

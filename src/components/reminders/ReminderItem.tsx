import React from 'react';
import type { ReminderItem as ReminderItemType } from '../../types/reminder';
import { formatDate } from '../documents/DocumentRow';

export interface ReminderItemProps {
  reminder: ReminderItemType;
}

export const ReminderItem: React.FC<ReminderItemProps> = ({ reminder }) => {
  const isSent = reminder.sent;

  return (
    <div
      className="tl"
      style={{
        display: 'flex',
        gap: '14px',
        alignItems: 'center',
        padding: '14px 20px',
        borderBottom: '1px solid var(--ln)',
      }}
    >
      {/* Day badge (e.g. 60d, 30d, 14d, 7d) */}
      <div
        className="tg"
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '14px',
          display: 'grid',
          placeItems: 'center',
          fontWeight: 700,
          fontSize: '15px',
          flex: 'none',
          background: isSent ? 'var(--g)' : 'var(--a)',
          color: isSent ? 'var(--gt)' : 'var(--at)',
        }}
      >
        {reminder.daysThreshold}d
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <b style={{ fontSize: '14px' }}>{reminder.documentType}</b>
        <br />
        <small className="mu">
          {reminder.boatName} · expires {formatDate(reminder.expiryDate)}
        </small>
      </div>

      {/* Status & Trigger Date */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <span
          className="pill"
          style={{
            background: isSent ? 'var(--g)' : 'var(--a)',
            color: isSent ? 'var(--gt)' : 'var(--at)',
            fontSize: '11px',
            padding: '3px 10px',
            borderRadius: '99px',
            fontWeight: 700,
          }}
        >
          {isSent ? 'Sent' : 'Scheduled'}
        </span>
        <br />
        <small className="mu">{formatDate(reminder.triggerDate)}</small>
      </div>
    </div>
  );
};

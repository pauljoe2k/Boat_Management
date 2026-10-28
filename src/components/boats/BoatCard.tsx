import React from 'react';
import type { Boat } from '../../types/boat';
import { Card } from '../common/Card';
import { ProgressBar } from '../common/ProgressBar';

export interface BoatCardProps {
  boat: Boat;
  onClick: () => void;
}

export const BoatCard: React.FC<BoatCardProps> = ({ boat, onClick }) => {
  const docCount = boat.documentCount ?? 0;
  const subCount = boat.submittedCount ?? 0;
  const percentage = docCount > 0 ? Math.round((subCount / docCount) * 100) : 0;

  return (
    <Card
      tabIndex={0}
      role="button"
      aria-label={`View details for ${boat.name}`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      style={{
        padding: '18px',
        cursor: 'pointer',
        transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
        userSelect: 'none',
      }}
      className="bc"
    >
      <div
        className="ic"
        style={{
          width: '42px',
          height: '42px',
          borderRadius: '14px',
          display: 'grid',
          placeItems: 'center',
          fontSize: '20px',
          marginBottom: '10px',
          background: `var(--${boat.c})`,
        }}
      >
        {boat.ic}
      </div>

      <h2>{boat.name}</h2>
      <small className="mu">
        {boat.reg} · {boat.kind}
      </small>

      <ProgressBar value={percentage} />

      <small className="mu">
        {subCount} of {docCount} documents submitted · {boat.owner}
      </small>
    </Card>
  );
};

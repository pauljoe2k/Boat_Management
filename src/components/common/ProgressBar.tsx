import React from 'react';

export interface ProgressBarProps {
  value: number; // 0 - 100
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ value, className = '' }) => {
  const percentage = Math.max(0, Math.min(100, isNaN(value) ? 0 : value));

  return (
    <div
      role="progressbar"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`prog ${className}`.trim()}
      style={{
        height: '8px',
        borderRadius: '9px',
        background: 'var(--r)',
        overflow: 'hidden',
        margin: '10px 0 6px',
      }}
    >
      <span
        style={{
          display: 'block',
          height: '100%',
          width: `${percentage}%`,
          background: 'var(--gd)',
          transition: 'width 0.3s ease',
        }}
      />
    </div>
  );
};

import React from 'react';

export interface StatCardProps {
  variant: 's1' | 's2' | 's3' | 's4';
  count: number;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  variant,
  count,
  label,
  isActive = false,
  onClick,
}) => {
  const variantClass = `st ${variant}`;

  return (
    <button
      type="button"
      className={variantClass}
      onClick={onClick}
      style={{
        border: 0,
        textAlign: 'left',
        cursor: onClick ? 'pointer' : 'default',
        borderRadius: '18px',
        padding: '16px 18px',
        transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
        outline: isActive ? '2px solid var(--ink)' : undefined,
        outlineOffset: '2px',
      }}
    >
      <b style={{ display: 'block', fontSize: '30px', lineHeight: 1.2 }}>{count}</b>
      <span style={{ fontSize: '13px' }}>{label}</span>
    </button>
  );
};

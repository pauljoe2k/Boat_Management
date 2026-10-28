import React from 'react';

export interface BadgeProps {
  variant: 'green' | 'red' | 'amber';
  label: string;
  showDot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant,
  label,
  showDot = true,
  className = '',
}) => {
  const variantClass = variant === 'green' ? 'g' : variant === 'red' ? 'r' : 'a';

  return (
    <span className={`pill ${variantClass} ${className}`.trim()}>
      {showDot && (
        <span
          className={`lt ${variantClass}`}
          aria-hidden="true"
        />
      )}
      <span>{label}</span>
    </span>
  );
};

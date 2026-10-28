import React from 'react';

export interface HeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, actions }) => {
  return (
    <div className="top">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="mu">{subtitle}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>{actions}</div>}
    </div>
  );
};

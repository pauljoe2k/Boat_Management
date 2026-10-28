import React from 'react';
import { NavLink } from 'react-router-dom';
import { useDocuments } from '../../hooks/useDocuments';

interface NavItem {
  to: string;
  icon: string;
  label: string;
  key: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', icon: '▦', label: 'Dashboard', key: 'dash' },
  { to: '/boats', icon: '⛵', label: 'Boats', key: 'boats' },
  { to: '/add', icon: '＋', label: 'Add', key: 'add' },
  { to: '/reminders', icon: '🔔', label: 'Reminders', key: 'rem' },
  { to: '/settings', icon: '⚙', label: 'Settings', key: 'set' },
];

export const BottomNav: React.FC = () => {
  const { data: documents = [] } = useDocuments();
  const overdueCount = documents.filter((d) => !d.submitted && d.daysLeft < 0).length;

  return (
    <nav
      className="tabs"
      aria-label="Mobile navigation"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'var(--sf)',
        borderTop: '1px solid var(--ln)',
        padding: '6px 6px calc(6px + env(safe-area-inset-bottom, 0px))',
        zIndex: 40,
        justifyContent: 'space-around',
      }}
    >
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.key}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) => `nav ${isActive ? 'on' : ''}`.trim()}
          style={({ isActive }) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2px',
            padding: '6px 10px',
            borderRadius: '10px',
            fontSize: '11px',
            fontWeight: 600,
            color: isActive ? 'var(--pt)' : 'var(--mu)',
            background: isActive ? 'var(--pri)' : 'transparent',
            textDecoration: 'none',
            position: 'relative',
          })}
        >
          <span style={{ fontSize: '18px', lineHeight: 1 }}>{item.icon}</span>
          <span>{item.label}</span>
          {item.key === 'rem' && overdueCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '2px',
                right: '4px',
                background: 'var(--r)',
                color: 'var(--rt)',
                borderRadius: '99px',
                fontSize: '10px',
                fontWeight: 700,
                padding: '0 5px',
                lineHeight: '14px',
              }}
            >
              {overdueCount}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );
};

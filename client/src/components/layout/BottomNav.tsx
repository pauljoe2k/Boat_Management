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
        width: '100%',
        background: 'var(--sf)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid var(--ln)',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.06)',
        padding: '6px 8px calc(6px + env(safe-area-inset-bottom, 0px))',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-around',
          width: '100%',
          maxWidth: '560px',
          margin: '0 auto',
          gap: '6px',
        }}
      >
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.key}
            to={item.to}
            end={item.to === '/'}
            style={({ isActive }) => ({
              flex: '1 1 0px',
              minWidth: 0,
              maxWidth: '96px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              padding: '6px 4px',
              borderRadius: '12px',
              color: isActive ? 'var(--pt)' : 'var(--mu)',
              background: isActive ? 'var(--pri)' : 'transparent',
              fontWeight: isActive ? 700 : 600,
              textDecoration: 'none',
              position: 'relative',
              transition:
                'background var(--transition-fast), color var(--transition-fast), transform var(--transition-fast)',
              transform: isActive ? 'translateY(-1px)' : 'none',
              boxShadow: isActive ? '0 2px 8px rgba(43, 63, 122, 0.12)' : 'none',
            })}
          >
            <span
              style={{
                fontSize: '18px',
                lineHeight: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '22px',
              }}
            >
              {item.icon}
            </span>
            <span
              style={{
                fontSize: '11px',
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '100%',
              }}
            >
              {item.label}
            </span>
            {item.key === 'rem' && overdueCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '3px',
                  right: 'calc(50% - 16px)',
                  background: 'var(--r)',
                  color: 'var(--rt)',
                  borderRadius: '99px',
                  fontSize: '10px',
                  fontWeight: 700,
                  minWidth: '16px',
                  height: '16px',
                  padding: '0 4px',
                  lineHeight: '16px',
                  textAlign: 'center',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                }}
              >
                {overdueCount}
              </span>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

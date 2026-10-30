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
        height: '46px',
        background: 'var(--nav-bg)',
        backdropFilter: 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        borderTop: '1px solid var(--nav-border)',
        boxShadow: '0 -2px 12px rgba(0, 0, 0, 0.05)',
        padding: '2px 8px calc(2px + env(safe-area-inset-bottom, 0px))',
        zIndex: 50,
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
          maxWidth: '520px',
          margin: '0 auto',
          gap: '4px',
          height: '100%',
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
              maxWidth: '88px',
              height: '38px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1px',
              padding: '2px 4px',
              borderRadius: '10px',
              color: isActive ? 'var(--pt)' : 'var(--mu)',
              background: isActive ? 'var(--pri)' : 'transparent',
              fontWeight: isActive ? 700 : 600,
              textDecoration: 'none',
              position: 'relative',
              transition:
                'background var(--transition-fast), color var(--transition-fast), transform var(--transition-fast)',
              transform: isActive ? 'translateY(-1px)' : 'none',
              boxShadow: isActive ? '0 1px 6px rgba(43, 63, 122, 0.14)' : 'none',
            })}
          >
            <span
              style={{
                fontSize: '15px',
                lineHeight: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '16px',
              }}
            >
              {item.icon}
            </span>
            <span
              style={{
                fontSize: '10px',
                lineHeight: 1.1,
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
                  top: '1px',
                  right: 'calc(50% - 14px)',
                  background: 'var(--r)',
                  color: 'var(--rt)',
                  borderRadius: '99px',
                  fontSize: '9px',
                  fontWeight: 700,
                  minWidth: '14px',
                  height: '14px',
                  padding: '0 3px',
                  lineHeight: '14px',
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

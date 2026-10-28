import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const { data: documents = [] } = useDocuments();

  const overdueCount = documents.filter((d) => !d.submitted && d.daysLeft < 0).length;

  return (
    <aside
      className="side"
      style={{
        width: '236px',
        background: 'var(--sf)',
        borderRight: '1px solid var(--ln)',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        position: 'sticky',
        top: 0,
        height: '100vh',
        flexShrink: 0,
      }}
    >
      <div
        className="logo"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: 700,
          fontSize: '18px',
          margin: '0 6px 22px',
        }}
      >
        <i
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '11px',
            background: 'linear-gradient(135deg, #b9c9fb, #e6ddf8)',
            display: 'grid',
            placeItems: 'center',
            fontStyle: 'normal',
            boxShadow: '0 2px 8px rgba(60, 80, 130, 0.1)',
          }}
        >
          ⚓
        </i>
        Harbour Desk
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.key}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `nav ${isActive ? 'on' : ''}`.trim()}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '11px 14px',
              borderRadius: '12px',
              color: isActive ? 'var(--pt)' : 'var(--mu)',
              background: isActive ? 'var(--pri)' : 'transparent',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'background var(--transition-fast), color var(--transition-fast)',
            })}
          >
            <span style={{ fontSize: '16px' }}>{item.icon}</span>
            <span>{item.label}</span>
            {item.key === 'rem' && overdueCount > 0 && (
              <b
                style={{
                  marginLeft: 'auto',
                  background: 'var(--r)',
                  color: 'var(--rt)',
                  borderRadius: '99px',
                  fontSize: '11px',
                  padding: '1px 8px',
                }}
              >
                {overdueCount}
              </b>
            )}
          </NavLink>
        ))}
      </nav>

      {user && (
        <div
          className="user"
          style={{
            marginTop: 'auto',
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
            padding: '10px',
            borderRadius: '14px',
            background: 'var(--bg)',
          }}
        >
          <div
            className="av"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: 'var(--l)',
              color: 'var(--lt)',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 700,
              fontSize: '13px',
              flexShrink: 0,
            }}
          >
            {user.initials || 'RN'}
          </div>
          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <b
              style={{
                display: 'block',
                fontSize: '13px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {user.name}
            </b>
            <small className="mu">{user.role}</small>
          </div>
          <button
            type="button"
            className="btn o sm"
            onClick={logout}
            aria-label="Exit session"
            title="Exit session"
          >
            Exit
          </button>
        </div>
      )}
    </aside>
  );
};

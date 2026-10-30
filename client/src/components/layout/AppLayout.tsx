import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div id="app" style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Mobile top bar for viewing identity and exit action when sidebar is hidden */}
        <header
          className="mobile-top-bar"
          style={{
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 16px',
            background: 'var(--nav-bg)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderBottom: '1px solid var(--nav-border)',
            position: 'sticky',
            top: 0,
            zIndex: 35,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '15px' }}>
            <span
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #b9c9fb, #e6ddf8)',
                display: 'grid',
                placeItems: 'center',
                fontSize: '14px',
              }}
            >
              ⚓
            </span>
            Harbour Desk
          </div>
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: 'var(--l)',
                  color: 'var(--lt)',
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 700,
                  fontSize: '11px',
                }}
              >
                {user.initials || 'RN'}
              </div>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  maxWidth: '120px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user.name}
              </span>
              <button
                type="button"
                className="btn o sm"
                onClick={logout}
                style={{ padding: '3px 9px', fontSize: '11px', borderRadius: '8px', height: '26px' }}
                aria-label="Exit session"
                title="Exit session"
              >
                Exit
              </button>
            </div>
          )}
        </header>

        <main
          style={{
            flex: 1,
            padding: '24px 32px 50px',
            maxWidth: '1100px',
            minWidth: 0,
          }}
        >
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
};

import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';

export const AppLayout: React.FC = () => {
  return (
    <div id="app" style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      <Sidebar />
      <main
        style={{
          flex: 1,
          padding: '30px 36px 60px',
          maxWidth: '1100px',
          minWidth: 0,
        }}
      >
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
};

import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useMode } from '../../contexts/ModeContext';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import BottomNav from './BottomNav';

export default function AppShell() {
  const { modeConfig } = useMode();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const showSidebar = modeConfig.ui?.showSidebar !== false;

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* Desktop sidebar */}
      {showSidebar && (
        <div className="hidden lg:flex flex-shrink-0">
          <Sidebar />
        </div>
      )}

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </>
      )}

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

        <main
          className="flex-1 overflow-y-auto pb-20 lg:pb-4 px-4 py-4 sm:px-6 sm:py-6"
          style={{ color: 'var(--text-primary)' }}
        >
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        <BottomNav />
      </div>
    </div>
  );
}

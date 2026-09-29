import React from 'react';
import { CONFIG } from '../config';

export default function AdminNavbar({ 
  activeTab, 
  onOpenGameModal, 
  onOpenUserModal,
  onToggleSidebar, 
  livePlayerCount = 0, 
  adminUser, 
  onLogout,
  dbStatus,
  theme = 'light',
  onToggleTheme
}) {
  const titles = {
    dashboard: 'Overview Dashboard',
    games: 'Games Catalog',
    users: 'Users & Players',
    categories: 'Categories',
    submissions: 'Dev Submissions',
    messages: 'Support Inbox',
    blog: 'Blog & Content'
  };

  return (
    <header className="admin-header">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="header-left">
        {onToggleSidebar && (
          <button
            className="admin-menu-toggle-btn"
            onClick={onToggleSidebar}
            title="Toggle Sidebar Menu"
            aria-label="Toggle Sidebar Menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        )}

        <div className="navbar-breadcrumbs">
          <span className="breadcrumb-root">
            <span>NextGenn</span>
          </span>
          <span className="breadcrumb-sep">›</span>
          <span className="breadcrumb-active">{titles[activeTab] || 'Dashboard'}</span>
        </div>
      </div>

      {/* Right: Actions, Theme Toggle & Live Portal */}
      <div className="header-right">
        {/* Real-time Server / DB Status Indicator */}
        <div
          className={`server-status-pill ${dbStatus?.connected ? 'online' : 'offline'}`}
          title={
            dbStatus?.connected
              ? 'Backend API & Database Connected'
              : 'Backend Offline • Running in Local Fallback Cache Mode'
          }
        >
          <span className="server-status-dot" />
          <span className="server-status-text">
            {dbStatus?.connected ? 'Server Live' : 'Offline Mode'}
          </span>
        </div>

        {/* Live Players Pill */}
        {livePlayerCount > 0 && (
          <div className="live-players-nav-pill" title={`${livePlayerCount} active players online right now`}>
            <span className="live-player-pulse-dot" />
            <span>{livePlayerCount} Online</span>
          </div>
        )}

        {activeTab === 'games' && onOpenGameModal && (
          <button className="header-btn primary" onClick={() => onOpenGameModal(null)}>
            <span>+ Add Game</span>
          </button>
        )}

        {activeTab === 'users' && onOpenUserModal && (
          <button className="header-btn primary" onClick={() => onOpenUserModal(null)}>
            <span>+ Add User</span>
          </button>
        )}

        {activeTab === 'dashboard' && onOpenGameModal && (
          <button className="header-btn primary" onClick={() => onOpenGameModal(null)}>
            <span>+ Add Game</span>
          </button>
        )}

        {/* Live Portal Link */}
        <a
          href={CONFIG.PORTAL_URL}
          target="_blank"
          rel="noreferrer"
          className="header-portal-btn"
          title="Open Gaming Portal in new tab"
        >
          <span>Portal</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>

        {/* Theme Mode Switcher */}
        {onToggleTheme && (
          <button
            className="theme-toggle-btn"
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        )}
      </div>
    </header>
  );
}

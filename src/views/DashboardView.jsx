import React, { useState, useEffect } from 'react';
import GameSandboxModal from '../components/GameSandboxModal';
import CustomSelect from '../components/CustomSelect';
import { statsApi } from '../services/api';
import { CONFIG } from '../config';

export default function DashboardView({
  games = [],
  users = [],
  categories = [],
  submissions = [],
  messages = [],
  onlineCount: propOnlineCount,
  activeGameCounts = {},
  onNavigateTab,
  onEditGame,
  onOpenAddGame,
  adminUser,
  onRefresh
}) {
  const [onlineCount, setOnlineCount] = useState(propOnlineCount ?? 0);
  const [activePlayGame, setActivePlayGame] = useState(null);
  const [tableSearch, setTableSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    if (typeof propOnlineCount === 'number') {
      setOnlineCount(propOnlineCount);
    }
  }, [propOnlineCount]);

  useEffect(() => {
    statsApi.getOnlineCount()
      .then(data => {
        if (typeof data?.count === 'number') setOnlineCount(data.count);
      })
      .catch(() => { });

    const interval = setInterval(() => {
      statsApi.getOnlineCount()
        .then(data => {
          if (typeof data?.count === 'number') setOnlineCount(data.count);
        })
        .catch(() => { });
    }, 15000);

    return () => clearInterval(interval);
  }, []);


  const totalPlays = games.reduce((acc, g) => acc + ((g && g.plays) || 0), 0);
  const activeGamesCount = games.filter(g => g && ((g.status || 'active') === 'active')).length;
  const pendingSubmissions = submissions.filter(s => s && s.status === 'pending');
  const unreadMessages = messages.filter(m => m && !m.read);
  const activeGamersCount = users.filter(u => u && (u.role === 'vip' || (u.level && u.level > 1))).length;

  // Filtered games for bottom table
  const filteredGames = games.filter(g => {
    if (!g) return false;
    const matchSearch = (g.title || '').toLowerCase().includes(tableSearch.toLowerCase()) ||
                        (g.category || '').toLowerCase().includes(tableSearch.toLowerCase());
    const matchStatus = statusFilter === 'all' || (g.status || 'active') === statusFilter;
    const matchCat = categoryFilter === 'all' || (g.category || '').toLowerCase() === categoryFilter.toLowerCase();
    return matchSearch && matchStatus && matchCat;
  });

  // Top 5 Games ordered by plays
  const topGames = [...games].filter(Boolean).sort((a, b) => (b.plays || 0) - (a.plays || 0)).slice(0, 5);

  // Recent 3 submissions
  const recentSubmissions = [...submissions].slice(0, 3);

  // Recent 2 messages
  const recentMessages = [...messages].slice(0, 2);

  return (
    <div className="overview-container">

      {/* ====================================================================
          2. Refined 4-Card Top Stat Row (Dynamic Telemetry)
          ==================================================================== */}
      <div className="stats-grid-techmin">
        {/* Card 1: Total Gameplay Sessions */}
        <div 
          className="stat-card-techmin clickable"
          onClick={() => onNavigateTab && onNavigateTab('games')}
          title="View Games Catalog"
        >
          <div className="stat-top-row">
            <span className="stat-title-text">Gameplay Sessions</span>
            <span className="stat-trend-capsule up">
              <span>↗</span>
              <span>Active</span>
            </span>
          </div>

          <div className="stat-value-big">
            {totalPlays.toLocaleString()}
          </div>

          <div className="stat-bottom-row">
            <div className="stat-meta-text">
              Across {games.length} catalog games
            </div>
            <div className="stat-pastel-box pastel-blue">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="6" y1="12" x2="10" y2="12" />
                <line x1="8" y1="10" x2="8" y2="14" />
                <line x1="15" y1="13" x2="15.01" y2="13" strokeWidth="3" />
                <line x1="18" y1="11" x2="18.01" y2="11" strokeWidth="3" />
                <rect x="2" y="6" width="20" height="12" rx="6" />
              </svg>
            </div>
          </div>
        </div>

        {/* Card 2: Registered Gamers */}
        <div 
          className="stat-card-techmin clickable"
          onClick={() => onNavigateTab && onNavigateTab('users')}
          title="View Users & Players"
        >
          <div className="stat-top-row">
            <span className="stat-title-text">Registered Gamers</span>
            <span className="stat-trend-capsule up">
              <span>👥</span>
              <span>{activeGamersCount} VIP</span>
            </span>
          </div>

          <div className="stat-value-big">
            {users.length.toLocaleString()}
          </div>

          <div className="stat-bottom-row">
            <div className="stat-meta-text">
              Platform player accounts
            </div>
            <div className="stat-pastel-box pastel-purple">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
          </div>
        </div>

        {/* Card 3: Published Games */}
        <div 
          className="stat-card-techmin clickable"
          onClick={() => onNavigateTab && onNavigateTab('games')}
          title="View Games Catalog"
        >
          <div className="stat-top-row">
            <span className="stat-title-text">Published Games</span>
            <span className="stat-trend-capsule up">
              <span>📂</span>
              <span>{categories.length} Categories</span>
            </span>
          </div>

          <div className="stat-value-big">
            {activeGamesCount} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ {games.length}</span>
          </div>

          <div className="stat-bottom-row">
            <div className="stat-meta-text">
              Active in public catalog
            </div>
            <div className="stat-pastel-box pastel-slate">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
              </svg>
            </div>
          </div>
        </div>

        {/* Card 4: Dev Submissions & Inbox */}
        <div 
          className="stat-card-techmin clickable"
          onClick={() => onNavigateTab && onNavigateTab(pendingSubmissions.length > 0 ? 'submissions' : 'messages')}
          title="View Dev Submissions & Inbox"
        >
          <div className="stat-top-row">
            <span className="stat-title-text">Pending Queue</span>
            <span className={`stat-trend-capsule ${pendingSubmissions.length > 0 || unreadMessages.length > 0 ? 'down' : 'up'}`}>
              <span>{pendingSubmissions.length > 0 ? '⚠️' : '✓'}</span>
              <span>{pendingSubmissions.length > 0 ? `${pendingSubmissions.length} To Review` : 'All Clear'}</span>
            </span>
          </div>

          <div className="stat-value-big">
            {pendingSubmissions.length}
          </div>

          <div className="stat-bottom-row">
            <div className="stat-meta-text">
              {unreadMessages.length} unread support messages
            </div>
            <div className="stat-pastel-box pastel-rose">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
                <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
                <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
                <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          3. Techmin Middle Row: Top Performing Games + Operations Hub
          ==================================================================== */}
      <div className="techmin-middle-grid">
        {/* Left Column (58%): Top Games Leaderboard */}
        <div className="merchant-list-card">
          <div className="panel-header" style={{ marginBottom: 12 }}>
            <div>
              <h2 className="panel-title">
                <span>Top Performing Games</span>
                <span className="panel-title-pill">Top 5</span>
              </h2>
              <span className="panel-subtitle">Ranked by real player engagement and play counts</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {onOpenAddGame && (
                <button 
                  className="techmin-btn-outline"
                  onClick={onOpenAddGame}
                  title="Add New Game"
                >
                  <span>+ Add Game</span>
                </button>
              )}
              <button 
                className="techmin-btn-outline"
                onClick={() => onNavigateTab && onNavigateTab('games')}
                title="View Full Games Catalog"
              >
                <span>All Games →</span>
              </button>
            </div>
          </div>

          <div className="merchant-items-stream">
            {topGames.map((game, idx) => {
              const rankIcons = ['🥇', '🥈', '🥉', '#4', '#5'];
              return (
                <div key={game.id || idx} className="merchant-item-row">
                  <div className="merchant-left">
                    <span className={`rank-badge-item rank-style-${idx + 1}`}>
                      {rankIcons[idx]}
                    </span>
                    <img
                      src={game.thumbnail || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=100'}
                      alt={game.title}
                      className="merchant-avatar"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=100';
                      }}
                    />
                    <div className="merchant-details">
                      <div className="merchant-name-row">
                        <span className="merchant-title">{game.title}</span>
                        {game.featured && (
                          <span className="featured-star-pill" title="Featured Title">
                            ★
                          </span>
                        )}
                        <span className="verified-badge" title="Verified Game Catalog Partner">✓</span>
                      </div>
                      <span className="merchant-category">
                        {game.category || 'Arcade'} • ★ {game.rating || 4.8}
                      </span>
                    </div>
                  </div>

                  <div className="merchant-right">
                    <span className="merchant-plays-tag">
                      {(game.plays || 0).toLocaleString()} plays
                    </span>
                    <a
                      href={`${CONFIG.PORTAL_URL}/game/${encodeURIComponent(game.id || game._id)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="merchant-action-btn"
                      title="View on Live Gaming Website"
                      style={{ textDecoration: 'none' }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                      <span>Portal</span>
                    </a>
                    {game.gameUrl && (
                      <button 
                        className="merchant-action-btn play-test-btn"
                        title="Play Test in Sandbox Modal"
                        onClick={() => setActivePlayGame(game)}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                        <span>Test</span>
                      </button>
                    )}
                    {onEditGame && (
                      <button 
                        className="merchant-action-btn edit-btn"
                        title="Edit Game Details"
                        onClick={() => onEditGame(game)}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (42%): Operations & Platform Telemetry Hub */}
        <div className="dashboard-ops-card">
          {/* Header */}
          <div className="panel-header" style={{ marginBottom: 14 }}>
            <div>
              <h2 className="panel-title">
                <span>Operations & Inquiries</span>
              </h2>
              <span className="panel-subtitle">Actionable items requiring admin attention</span>
            </div>
            <span className="live-player-pulse-tag">
              <span className="live-player-pulse-dot" />
              <span>{onlineCount} Online</span>
            </span>
          </div>

          {/* Submissions Section */}
          <div className="ops-section">
            <div className="ops-section-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="ops-icon-bullet orange">🚀</span>
                <span className="ops-section-title">Developer Submissions</span>
              </div>
              <button
                className="ops-link-btn"
                onClick={() => onNavigateTab && onNavigateTab('submissions')}
              >
                View all ({submissions.length}) →
              </button>
            </div>

            {recentSubmissions.length > 0 ? (
              <div className="ops-items-list">
                {recentSubmissions.map((sub, idx) => (
                  <div 
                    key={sub.id || idx} 
                    className="ops-item-row"
                    onClick={() => onNavigateTab && onNavigateTab('submissions')}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="ops-item-main">
                      <span className="ops-item-title">{sub.title || sub.gameTitle || 'Game Submission'}</span>
                      <span className="ops-item-sub">By {sub.developerName || sub.author || sub.email || 'Developer'} • {sub.category || 'Arcade'}</span>
                    </div>
                    <span className={`status-badge ${sub.status || 'pending'}`}>
                      {sub.status || 'pending'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="ops-empty-box">
                <span>✨ All developer submissions are reviewed. No backlog!</span>
              </div>
            )}
          </div>

          {/* Support Inbox Section */}
          <div className="ops-section" style={{ marginTop: 16 }}>
            <div className="ops-section-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="ops-icon-bullet blue">💬</span>
                <span className="ops-section-title">Support & Player Inquiries</span>
              </div>
              <button
                className="ops-link-btn"
                onClick={() => onNavigateTab && onNavigateTab('messages')}
              >
                Inbox ({messages.length}) →
              </button>
            </div>

            {recentMessages.length > 0 ? (
              <div className="ops-items-list">
                {recentMessages.map((msg, idx) => (
                  <div 
                    key={msg.id || idx} 
                    className="ops-item-row"
                    onClick={() => onNavigateTab && onNavigateTab('messages')}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="ops-item-main">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {!msg.read && <span className="unread-dot" title="Unread message" />}
                        <span className="ops-item-title">{msg.name || msg.sender || 'Gamer'}</span>
                      </div>
                      <span className="ops-item-sub message-preview">{msg.subject || msg.message || 'Support inquiry'}</span>
                    </div>
                    <span className="ops-item-time">
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleDateString() : 'Recent'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="ops-empty-box">
                <span>Inbox is quiet. All player tickets resolved!</span>
              </div>
            )}
          </div>

          {/* Platform Quick Telemetry Footer */}
          <div className="ops-telemetry-footer">
            <div className="telemetry-stat">
              <span className="telemetry-label">Catalog Games</span>
              <span className="telemetry-value">{games.length}</span>
            </div>
            <div className="telemetry-stat">
              <span className="telemetry-label">Categories</span>
              <span className="telemetry-value">{categories.length}</span>
            </div>
            <div className="telemetry-stat">
              <span className="telemetry-label">Registered Users</span>
              <span className="telemetry-value">{users.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          4. Techmin Bottom Row: Recent Games Catalog Directory Table
          ==================================================================== */}
      <div className="glass-panel" style={{ marginTop: 22 }}>
        {/* Header Row: Title & Action Buttons */}
        <div className="directory-panel-header">
          <div className="directory-header-info">
            <h2 className="panel-title">
              <span>Games Catalog Directory</span>
              <span className="panel-title-pill">{filteredGames.length} of {games.length}</span>
            </h2>
            <span className="panel-subtitle">Monitor real-time game status, concurrency, and play telemetry</span>
          </div>

          <div className="directory-header-actions">
            {onOpenAddGame && (
              <button 
                className="techmin-btn-primary"
                onClick={onOpenAddGame}
                title="Add New Game"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>Add Game</span>
              </button>
            )}

            <button 
              className="techmin-btn-outline"
              onClick={() => onNavigateTab && onNavigateTab('games')}
              title="Open full games management panel"
            >
              <span>See Full List</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>
        </div>

        {/* Dedicated Filter & Search Bar */}
        <div className="directory-toolbar-bar">
          <div className="directory-toolbar-left">
            {/* Search Input */}
            <div className="search-input-wrapper">
              <svg className="search-icon-svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search games by title or category..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="directory-search-input"
              />
              {tableSearch && (
                <button
                  className="search-clear-btn"
                  onClick={() => setTableSearch('')}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Status Selector */}
            <CustomSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'maintenance', label: 'Maintenance' },
                { value: 'draft', label: 'Draft' }
              ]}
              minWidth="130px"
            />

            {/* Category Filter Selector */}
            <CustomSelect
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={[
                { value: 'all', label: 'All Categories' },
                ...categories.filter(c => c && c.id !== 'all' && c._id !== 'all').map(c => ({
                  value: c.id || c._id || c.slug || (c.name || '').toLowerCase(),
                  label: c.name || c.id || 'Category'
                }))
              ]}
              minWidth="140px"
            />

            {(tableSearch || statusFilter !== 'all' || categoryFilter !== 'all') && (
              <button
                className="filter-reset-link"
                onClick={() => {
                  setTableSearch('');
                  setStatusFilter('all');
                  setCategoryFilter('all');
                }}
                title="Reset active filters"
              >
                Reset Filters
              </button>
            )}
          </div>

          <div className="directory-toolbar-right">
            <span className="directory-showing-count">
              Showing <strong>{Math.min(8, filteredGames.length)}</strong> of <strong>{filteredGames.length}</strong> games
            </span>
          </div>
        </div>

        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>#</th>
                <th>Game Name</th>
                <th>Category</th>
                <th>Live Players</th>
                <th>Total Plays</th>
                <th>Share</th>
                <th>Rating</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredGames.slice(0, 8).map((game, idx) => {
                const playShare = totalPlays > 0 ? Math.round(((game.plays || 0) / totalPlays) * 100) : 0;
                const gid = game.id || game._id;
                const gameLive = activeGameCounts && (activeGameCounts[gid] || activeGameCounts[game.id] || activeGameCounts[game._id]);
                const live = Number(gameLive || 0);

                return (
                  <tr key={game.id || idx}>
                    <td>
                      <span className={`rank-pill rank-${idx + 1}`}>
                        #{idx + 1}
                      </span>
                    </td>
                    <td>
                      <div className="game-row-identity">
                        <img
                          src={game.thumbnail || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=100'}
                          alt={game.title}
                          className="game-table-thumb"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=100';
                          }}
                        />
                        <div>
                          <div className="game-table-title">{game.title}</div>
                          {game.featured && (
                            <span className="featured-star-pill">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1" style={{ marginRight: 3 }}>
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                              </svg>
                              <span>Featured</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="category-pill-tag">
                        {game.category || 'Arcade'}
                      </span>
                    </td>
                    <td>
                      <span className="live-player-pulse-tag">
                        <span className="live-player-pulse-dot" />
                        <span>{live} LIVE</span>
                      </span>
                    </td>
                    <td>
                      <span className="plays-number-badge">
                        {(game.plays || 0).toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <div className="share-progress-wrapper">
                        <div className="share-bar-track">
                          <div className="share-bar-fill" style={{ width: `${Math.max(6, playShare)}%` }} />
                        </div>
                        <span className="share-pct-label">{playShare}%</span>
                      </div>
                    </td>
                    <td>
                      <div className="rating-badge-inline">
                        <span className="rating-star">★</span>
                        <span className="rating-value">{game.rating || 4.8}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${game.status || 'draft'}`}>
                        {game.status || 'draft'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="table-actions-right" style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <a
                          href={`${CONFIG.PORTAL_URL}/game/${encodeURIComponent(game.id || game._id)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="icon-action-btn portal"
                          title="View on Live Website"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                        </a>

                        {game.gameUrl && (
                          <button
                            className="icon-action-btn"
                            title="Play Test"
                            onClick={() => setActivePlayGame(game)}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                              <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                          </button>
                        )}
                        {onEditGame && (
                          <button
                            className="icon-action-btn edit"
                            title="Edit Game"
                            onClick={() => onEditGame(game)}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredGames.length === 0 && (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '48px 20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: '2rem' }}>🎮</span>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-heading)' }}>
                        No games found matching your search
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Try changing your search query or reset the filters.
                      </span>
                      <button
                        className="techmin-btn-outline"
                        style={{ marginTop: 6 }}
                        onClick={() => {
                          setTableSearch('');
                          setStatusFilter('all');
                          setCategoryFilter('all');
                        }}
                      >
                        Reset All Filters
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Game Sandbox Live Testing Modal */}
      {activePlayGame && (
        <GameSandboxModal
          gameUrl={activePlayGame.gameUrl}
          gameTitle={activePlayGame.title}
          onClose={() => setActivePlayGame(null)}
        />
      )}
    </div>
  );
}

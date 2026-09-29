import React, { useState, useRef, useEffect } from 'react';
import GameSandboxModal from '../components/GameSandboxModal';
import CustomSelect from '../components/CustomSelect';
import GameMonetizeImportModal from '../components/GameMonetizeImportModal';
import { parseVideoSource, getGamePreviewVideo } from '../utils/videoHelper';
import { CONFIG } from '../config';

function AdminGameCardItem({
  game,
  onPlay,
  onToggleFeatured,
  onEditGame,
  onDeleteGame,
  livePlayersCount = 0,
  isSelected = false,
  onToggleSelect
}) {
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef(null);

  const rawVideo = game.previewVideo || getGamePreviewVideo(game);
  const videoSource = parseVideoSource(rawVideo);

  const computedLive = Number(livePlayersCount || 0);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (videoRef.current && videoSource?.type === 'direct') {
      try {
        videoRef.current.currentTime = 0;
        const p = videoRef.current.play();
        if (p !== undefined) p.catch(() => {});
      } catch {}
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (videoRef.current && videoSource?.type === 'direct') {
      videoRef.current.pause();
      try { videoRef.current.currentTime = 0; } catch {}
    }
  };

  return (
    <div
      className={`game-admin-card ${isSelected ? 'card-selected' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="game-card-media" style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Selection Checkbox */}
        {onToggleSelect && (
          <div
            className={`game-card-select-checkbox ${isSelected ? 'selected' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(game.id || game._id);
            }}
            title={isSelected ? 'Deselect game' : 'Select game for bulk actions'}
          >
            <input
              type="checkbox"
              checked={!!isSelected}
              onChange={() => {}}
              aria-label={`Select ${game.title}`}
            />
          </div>
        )}

        <img
          src={game.thumbnail || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600'}
          alt={game.title}
          className="game-card-thumb"
        />

        {videoSource?.type === 'direct' && (
          <video
            ref={videoRef}
            src={videoSource.url}
            muted
            loop
            playsInline
            preload="auto"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: isHovered ? 1 : 0,
              transition: 'opacity 0.2s ease',
              pointerEvents: 'none',
              zIndex: 1
            }}
          />
        )}

        {isHovered && (videoSource?.type === 'youtube' || videoSource?.type === 'vimeo') && (
          <iframe
            src={videoSource.embedUrl}
            title={game.title}
            allow="autoplay; encrypted-media"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              border: 0,
              pointerEvents: 'none',
              opacity: 1,
              zIndex: 1,
              transform: 'scale(1.25)',
              transformOrigin: 'center center'
            }}
          />
        )}
        
        <div className="game-card-badge-top" style={{ zIndex: 2, display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span className={`status-badge ${game.status || 'draft'}`}>
            {game.status || 'draft'}
          </span>
          {game.featured && (
            <span className="featured-star-pill">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="#fbbf24" stroke="#fbbf24" strokeWidth="1">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span>Spotlight</span>
            </span>
          )}
          <span className="live-player-pulse-tag" title={`${computedLive} Active Players Right Now`}>
            <span className="live-player-pulse-dot" />
            <span>{computedLive} LIVE</span>
          </span>
        </div>

        {game.gameUrl && (
          <div className="game-card-quick-play" style={{ zIndex: 3 }}>
            <button
              className="admin-btn primary"
              style={{ padding: '8px 16px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              onClick={() => onPlay(game)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span>Play Test</span>
            </button>
          </div>
        )}
      </div>

      <div className="game-card-body">
        <div className="game-card-title-row">
          <div className="game-card-title" title={game.title}>{game.title}</div>
          <div className="rating-badge-inline">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#fbbf24" stroke="#fbbf24" strokeWidth="1">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span>{Number(game.rating || 5.0).toFixed(1)}</span>
          </div>
        </div>

        <div className="game-card-badges-row">
          <span className="game-card-badge category">
            {game.category || 'Arcade'}
          </span>
          <span className="game-card-badge tile-size">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M9 21V9" />
            </svg>
            <span>{game.tileSize ? game.tileSize.toUpperCase() : (game.featured ? '2X2' : '1X1')}</span>
          </span>
          {rawVideo && (
            <span className="game-card-badge video">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
              <span>Video</span>
            </span>
          )}
        </div>

        <div className="game-card-metrics-row">
          <div className="game-card-metric-item likes">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
            </svg>
            <span>{(game.likes || 0).toLocaleString()}</span>
          </div>
          <div className="game-card-metric-item plays">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="6" y1="12" x2="10" y2="12" />
              <line x1="8" y1="10" x2="8" y2="14" />
              <line x1="15" y1="13" x2="15.01" y2="13" />
              <line x1="18" y1="11" x2="18.01" y2="11" />
              <rect x="2" y="6" width="20" height="12" rx="2" />
            </svg>
            <strong>{(game.plays || 0).toLocaleString()}</strong>
            <span>Plays</span>
          </div>
        </div>

        {game.tags && game.tags.length > 0 && (
          <div className="game-card-tags-list">
            {game.tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="game-card-tag-pill">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="game-card-actions">
          <button
            className={`game-feature-toggle-btn ${game.featured ? 'active' : ''}`}
            onClick={() => onToggleFeatured(game.id || game._id)}
            title="Toggle Featured Spotlight"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill={game.featured ? '#f59e0b' : 'none'} stroke={game.featured ? '#f59e0b' : 'currentColor'} strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span>{game.featured ? 'Featured' : 'Feature'}</span>
          </button>

          <div className="game-card-icon-actions">
            {/* Direct View on Live Website Portal Link */}
            <a
              href={`${CONFIG.PORTAL_URL}/game/${encodeURIComponent(game.id || game._id)}`}
              target="_blank"
              rel="noreferrer"
              className="icon-action-btn portal"
              title="View on Live Gaming Website"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>

            <button
              className="icon-action-btn edit"
              title="Edit Game"
              onClick={() => onEditGame(game)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button
              className="icon-action-btn delete"
              title="Delete Game"
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete "${game.title}"?`)) {
                  onDeleteGame(game.id || game._id);
                }
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GamesManagementView({
  games = [],
  categories = [],
  activeGameCounts = {},
  onEditGame,
  onDeleteGame,
  onToggleFeatured,
  onOpenAddModal,
  onOpenGameModal,
  onDraftAll,
  onBulkUpdateStatus,
  onBulkDelete,
  onRefresh
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [quickFilter, setQuickFilter] = useState('all');
  const [sortBy, setSortBy] = useState('plays-desc');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [activePlayGame, setActivePlayGame] = useState(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);

  // Reset pagination on filter/sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedStatus, quickFilter, sortBy, pageSize]);

  // Filter and Sort Logic
  const filteredGames = games.filter((game) => {
    const q = searchQuery.trim().toLowerCase();
    const title = (game.title || '').toLowerCase();
    const desc = (game.description || '').toLowerCase();
    const gid = String(game.id || game._id || '').toLowerCase();
    const tagsStr = Array.isArray(game.tags) ? game.tags.join(' ').toLowerCase() : String(game.tags || '').toLowerCase();

    const matchesSearch = !q || title.includes(q) || desc.includes(q) || tagsStr.includes(q) || gid.includes(q);

    const gameCat = (game.category || '').toLowerCase();
    const selCat = (selectedCategory || 'all').toLowerCase();
    const matchesCategory = selCat === 'all' || gameCat === selCat;

    const gameStatus = (game.status || 'draft').toLowerCase();
    const selStatus = (selectedStatus || 'all').toLowerCase();
    const matchesStatus = selStatus === 'all' || gameStatus === selStatus;

    // Quick filter chips matching
    let matchesQuick = true;
    if (quickFilter === 'featured') matchesQuick = !!game.featured;
    else if (quickFilter === 'active') matchesQuick = gameStatus === 'active';
    else if (quickFilter === 'draft') matchesQuick = gameStatus === 'draft';
    else if (quickFilter === 'maintenance') matchesQuick = gameStatus === 'maintenance';
    else if (quickFilter === 'video') matchesQuick = !!(game.previewVideo || game.videoUrl);
    else if (quickFilter === 'popular') matchesQuick = (game.plays || 0) >= 100;

    return matchesSearch && matchesCategory && matchesStatus && matchesQuick;
  }).sort((a, b) => {
    if (sortBy === 'plays-desc') return (b.plays || 0) - (a.plays || 0);
    if (sortBy === 'plays-asc') return (a.plays || 0) - (b.plays || 0);
    if (sortBy === 'rating-desc') return (b.rating || 0) - (a.rating || 0);
    if (sortBy === 'title-asc') return (a.title || '').localeCompare(b.title || '');
    return 0;
  });

  const activeCount = games.filter(g => g.status === 'active').length;
  const draftCount = games.filter(g => !g.status || g.status === 'draft').length;
  const featuredCount = games.filter(g => g.featured).length;
  const maintenanceCount = games.filter(g => g.status === 'maintenance').length;
  const videoCount = games.filter(g => g.previewVideo || g.videoUrl).length;
  const popularCount = games.filter(g => (g.plays || 0) >= 100).length;

  // Calculate live player total
  const totalLivePlayers = games.reduce((sum, g) => {
    const gid = g.id || g._id;
    const gameLive = activeGameCounts && (activeGameCounts[gid] || activeGameCounts[g.id] || activeGameCounts[g._id]);
    const live = Number(gameLive || 0);
    return sum + live;
  }, 0);

  // Pagination calculation
  const totalItems = filteredGames.length;
  const isAllPages = pageSize === 'all';
  const effectivePageSize = isAllPages ? (totalItems || 1) : Number(pageSize);
  const totalPages = Math.max(1, Math.ceil(totalItems / effectivePageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = (safeCurrentPage - 1) * effectivePageSize;
  const pagedGames = isAllPages ? filteredGames : filteredGames.slice(startIndex, startIndex + effectivePageSize);

  // Multi-selection helpers
  const toggleSelectGame = (gid) => {
    if (!gid) return;
    setSelectedIds(prev =>
      prev.includes(gid) ? prev.filter(id => id !== gid) : [...prev, gid]
    );
  };

  const isAllPageSelected = pagedGames.length > 0 && pagedGames.every(g => selectedIds.includes(g.id || g._id));

  const toggleSelectAllPage = () => {
    if (isAllPageSelected) {
      const pageIds = pagedGames.map(g => g.id || g._id);
      setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
    } else {
      const pageIds = pagedGames.map(g => g.id || g._id);
      setSelectedIds(prev => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleBulkAction = async (actionType) => {
    if (selectedIds.length === 0) return;
    if (actionType === 'delete') {
      if (window.confirm(`Delete ${selectedIds.length} selected games? This action will remove them from the database.`)) {
        if (onBulkDelete) {
          await onBulkDelete(selectedIds);
        } else {
          for (const id of selectedIds) {
            onDeleteGame(id);
          }
        }
        setSelectedIds([]);
      }
    } else if (actionType === 'active' || actionType === 'draft' || actionType === 'maintenance') {
      if (onBulkUpdateStatus) {
        await onBulkUpdateStatus(selectedIds, actionType);
      } else {
        for (const id of selectedIds) {
          const target = games.find(g => (g.id || g._id) === id);
          if (target) onEditGame({ ...target, status: actionType });
        }
      }
      setSelectedIds([]);
    }
  };

  return (
    <div className="glass-panel">
      {/* Metric Summary Counters */}
      <div className="mini-stats-grid">
        <div className="mini-stat-card">
          <div className="mini-stat-label">TOTAL TITLES</div>
          <div className="mini-stat-value">{games.length}</div>
        </div>
        <div className="mini-stat-card success">
          <div className="mini-stat-label">
            <span className="live-player-pulse-dot" style={{ width: 6, height: 6 }} />
            <span>LIVE PLAYERS</span>
          </div>
          <div className="mini-stat-value">{totalLivePlayers.toLocaleString()}</div>
        </div>
        <div className="mini-stat-card success">
          <div className="mini-stat-label">ACTIVE LIVE</div>
          <div className="mini-stat-value">{activeCount}</div>
        </div>
        <div className="mini-stat-card" style={{ borderLeft: '3px solid #64748b' }}>
          <div className="mini-stat-label">DRAFT (HIDDEN)</div>
          <div className="mini-stat-value" style={{ color: '#64748b' }}>{draftCount}</div>
        </div>
        <div className="mini-stat-card warning">
          <div className="mini-stat-label">SPOTLIGHT FEATURED</div>
          <div className="mini-stat-value">{featuredCount}</div>
        </div>
        <div className="mini-stat-card danger">
          <div className="mini-stat-label">MAINTENANCE</div>
          <div className="mini-stat-value">{maintenanceCount}</div>
        </div>
      </div>

      {/* Advanced Filter Toolbar */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <span className="search-icon-pos">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            className="search-input"
            placeholder="Search by title, tag, ID, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <CustomSelect
            value={selectedCategory}
            onChange={setSelectedCategory}
            options={[
              { value: 'all', label: `All Categories (${games.length})` },
              ...categories.filter(c => c.id !== 'all').map((c) => {
                const nameStr = c.name || c.id || 'Category';
                return {
                  value: c.id,
                  label: nameStr.charAt(0).toUpperCase() + nameStr.slice(1)
                };
              })
            ]}
            minWidth="175px"
          />

          <CustomSelect
            value={selectedStatus}
            onChange={setSelectedStatus}
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'active', label: 'Active' },
              { value: 'maintenance', label: 'Maintenance' },
              { value: 'draft', label: 'Draft' }
            ]}
            minWidth="145px"
          />

          <CustomSelect
            value={sortBy}
            onChange={setSortBy}
            options={[
              { value: 'plays-desc', label: 'Most Played (Desc)' },
              { value: 'plays-asc', label: 'Least Played (Asc)' },
              { value: 'rating-desc', label: 'Highest Rated' },
              { value: 'title-asc', label: 'Alphabetical (A-Z)' }
            ]}
            minWidth="175px"
          />

          {/* View Mode Switcher */}
          <div className="chart-toggle-group">
            <button
              className={`chart-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Card Grid View"
            >
              Cards
            </button>
            <button
              className={`chart-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Detailed Table View"
            >
              Table
            </button>
          </div>

          {onRefresh && (
            <button
              className="admin-btn secondary"
              onClick={onRefresh}
              title="Refresh from Database"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              <span>Sync</span>
            </button>
          )}

          {onOpenAddModal && (
            <button
              className="admin-btn primary add-game-btn"
              style={{
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.8rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
              onClick={onOpenAddModal}
              title="Add a new game to catalog"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Add New Game</span>
            </button>
          )}

          {/* Import GameMonetize Button */}
          <button
            className="admin-btn primary"
            style={{
              background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
              color: '#070a13',
              fontWeight: 800,
              fontSize: '0.8rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 4px 14px rgba(0, 242, 254, 0.25)',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
            onClick={() => setImportModalOpen(true)}
            title="Import games from GameMonetize"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            <span>Import GameMonetize</span>
          </button>

          {onDraftAll && (
            <button
              className="admin-btn"
              style={{
                background: 'rgba(100, 116, 139, 0.12)',
                border: '1px solid rgba(100, 116, 139, 0.3)',
                color: '#64748b',
                fontWeight: 700,
                fontSize: '0.8rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
              onClick={() => {
                if (window.confirm('Badhi game status DRAFT karvu che? Aa game website par thi hide thai jashe.')) {
                  onDraftAll();
                }
              }}
              title="Set all games to Draft (hide from website)"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
              <span>Draft All Games</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Filter Chips Row */}
      <div className="quick-filter-chips-row">
        <span className="quick-filter-label">Quick Filter:</span>
        {[
          { id: 'all', label: 'All', count: games.length },
          { id: 'featured', label: 'Spotlight', icon: '★', count: featuredCount },
          { id: 'active', label: 'Active Live', count: activeCount },
          { id: 'draft', label: 'Drafts', count: draftCount },
          { id: 'maintenance', label: 'Maintenance', count: maintenanceCount },
          { id: 'video', label: 'Has Video', count: videoCount },
          { id: 'popular', label: 'Popular (100+)', count: popularCount }
        ].map((chip) => (
          <button
            key={chip.id}
            type="button"
            className={`quick-filter-chip ${quickFilter === chip.id ? 'active' : ''}`}
            onClick={() => setQuickFilter(chip.id)}
          >
            {chip.icon && <span style={{ color: '#fbbf24', fontSize: '0.85rem' }}>{chip.icon}</span>}
            <span>{chip.label}</span>
            <span className="chip-count">{chip.count}</span>
          </button>
        ))}
      </div>

      {/* Floating Multi-Select Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="bulk-actions-floating-bar">
          <div className="bulk-bar-info">
            <span className="bulk-badge">{selectedIds.length}</span>
            <span>games selected</span>
          </div>
          <div className="bulk-bar-actions">
            <button
              className="bulk-action-btn success"
              onClick={() => handleBulkAction('active')}
              title="Publish selected games live on website"
            >
              <span>Publish Active</span>
            </button>
            <button
              className="bulk-action-btn secondary"
              onClick={() => handleBulkAction('draft')}
              title="Hide selected games as drafts"
            >
              <span>Set Draft</span>
            </button>
            <button
              className="bulk-action-btn warning"
              onClick={() => handleBulkAction('maintenance')}
              title="Set selected games to maintenance mode"
            >
              <span>Maintenance</span>
            </button>
            <button
              className="bulk-action-btn danger"
              onClick={() => handleBulkAction('delete')}
              title="Delete selected games permanently"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              <span>Delete</span>
            </button>
            <button
              className="bulk-action-btn cancel"
              onClick={() => setSelectedIds([])}
              title="Clear current selection"
            >
              <span>Clear</span>
            </button>
          </div>
        </div>
      )}

      {/* Grid Mode View */}
      {viewMode === 'grid' && (
        <div className="games-cards-grid">
          {filteredGames.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              No games found matching the selected criteria.
            </div>
          ) : (
            pagedGames.map((game) => {
              const gid = game.id || game._id;
              const liveCount = (activeGameCounts && (activeGameCounts[gid] || activeGameCounts[game.id] || activeGameCounts[game._id])) || 0;

              return (
                <AdminGameCardItem
                  key={game.id || game._id}
                  game={game}
                  onPlay={setActivePlayGame}
                  onToggleFeatured={onToggleFeatured}
                  onEditGame={onEditGame}
                  onDeleteGame={onDeleteGame}
                  livePlayersCount={liveCount}
                  isSelected={selectedIds.includes(gid)}
                  onToggleSelect={toggleSelectGame}
                />
              );
            })
          )}
        </div>
      )}

      {/* Table Mode View */}
      {viewMode === 'table' && (
        <div className="table-responsive" style={{ marginTop: 16 }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 44, textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={isAllPageSelected}
                    onChange={toggleSelectAllPage}
                    aria-label="Select all on this page"
                    title="Select all games on this page"
                  />
                </th>
                <th>Game & Media</th>
                <th>Category</th>
                <th>Card Size</th>
                <th>Live Players</th>
                <th>Plays</th>
                <th>Rating</th>
                <th>Featured</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredGames.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No games match the selected filters.
                  </td>
                </tr>
              ) : (
                pagedGames.map((game) => {
                  const gid = game.id || game._id;
                  const gameLive = activeGameCounts && (activeGameCounts[gid] || activeGameCounts[game.id] || activeGameCounts[game._id]);
                  const live = Number(gameLive || 0);
                  const isSelected = selectedIds.includes(gid);

                  return (
                    <tr key={game.id || game._id} className={isSelected ? 'table-row-selected' : ''}>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectGame(gid)}
                          aria-label={`Select ${game.title}`}
                        />
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <img
                            src={game.thumbnail || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=100'}
                            alt={game.title}
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: 'var(--radius)',
                              objectFit: 'cover',
                              border: '1px solid var(--border-glass)'
                            }}
                          />
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-heading)', fontSize: '0.92rem' }}>{game.title}</div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>ID: {game.id}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="category-pill-tag">{game.category || 'Arcade'}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.74rem', background: 'var(--bg-canvas)', color: 'var(--text-muted)', border: '1px solid var(--border-color)', padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>
                          {game.tileSize ? game.tileSize.toUpperCase() : (game.featured ? '2X2' : 'AUTO')}
                        </span>
                      </td>
                      <td>
                        <span className="live-player-pulse-tag">
                          <span className="live-player-pulse-dot" />
                          <span>{live} LIVE</span>
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                          {(game.plays || 0).toLocaleString()}
                        </span>
                      </td>
                      <td>
                        <div className="rating-badge-inline">
                          <span className="rating-star">★</span>
                          <span>{game.rating || 5.0}</span>
                        </div>
                      </td>
                      <td>
                        <button
                          className="header-btn"
                          style={{ fontSize: '0.75rem', padding: '4px 8px', color: game.featured ? '#fbbf24' : 'var(--text-muted)' }}
                          onClick={() => onToggleFeatured(game.id || game._id)}
                        >
                          {game.featured ? 'Yes' : 'No'}
                        </button>
                      </td>
                      <td>
                        <span className={`status-badge ${game.status || 'draft'}`}>
                          {game.status || 'draft'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="action-btn-group" style={{ justifyContent: 'flex-end' }}>
                          {/* View on Live Website Portal Link */}
                          <a
                            href={`${CONFIG.PORTAL_URL}/game/${encodeURIComponent(game.id || game._id)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="icon-action-btn portal"
                            title="View on Live Gaming Website"
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
                          <button
                            className="icon-action-btn delete"
                            title="Delete Game"
                            onClick={() => {
                              if (window.confirm(`Delete "${game.title}"?`)) {
                                onDeleteGame(game.id || game._id);
                              }
                            }}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls Bar */}
      {filteredGames.length > 0 && (
        <div className="admin-pagination-container">
          <div className="pagination-info">
            Showing <strong>{isAllPages ? 1 : startIndex + 1}</strong> to{' '}
            <strong>{isAllPages ? totalItems : Math.min(startIndex + effectivePageSize, totalItems)}</strong> of{' '}
            <strong>{totalItems}</strong> games
          </div>

          {!isAllPages && totalPages > 1 && (
            <div className="pagination-controls">
              <button
                className="pagination-btn"
                disabled={safeCurrentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                ‹ Prev
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - safeCurrentPage) <= 1)
                .reduce((acc, p, idx, arr) => {
                  if (idx > 0 && p - arr[idx - 1] > 1) {
                    acc.push('ellipsis-' + p);
                  }
                  acc.push(p);
                  return acc;
                }, [])
                .map((item) => {
                  if (typeof item === 'string' && item.startsWith('ellipsis')) {
                    return <span key={item} className="pagination-ellipsis">…</span>;
                  }
                  return (
                    <button
                      key={item}
                      className={`pagination-btn page-num ${safeCurrentPage === item ? 'active' : ''}`}
                      onClick={() => setCurrentPage(item)}
                    >
                      {item}
                    </button>
                  );
                })}

              <button
                className="pagination-btn"
                disabled={safeCurrentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              >
                Next ›
              </button>
            </div>
          )}

          <div className="pagination-size-selector">
            <span>Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="pagination-select"
            >
              <option value={12}>12</option>
              <option value={24}>24</option>
              <option value={48}>48</option>
              <option value={100}>100</option>
              <option value="all">All ({totalItems})</option>
            </select>
          </div>
        </div>
      )}

      {/* Modern Game Sandbox Live Display */}
      {activePlayGame && (
        <GameSandboxModal
          gameUrl={activePlayGame.gameUrl}
          gameTitle={activePlayGame.title}
          onClose={() => setActivePlayGame(null)}
        />
      )}

      {/* GameMonetize Feed Importer Modal */}
      <GameMonetizeImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onOpenInForm={(game) => {
          setImportModalOpen(false);
          if (onOpenGameModal) {
            onOpenGameModal(game);
          } else if (onOpenAddModal) {
            onOpenAddModal();
          }
        }}
        onImportSuccess={() => {
          if (onRefresh) onRefresh();
        }}
      />
    </div>
  );
}

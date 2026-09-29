import React, { useState, useEffect, useMemo } from 'react';
import { gamesApi } from '../services/api';

const DEFAULT_FEED_URL = 'https://gamemonetize.com/feed.php?format=0&num=50&page=9';

export default function GameMonetizeImportModal({
  isOpen,
  onClose,
  onImportSuccess,
  onOpenInForm
}) {
  const [feedUrl, setFeedUrl] = useState(DEFAULT_FEED_URL);
  const [currentPage, setCurrentPage] = useState(9);
  const [numGames, setNumGames] = useState(50);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState(null);
  const [fetchedGames, setFetchedGames] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [importStatus, setImportStatus] = useState('active'); // 'active' | 'draft'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [activePlayGame, setActivePlayGame] = useState(null);

  // Helper to construct feed URL from page and num
  const buildFeedUrl = (page, num) => {
    return `https://gamemonetize.com/feed.php?format=0&num=${num}&page=${page}`;
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1) return;
    setCurrentPage(newPage);
    const newUrl = buildFeedUrl(newPage, numGames);
    setFeedUrl(newUrl);
    handleFetchFeed(newUrl);
  };

  const handleNumChange = (newNum) => {
    setNumGames(newNum);
    const newUrl = buildFeedUrl(currentPage, newNum);
    setFeedUrl(newUrl);
    handleFetchFeed(newUrl);
  };

  const handleFetchFeed = async (overrideUrl) => {
    const urlToFetch = overrideUrl || feedUrl;
    setIsLoading(true);
    setError(null);
    try {
      const data = await gamesApi.fetchGameMonetizeFeed(urlToFetch);
      if (data && Array.isArray(data.games)) {
        setFetchedGames(data.games);
        // By default, select all new games (skip already existing)
        const newIds = new Set(
          data.games
            .filter(g => !g.alreadyExists)
            .map(g => g.id)
        );
        // If all are already imported or all are new, select all
        if (newIds.size === 0) {
          setSelectedIds(new Set(data.games.map(g => g.id)));
        } else {
          setSelectedIds(newIds);
        }
      } else {
        throw new Error('No games returned in feed response');
      }
    } catch (err) {
      console.error('Fetch feed error:', err);
      setError(err.message || 'Failed to fetch games from GameMonetize');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial auto-fetch when modal opens if empty
  useEffect(() => {
    if (isOpen && fetchedGames.length === 0) {
      handleFetchFeed();
    }
  }, [isOpen]);

  // Unique categories in current fetched feed
  const feedCategories = useMemo(() => {
    const cats = new Set(fetchedGames.map(g => g.originalCategory || g.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [fetchedGames]);

  // Filtered games in preview
  const displayGames = useMemo(() => {
    return (fetchedGames || []).filter(g => {
      if (!g) return false;
      const q = (searchQuery || '').toLowerCase().trim();
      const title = (g.title || '').toLowerCase();
      const desc = (g.description || '').toLowerCase();
      const matchesSearch = !q || title.includes(q) || desc.includes(q);
      const cat = g.originalCategory || g.category;
      const matchesCat = filterCategory === 'all' || cat === filterCategory;
      return matchesSearch && matchesCat;
    });
  }, [fetchedGames, searchQuery, filterCategory]);

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === displayGames.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(displayGames.map(g => g.id)));
    }
  };

  const handleImport = async () => {
    const gamesToImport = fetchedGames.filter(g => selectedIds.has(g.id));
    if (gamesToImport.length === 0) return;

    setIsImporting(true);
    setError(null);
    try {
      const res = await gamesApi.importGameMonetizeGames(gamesToImport, {
        status: importStatus
      });
      if (onImportSuccess) {
        onImportSuccess(res);
      }
      onClose();
    } catch (err) {
      console.error('Import error:', err);
      setError(err.message || 'Failed to import games');
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '95%',
          maxWidth: '1240px',
          height: '92vh',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          borderRadius: 20,
          background: 'var(--bg-card)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5), 0 0 0 1px var(--border-color)'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 28px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-card)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0a1024',
                fontWeight: 900,
                fontSize: '1.25rem',
                boxShadow: '0 4px 14px rgba(0, 242, 254, 0.3)'
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-heading)' }}>
                GameMonetize Catalog Importer
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Directly fetch, preview, and publish HTML5 games into your catalog & website
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="icon-action-btn"
            style={{ width: 36, height: 36, borderRadius: '50%' }}
            title="Close"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Feed URL & Fetch Bar */}
        <div
          style={{
            padding: '16px 28px',
            background: 'var(--bg-canvas)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', flex: 1, minWidth: 320, gap: 8 }}>
            <input
              type="text"
              className="search-input"
              value={feedUrl}
              onChange={(e) => setFeedUrl(e.target.value)}
              placeholder="https://gamemonetize.com/feed.php?format=0&num=50&page=..."
              style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '0.84rem' }}
            />
            <button
              className="admin-btn primary"
              onClick={() => handleFetchFeed()}
              disabled={isLoading}
              style={{ minWidth: 130, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              {isLoading ? (
                <>
                  <span className="live-player-pulse-dot" />
                  <span>Fetching...</span>
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <span>Fetch Feed</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Pagination Stepper */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>PAGE:</span>
            <button
              className="header-btn"
              disabled={currentPage <= 1 || isLoading}
              onClick={() => handlePageChange(currentPage - 1)}
              style={{ padding: '4px 10px', fontSize: '0.8rem' }}
            >
              ◀ Prev
            </button>
            <span style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-heading)', minWidth: 24, textAlign: 'center' }}>
              {currentPage}
            </span>
            <button
              className="header-btn"
              disabled={isLoading}
              onClick={() => handlePageChange(currentPage + 1)}
              style={{ padding: '4px 10px', fontSize: '0.8rem' }}
            >
              Next ▶
            </button>

            <select
              className="header-btn"
              value={numGames}
              onChange={(e) => handleNumChange(Number(e.target.value))}
              style={{ padding: '4px 8px', fontSize: '0.8rem', marginLeft: 6 }}
            >
              <option value={20}>20 games</option>
              <option value={50}>50 games</option>
              <option value={100}>100 games</option>
            </select>
          </div>
        </div>

        {/* Filter & Import Settings Controls */}
        {fetchedGames.length > 0 && (
          <div
            style={{
              padding: '12px 28px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-card)'
            }}
          >
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                className="header-btn"
                onClick={handleSelectAll}
                style={{ fontSize: '0.8rem', padding: '6px 14px', fontWeight: 700 }}
              >
                {selectedIds.size === displayGames.length ? 'Deselect All' : `Select All (${displayGames.length})`}
              </button>

              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Selected: <strong style={{ color: 'var(--primary-color)' }}>{selectedIds.size}</strong> of {displayGames.length}
              </span>

              {/* Category Filter */}
              <select
                className="header-btn"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                style={{ fontSize: '0.8rem', padding: '6px 12px' }}
              >
                <option value="all">All Categories ({fetchedGames.length})</option>
                {feedCategories.map(c => (
                  <option key={c} value={c}>
                    {c} ({fetchedGames.filter(g => (g.originalCategory || g.category) === c).length})
                  </option>
                ))}
              </select>

              {/* Search in results */}
              <input
                type="text"
                className="search-input"
                placeholder="Filter titles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: 170, fontSize: '0.8rem', padding: '6px 12px' }}
              />
            </div>

            {/* Target Status Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Import as:
              </span>
              <div className="chart-toggle-group">
                  <button
                  className={`chart-toggle-btn ${importStatus === 'active' ? 'active' : ''}`}
                  onClick={() => setImportStatus('active')}
                  style={{
                    color: importStatus === 'active' ? '#10b981' : 'inherit',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5
                  }}
                  title="Show immediately on website"
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block', flexShrink: 0 }} />
                  Active (Live)
                </button>
                <button
                  className={`chart-toggle-btn ${importStatus === 'draft' ? 'active' : ''}`}
                  onClick={() => setImportStatus('draft')}
                  style={{
                    color: importStatus === 'draft' ? '#64748b' : 'inherit',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5
                  }}
                  title="Hide from website until reviewed"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                  Draft (Hidden)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div
            style={{
              padding: '12px 28px',
              background: 'rgba(239, 68, 68, 0.08)',
              borderBottom: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#ef4444',
              fontSize: '0.86rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            {error}
          </div>
        )}

        {/* Games List Container */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 28px',
            background: 'var(--bg-canvas)'
          }}
        >
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
              <div className="skeleton-spinner" style={{ width: 44, height: 44, margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-heading)', fontWeight: 700 }}>
                Fetching GameMonetize Feed...
              </h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                Connecting to feed API and detecting game dimensions...
              </p>
            </div>
          ) : fetchedGames.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
              <div style={{ margin: '0 auto 16px', width: 56, height: 56, borderRadius: '50%', background: 'rgba(0,242,254,0.06)', border: '1px solid rgba(0,242,254,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="6" width="20" height="12" rx="2" />
                  <line x1="6" y1="12" x2="10" y2="12" />
                  <line x1="8" y1="10" x2="8" y2="14" />
                  <line x1="15" y1="13" x2="15.01" y2="13" />
                  <line x1="18" y1="11" x2="18.01" y2="11" />
                </svg>
              </div>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-heading)', fontWeight: 700 }}>
                No Games Loaded
              </h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', maxWidth: 440, margin: '0 auto 20px' }}>
                Click "Fetch Feed" above to read the latest games from GameMonetize.
              </p>
              <button className="admin-btn primary" onClick={() => handleFetchFeed()}>
                Fetch Games Now
              </button>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: 16
              }}
            >
              {displayGames.map((game) => {
                const isSelected = selectedIds.has(game.id);
                return (
                  <div
                    key={game.id}
                    onClick={() => handleToggleSelect(game.id)}
                    style={{
                      background: 'var(--bg-card)',
                      borderRadius: 14,
                      border: isSelected
                        ? '2px solid var(--primary-color)'
                        : '1px solid var(--border-color)',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected
                        ? '0 6px 20px rgba(0, 242, 254, 0.15)'
                        : '0 2px 8px rgba(0,0,0,0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative'
                    }}
                  >
                    {/* Thumbnail banner */}
                    <div style={{ position: 'relative', width: '100%', height: 140, background: '#0a0f1d' }}>
                      <img
                        src={game.thumbnail}
                        alt={game.title}
                        loading="lazy"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400';
                        }}
                      />

                      {/* Checkbox overlay */}
                      <div
                        style={{
                          position: 'absolute',
                          top: 8,
                          left: 8,
                          width: 24,
                          height: 24,
                          borderRadius: 6,
                          background: isSelected ? 'var(--primary-color)' : 'rgba(0,0,0,0.65)',
                          border: isSelected ? 'none' : '2px solid #ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#0a1024',
                          fontWeight: 900,
                          fontSize: '0.8rem',
                          zIndex: 2,
                          boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                        }}
                      >
                        {isSelected && (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0a1024" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>

                      {/* Already in catalog tag */}
                      {game.alreadyExists && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            background: '#fbbf24',
                            color: '#070a13',
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: 20,
                            zIndex: 2,
                            letterSpacing: '0.02em'
                          }}
                        >
                          Already in Catalog
                        </div>
                      )}

                      {/* Playtest button on hover */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActivePlayGame(game);
                        }}
                        style={{
                          position: 'absolute',
                          bottom: 8,
                          right: 8,
                          background: 'rgba(0,0,0,0.75)',
                          backdropFilter: 'blur(4px)',
                          border: '1px solid rgba(255,255,255,0.3)',
                          color: '#ffffff',
                          borderRadius: 20,
                          padding: '4px 10px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          zIndex: 2
                        }}
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                        Test Play
                      </button>
                    </div>

                    {/* Card Content */}
                    <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: '0.88rem',
                          color: 'var(--text-heading)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                        title={game.title}
                      >
                        {game.title}
                      </div>

                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span
                          className="category-pill-tag"
                          style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                        >
                          {game.originalCategory || game.category}
                        </span>

                        <span
                          style={{
                            fontSize: '0.68rem',
                            background: 'var(--bg-canvas)',
                            color: 'var(--text-muted)',
                            border: '1px solid var(--border-color)',
                            padding: '2px 6px',
                            borderRadius: 4,
                            fontWeight: 600,
                            fontFamily: 'var(--font-mono)'
                          }}
                        >
                          {game.width}x{game.height}
                        </span>

                        <span
                          style={{
                            fontSize: '0.68rem',
                            background: 'rgba(0, 242, 254, 0.08)',
                            color: 'var(--primary-color)',
                            border: '1px solid rgba(0, 242, 254, 0.2)',
                            padding: '2px 6px',
                            borderRadius: 4,
                            fontWeight: 700
                          }}
                        >
                          {game.tileSize ? game.tileSize.toUpperCase() : 'AUTO'}
                        </span>
                      </div>

                      <p
                        style={{
                          margin: 0,
                          fontSize: '0.75rem',
                          color: 'var(--text-muted)',
                          lineHeight: 1.4,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {game.description || 'No description provided.'}
                      </p>

                      {/* Open in Form action */}
                      {onOpenInForm && (
                        <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="header-btn"
                            style={{
                              padding: '5px 12px',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              color: 'var(--primary-color)',
                              borderColor: 'rgba(0, 242, 254, 0.35)',
                              background: 'rgba(0, 242, 254, 0.08)',
                              borderRadius: 6
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenInForm({
                                id: game.id || undefined,
                                title: game.title || '',
                                description: game.description || '',
                                instructions: game.instructions || '',
                                thumbnail: game.thumbnail || '',
                                banner: game.banner || game.thumbnail || '',
                                gameUrl: game.gameUrl || '',
                                category: String(game.category || 'arcade').toLowerCase(),
                                tags: Array.isArray(game.tags) ? game.tags.join(', ') : (game.tags || ''),
                                width: game.width || 800,
                                height: game.height || 600,
                                orientation: (game.height > game.width * 1.25) ? 'portrait' : 'landscape',
                                tileSize: game.tileSize || 'auto',
                                status: importStatus
                              });
                            }}
                            title="Open in Add Game form to customize before saving"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                            <span>Open in Add Form</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '16px 28px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-card)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              Ready to import <strong style={{ color: 'var(--text-heading)' }}>{selectedIds.size}</strong> game{selectedIds.size === 1 ? '' : 's'} as <strong style={{ color: importStatus === 'active' ? '#10b981' : '#64748b' }}>{importStatus.toUpperCase()}</strong>
            </span>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              className="admin-btn secondary"
              onClick={onClose}
              disabled={isImporting}
            >
              Cancel
            </button>
            <button
              className="admin-btn primary"
              onClick={handleImport}
              disabled={isImporting || selectedIds.size === 0}
              style={{
                minWidth: 200,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontWeight: 800
              }}
            >
              {isImporting ? (
                <>
                  <span className="live-player-pulse-dot" />
                  <span>Importing {selectedIds.size} Games...</span>
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span>Import {selectedIds.size} Games to Catalog</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Play Test Modal inside Importer */}
      {activePlayGame && (
        <div
          className="modal-overlay"
          style={{ zIndex: 10000 }}
          onClick={() => setActivePlayGame(null)}
        >
          <div
            className="modal-content"
            style={{
              width: '90%',
              maxWidth: 960,
              height: '80vh',
              padding: 0,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 16
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '12px 20px',
                background: 'var(--bg-card)',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ fontWeight: 800, color: 'var(--text-heading)' }}>
                Playtesting: {activePlayGame.title} ({activePlayGame.width}x{activePlayGame.height})
              </div>
              <button
                className="icon-action-btn"
                onClick={() => setActivePlayGame(null)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <iframe
              src={activePlayGame.gameUrl}
              title={activePlayGame.title}
              style={{ width: '100%', height: '100%', border: 'none' }}
              allow="autoplay; fullscreen; gamepad"
            />
          </div>
        </div>
      )}
    </div>
  );
}

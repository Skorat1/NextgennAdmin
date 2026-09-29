import React, { useState, useEffect, useRef } from 'react';
import { parseVideoSource, getGamePreviewVideo } from '../utils/videoHelper';
import { gamesApi } from '../services/api';
import CustomSelect from './CustomSelect';
import './GameModal.css';

function sanitizeGameUrl(input) {
  if (!input) return '';
  let url = input.trim();
  const iframeSrcMatch = url.match(/src=["']([^"']+)["']/i);
  if (iframeSrcMatch) {
    url = iframeSrcMatch[1];
  }
  if (url.endsWith('.xml') || url.includes('.xml?')) {
    return `/game-proxy/gadgets/ifr?url=${encodeURIComponent(url)}`;
  }
  if (url.includes('opensocial.googleusercontent.com/gadgets/ifr')) {
    const subIdx = url.indexOf('/gadgets/ifr');
    if (subIdx !== -1) {
      return `/game-proxy${url.slice(subIdx)}`;
    }
  }
  if (url && !url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('//') && !url.startsWith('/')) {
    url = 'https://' + url;
  }
  return url;
}

// Quick heuristic metadata & video detection
function getQuickClientMetadata(rawInput) {
  if (!rawInput) return {};
  let target = rawInput.trim();
  const iframeMatch = target.match(/src=["']([^"']+)["']/i);
  if (iframeMatch) target = iframeMatch[1];

  // 1. YouTube & Shorts
  const ytMatch = target.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/i);
  if (ytMatch) {
    const vidId = ytMatch[1];
    return {
      thumbnail: `https://img.youtube.com/vi/${vidId}/maxresdefault.jpg`,
      banner: `https://img.youtube.com/vi/${vidId}/maxresdefault.jpg`,
      previewVideo: target
    };
  }

  // 2. CrazyGames URL matching
  const cgMatch = target.match(/crazygames\.com\/(?:game|embed|en_US)\/([a-zA-Z0-9-]+)/i) ||
    target.match(/https?:\/\/([a-zA-Z0-9-]+)\.game-files\.crazygames\.com/i) ||
    target.match(/https?:\/\/files\.crazygames\.com\/([a-zA-Z0-9-]+)/i);
  if (cgMatch) {
    const slug = cgMatch[1];
    const cleanTitle = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    return {
      thumbnail: `https://images.crazygames.com/games/${slug}/cover-16x9.png`,
      banner: `https://images.crazygames.com/games/${slug}/cover-16x9.png`,
      previewVideo: `https://videos.crazygames.com/games/${slug}/cover-16x9.mp4`,
      title: cleanTitle
    };
  }

  // 3. Poki URLs
  const poki = target.match(/poki\.com\/(?:[a-zA-Z-]+\/)?g\/([a-zA-Z0-9-]+)/i);
  if (poki) {
    const slug = poki[1];
    const cleanTitle = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    return {
      thumbnail: `https://img.poki.com/cdn-cgi/image/quality=78,width=600,height=600,fit=cover,f=auto/${slug}.png`,
      banner: `https://img.poki.com/cdn-cgi/image/quality=78,width=600,height=600,fit=cover,f=auto/${slug}.png`,
      title: cleanTitle
    };
  }

  // 4. GameMonetize
  const gm = target.match(/gamemonetize\.(?:com|co)\/([a-zA-Z0-9]+)/i) || target.match(/html5\.gamemonetize\.com\/([a-zA-Z0-9]+)/i);
  if (gm) {
    return {
      thumbnail: `https://img.gamemonetize.com/${gm[1]}/512x384.jpg`,
      banner: `https://img.gamemonetize.com/${gm[1]}/512x384.jpg`
    };
  }

  // 5. GameDistribution
  const gd = target.match(/html5\.gamedistribution\.com\/([a-zA-Z0-9]+)/i);
  if (gd) {
    return {
      thumbnail: `https://img.gamedistribution.com/${gd[1]}-512x384.jpeg`,
      banner: `https://img.gamedistribution.com/${gd[1]}-512x384.jpeg`
    };
  }

  // 6. Direct image or video
  if (/\.(png|jpg|jpeg|webp|gif)($|\?)/i.test(target)) {
    return { thumbnail: target, banner: target };
  }
  if (/\.(mp4|webm|ogg)($|\?)/i.test(target)) {
    return { previewVideo: target };
  }

  return {};
}

const TILE_SIZES = [
  { id: 'auto', label: 'AUTO', sub: 'Masonry' },
  { id: '1x1', label: '1×1', sub: 'Standard' },
  { id: '2x2', label: '2×2', sub: 'Hero Big' },
  { id: '2x1', label: '2×1', sub: 'Wide Banner' }
];

const QUICK_TAG_SUGGESTIONS = [
  'Arcade', 'Action', '3D', 'Racing', '2 Player', 'Casual', 'Multiplayer', 'Runner', 'Sports', 'Puzzle', 'Shooting', 'Adventure'
];

export default function GameModal({ game, isOpen, onClose, onSave, categories = [] }) {
  const [formData, setFormData] = useState({
    title: '',
    category: 'arcade',
    developer: '',
    description: '',
    instructions: '',
    thumbnail: '',
    banner: '',
    previewVideo: '',
    gameUrl: '',
    tags: '',
    featured: false,
    tileSize: 'auto',
    status: 'active',
    width: 800,
    height: 600,
    orientation: 'landscape'
  });

  const [isDetecting, setIsDetecting] = useState(false);
  const [detectStatus, setDetectStatus] = useState(null);
  const [isModalHovered, setIsModalHovered] = useState(false);
  const [imageRatioInfo, setImageRatioInfo] = useState(null);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const modalVideoRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Auto-detect image aspect ratio and compute best tile size
  const detectAndApplyTileSize = (thumbUrl) => {
    if (!thumbUrl || typeof thumbUrl !== 'string') return;
    const clean = thumbUrl.trim();
    if (!clean.startsWith('http') && !clean.startsWith('data:') && !clean.startsWith('/')) return;

    const img = new Image();
    img.onload = () => {
      if (!img.naturalWidth || !img.naturalHeight) return;
      const ratio = img.naturalWidth / img.naturalHeight;
      const isPortraitImg = img.naturalHeight > img.naturalWidth * 1.15;
      setImageRatioInfo({
        ratio: ratio.toFixed(2),
        width: img.naturalWidth,
        height: img.naturalHeight,
        bestSize: formData.featured ? '2x2' : 'auto',
        isPortrait: isPortraitImg
      });
    };
    img.src = clean;
  };

  useEffect(() => {
    setDetectStatus(null);
    setIsModalHovered(false);
    setImageRatioInfo(null);
    if (game) {
      const gWidth = Number(game.width) || 800;
      const gHeight = Number(game.height) || 600;
      const gCat = (game.category || 'arcade').trim();
      const catExists = categories.some(c => (c.id || c._id || '').toLowerCase() === gCat.toLowerCase());

      if (!catExists && gCat && gCat !== 'arcade') {
        setIsCustomCategory(true);
        setCustomCategoryInput(gCat);
      } else {
        setIsCustomCategory(false);
        setCustomCategoryInput('');
      }

      setFormData({
        title: game.title || '',
        category: gCat,
        developer: game.developer || game.author || '',
        description: game.description || '',
        instructions: game.instructions || '',
        thumbnail: game.thumbnail || '',
        banner: game.banner || '',
        previewVideo: game.previewVideo || '',
        gameUrl: game.gameUrl || '',
        tags: Array.isArray(game.tags) ? game.tags.join(', ') : (game.tags || ''),
        featured: Boolean(game.featured),
        tileSize: game.tileSize || (game.featured ? '2x2' : 'auto'),
        status: game.status || 'active',
        width: gWidth,
        height: gHeight,
        orientation: game.orientation || (gHeight > gWidth * 1.2 ? 'portrait' : 'landscape')
      });
      if (game.thumbnail) {
        detectAndApplyTileSize(game.thumbnail);
      }
    } else {
      setIsCustomCategory(false);
      setCustomCategoryInput('');
      setFormData({
        title: '',
        category: 'arcade',
        developer: '',
        description: '',
        instructions: '',
        thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
        banner: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80',
        previewVideo: '',
        gameUrl: '',
        tags: 'Arcade, 3D, WebGL',
        featured: false,
        tileSize: 'auto',
        status: 'active',
        width: 800,
        height: 600,
        orientation: 'landscape'
      });
    }
  }, [game, isOpen]);

  // Handle ESC key to dismiss modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleAutoDetectImage = async (urlInput) => {
    const raw = (urlInput !== undefined ? urlInput : formData.gameUrl || '').trim();
    if (!raw) {
      setDetectStatus({ type: 'warning', text: 'Please enter a Game URL first' });
      setTimeout(() => setDetectStatus(null), 3500);
      return;
    }

    const quick = getQuickClientMetadata(raw);
    if (quick.thumbnail || quick.previewVideo || quick.title) {
      setFormData(prev => ({
        ...prev,
        thumbnail: quick.thumbnail || prev.thumbnail,
        banner: quick.banner || quick.thumbnail || prev.banner,
        previewVideo: quick.previewVideo || prev.previewVideo,
        title: (!prev.title || prev.title.trim() === '' || prev.title.startsWith('New Game')) && quick.title ? quick.title : prev.title
      }));
      if (quick.thumbnail) detectAndApplyTileSize(quick.thumbnail);
      setDetectStatus({ type: 'success', text: 'Source details auto-detected!' });
    }

    setIsDetecting(true);
    try {
      const json = await gamesApi.detectMetadata(raw);
      if (json?.success && json?.data) {
        const { thumbnail, banner, previewVideo, title, description } = json.data;
        const targetThumb = thumbnail || quick.thumbnail || formData.thumbnail;
        setFormData(prev => ({
          ...prev,
          thumbnail: targetThumb,
          banner: banner || targetThumb || quick.banner || prev.banner,
          previewVideo: previewVideo || quick.previewVideo || prev.previewVideo || '',
          title: (!prev.title || prev.title.trim() === '' || prev.title.startsWith('New Game')) && title ? title : prev.title,
          description: (!prev.description || prev.description.trim() === '') && description ? description : prev.description
        }));
        if (targetThumb) detectAndApplyTileSize(targetThumb);
        setDetectStatus({ type: 'success', text: 'Game title, video & thumbnail fetched successfully!' });
      }
    } catch (err) {
      console.warn('Metadata detection fallback used:', err.message);
    } finally {
      setIsDetecting(false);
      setTimeout(() => setDetectStatus(null), 4000);
    }
  };

  const handleGameUrlChange = (e) => {
    let val = e.target.value;
    const iframeMatch = val.match(/src=["']([^"']+)["']/i);
    if (iframeMatch) {
      val = iframeMatch[1];
    }

    // Auto-detect resolution from iframe attributes if present
    const widthMatch = e.target.value.match(/width=["']?(\d+)/i);
    const heightMatch = e.target.value.match(/height=["']?(\d+)/i);
    let detectedW = null;
    let detectedH = null;
    if (widthMatch && heightMatch) {
      detectedW = parseInt(widthMatch[1], 10);
      detectedH = parseInt(heightMatch[1], 10);
    }

    const quick = getQuickClientMetadata(val);
    setFormData(prev => ({
      ...prev,
      gameUrl: val,
      width: detectedW || prev.width,
      height: detectedH || prev.height,
      orientation: (detectedH && detectedW && detectedH > detectedW * 1.2) ? 'portrait' : prev.orientation,
      thumbnail: quick.thumbnail || prev.thumbnail,
      banner: quick.banner || quick.thumbnail || prev.banner,
      previewVideo: quick.previewVideo || prev.previewVideo,
      title: (!prev.title || prev.title.trim() === '' || prev.title.startsWith('New Game')) && quick.title ? quick.title : prev.title
    }));
    if (quick.thumbnail) detectAndApplyTileSize(quick.thumbnail);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (val.trim().length > 10) {
      debounceTimerRef.current = setTimeout(() => {
        handleAutoDetectImage(val);
      }, 600);
    }
  };

  // Toggle quick tag in tags input
  const handleToggleQuickTag = (tag) => {
    const currentTags = formData.tags
      ? formData.tags.split(',').map(t => t.trim()).filter(Boolean)
      : [];
    const exists = currentTags.some(t => t.toLowerCase() === tag.toLowerCase());
    let nextTags;
    if (exists) {
      nextTags = currentTags.filter(t => t.toLowerCase() !== tag.toLowerCase());
    } else {
      nextTags = [...currentTags, tag];
    }
    setFormData(prev => ({ ...prev, tags: nextTags.join(', ') }));
  };

  // Quick resolution presets
  const handleApplyResolutionPreset = (w, h) => {
    setFormData(prev => ({
      ...prev,
      width: w,
      height: h
    }));
  };

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Please enter a game title');
      return;
    }

    const processedTags = formData.tags
      ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : ['Arcade'];

    const cleanedGameUrl = sanitizeGameUrl(formData.gameUrl);

    const finalCategory = (isCustomCategory && customCategoryInput.trim())
      ? customCategoryInput.toLowerCase().trim().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
      : (formData.category || 'arcade');

    const finalCategoryName = (isCustomCategory && customCategoryInput.trim())
      ? customCategoryInput.trim()
      : undefined;

    onSave({
      ...game,
      id: (game && (game.id || game._id))
        ? (game.id || game._id)
        : (formData.title.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'game') + '-' + Date.now().toString().slice(-4),
      title: formData.title.trim(),
      category: finalCategory,
      categoryName: finalCategoryName,
      developer: formData.developer.trim(),
      description: formData.description.trim(),
      instructions: formData.instructions.trim(),
      thumbnail: formData.thumbnail.trim(),
      banner: formData.banner.trim() || formData.thumbnail.trim(),
      previewVideo: formData.previewVideo || '',
      gameUrl: cleanedGameUrl,
      tags: processedTags,
      featured: formData.featured,
      tileSize: formData.tileSize || (formData.featured ? '2x2' : '1x1'),
      status: formData.status,
      width: Number(formData.width) || 800,
      height: Number(formData.height) || 600,
      orientation: formData.orientation || (formData.height > formData.width * 1.25 ? 'portrait' : 'landscape'),
      plays: game ? (game.plays || 0) : 0,
      rating: game ? (game.rating || 5.0) : 5.0,
      createdAt: game ? (game.createdAt || new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0]
    });
    onClose();
  };

  const activeVideoUrl = formData.previewVideo || getGamePreviewVideo({ gameUrl: formData.gameUrl, previewVideo: formData.previewVideo });
  const modalVideoSrc = parseVideoSource(activeVideoUrl);

  const currentTagsList = formData.tags
    ? formData.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
    : [];

  const getTilePreviewSize = (ts) => {
    switch (ts) {
      case '2x1': return { width: '220px', height: '110px' };
      case '2x2': return { width: '160px', height: '160px' };
      case 'auto': return { width: '140px', height: '140px' };
      case '1x1':
      default:
        return { width: '130px', height: '130px' };
    }
  };
  const previewSize = getTilePreviewSize(formData.tileSize);

  return (
    <div className="modal-overlay gm-modal-backdrop">
      <div
        className="modal-content game-modal-pro"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="gm-header">
          <div className="gm-header-left">
            <div className="gm-icon-badge">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="6" width="20" height="12" rx="6" />
                <line x1="6" y1="12" x2="10" y2="12" />
                <line x1="8" y1="10" x2="8" y2="14" />
                <line x1="15" y1="13" x2="15.01" y2="13" strokeWidth="3" />
                <line x1="18" y1="11" x2="18.01" y2="11" strokeWidth="3" />
              </svg>
            </div>
            <div className="gm-title-wrap">
              <div className="gm-title-row">  
                <h2 className="gm-title">{game ? 'Edit Game Catalog Entry' : 'Add New Game to Catalog'}</h2>
                {game && <span className="gm-badge-id">ID: {game.id || game._id}</span>}
              </div>
              <p className="gm-subtitle">
                Configure game details, playable source link, responsive resolution, and live homepage card preview
              </p>
            </div>
          </div>
          <button className="gm-close-btn" onClick={onClose} aria-label="Close modal" title="Close (Esc)">
            &times;
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div className="gm-body-layout">

            {/* Left Column: Organized Form Cards */}
            <div className="gm-form-col">

              {/* Card 1: Game Identification */}
              <div className="gm-card-section">
                <div className="gm-card-header">
                  <div className="gm-card-title">
                    <span>🎮</span>
                    <span>General Information</span>
                  </div>
                  <span className="gm-card-hint">Core title, category & developer</span>
                </div>

                <div className="gm-grid-2">
                  <div className="gm-field">
                    <label className="gm-label">
                      <span>Game Title <span className="req">*</span></span>
                    </label>
                    <input
                      type="text"
                      className="gm-input"
                      placeholder="e.g. Subway Surfers, Moto X3M"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      autoFocus
                    />
                  </div>

                  <div className="gm-field">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <label className="gm-label" style={{ margin: 0 }}>Category</label>
                      <button
                        type="button"
                        onClick={() => {
                          const nextState = !isCustomCategory;
                          setIsCustomCategory(nextState);
                          if (!nextState) {
                            if (!formData.category && categories.length > 0) {
                              const first = categories.find(c => c.id !== 'all');
                              if (first) setFormData(prev => ({ ...prev, category: first.id }));
                            }
                          }
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--accent-brand)',
                          cursor: 'pointer',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: 4,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                      >
                        {isCustomCategory ? (
                          <>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="15 18 9 12 15 6" />
                            </svg>
                            <span>Select Existing</span>
                          </>
                        ) : (
                          <>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="12" y1="5" x2="12" y2="19" />
                              <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            <span>+ New Category</span>
                          </>
                        )}
                      </button>
                    </div>

                    {!isCustomCategory ? (
                      <CustomSelect
                        value={formData.category}
                        onChange={(val) => {
                          if (val === '__add_new__') {
                            setIsCustomCategory(true);
                          } else {
                            setFormData(prev => ({ ...prev, category: val }));
                          }
                        }}
                        options={[
                          ...categories.filter(c => c.id !== 'all').map((c) => ({
                            value: c.id,
                            label: c.name.charAt(0).toUpperCase() + c.name.slice(1)
                          })),
                          { value: '__add_new__', label: '+ Add New Category...' }
                        ]}
                        minWidth="100%"
                      />
                    ) : (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <input
                          type="text"
                          className="gm-input"
                          placeholder="Type new category (e.g. Cricket, Racing 3D, Cooking)"
                          value={customCategoryInput}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomCategoryInput(val);
                            const slug = val.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
                            setFormData(prev => ({
                              ...prev,
                              category: slug || val.toLowerCase().trim(),
                              categoryName: val.trim()
                            }));
                          }}
                          autoFocus
                          required
                          style={{ borderColor: 'var(--accent-brand)', flex: 1 }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setIsCustomCategory(false);
                            setCustomCategoryInput('');
                            const first = categories.find(c => c.id !== 'all');
                            if (first) setFormData(prev => ({ ...prev, category: first.id }));
                          }}
                          style={{
                            padding: '8px 12px',
                            borderRadius: 'var(--radius)',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-canvas)',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            fontSize: '0.76rem',
                            fontWeight: 700
                          }}
                          title="Cancel custom category"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="gm-grid-2-equal">
                  <div className="gm-field">
                    <label className="gm-label">
                      <span>Developer / Studio</span>
                      <span className="gm-label-sub">Optional</span>
                    </label>
                    <input
                      type="text"
                      className="gm-input"
                      placeholder="e.g. SYBO Games, MadPuffers"
                      value={formData.developer}
                      onChange={(e) => setFormData({ ...formData, developer: e.target.value })}
                    />
                  </div>

                  <div className="gm-field">
                    <label className="gm-label">
                      <span>How to Play / Instructions</span>
                      <span className="gm-label-sub">Controls help</span>
                    </label>
                    <input
                      type="text"
                      className="gm-input"
                      placeholder="e.g. Use [W A S D] or [Arrow Keys] to move"
                      value={formData.instructions}
                      onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                    />
                  </div>
                </div>

                <div className="gm-field">
                  <label className="gm-label">Description</label>
                  <textarea
                    className="gm-textarea"
                    rows="2"
                    placeholder="Short engaging overview of gameplay, storyline, and objectives..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              {/* Card 2: Playable Source & Canvas Resolution */}
              <div className="gm-card-section">
                <div className="gm-card-header">
                  <div className="gm-card-title">
                    <span>🔗</span>
                    <span>Playable Link & Resolution</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAutoDetectImage()}
                    disabled={isDetecting || !formData.gameUrl.trim()}
                    style={{
                      background: 'rgba(59, 130, 246, 0.1)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      color: '#3b82f6',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: (isDetecting || !formData.gameUrl.trim()) ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      opacity: (!formData.gameUrl.trim() && !isDetecting) ? 0.5 : 1
                    }}
                  >
                    <span>✨</span>
                    <span>{isDetecting ? 'Detecting Source...' : 'Auto-Detect All Details'}</span>
                  </button>
                </div>

                <div className="gm-field">
                  <label className="gm-label">
                    <span>Game URL / Embed Iframe <span className="req">*</span></span>
                    <span className="gm-label-sub">Supports Poki, CrazyGames, GameMonetize, HTML5</span>
                  </label>
                  <input
                    type="text"
                    className="gm-input"
                    placeholder="https://... or <iframe src='...'></iframe>"
                    value={formData.gameUrl}
                    onChange={handleGameUrlChange}
                    onPaste={(e) => {
                      const pasted = e.clipboardData?.getData('text') || '';
                      if (pasted.trim()) handleAutoDetectImage(pasted);
                    }}
                    required
                  />

                  {detectStatus && (
                    <div style={{
                      marginTop: '4px',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      background: detectStatus.type === 'success' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                      color: detectStatus.type === 'success' ? '#16a34a' : '#2563eb',
                      border: `1px solid ${detectStatus.type === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`
                    }}>
                      {detectStatus.text}
                    </div>
                  )}
                </div>

                <div className="gm-grid-2-equal">
                  <div className="gm-field">
                    <label className="gm-label">
                      <span>Native Canvas Dimensions</span>
                      <span className="gm-label-sub">Width × Height</span>
                    </label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="number"
                        className="gm-input"
                        placeholder="800"
                        value={formData.width || ''}
                        onChange={(e) => setFormData({ ...formData, width: Number(e.target.value) || 800 })}
                        style={{ textAlign: 'center', fontWeight: 700 }}
                      />
                      <span style={{ color: 'var(--text-muted, #94a3b8)', fontWeight: 800 }}>×</span>
                      <input
                        type="number"
                        className="gm-input"
                        placeholder="600"
                        value={formData.height || ''}
                        onChange={(e) => setFormData({ ...formData, height: Number(e.target.value) || 600 })}
                        style={{ textAlign: 'center', fontWeight: 700 }}
                      />
                    </div>
                  </div>

                  <div className="gm-field">
                    <label className="gm-label">Quick Resolution Presets</label>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                      <button
                        type="button"
                        className="gm-preset-btn"
                        onClick={() => handleApplyResolutionPreset(800, 600)}
                      >
                        Default (800×600)
                      </button>
                      <button
                        type="button"
                        className="gm-preset-btn"
                        onClick={() => handleApplyResolutionPreset(960, 540)}
                      >
                        16:9 HD (960×540)
                      </button>
                      <button
                        type="button"
                        className="gm-preset-btn"
                        onClick={() => handleApplyResolutionPreset(540, 960)}
                      >
                        Vertical (540×960)
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Media & Quick Tags */}
              <div className="gm-card-section">
                <div className="gm-card-header">
                  <div className="gm-card-title">
                    <span>🖼️</span>
                    <span>Media & Search Tags</span>
                  </div>
                  <span className="gm-card-hint">Thumbnail image, hover preview video, and tags</span>
                </div>

                <div className="gm-field">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="gm-label">
                      <span>Thumbnail Image URL <span className="req">*</span></span>
                    </label>
                    {imageRatioInfo && (
                      <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 700 }}>
                        ✓ {imageRatioInfo.width}×{imageRatioInfo.height} ({imageRatioInfo.ratio}:1)
                      </span>
                    )}
                  </div>
                  <input
                    type="url"
                    className="gm-input"
                    placeholder="https://... (PNG, JPG, WebP)"
                    value={formData.thumbnail}
                    onChange={(e) => {
                      setFormData({ ...formData, thumbnail: e.target.value });
                      detectAndApplyTileSize(e.target.value);
                    }}
                    required
                  />
                </div>

                <div className="gm-field">
                  <label className="gm-label">
                    <span>Hover Video Preview URL</span>
                    <span className="gm-label-sub">Optional (MP4, YouTube, Vimeo, Shorts)</span>
                  </label>
                  <input
                    type="url"
                    className="gm-input"
                    placeholder="e.g. https://...mp4 or https://youtube.com/shorts/..."
                    value={formData.previewVideo}
                    onChange={(e) => setFormData({ ...formData, previewVideo: e.target.value })}
                  />
                </div>

                <div className="gm-field">
                  <label className="gm-label">
                    <span>Tags (Comma-separated)</span>
                    <span className="gm-label-sub">Click quick tags below to toggle</span>
                  </label>
                  <input
                    type="text"
                    className="gm-input"
                    placeholder="e.g. Arcade, 3D, Action, Racing"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  />

                  <div className="gm-quick-tags">
                    {QUICK_TAG_SUGGESTIONS.map(tag => {
                      const isActive = currentTagsList.includes(tag.toLowerCase());
                      return (
                        <button
                          key={tag}
                          type="button"
                          className={`gm-quick-tag ${isActive ? 'is-active' : ''}`}
                          onClick={() => handleToggleQuickTag(tag)}
                        >
                          {isActive ? `✓ ${tag}` : `+ ${tag}`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Card 4: Publishing & Spotlight */}
              <div className="gm-card-section">
                <div className="gm-card-header">
                  <div className="gm-card-title">
                    <span>🚀</span>
                    <span>Catalog Status & Spotlight</span>
                  </div>
                  <span className="gm-card-hint">Visibility & hero showcase options</span>
                </div>

                <div className="gm-field">
                  <label className="gm-label">Publication Status</label>
                  <div className="gm-status-group">
                    {[
                      { id: 'active', label: 'Active (Live)', icon: '🟢', class: 'status-active' },
                      { id: 'maintenance', label: 'Maintenance', icon: '🟠', class: 'status-maintenance' },
                      { id: 'draft', label: 'Draft (Hidden)', icon: '⚪', class: 'status-draft' }
                    ].map(st => (
                      <button
                        key={st.id}
                        type="button"
                        className={`gm-status-pill ${formData.status === st.id ? `active ${st.class}` : ''}`}
                        onClick={() => setFormData({ ...formData, status: st.id })}
                      >
                        <span>{st.icon}</span>
                        <span>{st.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  className={`gm-featured-box ${formData.featured ? 'is-featured' : ''}`}
                  onClick={() => setFormData({ ...formData, featured: !formData.featured })}
                >
                  <div className="gm-featured-info">
                    <span style={{ fontSize: '1.4rem' }}>{formData.featured ? '⭐' : '☆'}</span>
                    <div>
                      <div className="gm-featured-title">Mark as Spotlight / Hero Featured Game</div>
                      <div className="gm-featured-desc">
                        Highlighted prominently on homepage banners and tops of categories
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: '#f59e0b', cursor: 'pointer' }}
                  />
                </div>
              </div>

            </div>

            {/* Right Column: Sticky Live Poki Card Preview & Diagnostics */}
            <div className="gm-preview-col">

              {/* Live Poki Card Box */}
              <div className="gm-preview-box">
                <div className="gm-preview-head">
                  <span className="gm-preview-title">Homepage Card Preview</span>
                  <button
                    type="button"
                    onClick={() => detectAndApplyTileSize(formData.thumbnail)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent-brand, #3b82f6)',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title="Auto-detect optimal tile size from thumbnail image"
                  >
                    <span>🔄 Refresh</span>
                  </button>
                </div>

                {/* Card Size Selector Buttons */}
                <div className="gm-tile-selector">
                  {TILE_SIZES.map(ts => {
                    const isSel = (formData.tileSize || 'auto') === ts.id;
                    return (
                      <button
                        key={ts.id}
                        type="button"
                        className={`gm-tile-btn ${isSel ? 'is-active' : ''}`}
                        onClick={() => setFormData({ ...formData, tileSize: ts.id })}
                      >
                        <div style={{ fontSize: '0.8rem', fontWeight: 800 }}>{ts.label}</div>
                        <div style={{ fontSize: '0.62rem', color: isSel ? 'var(--accent-brand, #3b82f6)' : 'var(--text-muted, #64748b)' }}>
                          {ts.sub}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Live Card Interactive Display */}
                <div
                  onMouseEnter={() => {
                    setIsModalHovered(true);
                    if (modalVideoRef.current && modalVideoSrc?.type === 'direct') {
                      try {
                        modalVideoRef.current.currentTime = 0;
                        const p = modalVideoRef.current.play();
                        if (p !== undefined) p.catch(() => { });
                      } catch { }
                    }
                  }}
                  onMouseLeave={() => {
                    setIsModalHovered(false);
                    if (modalVideoRef.current && modalVideoSrc?.type === 'direct') {
                      modalVideoRef.current.pause();
                      try { modalVideoRef.current.currentTime = 0; } catch { }
                    }
                  }}
                  style={{
                    position: 'relative',
                    width: previewSize.width,
                    height: previewSize.height,
                    borderRadius: '18px',
                    overflow: 'hidden',
                    border: '2px solid rgba(255, 255, 255, 0.15)',
                    background: '#090e1a',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
                    cursor: 'pointer',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <img
                    src={formData.thumbnail || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400'}
                    alt="Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: 'inherit' }}
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400'; }}
                  />

                  {modalVideoSrc?.type === 'direct' && (
                    <video
                      ref={modalVideoRef}
                      src={modalVideoSrc.url}
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
                        opacity: isModalHovered ? 1 : 0,
                        transition: 'opacity 0.25s ease',
                        pointerEvents: 'none',
                        zIndex: 2
                      }}
                    />
                  )}

                  {isModalHovered && (modalVideoSrc?.type === 'youtube' || modalVideoSrc?.type === 'vimeo') && (
                    <iframe
                      src={modalVideoSrc.embedUrl}
                      title="Video preview"
                      allow="autoplay; encrypted-media"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        border: 0,
                        pointerEvents: 'none',
                        opacity: 1,
                        zIndex: 2,
                        transform: 'scale(1.25)',
                        transformOrigin: 'center center'
                      }}
                    />
                  )}

                  {/* Title overlay on hover */}
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    insetInline: 0,
                    padding: '16px 8px 6px',
                    background: 'linear-gradient(to top, rgba(15, 23, 42, 0.85) 0%, transparent 100%)',
                    zIndex: 3,
                    textAlign: 'center'
                  }}>
                    <span style={{
                      color: '#ffffff',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: 'block'
                    }}>
                      {formData.title || 'Untitled Game'}
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: '0.7rem', color: activeVideoUrl ? '#16a34a' : 'var(--text-muted, #94a3b8)', fontWeight: 600 }}>
                  {activeVideoUrl ? '🎬 Hover over card to test video preview' : '📷 Static thumbnail preview (hover to test)'}
                </div>
              </div>

              {/* Checklist & Readiness Card */}
              <div className="gm-checklist-card">
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-heading, #0f172a)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Catalog Readiness Checklist
                </div>

                <div className="gm-checklist-item">
                  <span>Playable URL Source:</span>
                  <span className="gm-checklist-status" style={{ color: formData.gameUrl ? '#16a34a' : '#94a3b8' }}>
                    {formData.gameUrl ? '✓ Connected' : '○ Missing'}
                  </span>
                </div>

                <div className="gm-checklist-item">
                  <span>Cover Thumbnail:</span>
                  <span className="gm-checklist-status" style={{ color: formData.thumbnail ? '#16a34a' : '#94a3b8' }}>
                    {formData.thumbnail ? '✓ Set' : '○ Missing'}
                  </span>
                </div>

                <div className="gm-checklist-item">
                  <span>Hover Video Preview:</span>
                  <span className="gm-checklist-status" style={{ color: activeVideoUrl ? '#16a34a' : '#94a3b8' }}>
                    {activeVideoUrl ? '✓ Active' : '○ Optional'}
                  </span>
                </div>

                <div className="gm-checklist-item">
                  <span>Visibility Status:</span>
                  <span className="gm-checklist-status" style={{
                    color: formData.status === 'active' ? '#16a34a' : (formData.status === 'maintenance' ? '#f59e0b' : '#64748b')
                  }}>
                    {formData.status.toUpperCase()}
                  </span>
                </div>
              </div>

            </div>

          </div>

          {/* Footer Bar */}
          <div className="gm-footer">
            <div className="gm-footer-tip">
              <span>💡 Press <kbd>Esc</kbd> to cancel, <kbd>Enter</kbd> to save</span>
            </div>
            <div className="gm-footer-actions">
              <button
                type="button"
                className="admin-btn secondary"
                onClick={onClose}
                style={{ padding: '9px 18px', fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="admin-btn primary"
                style={{
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  padding: '9px 24px',
                  borderRadius: '9px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)'
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                <span>{game ? 'Save Game Changes' : 'Publish Game to Catalog'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

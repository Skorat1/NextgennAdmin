import React, { useState, useRef } from 'react';
import { categoriesApi } from '../services/api';
import { CONFIG } from '../config';

// ─── Default Category Icon (Fallback) ─────────────────────────────────────────
const DefaultCategoryIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="6" y1="12" x2="10" y2="12" />
    <line x1="8" y1="10" x2="8" y2="14" />
    <line x1="15" y1="13" x2="15.01" y2="13" strokeWidth="3" />
    <line x1="18" y1="11" x2="18.01" y2="11" strokeWidth="3" />
    <rect x="2" y="6" width="20" height="12" rx="6" />
  </svg>
);

// ─── Helper to Check if Value is an Image URL / Path ─────────────────────────
function isImageUrl(val) {
  if (!val || typeof val !== 'string') return false;
  const str = val.trim();
  return (
    str.startsWith('http://') ||
    str.startsWith('https://') ||
    str.startsWith('data:image') ||
    str.startsWith('/uploads') ||
    /\.(png|jpe?g|webp|svg|gif|avif)$/i.test(str)
  );
}

// ─── Helper to Resolve Full Preview URL ──────────────────────────────────────
function getCategoryDisplayUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const backendBase = CONFIG.API_BASE.replace(/\/api\/?$/, '');
  return `${backendBase}${url.startsWith('/') ? '' : '/'}${url}`;
}

// ─── Client-side Image Compression / Prep Helper ─────────────────────────────
function compressImageFile(file) {
  return new Promise((resolve, reject) => {
    if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
      const reader = new FileReader();
      reader.onload = (e) => resolve({ dataUrl: e.target.result, filename: file.name });
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX_SIZE = 512;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/webp', 0.9);
        resolve({ dataUrl, filename: file.name.replace(/\.[^.]+$/, '') + '.webp' });
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Category Image Uploader Component ────────────────────────────────────────
function CategoryImageUploader({ image, onChange }) {
  const [tab, setTab] = useState(image && image.startsWith('http') && !image.includes('/uploads/') ? 'url' : 'upload');
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  const displayUrl = getCategoryDisplayUrl(image);

  const handleProcessFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, WEBP, GIF, SVG).');
      return;
    }

    setUploading(true);
    setUploadError('');

    try {
      const { dataUrl, filename } = await compressImageFile(file);

      let finalUrl = dataUrl;
      try {
        const res = await categoriesApi.uploadImage(dataUrl, filename);
        if (res && res.url) {
          finalUrl = res.url;
        }
      } catch (uploadErr) {
        console.warn('Backend category image upload fallback to data URL:', uploadErr.message);
      }

      onChange(finalUrl);
    } catch (err) {
      console.error('Image processing failed:', err);
      setUploadError(err.message || 'Failed to process image');
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleProcessFile(e.target.files[0]);
    }
  };

  return (
    <div className="form-group" style={{ gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <label className="form-label" style={{ margin: 0 }}>
          <span>Category Image / Icon</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'none' }}>
            PNG, SVG, JPG, WEBP
          </span>
        </label>

        {/* Upload Mode Selector */}
        <div style={{ display: 'flex', background: 'var(--bg-canvas)', borderRadius: 8, padding: 2, border: '1px solid var(--border-color)' }}>
          <button
            type="button"
            onClick={() => setTab('upload')}
            style={{
              padding: '3px 10px',
              fontSize: '0.72rem',
              fontWeight: 700,
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              background: tab === 'upload' ? 'var(--accent-brand)' : 'transparent',
              color: tab === 'upload' ? '#ffffff' : 'var(--text-muted)',
              transition: 'all 0.15s ease'
            }}
          >
            Upload File
          </button>
          <button
            type="button"
            onClick={() => setTab('url')}
            style={{
              padding: '3px 10px',
              fontSize: '0.72rem',
              fontWeight: 700,
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              background: tab === 'url' ? 'var(--accent-brand)' : 'transparent',
              color: tab === 'url' ? '#ffffff' : 'var(--text-muted)',
              transition: 'all 0.15s ease'
            }}
          >
            Image URL
          </button>
        </div>
      </div>

      {uploadError && (
        <div style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--accent-rose)', borderRadius: 8, color: 'var(--accent-rose)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{uploadError}</span>
        </div>
      )}

      {/* Selected Image Preview with remove button */}
      {image ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 14px',
          background: 'var(--bg-canvas)',
          border: '1.5px solid var(--border-color)',
          borderRadius: 10
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 8,
            overflow: 'hidden',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <img
              src={displayUrl}
              alt="Category Preview"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-heading)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {image.startsWith('data:') ? 'Custom Upload (WebP)' : image.split('/').pop()}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
              Image Attached ✓
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              onClick={() => {
                if (fileInputRef.current) fileInputRef.current.value = '';
                if (tab === 'upload' && fileInputRef.current) fileInputRef.current.click();
              }}
              style={{
                padding: '5px 10px',
                fontSize: '0.74rem',
                fontWeight: 600,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid var(--border-color)',
                borderRadius: 6,
                color: 'var(--text-body)',
                cursor: 'pointer'
              }}
            >
              Change
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              style={{
                padding: '5px 8px',
                fontSize: '0.74rem',
                fontWeight: 700,
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 6,
                color: 'var(--accent-rose)',
                cursor: 'pointer'
              }}
              title="Remove Image"
            >
              ✕
            </button>
          </div>
        </div>
      ) : (
        /* Empty State: Upload Dropzone or URL Input */
        tab === 'upload' ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px 16px',
              border: `2px dashed ${isDragging ? 'var(--accent-brand)' : 'var(--border-color)'}`,
              borderRadius: 12,
              background: isDragging ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-canvas)',
              cursor: uploading ? 'wait' : 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'center',
              gap: 8
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
              onChange={handleFileInputChange}
              style={{ display: 'none' }}
              disabled={uploading}
            />

            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgba(59, 130, 246, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-brand)'
            }}>
              {uploading ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                  <line x1="12" y1="2" x2="12" y2="6" />
                  <line x1="12" y1="18" x2="12" y2="22" />
                  <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                  <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                  <line x1="2" y1="12" x2="6" y2="12" />
                  <line x1="18" y1="12" x2="22" y2="12" />
                  <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
                  <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              )}
            </div>

            <div>
              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                {uploading ? 'Processing Image...' : isDragging ? 'Drop Image Here' : 'Click to Upload or Drag & Drop'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Square icon (PNG, JPG, WEBP, SVG)
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="url"
              className="form-input"
              placeholder="https://example.com/category-icon.png"
              value={image}
              onChange={(e) => onChange(e.target.value)}
              style={{ fontSize: '0.84rem' }}
            />
          </div>
        )
      )}
    </div>
  );
}

// ─── Render Category Thumbnail in List Table ──────────────────────────────────
function AdminCategoryThumbImage({ src, name, size, color }) {
  const [failed, setFailed] = useState(false);
  if (failed || !src) {
    return <DefaultCategoryIcon size={size} color={color || 'var(--accent-brand)'} />;
  }
  return (
    <img
      src={src}
      alt={name || 'Category'}
      style={{
        width: '100%',
        height: '100%',
        maxWidth: size + 6,
        maxHeight: size + 6,
        objectFit: 'contain',
        display: 'block',
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.12))',
        imageRendering: '-webkit-optimize-contrast'
      }}
      onError={() => setFailed(true)}
    />
  );
}

function renderCategoryThumb(cat, size = 24) {
  const imgUrl = cat?.image || (cat?.icon && isImageUrl(cat.icon) ? cat.icon : null);
  if (imgUrl) {
    const displayUrl = getCategoryDisplayUrl(imgUrl);
    return <AdminCategoryThumbImage src={displayUrl} name={cat?.name} size={size} color={cat?.color} />;
  }
  return <DefaultCategoryIcon size={size} color={cat?.color || 'var(--accent-brand)'} />;
}

// ─── Main CategoriesView Component ───────────────────────────────────────────
export default function CategoriesView({
  categories = [],
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  games = []
}) {
  const [editingCatId, setEditingCatId] = useState(null);
  const [newCatName, setNewCatName] = useState('');
  const [catImage, setCatImage] = useState('');
  const [newCatColor, setNewCatColor] = useState('#3b82f6');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Trigger editing a category
  const handleStartEdit = (cat) => {
    const catId = cat.id || cat._id;
    setEditingCatId(catId);
    setNewCatName(cat.name || '');
    setCatImage(cat.image || (isImageUrl(cat.icon) ? cat.icon : ''));
    setNewCatColor(cat.color || '#3b82f6');

    // Smooth scroll to form on mobile/small displays
    const formEl = document.getElementById('category-form-panel');
    if (formEl && window.innerWidth < 1024) {
      formEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Cancel edit mode
  const handleCancelEdit = () => {
    setEditingCatId(null);
    setNewCatName('');
    setCatImage('');
    setNewCatColor('#3b82f6');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingCatId) {
        // Updating existing category
        if (onUpdateCategory) {
          await onUpdateCategory(editingCatId, {
            name: newCatName.trim(),
            image: catImage || '',
            icon: catImage || '',
            color: newCatColor
          });
        }
        handleCancelEdit();
      } else {
        // Creating new category
        const id = newCatName.toLowerCase().replace(/[^a-z0-9]/g, '-');
        if (categories.some(c => (c.id || c._id) === id)) {
          alert('Category already exists!');
          return;
        }

        if (onAddCategory) {
          await onAddCategory({
            id,
            name: newCatName.trim(),
            image: catImage || '',
            icon: catImage || '',
            count: 0,
            color: newCatColor
          });
        }

        setNewCatName('');
        setCatImage('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="categories-view-grid">
      {/* Category List */}
      <div className="glass-panel">
        <div className="panel-header" style={{ flexWrap: 'wrap', gap: 14 }}>
          <div>
            <h2 className="panel-title">
              <span style={{ color: 'var(--accent-cyan)', display: 'inline-flex', alignItems: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                  <line x1="7" y1="7" x2="7.01" y2="7" strokeWidth="2.5" />
                </svg>
              </span>
              <span>Active Game Categories</span>
            </h2>
            <span className="panel-subtitle">Manage catalog genres, icons, and theme accents</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div className="search-bar" style={{ maxWidth: 220, height: 36, padding: '0 10px' }}>
              <span className="search-icon" style={{ display: 'flex', alignItems: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="text"
                className="search-input"
                placeholder="Filter categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ fontSize: '0.82rem' }}
              />
            </div>
            <span className="live-indicator">
              <span>{categories.length} Categories</span>
            </span>
          </div>
        </div>

        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Category Name</th>
                <th>Theme Accent</th>
                <th>Catalog Games</th>
                <th>ID Key</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const filtered = categories.filter((c) => {
                  if (!c) return false;
                  if (!searchQuery.trim()) return true;
                  const q = searchQuery.toLowerCase().trim();
                  return ((c.name && c.name.toLowerCase().includes(q)) || (c.id && String(c.id).toLowerCase().includes(q)));
                });

                const sortedCategories = [...filtered].sort((a, b) => {
                  const aId = (a?.id || a?._id || '').toLowerCase();
                  const bId = (b?.id || b?._id || '').toLowerCase();
                  if (aId === 'all') return -1;
                  if (bId === 'all') return 1;
                  return (a?.name || '').localeCompare(b?.name || '');
                });

                if (sortedCategories.length === 0) {
                  return (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
                        No categories found matching "{searchQuery}"
                      </td>
                    </tr>
                  );
                }

                return sortedCategories.map((cat) => {
                  const catId = cat.id || cat._id;
                  const isEditingThis = editingCatId === catId;
                  const count = catId === 'all' 
                    ? games.length 
                    : games.filter(g => (g.category === cat.id || (cat.name && g.category && g.category.toLowerCase() === cat.name.toLowerCase()))).length;

                  return (
                    <tr 
                      key={catId}
                      style={isEditingThis ? {
                        background: 'rgba(59, 130, 246, 0.08)',
                        outline: '1.5px solid var(--accent-brand)',
                        borderRadius: 8
                      } : {}}
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: 'var(--bg-canvas)',
                            border: isEditingThis ? '1.5px solid var(--accent-brand)' : '1px solid var(--border-color)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: cat.color || 'var(--accent-brand)',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                            overflow: 'hidden'
                          }}>
                            {renderCategoryThumb(cat, 22)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-heading)', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span>{cat.name}</span>
                              {isEditingThis && (
                                <span style={{ fontSize: '0.66rem', color: 'var(--accent-brand)', background: 'rgba(59, 130, 246, 0.15)', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                                  Editing
                                </span>
                              )}
                            </div>
                            {catId === 'all' && (
                              <span style={{ fontSize: '0.68rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>System Default</span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span 
                            style={{ 
                              width: 16, 
                              height: 16, 
                              borderRadius: '50%', 
                              background: cat.color || '#3b82f6',
                              border: '1px solid rgba(0, 0, 0, 0.1)'
                            }} 
                          />
                          <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                            {cat.color || '#3b82f6'}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-heading)' }}>
                          {count} games
                        </span>
                      </td>

                      <td>
                        <code style={{ background: 'rgba(255,255,255,0.06)', padding: '3px 8px', borderRadius: 4, fontSize: '0.78rem', color: 'var(--text-body)' }}>
                          {catId}
                        </code>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                          {/* Edit Category Button */}
                          <button
                            className="icon-action-btn edit"
                            title={`Edit ${cat.name}`}
                            onClick={() => handleStartEdit(cat)}
                            style={{
                              background: isEditingThis ? 'var(--accent-brand)' : undefined,
                              color: isEditingThis ? '#ffffff' : undefined,
                              borderColor: isEditingThis ? 'var(--accent-brand)' : undefined
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>

                          {/* Delete Category Button */}
                          {catId !== 'all' && (
                            <button
                              className="icon-action-btn delete"
                              title="Delete Category"
                              onClick={() => {
                                if (window.confirm(`Delete category "${cat.name}"?`)) {
                                  if (editingCatId === catId) handleCancelEdit();
                                  onDeleteCategory(catId);
                                }
                              }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Category Form */}
      <div className="glass-panel" id="category-form-panel" style={{ position: 'sticky', top: 20 }}>
        <div className="panel-header">
          <div>
            <h2 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{editingCatId ? 'Edit Category' : 'Create Category'}</span>
              {editingCatId && (
                <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: 12, background: 'var(--accent-brand)', color: '#fff', fontWeight: 700 }}>
                  Editing
                </span>
              )}
            </h2>
            <span className="panel-subtitle">
              {editingCatId 
                ? `Update details and image for "${newCatName || editingCatId}"`
                : 'Add a new genre tag with custom image icon'}
            </span>
          </div>

          {editingCatId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              style={{
                padding: '4px 10px',
                fontSize: '0.74rem',
                fontWeight: 600,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid var(--border-color)',
                borderRadius: 6,
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
              title="Cancel editing and create new category"
            >
              Cancel
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {editingCatId && (
            <div className="form-group">
              <label className="form-label">Category ID Key</label>
              <input
                type="text"
                className="form-input"
                value={editingCatId}
                disabled
                style={{ opacity: 0.65, cursor: 'not-allowed', fontFamily: 'var(--font-mono)' }}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Category Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Battle Royale, RPG, Strategy"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              required
            />
          </div>

          {/* Category Image Uploader Component */}
          <CategoryImageUploader
            image={catImage}
            onChange={setCatImage}
          />

          <div className="form-group">
            <label className="form-label">Theme Accent Color</label>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input
                type="color"
                value={newCatColor}
                onChange={(e) => setNewCatColor(e.target.value)}
                style={{ width: 44, height: 40, border: 'none', borderRadius: 8, cursor: 'pointer', background: 'transparent' }}
              />
              <input
                type="text"
                className="form-input"
                value={newCatColor}
                onChange={(e) => setNewCatColor(e.target.value)}
                style={{ flex: 1, fontFamily: 'var(--font-mono)' }}
              />
            </div>
          </div>

          {/* Live Preview Badge */}
          <div style={{ padding: '14px', background: 'var(--bg-canvas)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>LIVE PREVIEW BADGE</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '6px 14px', borderRadius: 20, background: `${newCatColor}18`, border: `1.5px solid ${newCatColor}` }}>
              <span style={{ color: newCatColor, display: 'inline-flex', alignItems: 'center', width: 20, height: 20, justifyContent: 'center' }}>
                {catImage ? (
                  <img
                    src={getCategoryDisplayUrl(catImage)}
                    alt="preview"
                    style={{ width: 20, height: 20, objectFit: 'contain', borderRadius: 4 }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : (
                  <DefaultCategoryIcon size={18} color={newCatColor} />
                )}
              </span>
              <span style={{ fontWeight: 700, color: 'var(--text-heading)', fontSize: '0.88rem' }}>{newCatName || 'Category Name'}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            <button
              type="submit"
              className="admin-btn primary"
              disabled={isSubmitting}
              style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <span>{isSubmitting ? 'Saving...' : editingCatId ? 'Save & Update Category' : 'Create & Register Category'}</span>
            </button>
            {editingCatId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="admin-btn secondary"
                style={{ padding: '0 16px' }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

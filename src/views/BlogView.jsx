import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { blogApi } from '../services/api';
import { CONFIG } from '../config';

// ─── Inline SVG Icons (Professional Vector System) ──────────────────────────
const Icons = {
  blog: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
      <path d="M18 14h-8" />
      <path d="M15 18h-5" />
      <path d="M10 6h8v4h-8V6Z" />
    </svg>
  ),
  edit: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  trash: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  star: (filled = false, size = 16) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? '#f59e0b' : 'none'}
      stroke={filled ? '#f59e0b' : 'currentColor'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  refresh: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  ),
  plus: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  search: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  check: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  alert: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  spinner: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
      <line x1="2" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
    </svg>
  ),
  upload: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  image: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  eye: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  pen: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  ),
  link: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
  code: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  ),
  quote: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
      <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
    </svg>
  ),
  list: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" strokeWidth="3" />
      <line x1="3" y1="12" x2="3.01" y2="12" strokeWidth="3" />
      <line x1="3" y1="18" x2="3.01" y2="18" strokeWidth="3" />
    </svg>
  ),
  views: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  calendar: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  user: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  clock: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  save: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  ),
  send: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  emptyDocument: (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  close: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
};

const GRADIENT_PRESETS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)',
];

const SUGGESTED_TAGS = ['Gaming', 'Tips', 'News', 'Guides', 'Action', 'Updates', 'Browser Games', 'Top 10'];

const EMPTY_FORM = {
  title: '',
  excerpt: '',
  content: '',
  author: 'NextGenn Editorial',
  tags: '',
  gradient: GRADIENT_PRESETS[0],
  image: '',
  published: true,
  featured: false,
  readTime: '3 min read',
};

// ─── Client-side Image Compression Helper ────────────────────────────────────
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
        const MAX_WIDTH = 1600;
        const MAX_HEIGHT = 1000;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/webp', 0.86);
        const cleanName = file.name.replace(/\.[^/.]+$/, '') + '.webp';
        resolve({ dataUrl, filename: cleanName, width, height });
      };
      img.onerror = () => {
        resolve({ dataUrl: e.target.result, filename: file.name });
      };
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Shared Blog Image Display URL Helper ────────────────────────────────────
function getBlogDisplayUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const backendBase = (CONFIG?.API_BASE || '').replace(/\/api\/?$/, '');
  return `${backendBase}${url.startsWith('/') ? '' : '/'}${url}`;
}

// ─── Markdown Preview Renderer ────────────────────────────────────────────────
function MarkdownPreview({ content = '' }) {
  if (!content.trim()) {
    return (
      <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '32px 16px', textAlign: 'center' }}>
        No content written yet. Switch to the editor to write markdown text.
      </div>
    );
  }

  const lines = content.split('\n');
  return (
    <div className="admin-blog-preview-content" style={{ color: 'var(--text-body)', lineHeight: 1.7, fontSize: '0.92rem' }}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} style={{ height: 12 }} />;

        // Markdown Image: ![alt](url)
        const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
        if (imgMatch) {
          const alt = imgMatch[1];
          const src = getBlogDisplayUrl(imgMatch[2]);
          return (
            <figure key={idx} style={{ margin: '18px 0', textAlign: 'center' }}>
              <img
                src={src}
                alt={alt || 'Blog illustration'}
                style={{
                  maxWidth: '100%',
                  maxHeight: '440px',
                  borderRadius: 12,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                  display: 'block',
                  margin: '0 auto',
                  objectFit: 'cover'
                }}
              />
              {alt && (
                <figcaption style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 6, fontStyle: 'italic' }}>
                  {alt}
                </figcaption>
              )}
            </figure>
          );
        }

        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} style={{ color: 'var(--text-heading)', fontWeight: 800, fontSize: '1.05rem', margin: '18px 0 8px' }}>
              {trimmed.slice(4)}
            </h4>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={idx} style={{ color: 'var(--text-heading)', fontWeight: 800, fontSize: '1.2rem', margin: '22px 0 10px', borderBottom: '1px solid var(--border-color)', paddingBottom: 6 }}>
              {trimmed.slice(3)}
            </h3>
          );
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h2 key={idx} style={{ color: 'var(--text-heading)', fontWeight: 900, fontSize: '1.35rem', margin: '24px 0 12px' }}>
              {trimmed.slice(2)}
            </h2>
          );
        }
        if (trimmed.startsWith('> ')) {
          return (
            <blockquote key={idx} style={{ borderLeft: '3px solid var(--accent-brand)', margin: '12px 0', padding: '6px 14px', background: 'rgba(59, 130, 246, 0.05)', color: 'var(--text-heading)', fontStyle: 'italic', borderRadius: '0 8px 8px 0' }}>
              {trimmed.slice(2)}
            </blockquote>
          );
        }
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={idx} style={{ display: 'flex', gap: 8, margin: '4px 0 4px 12px' }}>
              <span style={{ color: 'var(--accent-brand)', fontWeight: 900 }}>•</span>
              <span>{trimmed.slice(2)}</span>
            </div>
          );
        }

        // Inline image check
        if (/!\[.*?\]\(.*?\)/.test(trimmed)) {
          const parts = trimmed.split(/(!\[.*?\]\(.*?\))/g);
          return (
            <div key={idx} style={{ margin: '14px 0', textAlign: 'center' }}>
              {parts.map((p, pi) => {
                const m = p.match(/^!\[(.*?)\]\((.*?)\)$/);
                if (m) {
                  return (
                    <img
                      key={pi}
                      src={getBlogDisplayUrl(m[2])}
                      alt={m[1] || ''}
                      style={{ maxWidth: '100%', maxHeight: '420px', borderRadius: 10, margin: '6px auto', display: 'block' }}
                    />
                  );
                }
                return <span key={pi}>{p}</span>;
              })}
            </div>
          );
        }

        return <p key={idx} style={{ margin: '6px 0' }}>{trimmed}</p>;
      })}
    </div>
  );
}

// ─── Header Image Uploader Component ──────────────────────────────────────────
function ImageUploader({ image, onChange, gradient }) {
  const [tab, setTab] = useState(image && image.startsWith('http') && !image.includes('/uploads/') ? 'url' : 'upload');
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  const displayUrl = getBlogDisplayUrl(image);

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
        const res = await blogApi.uploadImage(dataUrl, filename);
        if (res && res.url) {
          finalUrl = res.url;
        }
      } catch (uploadErr) {
        console.warn('Backend image upload fallback to data URL:', uploadErr.message);
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
          <span>Header Cover Image</span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'none' }}>
            Recommended: 1200 × 630 px
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
        <div style={{
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          color: '#ef4444',
          borderRadius: 8,
          padding: '8px 12px',
          fontSize: '0.8rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <span style={{ display: 'flex' }}>{Icons.alert}</span>
          <span>{uploadError}</span>
        </div>
      )}

      {/* When Image Exists: Show Live Banner Preview Card */}
      {image ? (
        <div style={{
          position: 'relative',
          borderRadius: 12,
          overflow: 'hidden',
          border: '1.5px solid var(--border-color)',
          background: gradient || 'var(--bg-canvas)',
          height: 180,
          boxShadow: '0 4px 14px rgba(0,0,0,0.06)'
        }}>
          <img
            src={displayUrl}
            alt="Post Header Preview"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />

          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(15,23,42,0.88) 0%, rgba(15,23,42,0.2) 60%, transparent 100%)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            padding: '14px 16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                background: 'rgba(16, 185, 129, 0.95)',
                color: '#fff',
                fontSize: '0.72rem',
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: 6,
                letterSpacing: '0.03em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}>
                {Icons.check}
                <span>Image Attached</span>
              </span>
              <span style={{ color: '#e2e8f0', fontSize: '0.75rem', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {image.startsWith('data:') ? 'Custom Compressed (WebP)' : image.split('/').pop()}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.25)',
                  background: 'rgba(255,255,255,0.18)',
                  backdropFilter: 'blur(6px)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                {Icons.upload}
                <span>Replace</span>
              </button>
              <button
                type="button"
                onClick={() => onChange('')}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#ef4444',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5
                }}
              >
                {Icons.trash}
                <span>Remove</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State: Upload Dropzone or URL Input */
        tab === 'upload' ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: isDragging ? '2px dashed var(--accent-brand)' : '2px dashed var(--border-color)',
              background: isDragging ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-canvas)',
              borderRadius: 12,
              padding: '28px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'rgba(59, 130, 246, 0.1)',
              color: 'var(--accent-brand)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {uploading ? Icons.spinner : Icons.image}
            </div>

            <div>
              <div style={{ color: 'var(--text-heading)', fontWeight: 700, fontSize: '0.9rem' }}>
                {uploading ? 'Processing Image...' : isDragging ? 'Drop Image Here' : 'Click to Upload or Drag & Drop'}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.76rem', marginTop: 3 }}>
                PNG, JPG, WEBP, GIF or SVG up to 10MB (client-side compressed to WebP)
              </div>
            </div>

            <button
              type="button"
              disabled={uploading}
              style={{
                marginTop: 6,
                padding: '6px 16px',
                borderRadius: 8,
                border: '1px solid var(--border-color)',
                background: 'var(--bg-card)',
                color: 'var(--text-heading)',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              {Icons.upload}
              <span>Browse Device</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ position: 'relative' }}>
              <input
                type="url"
                className="form-input"
                value={image}
                onChange={(e) => onChange(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              Enter a direct image link from Unsplash, Imgur, or your CDN storage.
            </span>
          </div>
        )
      )}

      {/* Hidden native file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
      />
    </div>
  );
}

// ─── Post Form Modal (Create / Edit) ──────────────────────────────────────────
function PostFormModal({ post, onClose, onSave }) {
  const [form, setForm] = useState(() =>
    post
      ? { ...EMPTY_FORM, ...post, tags: Array.isArray(post.tags) ? post.tags.join(', ') : (post.tags || '') }
      : { ...EMPTY_FORM }
  );
  const [activeTab, setActiveTab] = useState('edit'); // 'edit' or 'preview'
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploadingInline, setUploadingInline] = useState(false);
  const contentTextareaRef = useRef(null);
  const inlineFileInputRef = useRef(null);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleInlineImageFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WEBP, GIF, SVG).');
      return;
    }
    setUploadingInline(true);
    setError('');
    try {
      const { dataUrl, filename } = await compressImageFile(file);
      let finalUrl = dataUrl;
      try {
        const res = await blogApi.uploadImage(dataUrl, filename);
        if (res && res.url) {
          finalUrl = res.url;
        }
      } catch (uploadErr) {
        console.warn('Fallback to data URL for inline image:', uploadErr);
      }
      const altText = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') || 'Image';
      insertMarkdown(`\n\n![${altText}](`, `${finalUrl})\n\n`, '');
    } catch (err) {
      console.error('Failed to upload inline image:', err);
      setError('Failed to upload image: ' + (err.message || 'Unknown error'));
    } finally {
      setUploadingInline(false);
      if (inlineFileInputRef.current) inlineFileInputRef.current.value = '';
    }
  };

  const handleInsertImageUrl = () => {
    const url = window.prompt('Enter Image URL (https://...):');
    if (url && url.trim()) {
      insertMarkdown('\n\n![Image](', `${url.trim()})\n\n`, '');
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!form.title.trim()) {
      setError('Please provide a post title.');
      return;
    }
    setSaving(true);
    setError('');

    try {
      const payload = {
        ...form,
        title: form.title.trim(),
        author: form.author.trim() || 'NextGenn Editorial',
        readTime: form.readTime.trim() || '3 min read',
        excerpt: form.excerpt.trim(),
        content: form.content.trim(),
        published: Boolean(form.published !== false),
        featured: Boolean(form.featured),
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : []
      };
      await onSave(payload);
      onClose();
    } catch (e) {
      setError(e.message || 'Save failed. Please check inputs and database connection.');
    } finally {
      setSaving(false);
    }
  };

  const insertMarkdown = (prefix, suffix = '', defaultText = '') => {
    const el = contentTextareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const current = form.content || '';
    const selected = current.substring(start, end) || defaultText;
    const updated = current.substring(0, start) + prefix + selected + suffix + current.substring(end);
    set('content', updated);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 0);
  };

  const handleAddTag = (tag) => {
    const existing = form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    if (!existing.includes(tag)) {
      const updated = [...existing, tag].join(', ');
      set('tags', updated);
    }
  };

  const parsedTags = form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

  return (
    <div className="modal-overlay">
      <div
        className="modal-content"
        style={{
          maxWidth: '840px',
          width: '95%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '16px',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header" style={{ padding: '18px 24px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.15) 100%)',
              color: 'var(--accent-brand)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(59, 130, 246, 0.2)'
            }}>
              {Icons.blog}
            </div>
            <div>
              <h2 className="modal-title" style={{ fontSize: '1.15rem' }}>
                {post ? 'Edit Article' : 'Create New Article'}
              </h2>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Draft editorial posts, game highlights, and community updates
              </div>
            </div>
          </div>
          <button
            type="button"
            className="close-btn"
            onClick={onClose}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {Icons.close}
          </button>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="modal-body" style={{ overflowY: 'auto', padding: '22px 26px', flex: 1 }}>
            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: 10,
                padding: '10px 14px',
                color: '#ef4444',
                fontSize: '0.86rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <span style={{ display: 'flex' }}>{Icons.alert}</span>
                <span>{error}</span>
              </div>
            )}

            {/* Post Title */}
            <div className="form-group">
              <label className="form-label">
                <span>Article Title *</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'none' }}>
                  {form.title.length}/100
                </span>
              </label>
              <input
                className="form-input"
                value={form.title}
                onChange={e => set('title', e.target.value)}
                placeholder="e.g. 10 Best Browser Games You Need to Try This Weekend"
                required
                style={{ fontSize: '0.95rem', fontWeight: 600 }}
              />
            </div>

            {/* Author & Read Time */}
            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">
                  <span>Author</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="form-input"
                    value={form.author}
                    onChange={e => set('author', e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>Read Time</span>
                </label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    className="form-input"
                    value={form.readTime}
                    onChange={e => set('readTime', e.target.value)}
                    placeholder="3 min read"
                    style={{ flex: 1 }}
                  />
                  {['2 min', '3 min', '5 min'].map(rt => (
                    <button
                      key={rt}
                      type="button"
                      onClick={() => set('readTime', `${rt} read`)}
                      style={{
                        padding: '0 8px',
                        borderRadius: 8,
                        border: '1px solid var(--border-color)',
                        background: form.readTime.includes(rt) ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-canvas)',
                        color: form.readTime.includes(rt) ? 'var(--accent-brand)' : 'var(--text-muted)',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {rt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Header Image with File Upload & Preview */}
            <ImageUploader
              image={form.image}
              onChange={(newUrl) => set('image', newUrl)}
              gradient={form.gradient}
            />

            {/* Tags with Instant Badge Preview & Quick Tags */}
            <div className="form-group">
              <label className="form-label">
                <span>Tags</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'none' }}>
                  Comma separated
                </span>
              </label>
              <input
                className="form-input"
                value={form.tags}
                onChange={e => set('tags', e.target.value)}
                placeholder="Gaming, Tips, 2026, Arcade..."
              />

              {/* Tag Chips Preview */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4, alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, marginRight: 4 }}>
                  Quick Add:
                </span>
                {SUGGESTED_TAGS.map(tag => {
                  const isSelected = parsedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleAddTag(tag)}
                      style={{
                        padding: '3px 10px',
                        borderRadius: 14,
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: isSelected ? '1px solid var(--accent-brand)' : '1px solid var(--border-color)',
                        background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-canvas)',
                        color: isSelected ? 'var(--accent-brand)' : 'var(--text-muted)',
                        transition: 'all 0.15s ease',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      {isSelected ? Icons.check : Icons.plus}
                      <span>{tag}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Card Accent Gradient Selector */}
            <div className="form-group">
              <label className="form-label">
                <span>Card Accent Gradient</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'none' }}>
                  Fallback scheme for post badges and card backgrounds
                </span>
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 4 }}>
                {GRADIENT_PRESETS.map((g, idx) => {
                  const isSelected = form.gradient === g;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => set('gradient', g)}
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: g,
                        cursor: 'pointer',
                        border: isSelected ? '3px solid #ffffff' : '2px solid transparent',
                        outline: isSelected ? '2px solid var(--accent-brand)' : 'none',
                        boxShadow: isSelected ? '0 0 10px rgba(59, 130, 246, 0.4)' : '0 2px 4px rgba(0,0,0,0.1)',
                        transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff'
                      }}
                    >
                      {isSelected && Icons.check}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Excerpt / Summary */}
            <div className="form-group">
              <label className="form-label">
                <span>Excerpt / Summary</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'none' }}>
                  {form.excerpt.length} characters
                </span>
              </label>
              <textarea
                className="form-textarea"
                value={form.excerpt}
                onChange={e => set('excerpt', e.target.value)}
                placeholder="A compelling 1-2 sentence hook displayed in cards and search results..."
                rows={2}
                style={{ minHeight: 68 }}
              />
            </div>

            {/* Full Markdown Editor with Format Toolbar */}
            <div className="form-group">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <label className="form-label" style={{ margin: 0 }}>
                  <span>Article Content <span style={{ color: 'var(--text-muted)', fontWeight: 500, textTransform: 'none' }}>(Markdown)</span></span>
                </label>

                {/* Edit vs Preview Toggle */}
                <div style={{ display: 'flex', background: 'var(--bg-canvas)', borderRadius: 8, padding: 2, border: '1px solid var(--border-color)' }}>
                  <button
                    type="button"
                    onClick={() => setActiveTab('edit')}
                    style={{
                      padding: '3px 10px',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      borderRadius: 6,
                      border: 'none',
                      cursor: 'pointer',
                      background: activeTab === 'edit' ? 'var(--accent-brand)' : 'transparent',
                      color: activeTab === 'edit' ? '#ffffff' : 'var(--text-muted)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    {Icons.pen}
                    <span>Write</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('preview')}
                    style={{
                      padding: '3px 10px',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      borderRadius: 6,
                      border: 'none',
                      cursor: 'pointer',
                      background: activeTab === 'preview' ? 'var(--accent-brand)' : 'transparent',
                      color: activeTab === 'preview' ? '#ffffff' : 'var(--text-muted)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    {Icons.eye}
                    <span>Preview</span>
                  </button>
                </div>
              </div>

              {activeTab === 'edit' ? (
                <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                  {/* Toolbar */}
                  <div style={{
                    padding: '6px 10px',
                    background: 'var(--bg-canvas)',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    flexWrap: 'wrap'
                  }}>
                    {[
                      { label: 'B', title: 'Bold', action: () => insertMarkdown('**', '**', 'bold text'), style: { fontWeight: 800 } },
                      { label: 'I', title: 'Italic', action: () => insertMarkdown('*', '*', 'italic text'), style: { fontStyle: 'italic' } },
                      { label: 'H2', title: 'Heading 2', action: () => insertMarkdown('## ', '\n', 'Section Title'), style: { fontWeight: 700 } },
                      { label: 'H3', title: 'Heading 3', action: () => insertMarkdown('### ', '\n', 'Subsection Title'), style: { fontWeight: 700 } },
                      { label: 'Quote', icon: Icons.quote, title: 'Blockquote', action: () => insertMarkdown('> ', '\n', 'Quote text') },
                      { label: 'List', icon: Icons.list, title: 'Bullet list', action: () => insertMarkdown('- ', '\n', 'List item') },
                      { label: 'Link', icon: Icons.link, title: 'Hyperlink', action: () => insertMarkdown('[', '](https://example.com)', 'Link Text') },
                      { label: 'Code', icon: Icons.code, title: 'Code Block', action: () => insertMarkdown('```\n', '\n```', 'code here') },
                    ].map((tool, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={tool.action}
                        title={tool.title}
                        style={{
                          padding: '4px 8px',
                          borderRadius: 6,
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-card)',
                          color: 'var(--text-heading)',
                          fontSize: '0.72rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          ...tool.style
                        }}
                      >
                        {tool.icon && <span>{tool.icon}</span>}
                        <span>{tool.label}</span>
                      </button>
                    ))}

                    <div style={{ width: 1, height: 18, background: 'var(--border-color)', margin: '0 4px' }} />

                    {/* Inline Image Upload from Device */}
                    <button
                      type="button"
                      onClick={() => inlineFileInputRef.current?.click()}
                      disabled={uploadingInline}
                      title="Upload image from device and insert into blog body"
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        border: '1px solid #3b82f6',
                        background: 'rgba(59, 130, 246, 0.12)',
                        color: 'var(--accent-brand)',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5
                      }}
                    >
                      {uploadingInline ? Icons.spinner : Icons.image}
                      <span>{uploadingInline ? 'Uploading...' : '📷 + Upload Image'}</span>
                    </button>

                    {/* Image from URL */}
                    <button
                      type="button"
                      onClick={handleInsertImageUrl}
                      title="Insert image by external URL"
                      style={{
                        padding: '4px 8px',
                        borderRadius: 6,
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-card)',
                        color: 'var(--text-heading)',
                        fontSize: '0.72rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      {Icons.link}
                      <span>Image URL</span>
                    </button>

                    {/* Hidden inline image file picker */}
                    <input
                      ref={inlineFileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleInlineImageFile(e.target.files[0]);
                        }
                      }}
                    />
                  </div>

                  <textarea
                    ref={contentTextareaRef}
                    className="form-textarea"
                    value={form.content}
                    onChange={e => set('content', e.target.value)}
                    placeholder="## Introduction&#10;&#10;Write your story or guide here...&#10;&#10;### Key Highlights&#10;&#10;Use **bold**, *italic*, and - bullet points to structure your article."
                    rows={12}
                    style={{
                      border: 'none',
                      borderRadius: 0,
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: '0.84rem',
                      minHeight: 220,
                      padding: '12px 14px'
                    }}
                  />
                </div>
              ) : (
                <div style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius)',
                  background: 'var(--bg-card)',
                  padding: '16px 20px',
                  minHeight: 250,
                  maxHeight: 380,
                  overflowY: 'auto'
                }}>
                  <MarkdownPreview content={form.content} />
                </div>
              )}
            </div>

            {/* Publication & Feature Switches */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 14,
              padding: '14px 16px',
              borderRadius: 12,
              background: 'var(--bg-canvas)',
              border: '1px solid var(--border-color)'
            }}>
              {/* Published Switch */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => set('published', !form.published)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', userSelect: 'none' }}
              >
                <div
                  style={{
                    width: 42,
                    height: 24,
                    borderRadius: 12,
                    background: form.published ? '#10b981' : 'var(--border-color)',
                    position: 'relative',
                    transition: 'background 0.2s',
                    flexShrink: 0
                  }}
                >
                  <div style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: '#fff',
                    position: 'absolute',
                    top: 3,
                    left: form.published ? 21 : 3,
                    transition: 'left 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                  }} />
                </div>
                <div>
                  <div style={{ color: 'var(--text-heading)', fontWeight: 700, fontSize: '0.85rem' }}>
                    {form.published ? 'Published (Live)' : 'Draft (Hidden)'}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                    {form.published ? 'Visible on public blog feed' : 'Only visible to administrators'}
                  </div>
                </div>
              </div>

              {/* Featured Switch */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => set('featured', !form.featured)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', userSelect: 'none' }}
              >
                <div
                  style={{
                    width: 42,
                    height: 24,
                    borderRadius: 12,
                    background: form.featured ? '#f59e0b' : 'var(--border-color)',
                    position: 'relative',
                    transition: 'background 0.2s',
                    flexShrink: 0
                  }}
                >
                  <div style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: '#fff',
                    position: 'absolute',
                    top: 3,
                    left: form.featured ? 21 : 3,
                    transition: 'left 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                  }} />
                </div>
                <div>
                  <div style={{ color: 'var(--text-heading)', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {form.featured && <span style={{ color: '#f59e0b', display: 'flex' }}>{Icons.star(true, 14)}</span>}
                    <span>{form.featured ? 'Featured Showcase' : 'Standard Post'}</span>
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                    {form.featured ? 'Pinned to top hero banner' : 'Standard chronological listing'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="modal-footer" style={{ padding: '16px 24px', flexShrink: 0 }}>
            <button
              type="button"
              className="admin-btn secondary"
              onClick={onClose}
              style={{ fontWeight: 700 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="admin-btn primary"
              disabled={saving}
              style={{ fontWeight: 800, minWidth: 140, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              {saving ? (
                <>
                  {Icons.spinner}
                  <span>Saving...</span>
                </>
              ) : post ? (
                <>
                  {Icons.save}
                  <span>Save Changes</span>
                </>
              ) : (
                <>
                  {Icons.send}
                  <span>Publish Article</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
function DeleteConfirmModal({ post, onClose, onConfirm }) {
  const [deleting, setDeleting] = useState(false);

  return (
    <div className="modal-overlay">
      <div
        className="modal-content"
        style={{ maxWidth: 440, padding: 28, textAlign: 'center', borderRadius: 16 }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: 'rgba(239, 68, 68, 0.1)',
          color: '#ef4444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px'
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
        </div>
        <h3 style={{ color: 'var(--text-heading)', fontWeight: 800, fontSize: '1.2rem', margin: '0 0 8px' }}>
          Delete Blog Article?
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0 0 24px', lineHeight: 1.5 }}>
          Are you sure you want to permanently delete "<strong style={{ color: 'var(--text-heading)' }}>{post.title}</strong>"?
          This action cannot be undone.
        </p>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button
            type="button"
            className="admin-btn secondary"
            onClick={onClose}
            style={{ fontWeight: 700 }}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={async () => {
              setDeleting(true);
              await onConfirm();
              onClose();
            }}
            style={{
              padding: '9px 24px',
              borderRadius: 'var(--radius)',
              border: 'none',
              background: '#ef4444',
              color: '#fff',
              fontWeight: 800,
              cursor: deleting ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            {deleting ? (
              <>
                {Icons.spinner}
                <span>Deleting...</span>
              </>
            ) : (
              <>
                {Icons.trash}
                <span>Delete Article</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Post Table Row ───────────────────────────────────────────────────────────
function PostRow({ post, onEdit, onDelete, onTogglePublish, onToggleFeatured }) {
  const backendBase = CONFIG.API_BASE.replace(/\/api\/?$/, '');
  const thumbUrl = post.image
    ? (post.image.startsWith('http') || post.image.startsWith('data:') ? post.image : `${backendBase}${post.image.startsWith('/') ? '' : '/'}${post.image}`)
    : '';

  const parsedTags = Array.isArray(post.tags) ? post.tags : (post.tags ? post.tags.split(',') : []);

  return (
    <tr
      style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s ease' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-table-hover)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <td style={{ padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Post Thumbnail / Gradient Fallback */}
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 10,
            background: thumbUrl ? `url(${thumbUrl}) center/cover no-repeat` : post.gradient,
            border: '1px solid var(--border-color)',
            flexShrink: 0,
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
          }} />

          <div>
            <div style={{
              color: 'var(--text-heading)',
              fontWeight: 700,
              fontSize: '0.9rem',
              maxWidth: 340,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {post.title}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.76rem', marginTop: 3, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                {Icons.user}
                <span>{post.author}</span>
              </span>
              <span>•</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                {Icons.clock}
                <span>{post.readTime || '3 min read'}</span>
              </span>
              {parsedTags.length > 0 && (
                <>
                  <span>•</span>
                  <span style={{
                    background: 'var(--bg-canvas)',
                    padding: '1px 6px',
                    borderRadius: 4,
                    fontSize: '0.68rem',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-muted)'
                  }}>
                    {parsedTags[0]}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </td>

      {/* Status Toggle */}
      <td style={{ padding: '14px 14px', textAlign: 'center' }}>
        <button
          onClick={() => onTogglePublish(post)}
          title={post.published ? 'Click to unpublish' : 'Click to publish'}
          style={{
            padding: '4px 12px',
            borderRadius: 20,
            border: 'none',
            cursor: 'pointer',
            fontWeight: 800,
            fontSize: '0.74rem',
            background: post.published ? 'rgba(16, 185, 129, 0.12)' : 'rgba(100, 116, 139, 0.12)',
            color: post.published ? '#10b981' : 'var(--text-muted)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <span style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: post.published ? '#10b981' : 'var(--text-muted)',
            display: 'inline-block'
          }} />
          <span>{post.published ? 'Published' : 'Draft'}</span>
        </button>
      </td>

      {/* Featured Star */}
      <td style={{ padding: '14px 14px', textAlign: 'center' }}>
        <button
          onClick={() => onToggleFeatured(post)}
          title={post.featured ? 'Remove from featured showcase' : 'Set as featured showcase'}
          style={{
            background: post.featured ? 'rgba(245, 158, 11, 0.12)' : 'transparent',
            border: post.featured ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid transparent',
            borderRadius: 8,
            padding: '6px 10px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
            color: post.featured ? '#f59e0b' : 'var(--text-dim)'
          }}
        >
          {Icons.star(post.featured, 16)}
        </button>
      </td>

      {/* Views */}
      <td style={{ padding: '14px 14px', color: 'var(--text-muted)', fontSize: '0.84rem', fontWeight: 600, textAlign: 'center' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          {Icons.views}
          <span>{Number(post.views || 0).toLocaleString()}</span>
        </span>
      </td>

      {/* Date */}
      <td style={{ padding: '14px 14px', color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          {Icons.calendar}
          <span>{post.createdAt ? new Date(post.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span>
        </span>
      </td>

      {/* Actions */}
      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
        <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center', justifyContent: 'flex-end' }}>
          <button
            className="icon-action-btn edit"
            title="Edit Article"
            onClick={() => onEdit(post)}
          >
            {Icons.edit}
          </button>
          <button
            className="icon-action-btn delete"
            title="Delete Article"
            onClick={() => onDelete(post)}
          >
            {Icons.trash}
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Main BlogView ────────────────────────────────────────────────────────────
export default function BlogView({
  posts = [],
  onAdd,
  onUpdate,
  onDelete,
  onTogglePublish,
  onToggleFeatured,
  onRefresh
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingPost, setEditingPost] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [deletingPost, setDeletingPost] = useState(null);

  const filtered = posts.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.title?.toLowerCase().includes(q) || p.author?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || (statusFilter === 'published' ? p.published : !p.published);
    return matchSearch && matchStatus;
  });

  const publishedCount = posts.filter(p => p.published).length;
  const draftCount = posts.filter(p => !p.published).length;
  const featuredCount = posts.filter(p => p.featured).length;

  const statCards = [
    {
      label: 'Total Articles',
      value: posts.length,
      color: 'var(--accent-brand, #3b82f6)',
      bg: 'rgba(59, 130, 246, 0.1)',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      )
    },
    {
      label: 'Published Live',
      value: publishedCount,
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.1)',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="16 12 12 8 8 12" />
          <line x1="12" y1="16" x2="12" y2="8" />
        </svg>
      )
    },
    {
      label: 'Drafts in Progress',
      value: draftCount,
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.1)',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      )
    },
    {
      label: 'Featured Showcase',
      value: featuredCount,
      color: '#8b5cf6',
      bg: 'rgba(139, 92, 246, 0.1)',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      )
    },
  ];

  return (
    <div className="blog-admin-wrap">
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.15) 100%)',
            color: 'var(--accent-brand)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            boxShadow: '0 2px 8px rgba(59, 130, 246, 0.1)'
          }}>
            {Icons.blog}
          </div>
          <div>
            <h1 style={{ color: 'var(--text-heading)', fontWeight: 800, fontSize: '1.45rem', margin: 0 }}>
              Blog & Content CMS
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', margin: '3px 0 0' }}>
              Publish updates, game guides, and editorial stories for the NextGenn gaming community
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            onClick={onRefresh}
            className="admin-btn secondary"
            style={{ fontWeight: 700, fontSize: '0.84rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            {Icons.refresh}
            <span>Refresh</span>
          </button>
          <button
            onClick={() => { setEditingPost(null); setShowForm(true); }}
            className="admin-btn primary"
            style={{ fontWeight: 800, fontSize: '0.88rem', padding: '9px 20px', display: 'inline-flex', alignItems: 'center', gap: 7 }}
          >
            {Icons.plus}
            <span>Create Article</span>
          </button>
        </div>
      </div>

      {/* Analytics / Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
        {statCards.map((s, i) => (
          <div
            key={i}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg, 14px)',
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <div>
              <div style={{ fontSize: '1.65rem', fontWeight: 900, color: s.color, lineHeight: 1.1 }}>
                {s.value}
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {s.label}
              </div>
            </div>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: s.bg,
              color: s.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {s.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Filters & Search Row */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', flex: 1, maxWidth: 540 }}>
          {/* Search bar with prefix SVG icon */}
          <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
            <span style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              display: 'flex',
              pointerEvents: 'none'
            }}>
              {Icons.search}
            </span>
            <input
              className="form-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search articles, tags or authors..."
              style={{ width: '100%', paddingLeft: 36, paddingRight: search ? 32 : 14, boxSizing: 'border-box' }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 2
                }}
              >
                {Icons.close}
              </button>
            )}
          </div>

          <select
            className="form-select"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ width: 170 }}
          >
            <option value="all">All Articles ({posts.length})</option>
            <option value="published">Published ({publishedCount})</option>
            <option value="draft">Drafts ({draftCount})</option>
          </select>
        </div>

        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          Showing <strong>{filtered.length}</strong> of <strong>{posts.length}</strong> articles
        </div>
      </div>

      {/* Posts Table Card */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-xl, 16px)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-card)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-table-head)' }}>
                {['Article / Title', 'Status', 'Featured', 'Views', 'Date Added', 'Actions'].map((h, idx) => (
                  <th
                    key={h}
                    style={{
                      padding: '12px 18px',
                      textAlign: idx === 1 || idx === 2 || idx === 3 ? 'center' : idx === 5 ? 'right' : 'left',
                      color: 'var(--text-muted)',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '56px 24px', textAlign: 'center' }}>
                    <div style={{
                      width: 64,
                      height: 64,
                      borderRadius: 16,
                      background: 'var(--bg-canvas)',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px',
                      border: '1px solid var(--border-color)'
                    }}>
                      {Icons.emptyDocument}
                    </div>
                    <div style={{ fontWeight: 800, color: 'var(--text-heading)', fontSize: '1.05rem' }}>No Articles Found</div>
                    <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: 4, maxWidth: 360, margin: '6px auto 18px' }}>
                      {search ? 'Try clearing your search query or switching status filters.' : 'Create your very first blog article to get started.'}
                    </div>
                    <button
                      onClick={() => { setEditingPost(null); setShowForm(true); }}
                      className="admin-btn primary"
                      style={{ fontSize: '0.84rem', padding: '8px 18px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      {Icons.plus}
                      <span>Write First Article</span>
                    </button>
                  </td>
                </tr>
              ) : (
                filtered.map(post => (
                  <PostRow
                    key={post.id}
                    post={post}
                    onEdit={p => { setEditingPost(p); setShowForm(true); }}
                    onDelete={p => setDeletingPost(p)}
                    onTogglePublish={onTogglePublish}
                    onToggleFeatured={onToggleFeatured}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div style={{
            padding: '12px 18px',
            borderTop: '1px solid var(--border-color)',
            color: 'var(--text-muted)',
            fontSize: '0.78rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>Showing <strong>{filtered.length}</strong> of <strong>{posts.length}</strong> articles</span>
            <span>NextGenn Editorial CMS v2.0</span>
          </div>
        )}
      </div>

      {/* Post Form Modal (Portal) */}
      {showForm && typeof document !== 'undefined' && createPortal(
        <PostFormModal
          post={editingPost}
          onClose={() => { setShowForm(false); setEditingPost(null); }}
          onSave={editingPost ? (data) => onUpdate(editingPost.id, data) : onAdd}
        />,
        document.body
      )}

      {/* Delete Confirmation Modal (Portal) */}
      {deletingPost && typeof document !== 'undefined' && createPortal(
        <DeleteConfirmModal
          post={deletingPost}
          onClose={() => setDeletingPost(null)}
          onConfirm={() => onDelete(deletingPost.id)}
        />,
        document.body
      )}
    </div>
  );
}

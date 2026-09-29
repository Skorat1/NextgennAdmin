import { CONFIG } from '../config';

const { API_BASE, STORAGE_KEYS } = CONFIG;

/**
 * Universal Authenticated Fetch Wrapper
 */
export async function authFetch(url, options = {}) {
  let token = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN) || '' : '';
  if (!token && typeof sessionStorage !== 'undefined') {
    token = sessionStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN) || '';
  }
  // Ensure we always provide an authorized token for admin API operations
  if (!token) {
    token = 'local_admin_token_default';
    try {
      localStorage.setItem(STORAGE_KEYS.ADMIN_TOKEN, token);
    } catch {}
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const finalUrl = url.startsWith('http') ? url : `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
  return fetch(finalUrl, { ...options, headers });
}

/**
 * Games API Services
 */
export const gamesApi = {
  getAll: async () => {
    const res = await authFetch('/games?status=all');
    if (!res.ok) throw new Error('Failed to fetch games');
    return res.json();
  },
  draftAll: async () => {
    const res = await authFetch('/games/admin/draft-all', {
      method: 'POST'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to set all games to draft');
    }
    return res.json();
  },
  fetchGameMonetizeFeed: async (feedUrl) => {
    const res = await authFetch('/games/admin/gamemonetize/fetch', {
      method: 'POST',
      body: JSON.stringify({ feedUrl })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch GameMonetize feed');
    }
    return res.json();
  },
  importGameMonetizeGames: async (games, options = {}) => {
    const res = await authFetch('/games/admin/gamemonetize/import', {
      method: 'POST',
      body: JSON.stringify({ games, status: options.status || 'active' })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to import games');
    }
    return res.json();
  },
  getById: async (id) => {
    const res = await authFetch(`/games/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error('Game not found');
    return res.json();
  },
  create: async (gameData) => {
    const res = await authFetch('/games', {
      method: 'POST',
      body: JSON.stringify(gameData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create game');
    }
    return res.json();
  },
  update: async (id, gameData) => {
    const res = await authFetch(`/games/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(gameData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update game');
    }
    return res.json();
  },
  delete: async (id) => {
    const res = await authFetch(`/games/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete game');
    return res.json();
  },
  toggleFeatured: async (id) => {
    const res = await authFetch(`/games/${encodeURIComponent(id)}/featured`, {
      method: 'PATCH'
    });
    if (!res.ok) throw new Error('Failed to toggle featured status');
    return res.json();
  },
  detectMetadata: async (url) => {
    const res = await authFetch('/games/detect-metadata', {
      method: 'POST',
      body: JSON.stringify({ url })
    });
    if (!res.ok) throw new Error('Metadata detection failed');
    return res.json();
  }
};

/**
 * Users API Services
 */
export const usersApi = {
  getAll: async () => {
    const res = await authFetch('/users');
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },
  create: async (userData) => {
    const res = await authFetch('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to create user');
    return result;
  },
  update: async (id, updates) => {
    const res = await authFetch(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to update user');
    return result;
  },
  delete: async (id) => {
    const res = await authFetch(`/users/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete user');
    return res.json();
  },
  login: async (identifier, password) => {
    const res = await fetch(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to authenticate admin');
    return data;
  }
};

/**
 * Categories API Services
 */
export const categoriesApi = {
  getAll: async () => {
    const res = await authFetch('/categories');
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
  },
  create: async (categoryData) => {
    const res = await authFetch('/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData)
    });
    if (!res.ok) throw new Error('Failed to create category');
    return res.json();
  },
  update: async (id, categoryData) => {
    const res = await authFetch(`/categories/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update category');
    }
    return res.json();
  },
  delete: async (id) => {
    const res = await authFetch(`/categories/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete category');
    return res.json();
  },
  uploadImage: async (base64Data, filename = 'category.png') => {
    const res = await authFetch('/categories/upload-image', {
      method: 'POST',
      body: JSON.stringify({ image: base64Data, filename })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to upload image');
    return result;
  }
};

/**
 * Developer Submissions API Services
 */
export const submissionsApi = {
  getAll: async () => {
    const res = await authFetch('/submissions');
    if (!res.ok) throw new Error('Failed to fetch submissions');
    return res.json();
  },
  updateStatus: async (id, status) => {
    const res = await authFetch(`/submissions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error('Failed to update submission status');
    return res.json();
  },
  delete: async (id) => {
    const res = await authFetch(`/submissions/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete submission');
    return res.json();
  }
};

/**
 * Messages & Feedback API Services
 */
export const messagesApi = {
  getAll: async () => {
    const res = await authFetch('/messages');
    if (!res.ok) throw new Error('Failed to fetch messages');
    return res.json();
  },
  markRead: async (id) => {
    const res = await authFetch(`/messages/${id}/read`, {
      method: 'PATCH'
    });
    if (!res.ok) throw new Error('Failed to mark message as read');
    return res.json();
  },
  markAllRead: async () => {
    const res = await authFetch('/messages/read-all', {
      method: 'PATCH'
    });
    if (!res.ok) throw new Error('Failed to mark all messages as read');
    return res.json();
  },
  delete: async (id) => {
    const res = await authFetch(`/messages/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete message');
    return res.json();
  }
};


/**
 * Online Visitors & Health API Services
 */
export const statsApi = {
  getOnlineCount: async () => {
    const res = await fetch(`${API_BASE}/stats/online`);
    if (!res.ok) return { count: 0 };
    return res.json();
  },
  getHealth: async () => {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) return { status: 'offline' };
    return res.json();
  },
  getLiveAnalytics: async () => {
    const res = await authFetch('/analytics/live');
    if (!res.ok) throw new Error('Failed to fetch live analytics');
    return res.json();
  }
};

/**
 * Blog Posts API Services (Admin)
 */
export const blogApi = {
  getAll: async () => {
    const res = await authFetch('/blog/admin/all');
    if (!res.ok) throw new Error('Failed to fetch blog posts');
    return res.json();
  },
  getById: async (id) => {
    const res = await authFetch(`/blog/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error('Post not found');
    return res.json();
  },
  create: async (data) => {
    const res = await authFetch('/blog', { method: 'POST', body: JSON.stringify(data) });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to create post');
    return result;
  },
  update: async (id, data) => {
    const res = await authFetch(`/blog/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to update post');
    return result;
  },
  delete: async (id) => {
    const res = await authFetch(`/blog/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete post');
    return res.json();
  },
  togglePublish: async (id) => {
    const res = await authFetch(`/blog/${encodeURIComponent(id)}/publish`, { method: 'PATCH' });
    if (!res.ok) throw new Error('Failed to toggle publish');
    return res.json();
  },
  toggleFeatured: async (id) => {
    const res = await authFetch(`/blog/${encodeURIComponent(id)}/featured`, { method: 'PATCH' });
    if (!res.ok) throw new Error('Failed to toggle featured');
    return res.json();
  },
  uploadImage: async (base64Data, filename = 'image.png') => {
    const res = await authFetch('/blog/upload-image', {
      method: 'POST',
      body: JSON.stringify({ image: base64Data, filename })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to upload image');
    return result;
  }
};


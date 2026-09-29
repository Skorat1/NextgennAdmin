/**
 * Application Configuration for NextGenn Admin Control Center
 */

export const CONFIG = {
  // Base URL for Backend REST API
  API_BASE: (import.meta.env.VITE_API_BASE || 'http://localhost:5000/api').replace(/\/+$/, ''),


  // Main Gaming Portal Frontend URL
  PORTAL_URL: import.meta.env.VITE_PORTAL_URL || 'http://localhost:5173',

  // LocalStorage / SessionStorage Keys
  STORAGE_KEYS: {
    ADMIN_TOKEN: 'nextgenn_admin_token',
    ADMIN_USER: 'nextgenn_admin_user',
    ADMIN_TAB: 'nextgenn_admin_tab',
    ADMIN_LOGGED_IN: 'nextgenn_admin_logged_in'
  },

  // Valid Navigation Tabs
  VALID_TABS: [
    'dashboard',
    'games',
    'users',
    'categories',
    'submissions',
    'messages',
    'blog'
  ]
};

export default CONFIG;

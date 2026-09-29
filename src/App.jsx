import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import AdminSidebar from './components/AdminSidebar';
import AdminNavbar from './components/AdminNavbar';
import AdminLogin from './components/AdminLogin';
import Toast from './components/Toast';

// Code-split all admin views on demand
const DashboardView = lazy(() => import('./views/DashboardView'));
const GamesManagementView = lazy(() => import('./views/GamesManagementView'));
const UsersView = lazy(() => import('./views/UsersView'));
const CategoriesView = lazy(() => import('./views/CategoriesView'));
const SubmissionsView = lazy(() => import('./views/SubmissionsView'));
const MessagesView = lazy(() => import('./views/MessagesView'));
const GameModal = lazy(() => import('./components/GameModal'));
const BlogView = lazy(() => import('./views/BlogView'));

import {
  DEFAULT_GAMES,
  DEFAULT_CATEGORIES,
  DEFAULT_SUBMISSIONS,
  DEFAULT_MESSAGES,
  DEFAULT_USERS
} from './data/defaultData';

import { CONFIG } from './config';
import {
  gamesApi,
  usersApi,
  categoriesApi,
  submissionsApi,
  messagesApi,
  statsApi,
  blogApi
} from './services/api';

const { VALID_TABS, STORAGE_KEYS } = CONFIG;

function getInitialAdminUser() {
  try {
    const isLoggedIn = sessionStorage.getItem(STORAGE_KEYS.ADMIN_LOGGED_IN) === 'true';
    if (!isLoggedIn) {
      // Must explicitly authenticate via Login screen
      return null;
    }
    const saved = sessionStorage.getItem(STORAGE_KEYS.ADMIN_USER) || localStorage.getItem(STORAGE_KEYS.ADMIN_USER);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && (parsed.role === 'admin' || parsed.role === 'moderator' || parsed.username)) {
        return parsed;
      }
    }
  } catch (e) { }
  return null;
}

function getInitialTab() {
  try {
    const hash = window.location.hash.replace('#', '').trim().toLowerCase();
    if (VALID_TABS.includes(hash)) return hash;

    const saved = localStorage.getItem(STORAGE_KEYS.ADMIN_TAB);
    if (saved && VALID_TABS.includes(saved)) return saved;
  } catch (e) { }
  return 'dashboard';
}

// Robust ID matcher that prevents undefined === undefined bugs and ensures strict string matching
function matchesId(item, targetId) {
  if (!item || targetId == null) return false;
  const t = String(targetId).trim();
  if (!t) return false;
  return (item.id != null && String(item.id).trim() === t) ||
         (item._id != null && String(item._id).trim() === t);
}

export default function App() {
  const [adminUser, setAdminUser] = useState(getInitialAdminUser);
  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [dbStatus, setDbStatus] = useState({ connected: false, checked: false });
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('admin_theme') || 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('admin_theme', theme);
    } catch { }
  }, [theme]);

  // Core Data States
  const [onlineCount, setOnlineCount] = useState(0);
  const [activeGameCounts, setActiveGameCounts] = useState({});
  const [games, setGames] = useState(DEFAULT_GAMES);
  const [users, setUsers] = useState(DEFAULT_USERS);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [submissions, setSubmissions] = useState(DEFAULT_SUBMISSIONS);
  const [messages, setMessages] = useState(DEFAULT_MESSAGES);
  const [blogPosts, setBlogPosts] = useState([]);


  // Modal States
  const [editingGame, setEditingGame] = useState(null);
  const [isGameModalOpen, setIsGameModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Sync activeTab with URL hash and localStorage
  useEffect(() => {
    try {
      window.location.hash = activeTab;
      localStorage.setItem(STORAGE_KEYS.ADMIN_TAB, activeTab);
    } catch (e) { }
  }, [activeTab]);

  // Listen for browser back / forward navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').trim().toLowerCase();
      if (VALID_TABS.includes(hash)) {
        setActiveTab(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Fetch all platform data from backend
  const fetchAllData = useCallback(async () => {
    try {
      const [gamesData, usersData, catData, subData, msgData, blogData] = await Promise.all([
        gamesApi.getAll().catch(() => null),
        usersApi.getAll().catch(() => null),
        categoriesApi.getAll().catch(() => null),
        submissionsApi.getAll().catch(() => null),
        messagesApi.getAll().catch(() => null),
        blogApi.getAll().catch(() => null)
      ]);

      if (Array.isArray(gamesData)) {
        setGames(gamesData);
        setDbStatus({ connected: true, checked: true });
      } else {
        setDbStatus({ connected: false, checked: true });
      }

      if (Array.isArray(usersData)) {
        setUsers(usersData);
      }

      if (Array.isArray(catData)) {
        setCategories(catData);
      }

      if (Array.isArray(subData)) {
        setSubmissions(subData);
      }

      if (Array.isArray(msgData)) {
        setMessages(msgData);
      }

      if (Array.isArray(blogData)) {
        setBlogPosts(blogData);
      }
    } catch (err) {
      console.warn('Backend API offline or initial sync fallback:', err.message);
      setDbStatus({ connected: false, checked: true });
    }
  }, []);

  // Real-time visitor polling & periodic synchronization
  useEffect(() => {
    statsApi.getOnlineCount().then(data => {
      if (typeof data?.count === 'number') setOnlineCount(data.count);
    }).catch(() => { });

    fetchAllData();

    const interval = setInterval(() => {
      statsApi.getOnlineCount().then(data => {
        if (typeof data?.count === 'number') setOnlineCount(data.count);
      }).catch(() => { });
    }, 15000);

    return () => clearInterval(interval);
  }, [fetchAllData]);

  // Game Handlers
  const handleOpenGameModal = (game = null) => {
    setEditingGame(game);
    setIsGameModalOpen(true);
  };

  const handleSaveGame = async (savedGame) => {
    const gameId = savedGame?.id || savedGame?._id;
    if (!gameId) {
      showToast('Game ID is required to save', 'error');
      return;
    }
    const exists = games.some(g => matchesId(g, gameId));

    // Auto-sync category to Admin categories state and database if new
    const rawCat = (savedGame.category || '').trim();
    if (rawCat && rawCat.toLowerCase() !== 'all') {
      const catKey = rawCat.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      const catExists = categories.some(c => {
        const cId = (c.id || c._id || '').toLowerCase().trim();
        const cName = (c.name || '').toLowerCase().trim();
        return cId === catKey || cId === rawCat.toLowerCase() || cName === rawCat.toLowerCase();
      });

      if (!catExists) {
        const catName = savedGame.categoryName || rawCat.split(/[-_\s]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        const newCatObj = {
          id: catKey,
          name: catName,
          icon: catKey,
          image: '',
          color: '#3b82f6',
          count: 1
        };

        setCategories(prev => {
          if (prev.some(c => matchesId(c, catKey))) return prev;
          return [...prev, newCatObj];
        });

        try {
          await categoriesApi.create(newCatObj);
        } catch (e) {
          console.warn('Auto category sync fallback:', e.message);
        }
      }
    }

    try {
      let result;
      if (exists) {
        result = await gamesApi.update(gameId, savedGame);
        const targetId = result?.id || result?._id || gameId;
        setGames(prev => prev.map(g => matchesId(g, targetId) ? { ...g, ...result } : g));
        showToast(`Game "${result.title || savedGame.title}" updated successfully!`);
      } else {
        result = await gamesApi.create(savedGame);
        const targetId = result?.id || result?._id || gameId;
        setGames(prev => [result, ...prev.filter(g => !matchesId(g, targetId))]);
        showToast(`Game "${result.title || savedGame.title}" published & live on NextGenn!`);
      }

      // Refresh categories list from server to ensure complete sync
      try {
        const liveCats = await categoriesApi.getLiveCategories();
        if (Array.isArray(liveCats) && liveCats.length > 0) {
          setCategories(liveCats);
        }
      } catch (e) { }
    } catch (err) {
      // Offline fallback
      if (exists) {
        setGames(prev => prev.map(g => matchesId(g, gameId) ? { ...g, ...savedGame } : g));
      } else {
        setGames(prev => [savedGame, ...prev.filter(g => !matchesId(g, gameId))]);
      }
      showToast(`Game saved locally (${err.message || 'offline'})`);
    }
  };

  const handleDeleteGame = async (gameId) => {
    if (!gameId) return;
    try {
      const game = games.find(g => matchesId(g, gameId));
      await gamesApi.delete(gameId);
      setGames(prev => prev.filter(g => !matchesId(g, gameId)));
      showToast(`Game "${game?.title || gameId}" deleted from database!`, 'error');
    } catch (err) {
      setGames(prev => prev.filter(g => !matchesId(g, gameId)));
      showToast(`Game removed locally.`, 'error');
    }
  };

  const handleToggleFeatured = async (gameId) => {
    if (!gameId) return;
    try {
      const updated = await gamesApi.toggleFeatured(gameId);
      setGames(prev => prev.map(g => matchesId(g, gameId) ? { ...g, ...updated } : g));
      showToast(updated.featured ? `Marked "${updated.title}" as Featured Spotlight!` : `Removed from Featured Spotlight.`);
    } catch (err) {
      setGames(prev => prev.map(g => matchesId(g, gameId) ? { ...g, featured: !g.featured } : g));
    }
  };

  const handleDraftAllGames = async () => {
    try {
      const res = await gamesApi.draftAll();
      setGames(prev => prev.map(g => ({ ...g, status: 'draft' })));
      showToast(`All ${res.affectedRows || games.length} games set to Draft! Hidden from website.`);
    } catch (err) {
      setGames(prev => prev.map(g => ({ ...g, status: 'draft' })));
      showToast('All games set to Draft.');
    }
  };

  const handleBulkUpdateStatus = async (gameIds, newStatus) => {
    if (!gameIds || gameIds.length === 0) return;
    try {
      await Promise.allSettled(
        gameIds.map(id => gamesApi.update(id, { status: newStatus }))
      );
      setGames(prev => prev.map(g => {
        const gid = g.id || g._id;
        return gameIds.some(id => matchesId({ id }, gid)) ? { ...g, status: newStatus } : g;
      }));
      showToast(`Bulk updated ${gameIds.length} games to "${newStatus}"!`);
    } catch (err) {
      setGames(prev => prev.map(g => {
        const gid = g.id || g._id;
        return gameIds.some(id => matchesId({ id }, gid)) ? { ...g, status: newStatus } : g;
      }));
      showToast(`Bulk updated ${gameIds.length} games locally.`);
    }
  };

  const handleBulkDelete = async (gameIds) => {
    if (!gameIds || gameIds.length === 0) return;
    try {
      await Promise.allSettled(
        gameIds.map(id => gamesApi.delete(id))
      );
      setGames(prev => prev.filter(g => {
        const gid = g.id || g._id;
        return !gameIds.some(id => matchesId({ id }, gid));
      }));
      showToast(`Bulk deleted ${gameIds.length} games from database!`, 'error');
    } catch (err) {
      setGames(prev => prev.filter(g => {
        const gid = g.id || g._id;
        return !gameIds.some(id => matchesId({ id }, gid));
      }));
      showToast(`Removed ${gameIds.length} games locally.`, 'error');
    }
  };

  // Category Handlers
  const handleAddCategory = async (newCat) => {
    try {
      const saved = await categoriesApi.create(newCat);
      setCategories(prev => [...prev, saved]);
      showToast(`Category "${saved.name}" created!`);
    } catch (err) {
      setCategories(prev => [...prev, newCat]);
      showToast(`Category created locally.`);
    }
  };

  const handleUpdateCategory = async (catId, updates) => {
    if (!catId) return;
    try {
      const updated = await categoriesApi.update(catId, updates);
      setCategories(prev => prev.map(c => matchesId(c, catId) ? { ...c, ...updated } : c));
      showToast(`Category "${updated.name || catId}" updated successfully!`);
      return updated;
    } catch (err) {
      setCategories(prev => prev.map(c => matchesId(c, catId) ? { ...c, ...updates } : c));
      showToast(`Category updated.`);
      return { id: catId, ...updates };
    }
  };

  const handleDeleteCategory = async (catId) => {
    if (!catId) return;
    try {
      await categoriesApi.delete(catId);
      setCategories(prev => prev.filter(c => !matchesId(c, catId)));
      showToast(`Category removed from database.`);
    } catch (err) {
      setCategories(prev => prev.filter(c => !matchesId(c, catId)));
    }
  };

  // Submission Handlers
  const handleApproveSubmission = async (sub) => {
    try {
      const rawUrl = (sub.gameUrl || '').trim();
      const iframeMatch = rawUrl.match(/src=["']([^"']+)["']/i);
      const cleanUrl = iframeMatch ? iframeMatch[1] : rawUrl;

      const newGame = {
        id: (sub.gameTitle || 'game').toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now().toString().slice(-4),
        title: sub.gameTitle,
        category: sub.category || 'arcade',
        description: sub.description || '',
        thumbnail: sub.thumbnailUrl || '',
        gameUrl: cleanUrl,
        tags: ['Developer', 'Community', sub.category || 'Arcade'],
        rating: 5.0,
        plays: 0,
        featured: false,
        status: 'active',
        createdAt: new Date().toISOString().split('T')[0]
      };

      const subIdentifier = sub.id || sub._id;
      let createdGame = newGame;
      try {
        createdGame = await gamesApi.create(newGame);
      } catch (e) { }

      try {
        await submissionsApi.updateStatus(subIdentifier, 'approved');
      } catch (e) { }

      setGames(prev => [createdGame, ...prev.filter(g => !matchesId(g, createdGame.id))]);
      setSubmissions(prev => prev.map(s => matchesId(s, subIdentifier) ? { ...s, status: 'approved' } : s));
      showToast(`Submission "${sub.gameTitle}" approved & live on NextGenn!`);
    } catch (err) {
      showToast(`Approved submission.`);
    }
  };

  const handleRejectSubmission = async (subId) => {
    if (!subId) return;
    try {
      await submissionsApi.updateStatus(subId, 'rejected');
      setSubmissions(prev => prev.map(s => matchesId(s, subId) ? { ...s, status: 'rejected' } : s));
      showToast('Submission marked as rejected.', 'info');
    } catch (err) {
      setSubmissions(prev => prev.map(s => matchesId(s, subId) ? { ...s, status: 'rejected' } : s));
    }
  };

  const handleDeleteSubmission = async (subId) => {
    if (!subId) return;
    try {
      await submissionsApi.delete(subId);
      setSubmissions(prev => prev.filter(s => !matchesId(s, subId)));
      showToast('Submission record deleted.');
    } catch (err) {
      setSubmissions(prev => prev.filter(s => !matchesId(s, subId)));
    }
  };

  // Message Handlers
  const handleMarkRead = async (msgId) => {
    if (!msgId) return;
    try {
      await messagesApi.markRead(msgId);
      setMessages(prev => prev.map(m => matchesId(m, msgId) ? { ...m, read: true } : m));
    } catch (err) {
      setMessages(prev => prev.map(m => matchesId(m, msgId) ? { ...m, read: true } : m));
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await messagesApi.markAllRead();
      setMessages(prev => prev.map(m => ({ ...m, read: true })));
      showToast('All messages marked as read.');
    } catch (err) {
      setMessages(prev => prev.map(m => ({ ...m, read: true })));
    }
  };

  const handleDeleteMessage = async (msgId) => {
    if (!msgId) return;
    try {
      await messagesApi.delete(msgId);
      setMessages(prev => prev.filter(m => !matchesId(m, msgId)));
      showToast('Message deleted successfully.');
    } catch (err) {
      setMessages(prev => prev.filter(m => !matchesId(m, msgId)));
    }
  };

  // User Management Handlers
  const handleAddUser = async (userData) => {
    try {
      const result = await usersApi.create(userData);
      if (result.user) {
        setUsers(prev => [result.user, ...prev.filter(u => !matchesId(u, result.user.id || result.user._id))]);
        showToast(`User "${result.user.username}" created successfully!`);
      }
      return result;
    } catch (err) {
      const localUser = {
        id: 'usr-' + Date.now().toString(36),
        ...userData,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${userData.username}`,
        createdAt: new Date().toISOString()
      };
      setUsers(prev => [localUser, ...prev]);
      showToast(`User "${userData.username}" created locally!`);
      return { user: localUser };
    }
  };

  const handleUpdateUser = async (userId, updates) => {
    try {
      setUsers(prev => prev.map(u => matchesId(u, userId) ? { ...u, ...updates } : u));
      const result = await usersApi.update(userId, updates);
      if (result.user) {
        setUsers(prev => prev.map(u => matchesId(u, userId) ? { ...u, ...result.user } : u));
      }
      showToast(`User account updated!`);
    } catch (err) {
      showToast(`User updated.`);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!userId) return;
    try {
      await usersApi.delete(userId);
      setUsers(prev => prev.filter(u => !matchesId(u, userId)));
      showToast('User deleted successfully.');
    } catch (err) {
      setUsers(prev => prev.filter(u => !matchesId(u, userId)));
    }
  };

  // ── Blog CRUD Handlers ──────────────────────────────────────────────────────
  const handleAddBlogPost = async (data) => {
    try {
      const post = await blogApi.create(data);
      if (post) {
        const targetId = post.id || post._id;
        setBlogPosts(prev => [post, ...prev.filter(p => !matchesId(p, targetId))]);
        showToast('Blog post published successfully.');
      }
      return post;
    } catch (err) {
      console.error('Error creating blog post:', err);
      showToast('Error saving post: ' + (err.message || 'Server error'), 'error');
      throw err;
    }
  };

  const handleUpdateBlogPost = async (id, data) => {
    try {
      setBlogPosts(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
      const updated = await blogApi.update(id, data);
      if (updated) setBlogPosts(prev => prev.map(p => p.id === id ? updated : p));
      showToast('Blog post updated successfully.');
    } catch (err) {
      showToast('Post updated locally.');
    }
  };

  const handleDeleteBlogPost = async (id) => {
    try {
      await blogApi.delete(id);
      setBlogPosts(prev => prev.filter(p => p.id !== id));
      showToast('Blog post deleted.');
    } catch (err) {
      setBlogPosts(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleToggleBlogPublish = async (post) => {
    try {
      setBlogPosts(prev => prev.map(p => p.id === post.id ? { ...p, published: !p.published } : p));
      await blogApi.togglePublish(post.id);
      showToast(post.published ? 'Post moved to drafts.' : 'Post published successfully.');
    } catch (err) {
      setBlogPosts(prev => prev.map(p => p.id === post.id ? { ...p, published: !p.published } : p));
    }
  };

  const handleToggleBlogFeatured = async (post) => {
    try {
      setBlogPosts(prev => prev.map(p => p.id === post.id ? { ...p, featured: !p.featured } : p));
      await blogApi.toggleFeatured(post.id);
      showToast(post.featured ? 'Post removed from featured.' : 'Post marked as featured.');
    } catch (err) {
      setBlogPosts(prev => prev.map(p => p.id === post.id ? { ...p, featured: !p.featured } : p));
    }
  };

  // Auth Handlers
  const handleAdminLogin = (user) => {
    try {
      sessionStorage.setItem(STORAGE_KEYS.ADMIN_LOGGED_IN, 'true');
      sessionStorage.setItem(STORAGE_KEYS.ADMIN_USER, JSON.stringify(user));
    } catch (e) { }
    setAdminUser(user);
    showToast(`Welcome back, ${user.username || user.name || 'Admin'}!`);
  };

  const handleAdminLogout = () => {
    try {
      sessionStorage.clear();
      localStorage.removeItem(STORAGE_KEYS.ADMIN_LOGGED_IN);
      localStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.ADMIN_USER);
      localStorage.removeItem('sky_admin_user');
      localStorage.removeItem('sky_admin_token');
    } catch (e) { }
    setAdminUser(null);
    showToast('Signed out of admin console.', 'info');
  };

  const unreadMessagesCount = messages.filter(m => !m.read).length;
  const pendingSubmissionsCount = submissions.filter(s => s.status === 'pending').length;

  if (!adminUser) {
    return (
      <>
        <AdminLogin onLoginSuccess={handleAdminLogin} />
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: 'success' })}
        />
      </>
    );
  }

  return (
    <div className="admin-app">
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        gamesCount={games.length}
        usersCount={users.length}
        submissionsCount={pendingSubmissionsCount}
        unreadMessagesCount={unreadMessagesCount}
        adminUser={adminUser}
        onLogout={handleAdminLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {sidebarOpen && (
        <div 
          className="admin-sidebar-overlay" 
          onClick={() => setSidebarOpen(false)} 
          title="Close sidebar"
        />
      )}

      <div className="admin-main">
        <AdminNavbar
          activeTab={activeTab}
          onOpenGameModal={handleOpenGameModal}
          onOpenUserModal={() => setIsUserModalOpen(true)}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          livePlayerCount={onlineCount}
          adminUser={adminUser}
          onLogout={handleAdminLogout}
          dbStatus={dbStatus}
          theme={theme}
          onToggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
        />

        <main className="admin-content-area">
          <Suspense fallback={<div className="admin-loading-spinner" style={{ padding: '60px', textAlign: 'center', color: 'var(--accent-cyan)' }}>Loading Control View...</div>}>
            {activeTab === 'dashboard' && (
              <DashboardView
                games={games}
                users={users}
                categories={categories}
                submissions={submissions}
                messages={messages}
                onlineCount={onlineCount}
                activeGameCounts={activeGameCounts}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onEditGame={handleOpenGameModal}
                onOpenAddGame={() => handleOpenGameModal(null)}
                adminUser={adminUser}
                onRefresh={fetchAllData}
              />
            )}

            {activeTab === 'games' && (
              <GamesManagementView
                games={games}
                categories={categories}
                activeGameCounts={activeGameCounts}
                onEditGame={handleOpenGameModal}
                onDeleteGame={handleDeleteGame}
                onToggleFeatured={handleToggleFeatured}
                onOpenAddModal={() => handleOpenGameModal(null)}
                onOpenGameModal={handleOpenGameModal}
                onDraftAll={handleDraftAllGames}
                onBulkUpdateStatus={handleBulkUpdateStatus}
                onBulkDelete={handleBulkDelete}
                onRefresh={fetchAllData}
              />
            )}

            {activeTab === 'users' && (
              <UsersView
                users={users}
                onAddUser={handleAddUser}
                onUpdateUser={handleUpdateUser}
                onDeleteUser={handleDeleteUser}
                onRefresh={fetchAllData}
                isModalOpen={isUserModalOpen}
                setIsModalOpen={setIsUserModalOpen}
              />
            )}

            {activeTab === 'categories' && (
              <CategoriesView
                categories={categories}
                onAddCategory={handleAddCategory}
                onUpdateCategory={handleUpdateCategory}
                onDeleteCategory={handleDeleteCategory}
                games={games}
              />
            )}

            {activeTab === 'submissions' && (
              <SubmissionsView
                submissions={submissions}
                onApprove={handleApproveSubmission}
                onReject={handleRejectSubmission}
                onDeleteSubmission={handleDeleteSubmission}
              />
            )}

            {activeTab === 'blog' && (
              <BlogView
                posts={blogPosts}
                onAdd={handleAddBlogPost}
                onUpdate={handleUpdateBlogPost}
                onDelete={handleDeleteBlogPost}
                onTogglePublish={handleToggleBlogPublish}
                onToggleFeatured={handleToggleBlogFeatured}
                onRefresh={fetchAllData}
              />
            )}

            {activeTab === 'messages' && (
              <MessagesView
                messages={messages}
                onRead={handleMarkRead}
                onMarkAllRead={handleMarkAllRead}
                onDeleteMessage={handleDeleteMessage}
              />
            )}
          </Suspense>
        </main>
      </div>

      <Suspense fallback={null}>
        <GameModal
          game={editingGame}
          isOpen={isGameModalOpen}
          onClose={() => setIsGameModalOpen(false)}
          onSave={handleSaveGame}
          categories={categories}
        />
      </Suspense>

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />
    </div>
  );
}

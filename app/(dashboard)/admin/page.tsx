'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/components/AuthProvider';
import {
  Users, Map, FileText, TrendingUp, Shield, Trash2,
  Search, RefreshCw, ChevronLeft, ChevronRight,
  BarChart2, Globe, CheckCircle, XCircle, LogOut, Crown
} from 'lucide-react';

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface Stats { totalUsers: number; totalTrips: number; totalPosts: number; }
interface AdminUser { _id: string; email: string; firstName?: string; lastName?: string; isAdmin: boolean; createdAt: string; }
interface AdminTrip { _id: string; title?: string; destination?: string; userId: string; isPublic: boolean; createdAt: string; }

type Tab = 'overview' | 'users' | 'trips';

/* ─── Component ──────────────────────────────────────────────────────────── */
export default function AdminPanel() {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalTrips: 0, totalPosts: 0 });
  const [recentUsers, setRecentUsers] = useState<AdminUser[]>([]);
  const [recentTrips, setRecentTrips] = useState<AdminTrip[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [trips, setTrips] = useState<AdminTrip[]>([]);
  const [userPage, setUserPage] = useState(1);
  const [tripPage, setTripPage] = useState(1);
  const [userPages, setUserPages] = useState(1);
  const [tripPages, setTripPages] = useState(1);
  const [userSearch, setUserSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* ── Auth guard ── */
  useEffect(() => {
    if (!isLoaded) return;
    if (!user) { router.replace('/sign-in'); return; }
    fetch('/api/profile').then(r => r.json()).then(data => {
      if (!data.isAdmin) { router.replace('/'); return; }
      setIsAdmin(true);
    });
  }, [isLoaded, user]);

  /* ── Stats ── */
  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      setStats(data.stats);
      setRecentUsers(data.recentUsers || []);
      setRecentTrips(data.recentTrips || []);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── Users ── */
  const loadUsers = useCallback(async (page = 1, q = '') => {
    const res = await fetch(`/api/admin/users?page=${page}&q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setUsers(data.users || []);
    setUserPages(data.pages || 1);
    setUserPage(page);
  }, []);

  /* ── Trips ── */
  const loadTrips = useCallback(async (page = 1) => {
    const res = await fetch(`/api/admin/trips?page=${page}`);
    const data = await res.json();
    setTrips(data.trips || []);
    setTripPages(data.pages || 1);
    setTripPage(page);
  }, []);

  useEffect(() => { if (isAdmin) loadStats(); }, [isAdmin, loadStats]);
  useEffect(() => { if (isAdmin && activeTab === 'users') loadUsers(); }, [isAdmin, activeTab]);
  useEffect(() => { if (isAdmin && activeTab === 'trips') loadTrips(); }, [isAdmin, activeTab]);

  const toggleAdmin = async (userId: string, current: boolean) => {
    setActionLoading(userId);
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, isAdmin: !current }),
    });
    setActionLoading(null);
    showToast(`Admin role ${!current ? 'granted' : 'revoked'}`);
    loadUsers(userPage, userSearch);
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    setActionLoading(userId);
    await fetch(`/api/admin/users?userId=${userId}`, { method: 'DELETE' });
    setActionLoading(null);
    showToast('User deleted', 'error');
    loadUsers(userPage, userSearch);
    loadStats();
  };

  const deleteTrip = async (tripId: string) => {
    if (!confirm('Delete this trip? This cannot be undone.')) return;
    setActionLoading(tripId);
    await fetch(`/api/admin/trips?tripId=${tripId}`, { method: 'DELETE' });
    setActionLoading(null);
    showToast('Trip deleted', 'error');
    loadTrips(tripPage);
    loadStats();
  };

  if (!isLoaded || isAdmin === null) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner" />
        <p>Verifying access...</p>
      </div>
    );
  }

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="admin-root">
      {/* ── Toast ── */}
      {toast && (
        <div className={`admin-toast ${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* ── Sidebar ── */}
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <Shield size={28} className="admin-logo-icon" />
          <div>
            <div className="admin-logo-title">Traveloop</div>
            <div className="admin-logo-sub">Admin Console</div>
          </div>
        </div>

        <nav className="admin-nav">
          {([
            { id: 'overview', label: 'Overview', icon: BarChart2 },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'trips', label: 'Trips', icon: Map },
          ] as { id: Tab; label: string; icon: any }[]).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`admin-nav-item ${activeTab === id ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <button className="admin-back-btn" onClick={() => router.push('/')}>
          <LogOut size={16} />
          Back to App
        </button>
      </aside>

      {/* ── Main ── */}
      <main className="admin-main">
        {/* Header */}
        <div className="admin-header">
          <div>
            <h1 className="admin-page-title">
              {activeTab === 'overview' && 'Dashboard Overview'}
              {activeTab === 'users' && 'User Management'}
              {activeTab === 'trips' && 'Trip Management'}
            </h1>
            <p className="admin-page-sub">Welcome back, Admin</p>
          </div>
          <button className="admin-refresh" onClick={loadStats}>
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {/* ── Overview Tab ── */}
        {activeTab === 'overview' && (
          <div className="admin-overview">
            {/* Stat Cards */}
            <div className="admin-stats-grid">
              {[
                { label: 'Total Users', value: stats.totalUsers, icon: Users, color: '#6366f1' },
                { label: 'Total Trips', value: stats.totalTrips, icon: Globe, color: '#0d9488' },
                { label: 'Community Posts', value: stats.totalPosts, icon: FileText, color: '#f59e0b' },
                { label: 'Engagement', value: `${stats.totalTrips > 0 ? (stats.totalPosts / stats.totalTrips).toFixed(1) : 0}x`, icon: TrendingUp, color: '#ec4899' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div className="admin-stat-card" key={label}>
                  <div className="admin-stat-icon" style={{ background: `${color}20`, color }}>
                    <Icon size={24} />
                  </div>
                  <div className="admin-stat-body">
                    <div className="admin-stat-value">{loading ? '—' : value}</div>
                    <div className="admin-stat-label">{label}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="admin-grid-2">
              {/* Recent Users */}
              <div className="admin-card">
                <div className="admin-card-header">
                  <h2><Users size={18} /> Recent Users</h2>
                </div>
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead><tr><th>Name</th><th>Email</th><th>Joined</th><th>Role</th></tr></thead>
                    <tbody>
                      {recentUsers.map(u => (
                        <tr key={u._id}>
                          <td>{u.firstName || '—'} {u.lastName || ''}</td>
                          <td className="admin-muted">{u.email}</td>
                          <td className="admin-muted">{fmtDate(u.createdAt)}</td>
                          <td>
                            {u.isAdmin
                              ? <span className="admin-badge admin"><Crown size={12} /> Admin</span>
                              : <span className="admin-badge user">User</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Trips */}
              <div className="admin-card">
                <div className="admin-card-header">
                  <h2><Map size={18} /> Recent Trips</h2>
                </div>
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead><tr><th>Title</th><th>Destination</th><th>Created</th><th>Visibility</th></tr></thead>
                    <tbody>
                      {recentTrips.map(t => (
                        <tr key={t._id}>
                          <td>{(t as any).title || 'Untitled'}</td>
                          <td className="admin-muted">{(t as any).destination || '—'}</td>
                          <td className="admin-muted">{fmtDate(t.createdAt)}</td>
                          <td>
                            <span className={`admin-badge ${t.isPublic ? 'public' : 'private'}`}>
                              {t.isPublic ? 'Public' : 'Private'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Users Tab ── */}
        {activeTab === 'users' && (
          <div className="admin-card">
            <div className="admin-card-header">
              <h2><Users size={18} /> All Users</h2>
              <div className="admin-search-wrap">
                <Search size={16} className="admin-search-icon" />
                <input
                  className="admin-search"
                  placeholder="Search by name or email…"
                  value={userSearch}
                  onChange={e => { setUserSearch(e.target.value); loadUsers(1, e.target.value); }}
                />
              </div>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>Name</th><th>Email</th><th>Joined</th><th>Role</th><th>Actions</th></tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id}>
                      <td className="admin-bold">{u.firstName || '—'} {u.lastName || ''}</td>
                      <td className="admin-muted">{u.email}</td>
                      <td className="admin-muted">{fmtDate(u.createdAt)}</td>
                      <td>
                        {u.isAdmin
                          ? <span className="admin-badge admin"><Crown size={12} /> Admin</span>
                          : <span className="admin-badge user">User</span>}
                      </td>
                      <td>
                        <div className="admin-actions">
                          <button
                            className={`admin-btn ${u.isAdmin ? 'warning' : 'primary'}`}
                            disabled={actionLoading === u._id}
                            onClick={() => toggleAdmin(u._id, u.isAdmin)}
                          >
                            {u.isAdmin ? 'Revoke' : 'Make Admin'}
                          </button>
                          <button
                            className="admin-btn danger"
                            disabled={actionLoading === u._id || u.email === 'aksharthakkar77@gmail.com'}
                            onClick={() => deleteUser(u._id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="admin-pagination">
              <button disabled={userPage <= 1} onClick={() => loadUsers(userPage - 1, userSearch)}>
                <ChevronLeft size={18} />
              </button>
              <span>Page {userPage} of {userPages}</span>
              <button disabled={userPage >= userPages} onClick={() => loadUsers(userPage + 1, userSearch)}>
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ── Trips Tab ── */}
        {activeTab === 'trips' && (
          <div className="admin-card">
            <div className="admin-card-header">
              <h2><Map size={18} /> All Trips</h2>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>Title</th><th>Destination</th><th>User ID</th><th>Created</th><th>Visibility</th><th>Actions</th></tr></thead>
                <tbody>
                  {trips.map(t => (
                    <tr key={t._id}>
                      <td className="admin-bold">{(t as any).title || 'Untitled'}</td>
                      <td className="admin-muted">{(t as any).destination || '—'}</td>
                      <td className="admin-muted admin-mono">{t.userId?.toString().slice(-6)}</td>
                      <td className="admin-muted">{fmtDate(t.createdAt)}</td>
                      <td>
                        <span className={`admin-badge ${t.isPublic ? 'public' : 'private'}`}>
                          {t.isPublic ? 'Public' : 'Private'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="admin-btn danger"
                          disabled={actionLoading === t._id}
                          onClick={() => deleteTrip(t._id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="admin-pagination">
              <button disabled={tripPage <= 1} onClick={() => loadTrips(tripPage - 1)}>
                <ChevronLeft size={18} />
              </button>
              <span>Page {tripPage} of {tripPages}</span>
              <button disabled={tripPage >= tripPages} onClick={() => loadTrips(tripPage + 1)}>
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </main>

      <style>{`
        .admin-root {
          display: flex;
          min-height: 100vh;
          background: #0f172a;
          font-family: 'Inter', sans-serif;
          color: #e2e8f0;
        }

        /* ── Sidebar ── */
        .admin-sidebar {
          width: 240px;
          min-height: 100vh;
          background: #1e293b;
          border-right: 1px solid #334155;
          display: flex;
          flex-direction: column;
          padding: 24px 16px;
          flex-shrink: 0;
        }
        .admin-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 8px 24px;
          border-bottom: 1px solid #334155;
          margin-bottom: 20px;
        }
        .admin-logo-icon { color: #6366f1; }
        .admin-logo-title { font-size: 18px; font-weight: 700; color: #f1f5f9; }
        .admin-logo-sub { font-size: 11px; color: #94a3b8; }
        .admin-nav { display: flex; flex-direction: column; gap: 4px; flex: 1; }
        .admin-nav-item {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 14px; border-radius: 10px; border: none;
          cursor: pointer; font-size: 14px; font-weight: 500;
          color: #94a3b8; background: transparent;
          transition: all .2s; text-align: left; width: 100%;
        }
        .admin-nav-item:hover { background: #334155; color: #e2e8f0; }
        .admin-nav-item.active { background: #6366f120; color: #818cf8; }
        .admin-back-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 14px; border-radius: 10px; border: 1px solid #334155;
          cursor: pointer; font-size: 13px; color: #94a3b8;
          background: transparent; margin-top: auto;
          transition: all .2s;
        }
        .admin-back-btn:hover { background: #334155; color: #e2e8f0; }

        /* ── Main ── */
        .admin-main {
          flex: 1; padding: 32px; overflow-y: auto; min-width: 0;
        }
        .admin-header {
          display: flex; align-items: flex-start; justify-content: space-between;
          margin-bottom: 28px;
        }
        .admin-page-title { font-size: 26px; font-weight: 700; color: #f1f5f9; }
        .admin-page-sub { font-size: 13px; color: #64748b; margin-top: 4px; }
        .admin-refresh {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 16px; border-radius: 8px; border: 1px solid #334155;
          background: #1e293b; color: #94a3b8; cursor: pointer;
          font-size: 13px; transition: all .2s;
        }
        .admin-refresh:hover { background: #334155; color: #e2e8f0; }

        /* ── Stats ── */
        .admin-stats-grid {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;
          margin-bottom: 24px;
        }
        .admin-stat-card {
          background: #1e293b; border: 1px solid #334155; border-radius: 14px;
          padding: 20px; display: flex; align-items: center; gap: 16px;
        }
        .admin-stat-icon {
          width: 52px; height: 52px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .admin-stat-value { font-size: 28px; font-weight: 700; color: #f1f5f9; }
        .admin-stat-label { font-size: 13px; color: #64748b; }

        /* ── Grid ── */
        .admin-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

        /* ── Card ── */
        .admin-card {
          background: #1e293b; border: 1px solid #334155; border-radius: 14px;
          overflow: hidden;
        }
        .admin-card-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 24px; border-bottom: 1px solid #334155;
        }
        .admin-card-header h2 {
          display: flex; align-items: center; gap: 8px;
          font-size: 15px; font-weight: 600; color: #cbd5e1;
        }

        /* ── Search ── */
        .admin-search-wrap { position: relative; }
        .admin-search-icon {
          position: absolute; left: 10px; top: 50%; transform: translateY(-50%);
          color: #64748b; pointer-events: none;
        }
        .admin-search {
          background: #0f172a; border: 1px solid #334155; border-radius: 8px;
          padding: 8px 12px 8px 32px; color: #e2e8f0; font-size: 13px;
          outline: none; width: 240px;
        }
        .admin-search:focus { border-color: #6366f1; }

        /* ── Table ── */
        .admin-table-wrap { overflow-x: auto; }
        .admin-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .admin-table th {
          padding: 10px 20px; text-align: left; font-size: 11px; font-weight: 600;
          color: #64748b; text-transform: uppercase; letter-spacing: .05em;
          border-bottom: 1px solid #334155;
        }
        .admin-table td {
          padding: 12px 20px; border-bottom: 1px solid #1e293b;
          vertical-align: middle;
        }
        .admin-table tbody tr:hover { background: #ffffff05; }
        .admin-muted { color: #94a3b8; }
        .admin-bold { font-weight: 600; color: #e2e8f0; }
        .admin-mono { font-family: monospace; }

        /* ── Badges ── */
        .admin-badge {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600;
        }
        .admin-badge.admin { background: #6366f120; color: #818cf8; }
        .admin-badge.user { background: #0f172a; color: #64748b; }
        .admin-badge.public { background: #0d948820; color: #2dd4bf; }
        .admin-badge.private { background: #ef444420; color: #f87171; }

        /* ── Buttons ── */
        .admin-actions { display: flex; align-items: center; gap: 8px; }
        .admin-btn {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 5px 12px; border-radius: 6px; border: none;
          cursor: pointer; font-size: 12px; font-weight: 600;
          transition: all .2s;
        }
        .admin-btn:disabled { opacity: .4; cursor: not-allowed; }
        .admin-btn.primary { background: #6366f1; color: #fff; }
        .admin-btn.primary:hover:not(:disabled) { background: #4f46e5; }
        .admin-btn.warning { background: #f59e0b20; color: #fbbf24; border: 1px solid #f59e0b40; }
        .admin-btn.warning:hover:not(:disabled) { background: #f59e0b40; }
        .admin-btn.danger { background: #ef444420; color: #f87171; border: 1px solid #ef444440; }
        .admin-btn.danger:hover:not(:disabled) { background: #ef444440; }

        /* ── Pagination ── */
        .admin-pagination {
          display: flex; align-items: center; justify-content: center; gap: 16px;
          padding: 16px; border-top: 1px solid #334155; font-size: 13px; color: #94a3b8;
        }
        .admin-pagination button {
          display: flex; align-items: center; justify-content: center;
          width: 32px; height: 32px; border-radius: 8px; border: 1px solid #334155;
          background: #0f172a; color: #94a3b8; cursor: pointer; transition: all .2s;
        }
        .admin-pagination button:hover:not(:disabled) { background: #334155; color: #e2e8f0; }
        .admin-pagination button:disabled { opacity: .3; cursor: not-allowed; }

        /* ── Toast ── */
        .admin-toast {
          position: fixed; top: 24px; right: 24px; z-index: 9999;
          display: flex; align-items: center; gap: 8px;
          padding: 12px 20px; border-radius: 10px; font-size: 14px; font-weight: 500;
          box-shadow: 0 8px 24px rgba(0,0,0,.4);
          animation: slideIn .3s ease;
        }
        .admin-toast.success { background: #0d9488; color: #fff; }
        .admin-toast.error { background: #ef4444; color: #fff; }

        /* ── Loading ── */
        .admin-loading {
          min-height: 100vh; display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 16px;
          background: #0f172a; color: #94a3b8; font-size: 14px;
        }
        .admin-spinner {
          width: 36px; height: 36px; border: 3px solid #334155;
          border-top-color: #6366f1; border-radius: 50%; animation: spin 1s linear infinite;
        }

        /* ── Overview layout fix ── */
        .admin-overview { display: flex; flex-direction: column; gap: 0; }
        .admin-overview .admin-grid-2 { margin-top: 24px; }

        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

        @media (max-width: 1100px) {
          .admin-stats-grid { grid-template-columns: repeat(2, 1fr); }
          .admin-grid-2 { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .admin-sidebar { display: none; }
          .admin-stats-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </div>
  );
}

import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/admin.css';
import {
  getStoredUsers,
  saveStoredUsers,
  resolveAdmissionRequest,
} from '../utils/mockApi';

/**
 * Executive Admin Platform Overview
 * Content aligned with institutional management specifications:
 * - 4 Stat Cards: Pending approvals, Students, Teachers, Tests created
 * - Approval queue with 1-click Approve / Reject & "Approve all" action
 * - System Activity metrics (Test attempts, AI practice sets, Published tests)
 * - Recent signups quick list
 */
export default function AdminOverview() {
  const navigate = useNavigate();

  // Executive Theme (Light / Dark)
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('examai_admin_theme') || 'light';
    } catch {
      return 'light';
    }
  });

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    try {
      localStorage.setItem('examai_admin_theme', nextTheme);
    } catch (e) {
      console.warn('Theme save failed', e);
    }
  };

  // Sync users state with localStorage & mockApi
  const [users, setUsers] = useState(() => {
    return getStoredUsers();
  });

  useEffect(() => {
    const syncUsers = () => {
      const latest = getStoredUsers();
      setUsers(latest);
    };

    window.addEventListener('storage', syncUsers);
    window.addEventListener('examai_users_updated', syncUsers);
    window.addEventListener('examai_decision_updated', syncUsers);
    const interval = setInterval(syncUsers, 1200);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', syncUsers);
      window.removeEventListener('examai_users_updated', syncUsers);
      window.removeEventListener('examai_decision_updated', syncUsers);
    };
  }, []);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState('');
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? '' : prev));
    }, 3800);
  };

  // Calculated Metrics
  const pendingUsers = useMemo(() => {
    return users.filter((u) => u.status === 'pending');
  }, [users]);

  const studentStats = useMemo(() => {
    const all = users.filter((u) => u.role === 'student');
    const pending = all.filter((u) => u.status === 'pending').length;
    const rejected = all.filter((u) => u.status === 'rejected').length;
    return { total: all.length, pending, rejected };
  }, [users]);

  const teacherStats = useMemo(() => {
    const all = users.filter((u) => u.role === 'teacher');
    const pending = all.filter((u) => u.status === 'pending').length;
    const rejected = all.filter((u) => u.status === 'rejected').length;
    return { total: all.length, pending, rejected };
  }, [users]);

  const recentUsers = useMemo(() => {
    return [...users].slice(0, 5);
  }, [users]);

  // Actions
  const handleApproveUser = (user) => {
    const updated = users.map((u) =>
      u.id === user.id ? { ...u, status: 'approved', rejectionReason: null } : u
    );
    setUsers(updated);
    saveStoredUsers(updated);
    resolveAdmissionRequest(user.id, 'approved');
    showToast(`Approved ${user.name} for platform access.`);
  };

  const handleRejectUser = (user) => {
    const updated = users.map((u) =>
      u.id === user.id
        ? { ...u, status: 'rejected', rejectionReason: 'Registration credentials not verified by administrator.' }
        : u
    );
    setUsers(updated);
    saveStoredUsers(updated);
    resolveAdmissionRequest(user.id, 'rejected', 'Registration credentials not verified by administrator.');
    showToast(`Declined admission for ${user.name}.`);
  };

  const handleApproveAll = () => {
    if (pendingUsers.length === 0) return;
    const updated = users.map((u) =>
      u.status === 'pending' ? { ...u, status: 'approved', rejectionReason: null } : u
    );
    setUsers(updated);
    saveStoredUsers(updated);
    pendingUsers.forEach((u) => resolveAdmissionRequest(u.id, 'approved'));
    showToast(`Approved all ${pendingUsers.length} pending candidate(s).`);
  };

  const isDark = theme === 'dark';

  return (
    <div className="admin-layout" data-admin-theme={theme}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: '#0B1B33',
            color: '#FFFFFF',
            padding: '0.8rem 1.4rem',
            borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
            fontSize: '0.875rem',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            border: '1px solid rgba(45, 91, 208, 0.4)',
          }}
        >
          <span style={{ color: '#10B981' }}>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className="admin-sidebar">
        <div>
          <div className="admin-sidebar-header">
            <Link to="/" className="admin-brand">
              <div className="admin-brand-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c3 3 9 3 12 0v-5" />
                </svg>
              </div>
              <div>
                <span className="admin-brand-text">ExamAI</span>
                <span className="admin-brand-badge">ADMIN</span>
              </div>
            </Link>
          </div>

          <div className="admin-sidebar-nav">
            <div className="admin-nav-section-title">Platform</div>

            <Link to="/admin/overview" className="admin-nav-item active">
              <svg className="admin-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="9" rx="1" />
                <rect x="14" y="3" width="7" height="5" rx="1" />
                <rect x="14" y="12" width="7" height="9" rx="1" />
                <rect x="3" y="16" width="7" height="5" rx="1" />
              </svg>
              <span>Overview</span>
            </Link>

            <Link to="/admin/users" className="admin-nav-item">
              <svg className="admin-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span>Users & Approvals</span>
              {pendingUsers.length > 0 && (
                <span className="admin-nav-badge">{pendingUsers.length}</span>
              )}
            </Link>

            <div className="admin-nav-section-title" style={{ marginTop: '1.25rem' }}>Governance</div>

            <a href="#proctoring" onClick={(e) => e.preventDefault()} className="admin-nav-item" style={{ opacity: 0.65 }}>
              <svg className="admin-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>Proctoring Audit</span>
            </a>

            <a href="#settings" onClick={(e) => e.preventDefault()} className="admin-nav-item" style={{ opacity: 0.65 }}>
              <svg className="admin-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              <span>Platform Security</span>
            </a>
          </div>
        </div>

        {/* Sidebar Footer Identity Card */}
        <div className="admin-sidebar-footer">
          <div className="admin-profile-card">
            <div className="admin-avatar">PA</div>
            <div className="admin-user-info">
              <div className="admin-user-name">Platform Admin</div>
              <div className="admin-user-role">Administrator</div>
            </div>
            <button
              title="Logout"
              onClick={() => navigate('/login/admin')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#7A8CA5',
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Overview Body */}
      <main className="admin-main">
        {/* Top Header Bar */}
        <header className="admin-topbar">
          <nav className="admin-breadcrumbs">
            <Link to="/admin/overview">Platform Admin</Link>
            <span className="admin-breadcrumbs-separator">/</span>
            <span className="admin-breadcrumbs-active">Overview</span>
          </nav>

          <div className="admin-topbar-actions">
            {/* Live Sync Badge */}
            <div className="live-sync-indicator" title="Automatic real-time sync with platform database">
              <span className="live-sync-dot" />
              <span>Real-Time Sync Active</span>
            </div>

            {/* Theme Switcher Button */}
            <button
              className="btn-theme-toggle"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            >
              {theme === 'light' ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>

            {/* Platform Admin Profile Pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '8px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#C2410C',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                }}
              >
                PA
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: isDark ? '#FFFFFF' : '#0B1B33', lineHeight: 1.2 }}>
                  Platform Admin
                </span>
                <span style={{ fontSize: '0.68rem', color: isDark ? '#94A3B8' : '#64748B' }}>
                  Administrator
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div style={{ padding: '2rem 2.25rem', flex: 1 }}>
          {/* Page Heading */}
          <div style={{ marginBottom: '1.75rem' }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#D97706',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                display: 'block',
                marginBottom: '4px',
              }}
            >
              ADMIN CONSOLE
            </span>
            <h1
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.9rem',
                color: isDark ? '#FFFFFF' : '#0B1B33',
                margin: '0 0 0.35rem',
              }}
            >
              Platform overview
            </h1>
            <p style={{ fontSize: '0.9rem', color: isDark ? '#94A3B8' : '#5F6B7D', margin: 0 }}>
              Review signups and keep track of activity across ExamAI.
            </p>
          </div>

          {/* 4 Overview Statistics Cards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
              gap: '1.25rem',
              marginBottom: '2rem',
            }}
          >
            {/* Card 1: Pending Approvals */}
            <div
              style={{
                backgroundColor: isDark ? '#0E1726' : '#FFFFFF',
                borderRadius: '12px',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E1E6EE',
                padding: '1.35rem 1.5rem',
                boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.4)' : '0 2px 8px rgba(11, 27, 51, 0.04)',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: isDark ? '#94A3B8' : '#5F6B7D' }}>
                  Pending approvals
                </span>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(217, 119, 6, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#D97706',
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <polygon points="5 3 19 3 12 12 19 21 5 21 12 12 5 3" />
                  </svg>
                </div>
              </div>
              <div
                style={{
                  fontSize: '2rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-heading)',
                  color: isDark ? '#FFFFFF' : '#0B1B33',
                  lineHeight: 1,
                  marginBottom: '0.5rem',
                }}
              >
                {pendingUsers.length}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#D97706', fontWeight: 500 }}>
                Waiting for your review
              </div>
            </div>

            {/* Card 2: Students */}
            <div
              style={{
                backgroundColor: isDark ? '#0E1726' : '#FFFFFF',
                borderRadius: '12px',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E1E6EE',
                padding: '1.35rem 1.5rem',
                boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.4)' : '0 2px 8px rgba(11, 27, 51, 0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: isDark ? '#94A3B8' : '#5F6B7D' }}>
                  Students
                </span>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(45, 91, 208, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#2D5BD0',
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                  </svg>
                </div>
              </div>
              <div
                style={{
                  fontSize: '2rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-heading)',
                  color: isDark ? '#FFFFFF' : '#0B1B33',
                  lineHeight: 1,
                  marginBottom: '0.5rem',
                }}
              >
                {studentStats.total}
              </div>
              <div style={{ fontSize: '0.78rem', color: isDark ? '#94A3B8' : '#5F6B7D' }}>
                {studentStats.pending} pending · {studentStats.rejected} rejected
              </div>
            </div>

            {/* Card 3: Teachers */}
            <div
              style={{
                backgroundColor: isDark ? '#0E1726' : '#FFFFFF',
                borderRadius: '12px',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E1E6EE',
                padding: '1.35rem 1.5rem',
                boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.4)' : '0 2px 8px rgba(11, 27, 51, 0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: isDark ? '#94A3B8' : '#5F6B7D' }}>
                  Teachers
                </span>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(14, 107, 88, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0E6B58',
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
              </div>
              <div
                style={{
                  fontSize: '2rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-heading)',
                  color: isDark ? '#FFFFFF' : '#0B1B33',
                  lineHeight: 1,
                  marginBottom: '0.5rem',
                }}
              >
                {teacherStats.total}
              </div>
              <div style={{ fontSize: '0.78rem', color: isDark ? '#94A3B8' : '#5F6B7D' }}>
                {teacherStats.pending} pending · {teacherStats.rejected} rejected
              </div>
            </div>

            {/* Card 4: Tests Created */}
            <div
              style={{
                backgroundColor: isDark ? '#0E1726' : '#FFFFFF',
                borderRadius: '12px',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E1E6EE',
                padding: '1.35rem 1.5rem',
                boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.4)' : '0 2px 8px rgba(11, 27, 51, 0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: isDark ? '#94A3B8' : '#5F6B7D' }}>
                  Tests created
                </span>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#10B981',
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                </div>
              </div>
              <div
                style={{
                  fontSize: '2rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-heading)',
                  color: isDark ? '#FFFFFF' : '#0B1B33',
                  lineHeight: 1,
                  marginBottom: '0.5rem',
                }}
              >
                3
              </div>
              <div style={{ fontSize: '0.78rem', color: isDark ? '#94A3B8' : '#5F6B7D' }}>
                3 published · 0 practice sets
              </div>
            </div>
          </div>

          {/* Main 2-Column Section: Approval Queue (Left) & Activity + Recent Signups (Right) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)',
              gap: '1.75rem',
            }}
          >
            {/* LEFT COLUMN: Approval Queue Card */}
            <div
              style={{
                backgroundColor: isDark ? '#0E1726' : '#FFFFFF',
                borderRadius: '12px',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E1E6EE',
                boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.4)' : '0 2px 8px rgba(11, 27, 51, 0.04)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Card Header with "Approve all" action */}
              <div
                style={{
                  padding: '1.25rem 1.5rem',
                  borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E1E6EE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <h3
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '1.15rem',
                      color: isDark ? '#FFFFFF' : '#0B1B33',
                      margin: '0 0 2px',
                    }}
                  >
                    Approval queue
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: isDark ? '#94A3B8' : '#5F6B7D', margin: 0 }}>
                    New teachers and students can't sign in until approved.
                  </p>
                </div>

                {pendingUsers.length > 0 && (
                  <button
                    onClick={handleApproveAll}
                    style={{
                      backgroundColor: '#C2410C',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '0.45rem 0.95rem',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 6px rgba(194, 65, 12, 0.3)',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Approve all ({pendingUsers.length})</span>
                  </button>
                )}
              </div>

              {/* Pending Queue List */}
              <div style={{ padding: '1rem 1.5rem', flex: 1 }}>
                {pendingUsers.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
                    <div
                      style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '50%',
                        backgroundColor: isDark ? '#132338' : '#E3F1EC',
                        color: '#2F7D5B',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1rem',
                      }}
                    >
                      <svg width="28" height="28" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h4 style={{ fontSize: '1rem', color: isDark ? '#FFFFFF' : '#0B1B33', marginBottom: '0.25rem' }}>
                      All signups reviewed
                    </h4>
                    <p style={{ fontSize: '0.84375rem', color: isDark ? '#94A3B8' : '#5F6B7D', margin: 0 }}>
                      No candidate accounts currently waiting in the approval queue.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {pendingUsers.map((user) => {
                      const initials = user.name
                        ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                        : 'ST';

                      return (
                        <div
                          key={user.id}
                          style={{
                            backgroundColor: isDark ? '#131E31' : '#F8FAFD',
                            borderRadius: '10px',
                            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E1E6EE',
                            padding: '1rem 1.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '1rem',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                            {/* Candidate Avatar Initials */}
                            <div
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '50%',
                                backgroundColor: isDark ? '#1E293B' : '#F1E8DF',
                                color: isDark ? '#E2E8F0' : '#8A5326',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifySelf: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              {initials}
                            </div>

                            <div style={{ minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                                <strong style={{ fontSize: '0.9375rem', color: isDark ? '#FFFFFF' : '#0B1B33' }}>
                                  {user.name}
                                </strong>
                                <span
                                  style={{
                                    fontSize: '0.72rem',
                                    fontWeight: 600,
                                    borderRadius: '12px',
                                    padding: '1px 8px',
                                    backgroundColor: user.role === 'teacher' ? 'rgba(14, 107, 88, 0.12)' : 'rgba(124, 58, 237, 0.12)',
                                    color: user.role === 'teacher' ? '#0E6B58' : '#7C3AED',
                                    textTransform: 'capitalize',
                                  }}
                                >
                                  {user.role}
                                </span>
                              </div>

                              <div style={{ fontSize: '0.8rem', color: isDark ? '#94A3B8' : '#5F6B7D', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {user.email} · {user.college || 'Institution'} · {user.identifier} · {user.joinedDisplay || 'Recently'}
                              </div>
                            </div>
                          </div>

                          {/* Quick Action Buttons */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              onClick={() => handleApproveUser(user)}
                              style={{
                                backgroundColor: '#C2410C',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '0.45rem 0.9rem',
                                fontSize: '0.8125rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                              }}
                            >
                              <span>✓ Approve</span>
                            </button>

                            <button
                              onClick={() => handleRejectUser(user)}
                              style={{
                                backgroundColor: 'transparent',
                                color: isDark ? '#CBD5E1' : '#64748B',
                                border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #CBD5E1',
                                borderRadius: '6px',
                                padding: '0.45rem 0.8rem',
                                fontSize: '0.8125rem',
                                fontWeight: 500,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <span>✕ Reject</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Activity Card & Recent Signups Card */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              {/* Activity Card */}
              <div
                style={{
                  backgroundColor: isDark ? '#0E1726' : '#FFFFFF',
                  borderRadius: '12px',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E1E6EE',
                  boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.4)' : '0 2px 8px rgba(11, 27, 51, 0.04)',
                  padding: '1.25rem 1.5rem',
                }}
              >
                <h3
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1.15rem',
                    color: isDark ? '#FFFFFF' : '#0B1B33',
                    marginBottom: '1rem',
                  }}
                >
                  Activity
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 0.9rem',
                      borderRadius: '8px',
                      backgroundColor: isDark ? '#131E31' : '#F8FAFD',
                      border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E1E6EE',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1rem' }}>📄</span>
                      <span style={{ fontSize: '0.875rem', color: isDark ? '#E2E8F0' : '#14233C', fontWeight: 500 }}>
                        Test attempts
                      </span>
                    </div>
                    <strong style={{ fontSize: '1rem', color: isDark ? '#FFFFFF' : '#0B1B33' }}>
                      2
                    </strong>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 0.9rem',
                      borderRadius: '8px',
                      backgroundColor: isDark ? '#131E31' : '#F8FAFD',
                      border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E1E6EE',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1rem' }}>✨</span>
                      <span style={{ fontSize: '0.875rem', color: isDark ? '#E2E8F0' : '#14233C', fontWeight: 500 }}>
                        AI practice sets generated
                      </span>
                    </div>
                    <strong style={{ fontSize: '1rem', color: isDark ? '#FFFFFF' : '#0B1B33' }}>
                      0
                    </strong>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 0.9rem',
                      borderRadius: '8px',
                      backgroundColor: isDark ? '#131E31' : '#F8FAFD',
                      border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E1E6EE',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1rem' }}>📖</span>
                      <span style={{ fontSize: '0.875rem', color: isDark ? '#E2E8F0' : '#14233C', fontWeight: 500 }}>
                        Published tests
                      </span>
                    </div>
                    <strong style={{ fontSize: '1rem', color: isDark ? '#FFFFFF' : '#0B1B33' }}>
                      3
                    </strong>
                  </div>
                </div>
              </div>

              {/* Recent Signups Card */}
              <div
                style={{
                  backgroundColor: isDark ? '#0E1726' : '#FFFFFF',
                  borderRadius: '12px',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E1E6EE',
                  boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.4)' : '0 2px 8px rgba(11, 27, 51, 0.04)',
                  padding: '1.25rem 1.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h3
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '1.15rem',
                      color: isDark ? '#FFFFFF' : '#0B1B33',
                      margin: 0,
                    }}
                  >
                    Recent signups
                  </h3>
                  <Link
                    to="/admin/users"
                    style={{
                      fontSize: '0.8rem',
                      color: '#2D5BD0',
                      textDecoration: 'none',
                      fontWeight: 600,
                    }}
                  >
                    View all →
                  </Link>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {recentUsers.map((user) => {
                    const initials = user.name
                      ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                      : 'US';

                    return (
                      <div
                        key={user.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.65rem 0.8rem',
                          borderRadius: '8px',
                          backgroundColor: isDark ? '#131E31' : '#F8FAFD',
                          border: isDark ? '1px solid rgba(255, 255, 255, 0.04)' : '1px solid #E1E6EE',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                          <div
                            style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '50%',
                              backgroundColor: isDark ? '#1E293B' : '#E2E8F0',
                              color: isDark ? '#94A3B8' : '#475569',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {initials}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '0.84375rem', fontWeight: 600, color: isDark ? '#FFFFFF' : '#0B1B33', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {user.name}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: isDark ? '#94A3B8' : '#64748B' }}>
                              {user.role} · {user.joinedDisplay || 'Recent'}
                            </div>
                          </div>
                        </div>

                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 600,
                            borderRadius: '10px',
                            padding: '1px 7px',
                            backgroundColor:
                              user.status === 'approved'
                                ? 'rgba(16, 185, 129, 0.12)'
                                : user.status === 'rejected'
                                ? 'rgba(239, 68, 68, 0.12)'
                                : 'rgba(217, 119, 6, 0.12)',
                            color:
                              user.status === 'approved'
                                ? '#10B981'
                                : user.status === 'rejected'
                                ? '#EF4444'
                                : '#D97706',
                            textTransform: 'capitalize',
                          }}
                        >
                          {user.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/admin.css';
import {
  INITIAL_USERS,
  getStoredUsers,
  saveStoredUsers,
  resolveAdmissionRequest,
} from '../utils/mockApi';


const PRESET_REJECTION_REASONS = [
  'Institutional ID document is unreadable or blurry',
  'Roll / Employee identification does not match registrar database',
  'Uploaded proof expired or belongs to an unauthorized session',
  'Duplicate account registered with identical institutional credentials',
  'Department or course mismatch with enrolled examination roster',
  'Other (Custom reason specified below)',
];

export default function AdminUsers() {
  const navigate = useNavigate();
  const searchInputRef = useRef(null);

  // Theme state (Executive Light or Dark)
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

  // Local storage persistence synced with mockApi
  const [users, setUsers] = useState(() => {
    return getStoredUsers();
  });

  useEffect(() => {
    saveStoredUsers(users);
  }, [users]);

  // Live Student Admission Request state
  const [activeAdmissionRequest, setActiveAdmissionRequest] = useState(() => {
    try {
      const raw = localStorage.getItem('examai_latest_admission_request');
      if (raw) {
        const req = JSON.parse(raw);
        if (req.status === 'pending') return req;
      }
    } catch {}
    return null;
  });

  useEffect(() => {
    const checkRequests = () => {
      try {
        const raw = localStorage.getItem('examai_latest_admission_request');
        if (raw) {
          const req = JSON.parse(raw);
          if (req.status === 'pending') {
            setActiveAdmissionRequest(req);
            return;
          }
        }
        setActiveAdmissionRequest(null);
      } catch {}
    };

    const handleCustomReq = (e) => {
      if (e.detail && e.detail.status === 'pending') {
        setActiveAdmissionRequest(e.detail);
      }
    };

    const handleExternalUsersUpdate = () => {
      const latest = getStoredUsers();
      setUsers(latest);
      checkRequests();
    };

    window.addEventListener('storage', checkRequests);
    window.addEventListener('examai_admission_requested', handleCustomReq);
    window.addEventListener('examai_users_updated', handleExternalUsersUpdate);
    const interval = setInterval(checkRequests, 1000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', checkRequests);
      window.removeEventListener('examai_admission_requested', handleCustomReq);
      window.removeEventListener('examai_users_updated', handleExternalUsersUpdate);
    };
  }, []);

  // Filters & Search State
  const [statusTab, setStatusTab] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // 'all' | 'student' | 'teacher'
  const [deptFilter, setDeptFilter] = useState('all');

  // Sorting state
  const [sortConfig, setSortConfig] = useState({ key: 'joined', direction: 'desc' });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  // Multi-selection state
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Modal / Drawer States
  const [rejectingUser, setRejectingUser] = useState(null);
  const [selectedPresetReason, setSelectedPresetReason] = useState(PRESET_REJECTION_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [drawerUser, setDrawerUser] = useState(null);
  const [drawerTab, setDrawerTab] = useState('idProof');

  // New Candidate Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCandidate, setNewCandidate] = useState({
    name: '',
    email: '',
    role: 'student',
    college: 'Demo Institute of Technology',
    identifier: '',
    department: 'Computer Science',
    subDetails: 'B.Tech · 1st Year',
    status: 'pending',
  });

  // Toast Notification state
  const [toast, setToast] = useState(null);

  const showToast = (message, undoAction = null) => {
    setToast({ message, undoAction });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  // Keyboard shortcut: '/' to focus search, 'Escape' to close modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape') {
        setRejectingUser(null);
        setDrawerUser(null);
        setIsAddModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Summary Counters
  const counts = useMemo(() => {
    const total = users.length;
    const pending = users.filter((u) => u.status === 'pending').length;
    const approved = users.filter((u) => u.status === 'approved').length;
    const rejected = users.filter((u) => u.status === 'rejected').length;
    const students = users.filter((u) => u.role === 'student' && u.active).length;
    const teachers = users.filter((u) => u.role === 'teacher' && u.active).length;
    const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 100;

    return { total, pending, approved, rejected, students, teachers, approvalRate };
  }, [users]);

  // Handle Sort
  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  // Filter & Sort
  const processedUsers = useMemo(() => {
    const result = users.filter((u) => {
      if (statusTab !== 'all' && u.status !== statusTab) return false;
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (deptFilter !== 'all' && u.department !== deptFilter) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = u.name.toLowerCase().includes(query);
        const matchesEmail = u.email.toLowerCase().includes(query);
        const matchesId = u.identifier.toLowerCase().includes(query);
        const matchesCollege = u.college.toLowerCase().includes(query);
        if (!matchesName && !matchesEmail && !matchesId && !matchesCollege) {
          return false;
        }
      }

      return true;
    });

    result.sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [users, statusTab, roleFilter, deptFilter, searchQuery, sortConfig]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusTab, roleFilter, deptFilter, searchQuery]);

  const totalPages = Math.ceil(processedUsers.length / pageSize) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedUsers.slice(start, start + pageSize);
  }, [processedUsers, currentPage, pageSize]);

  // Single Actions
  const handleApprove = (userId) => {
    const prevUsers = [...users];
    const targetUser = users.find((u) => u.id === userId);
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: 'approved', rejectionReason: null } : u))
    );
    resolveAdmissionRequest(userId, 'approved');
    if (activeAdmissionRequest && (activeAdmissionRequest.id === userId || activeAdmissionRequest.email === targetUser?.email)) {
      setActiveAdmissionRequest(null);
    }
    showToast(`Approved ${targetUser?.name || 'candidate'}.`, () => {
      setUsers(prevUsers);
      resolveAdmissionRequest(userId, 'pending');
    });
  };

  const handleOpenRejectModal = (user) => {
    setRejectingUser(user);
    setSelectedPresetReason(PRESET_REJECTION_REASONS[0]);
    setCustomReason('');
  };

  const handleConfirmReject = () => {
    if (!rejectingUser) return;
    const finalReason =
      selectedPresetReason === 'Other (Custom reason specified below)' && customReason.trim()
        ? customReason.trim()
        : selectedPresetReason;

    const prevUsers = [...users];
    setUsers((prev) =>
      prev.map((u) =>
        u.id === rejectingUser.id
          ? { ...u, status: 'rejected', rejectionReason: finalReason }
          : u
      )
    );
    resolveAdmissionRequest(rejectingUser.id, 'rejected', finalReason);
    if (activeAdmissionRequest && (activeAdmissionRequest.id === rejectingUser.id || activeAdmissionRequest.email === rejectingUser.email)) {
      setActiveAdmissionRequest(null);
    }
    setRejectingUser(null);
    showToast(`Rejected ${rejectingUser.name}.`, () => {
      setUsers(prevUsers);
      resolveAdmissionRequest(rejectingUser.id, 'pending');
    });
  };

  const handleAdmitCandidate = (candidate) => {
    handleApprove(candidate.id);
  };

  const handleRejectCandidateAdmission = (candidate) => {
    const target = users.find((u) => u.id === candidate.id || u.email === candidate.email) || candidate;
    handleOpenRejectModal(target);
  };

  const handleToggleActive = (userId) => {
    const target = users.find((u) => u.id === userId);
    const newActiveState = !target.active;
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, active: newActiveState } : u))
    );
    showToast(`${target.name} access is now ${newActiveState ? 'Active' : 'Suspended'}.`);
  };

  // Bulk Actions
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(new Set(processedUsers.map((u) => u.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleSelectRow = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkApprove = () => {
    const prevUsers = [...users];
    setUsers((prev) =>
      prev.map((u) => (selectedIds.has(u.id) ? { ...u, status: 'approved', rejectionReason: null } : u))
    );
    showToast(`Approved ${selectedIds.size} selected accounts.`, () => {
      setUsers(prevUsers);
    });
    setSelectedIds(new Set());
  };

  const handleBulkReject = () => {
    const prevUsers = [...users];
    setUsers((prev) =>
      prev.map((u) =>
        selectedIds.has(u.id)
          ? { ...u, status: 'rejected', rejectionReason: 'Batch administrative review rejection' }
          : u
      )
    );
    showToast(`Rejected ${selectedIds.size} selected accounts.`, () => {
      setUsers(prevUsers);
    });
    setSelectedIds(new Set());
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['ID', 'Name', 'Email', 'Role', 'College', 'Identifier', 'Department', 'Joined', 'Status', 'Active'];
    const rows = processedUsers.map((u) => [
      u.id,
      `"${u.name}"`,
      u.email,
      u.role,
      `"${u.college}"`,
      `"${u.identifier}"`,
      `"${u.department}"`,
      u.joinedDisplay || u.joined,
      u.status,
      u.active ? 'Yes' : 'No',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ExamAI_Candidate_Roster_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported filtered candidate roster to CSV.');
  };

  // Print Roster
  const handlePrintRoster = () => {
    window.print();
  };

  // Add Candidate submit
  const handleCreateCandidate = (e) => {
    e.preventDefault();
    if (!newCandidate.name || !newCandidate.email || !newCandidate.identifier) {
      alert('Please fill out candidate Name, Email, and Identifier Code.');
      return;
    }

    const created = {
      id: `usr_${Date.now()}`,
      name: newCandidate.name,
      email: newCandidate.email,
      role: newCandidate.role,
      college: newCandidate.college,
      identifier: newCandidate.identifier,
      department: newCandidate.department,
      subDetails: newCandidate.subDetails,
      joined: new Date().toISOString().slice(0, 10),
      joinedDisplay: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: newCandidate.status,
      active: true,
      rejectionReason: null,
      adminNotes: 'Manually registered via Administrative Console.',
      avatarColor: newCandidate.role === 'teacher' ? '#0E6B58' : '#2D5BD0',
      idProofUrl: `DOC-${newCandidate.role.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
    };

    setUsers((prev) => [created, ...prev]);
    setIsAddModalOpen(false);
    setNewCandidate({
      name: '',
      email: '',
      role: 'student',
      college: 'Demo Institute of Technology',
      identifier: '',
      department: 'Computer Science',
      subDetails: 'B.Tech · 1st Year',
      status: 'pending',
    });
    showToast(`Added candidate ${created.name} to roster.`);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setStatusTab('all');
    setRoleFilter('all');
    setDeptFilter('all');
    setSearchQuery('');
  };

  const hasActiveFilters = statusTab !== 'all' || roleFilter !== 'all' || deptFilter !== 'all' || searchQuery.trim() !== '';

  return (
    <div className="admin-layout" data-admin-theme={theme}>
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

            <Link to="/admin/overview" className="admin-nav-item">
              <svg className="admin-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="9" rx="1" />
                <rect x="14" y="3" width="7" height="5" rx="1" />
                <rect x="14" y="12" width="7" height="9" rx="1" />
                <rect x="3" y="16" width="7" height="5" rx="1" />
              </svg>
              <span>Overview</span>
            </Link>

            <Link to="/admin/users" className="admin-nav-item active">
              <svg className="admin-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span>Users & Approvals</span>
              {counts.pending > 0 && <span className="admin-nav-badge">{counts.pending}</span>}
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

      {/* Main Content Area */}
      <main className="admin-main">
        {/* Top Header Bar */}
        <header className="admin-topbar">
          <nav className="admin-breadcrumbs">
            <Link to="/dashboard/admin">Platform Admin</Link>
            <span className="admin-breadcrumbs-separator">/</span>
            <span className="admin-breadcrumbs-active">Users & Approvals</span>
          </nav>

          <div className="admin-topbar-actions">
            {/* Live Sync Badge */}
            <div className="live-sync-indicator" title="Automatic real-time sync with candidate registration stream">
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

            {/* Add Candidate Button */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="btn-action"
              style={{ background: '#2D5BD0', color: '#FFFFFF', padding: '5px 12px' }}
            >
              <span>+ Add Candidate</span>
            </button>

            {/* Export CSV Button */}
            <button
              onClick={handleExportCSV}
              className="btn-action btn-action-details"
              title="Export current table to CSV"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Export</span>
            </button>

            {/* Print Roster */}
            <button
              onClick={handlePrintRoster}
              className="btn-action btn-action-details"
              title="Print formatted candidate roster"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="admin-content">
          {/* Compact Page Heading */}
          <div className="admin-page-header">
            <div>
              <div className="admin-header-kicker">Admin Console</div>
              <h1 className="admin-header-title">Users & Approvals</h1>
              <p className="admin-header-desc">
                Approve, reject, or deactivate teacher and student accounts. Review academic verification credentials before granting examination privileges.
              </p>
            </div>
          </div>

          {/* Live Student Test Admission Desk Alert Banner */}
          {activeAdmissionRequest && activeAdmissionRequest.status === 'pending' && (
            <div
              style={{
                background: theme === 'dark' ? 'linear-gradient(135deg, #102444 0%, #18335C 100%)' : 'linear-gradient(135deg, #0B1B33 0%, #162C52 100%)',
                borderRadius: '12px',
                padding: '1.25rem 1.5rem',
                marginBottom: '1.5rem',
                border: '1px solid rgba(45, 91, 208, 0.4)',
                boxShadow: '0 8px 24px -4px rgba(11, 27, 51, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
                color: '#FFFFFF',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(45, 91, 208, 0.25)',
                    border: '1px solid #2D5BD0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#9DB6F5',
                    flexShrink: 0,
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#10B981',
                        boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.3)',
                      }}
                    />
                    <strong style={{ fontSize: '0.95rem', color: '#FFFFFF', letterSpacing: '0.01em' }}>
                      Live Student Test Admission Request
                    </strong>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        color: '#9DB6F5',
                        backgroundColor: 'rgba(45, 91, 208, 0.28)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontWeight: 600,
                      }}
                    >
                      {activeAdmissionRequest.requestedDisplayTime || 'Just now'}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.84375rem', color: '#C9D1DC', margin: 0, lineHeight: 1.4 }}>
                    {activeAdmissionRequest.role === 'teacher' ? 'Faculty / Educator' : 'Candidate'}{' '}
                    <strong style={{ color: '#FFFFFF' }}>{activeAdmissionRequest.name}</strong> ({activeAdmissionRequest.email}) is waiting for administrator approval.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={() => handleAdmitCandidate(activeAdmissionRequest)}
                  style={{
                    backgroundColor: '#2F7D5B',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '0.55rem 1.15rem',
                    borderRadius: '7px',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 6px rgba(47, 125, 91, 0.4)',
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{activeAdmissionRequest.role === 'teacher' ? 'Approve Faculty' : 'Accept & Admit'}</span>
                </button>

                <button
                  onClick={() => handleRejectCandidateAdmission(activeAdmissionRequest)}
                  style={{
                    backgroundColor: 'rgba(184, 67, 63, 0.15)',
                    color: '#F87171',
                    border: '1px solid rgba(184, 67, 63, 0.4)',
                    padding: '0.55rem 1.15rem',
                    borderRadius: '7px',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  <span>Reject</span>
                </button>
              </div>
            </div>
          )}

          {/* Compact Stat Overview Cards */}
          <div className="admin-stats-grid">
            <div className="admin-stat-card stat-pending">
              <div className="admin-stat-label">
                <span>Pending Review</span>
                <span style={{ color: '#D97706', fontSize: '0.68rem', fontWeight: 700 }}>Action Required</span>
              </div>
              <div className="admin-stat-value">{counts.pending}</div>
              <div className="admin-stat-hint">Candidates awaiting verification</div>
            </div>

            <div className="admin-stat-card stat-students">
              <div className="admin-stat-label">
                <span>Active Students</span>
                <span style={{ color: '#2D5BD0', fontSize: '0.68rem', fontWeight: 700 }}>Enrolled</span>
              </div>
              <div className="admin-stat-value">{counts.students}</div>
              <div className="admin-stat-hint">Authorized for online exams</div>
            </div>

            <div className="admin-stat-card stat-teachers">
              <div className="admin-stat-label">
                <span>Verified Faculty</span>
                <span style={{ color: '#0E6B58', fontSize: '0.68rem', fontWeight: 700 }}>Educators</span>
              </div>
              <div className="admin-stat-value">{counts.teachers}</div>
              <div className="admin-stat-hint">Authorized paper creators</div>
            </div>

            <div className="admin-stat-card stat-approved">
              <div className="admin-stat-label">
                <span>Approval Ratio</span>
                <span style={{ color: '#10B981', fontSize: '0.68rem', fontWeight: 700 }}>Pass Rate</span>
              </div>
              <div className="admin-stat-value">{counts.approvalRate}%</div>
              <div className="admin-stat-hint">{counts.approved} approved of {counts.total} total</div>
            </div>
          </div>

          {/* Table Container Card */}
          <div className="admin-table-container">
            {/* Filter Toolbar */}
            <div className="admin-toolbar">
              {/* Status Tabs */}
              <div className="admin-filter-tabs">
                <button
                  type="button"
                  className={`admin-tab-btn ${statusTab === 'pending' ? 'active tab-pending' : ''}`}
                  onClick={() => setStatusTab('pending')}
                >
                  <span>Pending</span>
                  <span className="admin-tab-count">{counts.pending}</span>
                </button>

                <button
                  type="button"
                  className={`admin-tab-btn ${statusTab === 'approved' ? 'active' : ''}`}
                  onClick={() => setStatusTab('approved')}
                >
                  <span>Approved</span>
                  <span className="admin-tab-count">{counts.approved}</span>
                </button>

                <button
                  type="button"
                  className={`admin-tab-btn ${statusTab === 'rejected' ? 'active' : ''}`}
                  onClick={() => setStatusTab('rejected')}
                >
                  <span>Rejected</span>
                  <span className="admin-tab-count">{counts.rejected}</span>
                </button>

                <button
                  type="button"
                  className={`admin-tab-btn ${statusTab === 'all' ? 'active' : ''}`}
                  onClick={() => setStatusTab('all')}
                >
                  <span>All</span>
                  <span className="admin-tab-count">{counts.total}</span>
                </button>
              </div>

              {/* Search & Filter Dropdowns */}
              <div className="admin-toolbar-controls">
                {/* Search Bar with Keyboard indicator */}
                <div className="admin-search-wrapper">
                  <svg className="admin-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    ref={searchInputRef}
                    type="text"
                    className="admin-search-input"
                    placeholder="Search name, email, roll no..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {!searchQuery && <span className="admin-search-kbd">/</span>}
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      style={{
                        position: 'absolute',
                        right: '6px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: '#94A3B8',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Role Filter */}
                <select
                  className="admin-select"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="all">All Roles</option>
                  <option value="student">Students</option>
                  <option value="teacher">Teachers / Faculty</option>
                </select>

                {/* Department Filter */}
                <select
                  className="admin-select"
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                >
                  <option value="all">All Departments</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Physics">Physics</option>
                  <option value="Electrical Eng">Electrical Eng</option>
                </select>
              </div>
            </div>

            {/* Active Filter Chips */}
            {hasActiveFilters && (
              <div className="admin-active-filters">
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--adm-text-muted)' }}>
                  Active Filters:
                </span>
                {statusTab !== 'all' && (
                  <span className="active-filter-tag">
                    Status: {statusTab}
                    <span className="active-filter-tag-close" onClick={() => setStatusTab('all')}>✕</span>
                  </span>
                )}
                {roleFilter !== 'all' && (
                  <span className="active-filter-tag">
                    Role: {roleFilter}
                    <span className="active-filter-tag-close" onClick={() => setRoleFilter('all')}>✕</span>
                  </span>
                )}
                {deptFilter !== 'all' && (
                  <span className="active-filter-tag">
                    Dept: {deptFilter}
                    <span className="active-filter-tag-close" onClick={() => setDeptFilter('all')}>✕</span>
                  </span>
                )}
                {searchQuery.trim() !== '' && (
                  <span className="active-filter-tag">
                    Query: "{searchQuery}"
                    <span className="active-filter-tag-close" onClick={() => setSearchQuery('')}>✕</span>
                  </span>
                )}
                <button
                  onClick={handleClearFilters}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: '#2D5BD0',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    marginLeft: '4px',
                  }}
                >
                  Clear All Filters
                </button>
              </div>
            )}

            {/* Bulk Action Bar */}
            {selectedIds.size > 0 && (
              <div className="admin-bulk-bar">
                <div className="admin-bulk-info">
                  <span className="admin-bulk-badge">{selectedIds.size}</span>
                  <span>Candidates selected for bulk action</span>
                </div>
                <div className="admin-bulk-buttons">
                  <button
                    onClick={handleBulkApprove}
                    className="btn-action btn-action-approve"
                  >
                    ✓ Approve Selected ({selectedIds.size})
                  </button>
                  <button
                    onClick={handleBulkReject}
                    className="btn-action btn-action-reject"
                    style={{ color: '#F87171', borderColor: 'rgba(248, 113, 113, 0.4)' }}
                  >
                    ✕ Reject Selected ({selectedIds.size})
                  </button>
                  <button
                    onClick={() => setSelectedIds(new Set())}
                    className="btn-action btn-action-details"
                    style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#FFFFFF', borderColor: 'transparent' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Candidate Table with Sortable Columns */}
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: '36px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={paginatedUsers.length > 0 && selectedIds.size === paginatedUsers.length}
                        onChange={handleSelectAll}
                        style={{ cursor: 'pointer' }}
                        title="Select All on page"
                      />
                    </th>
                    <th className="th-sortable" onClick={() => handleSort('name')}>
                      User {sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : <span style={{ opacity: 0.35 }}>⇅</span>}
                    </th>
                    <th className="th-sortable" onClick={() => handleSort('role')}>
                      Role {sortConfig.key === 'role' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : <span style={{ opacity: 0.35 }}>⇅</span>}
                    </th>
                    <th className="th-sortable" onClick={() => handleSort('college')}>
                      Details {sortConfig.key === 'college' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : <span style={{ opacity: 0.35 }}>⇅</span>}
                    </th>
                    <th className="th-sortable" onClick={() => handleSort('joined')}>
                      Joined {sortConfig.key === 'joined' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : <span style={{ opacity: 0.35 }}>⇅</span>}
                    </th>
                    <th className="th-sortable" onClick={() => handleSort('status')}>
                      Status {sortConfig.key === 'status' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : <span style={{ opacity: 0.35 }}>⇅</span>}
                    </th>
                    <th>Active</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#7A8CA5' }}>
                        <div style={{ fontSize: '1.05rem', marginBottom: '0.3rem', fontWeight: 600, color: 'var(--adm-text)' }}>
                          No matching candidates found
                        </div>
                        <div style={{ fontSize: '0.78rem', marginBottom: '0.75rem' }}>
                          Try clearing your search query or selecting a different status filter tab.
                        </div>
                        {hasActiveFilters && (
                          <button
                            onClick={handleClearFilters}
                            className="btn-action btn-action-details"
                          >
                            Reset All Filters
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((user) => {
                      const isSelected = selectedIds.has(user.id);
                      const initials = user.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase();

                      return (
                        <tr key={user.id} className={isSelected ? 'row-selected' : ''}>
                          {/* Checkbox */}
                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectRow(user.id)}
                              style={{ cursor: 'pointer' }}
                            />
                          </td>

                          {/* Candidate Identity */}
                          <td>
                            <div className="candidate-cell">
                              <div
                                className={`candidate-avatar ${
                                  user.role === 'teacher' ? 'avatar-teacher' : 'avatar-student'
                                }`}
                              >
                                {initials}
                              </div>
                              <div className="candidate-meta">
                                <div className="candidate-name">
                                  <span>{user.name}</span>
                                  {user.status === 'approved' && (
                                    <svg
                                      width="13"
                                      height="13"
                                      viewBox="0 0 24 24"
                                      fill="#10B981"
                                      stroke="#FFFFFF"
                                      strokeWidth="2"
                                      title="Institutional Email Verified"
                                    >
                                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                    </svg>
                                  )}
                                </div>
                                <span className="candidate-email">{user.email}</span>
                              </div>
                            </div>
                          </td>

                          {/* Role Badge */}
                          <td>
                            <span
                              className={`role-badge`}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '2px 8px',
                                borderRadius: '9999px',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                textTransform: 'capitalize',
                                backgroundColor: user.role === 'teacher' ? '#E3F1EC' : '#E6EDFB',
                                color: user.role === 'teacher' ? '#0E6B58' : '#2347A8',
                                border: `1px solid ${user.role === 'teacher' ? '#B7DACD' : '#BFD0F3'}`,
                              }}
                            >
                              {user.role}
                            </span>
                          </td>

                          {/* Academic Details */}
                          <td>
                            <div className="details-college" title={user.college}>
                              {user.college}
                            </div>
                            <div className="details-sub">
                              <span className="details-code">{user.identifier}</span>
                              <span>·</span>
                              <span>{user.subDetails}</span>
                            </div>
                          </td>

                          {/* Join Date */}
                          <td style={{ color: 'var(--adm-text-muted)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                            {user.joinedDisplay || user.joined}
                          </td>

                          {/* Status Pill */}
                          <td>
                            <div style={{ display: 'inline-block' }}>
                              <span className={`status-pill ${user.status}`}>
                                <span className="status-dot" />
                                <span style={{ textTransform: 'capitalize' }}>{user.status}</span>
                              </span>
                              {user.status === 'rejected' && user.rejectionReason && (
                                <span
                                  className="rejection-reason-text"
                                  title={user.rejectionReason}
                                >
                                  "{user.rejectionReason}"
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Active Toggle Switch */}
                          <td>
                            <div className="switch-container">
                              <label className="switch-toggle" title={`Toggle access: ${user.active ? 'Active' : 'Suspended'}`}>
                                <input
                                  type="checkbox"
                                  checked={user.active}
                                  onChange={() => handleToggleActive(user.id)}
                                />
                                <span className="switch-slider" />
                              </label>
                              <span className={`switch-label ${user.active ? 'active' : ''}`}>
                                {user.active ? 'Active' : 'Off'}
                              </span>
                            </div>
                          </td>

                          {/* Actions */}
                          <td>
                            <div className="table-actions">
                              {/* Details Drawer Button */}
                              <button
                                className="btn-action btn-action-details"
                                title="Inspect Verification Credentials"
                                onClick={() => {
                                  setDrawerUser(user);
                                  setDrawerTab('idProof');
                                }}
                              >
                                👁 Details
                              </button>

                              {/* Approve Button */}
                              {user.status !== 'approved' && (
                                <button
                                  className="btn-action btn-action-approve"
                                  title="Approve candidate"
                                  onClick={() => handleApprove(user.id)}
                                >
                                  ✓ Approve
                                </button>
                              )}

                              {/* Reject Button */}
                              {user.status !== 'rejected' && (
                                <button
                                  className="btn-action btn-action-reject"
                                  title="Reject with institutional reason"
                                  onClick={() => handleOpenRejectModal(user)}
                                >
                                  ✕ Reject
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Compact Pagination Controls */}
            {processedUsers.length > 0 && (
              <div className="adm-pagination-bar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span>
                    Showing <strong>{(currentPage - 1) * pageSize + 1}</strong> to{' '}
                    <strong>{Math.min(currentPage * pageSize, processedUsers.length)}</strong> of{' '}
                    <strong>{processedUsers.length}</strong> candidates
                  </span>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.76rem' }}>
                    <span>Per page:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="admin-select"
                      style={{ padding: '2px 16px 2px 5px', fontSize: '0.74rem' }}
                    >
                      <option value={5}>5</option>
                      <option value={8}>8</option>
                      <option value={15}>15</option>
                      <option value={30}>30</option>
                    </select>
                  </label>
                </div>

                <div className="adm-pagination-controls">
                  <button
                    className="adm-page-btn"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    ‹ Prev
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                    <button
                      key={num}
                      className={`adm-page-btn ${currentPage === num ? 'active' : ''}`}
                      onClick={() => setCurrentPage(num)}
                    >
                      {num}
                    </button>
                  ))}

                  <button
                    className="adm-page-btn"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next ›
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Add Candidate Modal */}
      {isAddModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Authorize New Candidate</h3>
                <span style={{ fontSize: '0.76rem', color: 'var(--adm-text-muted)' }}>
                  Add a student or faculty account to the examination platform roster.
                </span>
              </div>
              <button className="modal-close-btn" onClick={() => setIsAddModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCandidate}>
              <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, marginBottom: '3px' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="admin-search-input"
                    placeholder="e.g. Ananya Sen"
                    value={newCandidate.name}
                    onChange={(e) => setNewCandidate({ ...newCandidate, name: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, marginBottom: '3px' }}>
                    Institutional Email *
                  </label>
                  <input
                    type="email"
                    required
                    className="admin-search-input"
                    placeholder="ananya@demo.edu"
                    value={newCandidate.email}
                    onChange={(e) => setNewCandidate({ ...newCandidate, email: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, marginBottom: '3px' }}>
                    Role *
                  </label>
                  <select
                    className="admin-select"
                    style={{ width: '100%' }}
                    value={newCandidate.role}
                    onChange={(e) => setNewCandidate({ ...newCandidate, role: e.target.value })}
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher / Faculty</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, marginBottom: '3px' }}>
                    Roll No / Faculty ID *
                  </label>
                  <input
                    type="text"
                    required
                    className="admin-search-input"
                    placeholder="e.g. 24-CS-188"
                    value={newCandidate.identifier}
                    onChange={(e) => setNewCandidate({ ...newCandidate, identifier: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, marginBottom: '3px' }}>
                    Department
                  </label>
                  <select
                    className="admin-select"
                    style={{ width: '100%' }}
                    value={newCandidate.department}
                    onChange={(e) => setNewCandidate({ ...newCandidate, department: e.target.value })}
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Physics">Physics</option>
                    <option value="Electrical Eng">Electrical Eng</option>
                  </select>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, marginBottom: '3px' }}>
                    College / Institution
                  </label>
                  <input
                    type="text"
                    className="admin-search-input"
                    value={newCandidate.college}
                    onChange={(e) => setNewCandidate({ ...newCandidate, college: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, marginBottom: '3px' }}>
                    Class / Year Details
                  </label>
                  <input
                    type="text"
                    className="admin-search-input"
                    placeholder="e.g. B.Tech · 2nd Year"
                    value={newCandidate.subDetails}
                    onChange={(e) => setNewCandidate({ ...newCandidate, subDetails: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, marginBottom: '3px' }}>
                    Initial Approval Status
                  </label>
                  <select
                    className="admin-select"
                    style={{ width: '100%' }}
                    value={newCandidate.status}
                    onChange={(e) => setNewCandidate({ ...newCandidate, status: e.target.value })}
                  >
                    <option value="pending">Pending Review</option>
                    <option value="approved">Pre-Approved</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-action btn-action-details"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-action"
                  style={{ background: '#2D5BD0', color: '#FFFFFF', padding: '5px 14px' }}
                >
                  Save & Authorize
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal with Presets */}
      {rejectingUser && (
        <div className="modal-backdrop" onClick={() => setRejectingUser(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Reject Registration</h3>
                <span style={{ fontSize: '0.76rem', color: 'var(--adm-text-muted)' }}>
                  Candidate: <strong>{rejectingUser.name}</strong> ({rejectingUser.email})
                </span>
              </div>
              <button className="modal-close-btn" onClick={() => setRejectingUser(null)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: '0.8rem', color: 'var(--adm-text)', marginBottom: '0.65rem' }}>
                Select an institutional reason for rejecting this candidate account:
              </p>

              <div className="reason-presets-grid">
                {PRESET_REJECTION_REASONS.map((reason) => (
                  <label
                    key={reason}
                    className={`reason-preset-label ${selectedPresetReason === reason ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="rejectionReason"
                      value={reason}
                      checked={selectedPresetReason === reason}
                      onChange={() => setSelectedPresetReason(reason)}
                      style={{ accentColor: '#DC2626' }}
                    />
                    <span>{reason}</span>
                  </label>
                ))}
              </div>

              {selectedPresetReason === 'Other (Custom reason specified below)' && (
                <div style={{ marginTop: '0.65rem' }}>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--adm-text)', marginBottom: '3px' }}>
                    Specific Administrative Reason:
                  </label>
                  <textarea
                    rows="3"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Enter specific audit observation (e.g. Roll number not present in registrar list)..."
                    style={{
                      width: '100%',
                      padding: '0.55rem',
                      borderRadius: '6px',
                      border: '1px solid var(--adm-border)',
                      fontSize: '0.8rem',
                      fontFamily: 'inherit',
                      outline: 'none',
                      background: 'var(--adm-surface)',
                      color: 'var(--adm-text)',
                    }}
                  />
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="btn-action btn-action-details"
                onClick={() => setRejectingUser(null)}
              >
                Cancel
              </button>
              <button
                className="btn-action"
                style={{ background: '#DC2626', color: '#FFFFFF', padding: '5px 14px' }}
                onClick={handleConfirmReject}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Candidate Verification Details Drawer / Side Sheet */}
      {drawerUser && (
        <div className="drawer-backdrop" onClick={() => setDrawerUser(null)}>
          <div className="drawer-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="drawer-header">
              <div>
                <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: '#2D5BD0', fontWeight: 700 }}>
                  Verification Dossier
                </span>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', margin: '1px 0 0', color: 'var(--adm-text)' }}>
                  {drawerUser.name}
                </h2>
              </div>
              <button className="modal-close-btn" onClick={() => setDrawerUser(null)}>
                ✕
              </button>
            </div>

            {/* Drawer Tabs */}
            <div className="drawer-tabs">
              <button
                className={`drawer-tab ${drawerTab === 'idProof' ? 'active' : ''}`}
                onClick={() => setDrawerTab('idProof')}
              >
                Identity & ID Card
              </button>
              <button
                className={`drawer-tab ${drawerTab === 'academic' ? 'active' : ''}`}
                onClick={() => setDrawerTab('academic')}
              >
                Academic Profile
              </button>
              <button
                className={`drawer-tab ${drawerTab === 'audit' ? 'active' : ''}`}
                onClick={() => setDrawerTab('audit')}
              >
                Audit & Notes
              </button>
            </div>

            <div className="drawer-body">
              {drawerTab === 'idProof' && (
                <>
                  {/* Institutional ID Preview Card */}
                  <div className="id-card-preview">
                    <div className="id-card-watermark">EXAM</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div>
                        <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9DB6F5' }}>
                          Institutional Identity Card
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', marginTop: '1px' }}>
                          {drawerUser.college}
                        </div>
                      </div>
                      <span
                        style={{
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          backgroundColor: 'rgba(255, 255, 255, 0.2)',
                          textTransform: 'uppercase',
                        }}
                      >
                        {drawerUser.role}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr', gap: '0.85rem', alignItems: 'center' }}>
                      <div
                        style={{
                          width: '64px',
                          height: '72px',
                          borderRadius: '6px',
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1rem',
                          fontWeight: 700,
                        }}
                      >
                        {drawerUser.name
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')}
                        <span style={{ fontSize: '0.55rem', color: '#9DB6F5', marginTop: '2px' }}>VERIFIED</span>
                      </div>

                      <div style={{ fontSize: '0.78rem', lineHeight: 1.5 }}>
                        <div>
                          <span style={{ color: '#9DB6F5' }}>ID Code: </span>
                          <strong style={{ fontFamily: 'monospace' }}>{drawerUser.identifier}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#9DB6F5' }}>Program: </span>
                          <span>{drawerUser.subDetails}</span>
                        </div>
                        <div>
                          <span style={{ color: '#9DB6F5' }}>Dept: </span>
                          <span>{drawerUser.department}</span>
                        </div>
                        <div>
                          <span style={{ color: '#9DB6F5' }}>Doc Ref: </span>
                          <span style={{ fontFamily: 'monospace', fontSize: '0.72rem' }}>{drawerUser.idProofUrl}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Verification Checklist */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--adm-text-muted)', marginBottom: '0.4rem' }}>
                      Administrator Verification Checklist
                    </div>
                    <div className="verification-checklist">
                      <label className="checklist-item">
                        <input type="checkbox" defaultChecked />
                        <span>Facial portrait matches registered user profile</span>
                      </label>
                      <label className="checklist-item">
                        <input type="checkbox" defaultChecked />
                        <span>Institutional email domain validated by DNS records</span>
                      </label>
                      <label className="checklist-item">
                        <input type="checkbox" defaultChecked />
                        <span>Identification code matches registrar academic roster</span>
                      </label>
                    </div>
                  </div>
                </>
              )}

              {drawerTab === 'academic' && (
                <div style={{ background: 'var(--adm-surface-alt)', borderRadius: '8px', padding: '1rem', border: '1px solid var(--adm-border)', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', fontSize: '0.78rem' }}>
                    <div>
                      <span style={{ color: 'var(--adm-text-muted)', display: 'block', fontSize: '0.7rem' }}>Enrolled Degree</span>
                      <strong>{drawerUser.subDetails}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--adm-text-muted)', display: 'block', fontSize: '0.7rem' }}>Department</span>
                      <strong>{drawerUser.department}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--adm-text-muted)', display: 'block', fontSize: '0.7rem' }}>Host Institution</span>
                      <strong>{drawerUser.college}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--adm-text-muted)', display: 'block', fontSize: '0.7rem' }}>Candidate Role</span>
                      <strong style={{ textTransform: 'capitalize' }}>{drawerUser.role}</strong>
                    </div>
                  </div>
                </div>
              )}

              {drawerTab === 'audit' && (
                <div style={{ background: 'var(--adm-surface-alt)', borderRadius: '8px', padding: '1rem', border: '1px solid var(--adm-border)', marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--adm-text-muted)', marginBottom: '0.5rem' }}>
                    Internal Administrative Notes
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--adm-text)', marginBottom: '0.75rem', lineHeight: 1.4 }}>
                    {drawerUser.adminNotes || 'No notes currently logged.'}
                  </p>

                  <div style={{ borderTop: '1px solid var(--adm-border)', paddingTop: '0.6rem', fontSize: '0.74rem', color: 'var(--adm-text-muted)' }}>
                    <div>Logged IP: <code>192.168.1.104 (Campus Wi-Fi)</code></div>
                    <div>Application Timestamp: <code>{drawerUser.joined}T10:14:00Z</code></div>
                  </div>
                </div>
              )}

              {/* Account Metadata Summary */}
              <div style={{ background: 'var(--adm-surface-alt)', borderRadius: '8px', padding: '0.85rem', border: '1px solid var(--adm-border)', marginBottom: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', fontSize: '0.78rem' }}>
                  <div>
                    <span style={{ color: 'var(--adm-text-muted)', display: 'block', fontSize: '0.7rem' }}>Email Address</span>
                    <strong style={{ color: 'var(--adm-text)' }}>{drawerUser.email}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--adm-text-muted)', display: 'block', fontSize: '0.7rem' }}>Current Status</span>
                    <span className={`status-pill ${drawerUser.status}`} style={{ marginTop: '2px' }}>
                      <span className="status-dot" />
                      <span style={{ textTransform: 'capitalize' }}>{drawerUser.status}</span>
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--adm-text-muted)', display: 'block', fontSize: '0.7rem' }}>Registration Date</span>
                    <strong style={{ color: 'var(--adm-text)' }}>{drawerUser.joinedDisplay || drawerUser.joined}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--adm-text-muted)', display: 'block', fontSize: '0.7rem' }}>Platform Access</span>
                    <strong style={{ color: drawerUser.active ? '#10B981' : '#EF4444' }}>
                      {drawerUser.active ? 'Access Enabled' : 'Access Suspended'}
                    </strong>
                  </div>
                </div>

                {drawerUser.rejectionReason && (
                  <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--adm-border)' }}>
                    <span style={{ color: '#DC2626', display: 'block', fontSize: '0.7rem', fontWeight: 600 }}>
                      Logged Rejection Audit Note:
                    </span>
                    <p style={{ margin: '3px 0 0', fontSize: '0.76rem', color: '#991B1B', fontStyle: 'italic' }}>
                      "{drawerUser.rejectionReason}"
                    </p>
                  </div>
                )}
              </div>

              {/* Drawer Quick Actions */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {drawerUser.status !== 'approved' && (
                  <button
                    className="btn-action btn-action-approve"
                    style={{ flex: 1, padding: '0.65rem', fontSize: '0.82rem' }}
                    onClick={() => {
                      handleApprove(drawerUser.id);
                      setDrawerUser((prev) => ({ ...prev, status: 'approved', rejectionReason: null }));
                    }}
                  >
                    ✓ Approve Candidate
                  </button>
                )}

                {drawerUser.status !== 'rejected' && (
                  <button
                    className="btn-action btn-action-reject"
                    style={{ flex: 1, padding: '0.65rem', fontSize: '0.82rem', color: '#DC2626' }}
                    onClick={() => {
                      const userToReject = drawerUser;
                      setDrawerUser(null);
                      handleOpenRejectModal(userToReject);
                    }}
                  >
                    ✕ Reject Candidate
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div className="admin-toast-container">
          <div className="admin-toast">
            <span>{toast.message}</span>
            {toast.undoAction && (
              <button
                className="toast-undo-btn"
                onClick={() => {
                  toast.undoAction();
                  setToast(null);
                }}
              >
                Undo
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

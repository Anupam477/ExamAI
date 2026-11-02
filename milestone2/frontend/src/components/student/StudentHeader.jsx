import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearActiveSession } from '../../utils/mockApi';

/**
 * Student Portal Top Navigation Bar
 * Ultra-clean, minimalist layout matching the exact design specification:
 * Theme toggle (Sun/Moon) and user avatar TS with dropdown.
 */
export default function StudentHeader({ theme, onToggleTheme, activeUser }) {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleSignOut = () => {
    clearActiveSession();
    navigate('/');
  };

  return (
    <header className="student-header">
      <div className="student-header-right">
        {/* Theme Toggle Button (Sun in Light, Moon in Dark) */}
        <button
          type="button"
          className="student-theme-btn"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
          )}
        </button>

        {/* User Profile Pill */}
        <div style={{ position: 'relative' }}>
          <div
            className="student-user-pill"
            onClick={() => setDropdownOpen((prev) => !prev)}
            role="button"
            tabIndex={0}
          >
            <div className="student-avatar">
              {activeUser?.initials || 'TS'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="student-user-name">
                {activeUser?.name || 'test student'}
              </span>
              <span className="student-user-role">
                {activeUser?.roleTitle || 'Student'}
              </span>
            </div>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ color: 'var(--sp-text-muted)', marginLeft: 2 }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>

          {/* Profile Dropdown */}
          {dropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                backgroundColor: 'var(--sp-surface)',
                border: '1px solid var(--sp-border)',
                borderRadius: '12px',
                padding: '0.5rem',
                minWidth: '210px',
                boxShadow: 'var(--sp-shadow-modal)',
                zIndex: 100,
              }}
            >
              <div
                style={{
                  padding: '0.65rem 0.85rem',
                  borderBottom: '1px solid var(--sp-border)',
                  marginBottom: '0.35rem',
                }}
              >
                <div style={{ fontSize: '0.84375rem', fontWeight: 600, color: 'var(--sp-text-primary)' }}>
                  {activeUser?.name || 'test student'}
                </div>
                <div style={{ fontSize: '0.71875rem', color: 'var(--sp-text-muted)' }}>
                  {activeUser?.email || 'teststudent@gmail.com'}
                </div>
              </div>

              <div
                style={{
                  padding: '0.5rem 0.85rem',
                  fontSize: '0.75rem',
                  color: 'var(--sp-text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                <span>Verified Candidate</span>
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '0.55rem 0.85rem',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--sp-rose-text)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--sp-surface-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

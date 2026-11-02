import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearActiveSession } from '../../utils/mockApi';

/**
 * Teacher Console Top Navigation Bar
 * Features theme toggle (Sun/Moon) and teacher profile pill with drop-down.
 */
export default function TeacherHeader({ theme, onToggleTheme, activeUser }) {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleSignOut = () => {
    clearActiveSession();
    navigate('/');
  };

  return (
    <header className="teacher-header">
      <div className="teacher-header-left">
        <span style={{ fontSize: '0.84375rem', color: 'var(--tp-text-muted)' }}>
          Educator Console &bull; <strong style={{ color: 'var(--tp-text-primary)' }}>ExamAI Studio</strong>
        </span>
      </div>

      <div className="teacher-header-right">
        {/* Theme Toggle Button */}
        <button
          type="button"
          className="teacher-theme-btn"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? (
            // Moon icon in dark mode
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          ) : (
            // Sun icon matching screenshot
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
            className="teacher-user-pill"
            onClick={() => setDropdownOpen((prev) => !prev)}
            role="button"
            tabIndex={0}
          >
            <div className="teacher-user-avatar">
              {activeUser?.initials || 'TT'}
            </div>
            <div className="teacher-user-details">
              <span className="teacher-user-name">
                {activeUser?.name || 'test teacher'}
              </span>
              <span className="teacher-user-role">
                {activeUser?.roleTitle || 'Teacher'}
              </span>
            </div>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ color: 'var(--tp-text-muted)', marginLeft: 4 }}
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
                backgroundColor: 'var(--tp-surface)',
                border: '1px solid var(--tp-border)',
                borderRadius: '8px',
                padding: '0.5rem',
                minWidth: '180px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
                zIndex: 50,
              }}
            >
              <div
                style={{
                  padding: '0.45rem 0.75rem',
                  fontSize: '0.75rem',
                  color: 'var(--tp-text-muted)',
                  borderBottom: '1px solid var(--tp-border-light)',
                  marginBottom: '4px',
                }}
              >
                Logged in as <strong style={{ color: 'var(--tp-text-primary)' }}>Teacher</strong>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.84375rem',
                  color: '#DC2626',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

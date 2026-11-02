import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Student Portal Sidebar Navigation
 * Matches ExamAI student portal layout from user specification:
 * - OVERVIEW: Dashboard
 * - LEARNING: My Tests, Practice (AI generator), Results
 * - Footer badge: Student portal callout
 */
export default function StudentSidebar({ currentTab, onSelectTab }) {
  return (
    <aside className="student-sidebar">
      <div>
        {/* Brand Logo */}
        <Link to="/" className="student-logo-wrap">
          <div className="student-logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
          </div>
          <span className="student-logo-text">ExamAI</span>
        </Link>

        {/* OVERVIEW Group */}
        <div className="student-nav-group">
          <div className="student-nav-label">OVERVIEW</div>
          <button
            type="button"
            className={`student-nav-link ${currentTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => onSelectTab('dashboard')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            <span>Dashboard</span>
          </button>
        </div>

        {/* LEARNING Group */}
        <div className="student-nav-group">
          <div className="student-nav-label">LEARNING</div>

          <button
            type="button"
            className={`student-nav-link ${currentTab === 'tests' ? 'active' : ''}`}
            onClick={() => onSelectTab('tests')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <span>My Tests</span>
          </button>

          <button
            type="button"
            className={`student-nav-link ${currentTab === 'practice' ? 'active' : ''}`}
            onClick={() => onSelectTab('practice')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z" />
            </svg>
            <span>Practice</span>
          </button>

          <button
            type="button"
            className={`student-nav-link ${currentTab === 'results' ? 'active' : ''}`}
            onClick={() => onSelectTab('results')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
              <path d="M4 22h16" />
              <path d="M10 14.66V17c0 .55-.45 1-1 1H7" />
              <path d="M14 14.66V17c0 .55.45 1 1 1h2" />
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
            </svg>
            <span>Results</span>
          </button>
        </div>
      </div>

      {/* Student Portal Bottom Callout Badge */}
      <div className="student-portal-footer-card">
        <div className="student-portal-badge">
          N
        </div>
        <div>
          <div className="student-portal-info-title">Student portal</div>
          <div className="student-portal-info-desc">Practice with AI-generated tests anytime.</div>
        </div>
      </div>
    </aside>
  );
}

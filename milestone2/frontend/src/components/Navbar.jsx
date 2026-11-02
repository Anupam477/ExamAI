import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

/**
 * Top Navbar Component with Glassmorphism & Role-specific CTA Pills
 */
export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isCurrent = (path) => location.pathname === path;

  return (
    <header
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderBottom: '1px solid #E1E6EE',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 1px 3px rgba(11, 27, 51, 0.03)',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '70px',
        }}
      >
        {/* Brand Logo */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textDecoration: 'none',
            color: '#0B1B33',
          }}
          aria-label="ExamAI home page"
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0B1B33 0%, #173562 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 4px 10px rgba(11, 27, 51, 0.18)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9DB6F5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.4rem',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
                color: '#0B1B33',
              }}
            >
              ExamAI
            </span>
            <span
              style={{
                fontSize: '0.6875rem',
                color: '#5F6B7D',
                letterSpacing: '0.04em',
                fontWeight: 500,
                textTransform: 'uppercase',
              }}
            >
              Institutional Exam Cloud
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav
          aria-label="Primary navigation"
          className="desktop-nav"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
          }}
        >
          <Link
            to="/login/admin"
            style={{
              fontSize: '0.875rem',
              fontWeight: 500,
              color: isCurrent('/login/admin') ? '#22262E' : '#5F6B7D',
              padding: '0.5rem 0.95rem',
              borderRadius: '6px',
              textDecoration: 'none',
              transition: 'color var(--transition-fast)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#14233C'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = isCurrent('/login/admin') ? '#22262E' : '#5F6B7D'; }}
          >
            Admin login
          </Link>

          <Link
            to="/login/teacher"
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#0E6B58',
              backgroundColor: '#E3F1EC',
              border: '1px solid #B7DACD',
              padding: '0.5rem 1.1rem',
              borderRadius: '8px',
              textDecoration: 'none',
              transition: 'all var(--transition-fast)',
              boxShadow: '0 1px 2px rgba(14, 107, 88, 0.08)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#D4EBE3';
              e.currentTarget.style.borderColor = '#99C7B5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#E3F1EC';
              e.currentTarget.style.borderColor = '#B7DACD';
            }}
          >
            Teacher login
          </Link>

          <Link
            to="/login/student"
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#FFFFFF',
              backgroundColor: '#2D5BD0',
              border: '1px solid #2347A8',
              padding: '0.5rem 1.15rem',
              borderRadius: '8px',
              textDecoration: 'none',
              transition: 'all var(--transition-fast)',
              boxShadow: '0 2px 8px rgba(45, 91, 208, 0.28)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2347A8';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(45, 91, 208, 0.38)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#2D5BD0';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(45, 91, 208, 0.28)';
            }}
          >
            Student login
          </Link>
        </nav>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="mobile-nav-toggle"
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileMenuOpen}
          style={{
            display: 'none',
            padding: '8px',
            color: '#14233C',
            borderRadius: '6px',
            border: '1px solid #E1E6EE',
            backgroundColor: '#FFFFFF',
          }}
        >
          {mobileMenuOpen ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div
          className="mobile-menu"
          style={{
            borderTop: '1px solid #E1E6EE',
            backgroundColor: '#FFFFFF',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
            boxShadow: '0 10px 24px rgba(11, 27, 51, 0.08)',
          }}
        >
          <Link
            to="/login/student"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              fontSize: '0.9375rem',
              fontWeight: 600,
              color: '#FFFFFF',
              backgroundColor: '#2D5BD0',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              textAlign: 'center',
              textDecoration: 'none',
            }}
          >
            Student login
          </Link>
          <Link
            to="/login/teacher"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              fontSize: '0.9375rem',
              fontWeight: 600,
              color: '#0E6B58',
              backgroundColor: '#E3F1EC',
              border: '1px solid #B7DACD',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              textAlign: 'center',
              textDecoration: 'none',
            }}
          >
            Teacher login
          </Link>
          <Link
            to="/login/admin"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              fontSize: '0.9375rem',
              fontWeight: 500,
              color: '#22262E',
              backgroundColor: '#E9EAEC',
              border: '1px solid #CDD0D5',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              textAlign: 'center',
              textDecoration: 'none',
            }}
          >
            Admin login
          </Link>
        </div>
      )}

      <style>{`
        @media (max-width: 680px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-nav-toggle {
            display: flex !important;
          }
        }
      `}</style>
    </header>
  );
}

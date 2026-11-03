import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Simple Footer Component for ExamAI
 */
export default function Footer() {
  return (
    <footer
      style={{
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid #E1E6EE',
        marginTop: 'auto',
        padding: '3rem 0 2.5rem',
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '2rem',
            paddingBottom: '2rem',
            borderBottom: '1px solid #E1E6EE',
          }}
        >
          <div style={{ maxWidth: '340px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  backgroundColor: '#0B1B33',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                  <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                </svg>
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: '#0B1B33',
                }}
              >
                ExamAI
              </span>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#5F6B7D', lineHeight: 1.5 }}>
              The intelligent way to run online examinations with verified server-side integrity and automated AI proctoring.
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3rem' }}>
            <div>
              <p
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: '#14233C',
                  marginBottom: '0.75rem',
                }}
              >
                Portal access
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li>
                  <Link to="/login/student" target="_blank" rel="noreferrer" style={{ fontSize: '0.875rem', color: '#5F6B7D', textDecoration: 'none' }}>
                    Student portal
                  </Link>
                </li>
                <li>
                  <Link to="/login/teacher" target="_blank" rel="noreferrer" style={{ fontSize: '0.875rem', color: '#5F6B7D', textDecoration: 'none' }}>
                    Teacher portal
                  </Link>
                </li>
                <li>
                  <Link to="/login/admin" target="_blank" rel="noreferrer" style={{ fontSize: '0.875rem', color: '#5F6B7D', textDecoration: 'none' }}>
                    Admin console
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: '#14233C',
                  marginBottom: '0.75rem',
                }}
              >
                Integrity & Security
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li style={{ fontSize: '0.875rem', color: '#5F6B7D' }}>
                  Server-side audit logging
                </li>
                <li style={{ fontSize: '0.875rem', color: '#5F6B7D' }}>
                  MediaPipe vision engine
                </li>
                <li style={{ fontSize: '0.875rem', color: '#5F6B7D' }}>
                  Gemini question model
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div
          style={{
            paddingTop: '1.5rem',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <p style={{ fontSize: '0.8125rem', color: '#5F6B7D', margin: 0 }}>
            © 2026 ExamAI Inc. All rights reserved. Built for secure institutional assessment.
          </p>
          <p style={{ fontSize: '0.8125rem', color: '#5F6B7D', margin: 0 }}>
            Milestone 2 • Authentication Module
          </p>
        </div>
      </div>
    </footer>
  );
}

import React from 'react';
import { Link } from 'react-router-dom';
import Badge from './Badge';

/**
 * Split Layout for Authentication Pages
 * Left: Midnight navy panel with branding, tagline, AI badge, platinum line, trust points.
 * Right: Vertically centered ivory card for form interactions.
 * 
 * @param {object} props
 * @param {'student'|'teacher'|'admin'} props.role
 * @param {string} props.title
 * @param {string} props.subtitle
 * @param {React.ReactNode} props.children
 * @param {React.ReactNode} [props.footerLink]
 */
export default function AuthLayout({
  role = 'student',
  title,
  subtitle,
  children,
  footerLink,
}) {
  const roleDisplayNames = {
    student: 'Student portal',
    teacher: 'Teacher portal',
    admin: 'Administrator console',
  };

  const trustPoints = [
    {
      title: 'Server-side integrity logging',
      desc: 'Suspicion telemetry and proctoring metrics are recorded directly to server logs, preventing client tampering.',
    },
    {
      title: 'Real-time MediaPipe vision',
      desc: 'Automated gaze monitoring, face presence, and multi-person detection run unobtrusively during tests.',
    },
    {
      title: 'Gemini-powered evaluation',
      desc: 'Accurate handwriting OCR analysis and automated objective scoring with granular performance analytics.',
    },
  ];

  return (
    <div
      className="auth-split-layout"
      style={{
        display: 'flex',
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#F7F9FC',
      }}
    >
      {/* Left Panel: Midnight Navy (approx 45% width) */}
      <aside
        className="auth-left-panel"
        style={{
          width: '44%',
          backgroundColor: '#0B1B33',
          color: '#FFFFFF',
          padding: '3.5rem 3.5rem 3rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
        }}
      >
        <div>
          {/* Brand header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3rem' }}>
            <Link
              to="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                textDecoration: 'none',
                color: '#FFFFFF',
              }}
              aria-label="Back to ExamAI home"
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(201, 209, 220, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9DB6F5" strokeWidth="2.2">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                  <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                </svg>
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.45rem',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                }}
              >
                ExamAI
              </span>
            </Link>

            <Badge variant="ai">AI-powered</Badge>
          </div>

          {/* Platform Tagline & Context */}
          <div style={{ marginBottom: '2.5rem' }}>
            <h1
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '2.1rem',
                color: '#FFFFFF',
                lineHeight: 1.25,
                marginBottom: '1rem',
                fontWeight: 600,
              }}
            >
              The intelligent way to run online examinations
            </h1>
            <p
              style={{
                fontSize: '0.9375rem',
                color: '#C9D1DC',
                lineHeight: 1.6,
                maxWidth: '46ch',
              }}
            >
              Enterprise-grade proctoring, AI question synthesis, and verified assessment fidelity for modern academic institutions.
            </p>
          </div>

          {/* Thin Platinum Line */}
          <div
            style={{
              height: '1px',
              backgroundColor: '#C9D1DC',
              opacity: 0.35,
              width: '100%',
              marginBottom: '2.5rem',
            }}
          />

          {/* Trust Points */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {trustPoints.map((point, index) => (
              <div key={index} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(157, 182, 245, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px',
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 20 20" fill="#9DB6F5">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h4
                    style={{
                      fontSize: '0.875rem',
                      fontFamily: 'var(--font-body)',
                      fontWeight: 600,
                      color: '#FFFFFF',
                      marginBottom: '0.2rem',
                    }}
                  >
                    {point.title}
                  </h4>
                  <p
                    style={{
                      fontSize: '0.8125rem',
                      color: '#C9D1DC',
                      lineHeight: 1.45,
                      margin: 0,
                    }}
                  >
                    {point.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom subtle note */}
        <div style={{ paddingTop: '2rem' }}>
          <p style={{ fontSize: '0.75rem', color: '#C9D1DC', opacity: 0.8, margin: 0 }}>
            Active environment: ExamAI Institutional Cluster v2.4
          </p>
        </div>
      </aside>

      {/* Right Panel: White Form Container (approx 56% width) */}
      <main
        className="auth-right-panel"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2.5rem 1.5rem',
          position: 'relative',
        }}
      >
        {/* Top return link for convenient navigation */}
        <div
          style={{
            position: 'absolute',
            top: '1.5rem',
            right: '2rem',
          }}
        >
          <Link
            to="/"
            style={{
              fontSize: '0.8125rem',
              color: '#5F6B7D',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Back to landing page
          </Link>
        </div>

        {/* Card */}
        <div
          className="auth-form-card"
          style={{
            width: '100%',
            maxWidth: '460px',
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E1E6EE',
            padding: '2.5rem 2.25rem',
            boxShadow: '0 10px 28px -4px rgba(11, 27, 51, 0.08), 0 4px 12px -2px rgba(11, 27, 51, 0.04)',
          }}
        >
          {/* Header of Form Card */}
          <div style={{ marginBottom: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <Badge variant={role}>{roleDisplayNames[role] || 'Portal'}</Badge>
            </div>

            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.65rem',
                fontWeight: 600,
                color: '#0B1B33',
                marginBottom: '0.4rem',
              }}
            >
              {title}
            </h2>

            {subtitle && (
              <p
                style={{
                  fontSize: '0.875rem',
                  color: '#5F6B7D',
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                {subtitle}
              </p>
            )}
          </div>

          {/* Form Content */}
          {children}

          {/* Footer switch link */}
          {footerLink && (
            <div
              style={{
                marginTop: '1.75rem',
                paddingTop: '1.25rem',
                borderTop: '1px solid #E1E6EE',
                textAlign: 'center',
                fontSize: '0.875rem',
                color: '#5F6B7D',
              }}
            >
              {footerLink}
            </div>
          )}
        </div>
      </main>

      <style>{`
        @media (max-width: 960px) {
          .auth-split-layout {
            flex-direction: column;
          }
          .auth-left-panel {
            width: 100% !important;
            padding: 2rem 1.5rem !important;
          }
          .auth-right-panel {
            padding: 2rem 1rem !important;
          }
          .auth-form-card {
            padding: 1.75rem 1.5rem !important;
          }
        }
      `}</style>
    </div>
  );
}

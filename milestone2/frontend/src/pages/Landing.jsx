import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FeatureCard from '../components/FeatureCard';
import Badge from '../components/Badge';
import Button from '../components/Button';

/**
 * Landing Page Component - High-tier SaaS Institutional Polish
 * Includes:
 * - Rich hero with mesh background & grid pattern
 * - Live Proctoring HUD preview card
 * - 4 Interactive Feature cards with hover states
 * - "Fair by design" server integrity architecture
 * - Institutional footer
 */
export default function Landing() {
  const features = [
    {
      title: 'AI Question Generation',
      description: 'Generate high-fidelity, syllabus-aligned question papers powered by Google Gemini with granular section structuring and automatic difficulty distribution.',
      highlights: ['MCQ assessments', 'Multi-select logic', 'Section-wise tests', 'Difficulty balancing'],
      iconType: 'questions',
    },
    {
      title: 'Webcam Proctoring',
      description: 'Continuous real-time visual integrity monitoring via MediaPipe without invasive client-side kernel drivers or browser extensions.',
      highlights: ['Face presence verification', 'Multi-person detection', 'Gaze tracking telemetry', 'Low-bandwidth stream'],
      iconType: 'proctoring',
    },
    {
      title: 'Handwriting OCR',
      description: 'Scan, digitize, and transcribe subjective handwritten answers for structured multimodal analysis and diagram recognition.',
      highlights: ['Ink digitizer', 'Diagram preservation', 'Math notation parser', 'Multi-page stitch'],
      iconType: 'ocr',
    },
    {
      title: 'Instant AI Grading & Analytics',
      description: 'Automated scoring with transparent rubric matching, constructive error breakdowns, and institutional cohort grade summaries.',
      highlights: ['Detailed rubric feedback', 'Automated scoring', 'Cohort performance heatmaps', 'Plagiarism analysis'],
      iconType: 'grading',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#F7F9FC' }}>
      <Navbar />

      {/* Hero Section */}
      <section
        className="hero-gradient"
        style={{
          color: '#FFFFFF',
          padding: '5rem 0 5.5rem',
          position: 'relative',
          overflow: 'hidden',
          borderBottom: '1px solid rgba(201, 209, 220, 0.16)',
        }}
      >
        <div className="hero-grid-pattern" aria-hidden="true" />

        <div className="container hero-reveal" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ maxWidth: '820px', margin: '0 auto', textAlign: 'center' }}>
            {/* Top Pill */}
            <div style={{ display: 'inline-flex', marginBottom: '1.5rem' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '5px 14px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(11, 27, 51, 0.75)',
                  border: '1px solid #23375C',
                  fontSize: '12.5px',
                  fontWeight: 500,
                  color: '#9DB6F5',
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
                }}
              >
                <span className="status-pulse" />
                AI-powered institutional examination platform
              </span>
            </div>

            {/* Main Tagline */}
            <h1
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(2.4rem, 5vw, 3.8rem)',
                fontWeight: 600,
                lineHeight: 1.15,
                color: '#FFFFFF',
                marginBottom: '1.35rem',
                letterSpacing: '-0.02em',
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.35)',
              }}
            >
              The intelligent way to run online examinations
            </h1>

            {/* Subtext */}
            <p
              style={{
                fontSize: 'clamp(1rem, 2vw, 1.18rem)',
                lineHeight: 1.65,
                color: '#C9D1DC',
                marginBottom: '2.5rem',
                marginRight: 'auto',
                marginLeft: 'auto',
                maxWidth: '65ch',
              }}
            >
              Empowering academic institutions with automated MediaPipe webcam proctoring, Gemini-driven dynamic question synthesis, and verified server-side integrity evaluation.
            </p>

            {/* Call To Action Buttons (High contrast, clearly visible) */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '1.25rem',
                marginBottom: '4rem',
              }}
            >
              <Link to="/login/student" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                <Button
                  variant="student"
                  style={{
                    minWidth: '175px',
                    padding: '0.9rem 1.85rem',
                    fontSize: '1.025rem',
                  }}
                >
                  <span>Student login</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </Button>
              </Link>

              <Link to="/login/teacher" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                <Button
                  variant="teacher"
                  style={{
                    minWidth: '175px',
                    padding: '0.9rem 1.85rem',
                    fontSize: '1.025rem',
                  }}
                >
                  <span>Teacher login</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </Button>
              </Link>
            </div>

            {/* Hero Interactive HUD Preview: Live Simulation of ExamAI Platform */}
            <div
              style={{
                maxWidth: '720px',
                margin: '0 auto',
                backgroundColor: 'rgba(11, 27, 51, 0.85)',
                borderRadius: '16px',
                border: '1px solid rgba(201, 209, 220, 0.22)',
                padding: '1.5rem',
                boxShadow: '0 24px 60px -12px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(16px)',
                textAlign: 'left',
              }}
            >
              {/* HUD Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '1rem',
                  borderBottom: '1px solid rgba(201, 209, 220, 0.12)',
                  marginBottom: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="status-pulse" />
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#FFFFFF', letterSpacing: '0.02em' }}>
                    Active Proctoring Stream
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#9DB6F5', backgroundColor: 'rgba(45, 91, 208, 0.25)', padding: '2px 8px', borderRadius: '4px' }}>
                    60 FPS Telemetry
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'rgba(201, 209, 220, 0.3)' }} />
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'rgba(201, 209, 220, 0.3)' }} />
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2F7D5B' }} />
                </div>
              </div>

              {/* HUD 3 Telemetry Cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '0.85rem',
                  marginBottom: '1rem',
                }}
              >
                <div
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(201, 209, 220, 0.12)',
                    borderRadius: '8px',
                    padding: '0.85rem',
                  }}
                >
                  <span style={{ fontSize: '0.75rem', color: '#C9D1DC', display: 'block', marginBottom: '4px' }}>
                    Gaze Tracking Vector
                  </span>
                  <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="#2F7D5B">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Center Focus (99.4%)
                  </span>
                </div>

                <div
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(201, 209, 220, 0.12)',
                    borderRadius: '8px',
                    padding: '0.85rem',
                  }}
                >
                  <span style={{ fontSize: '0.75rem', color: '#C9D1DC', display: 'block', marginBottom: '4px' }}>
                    Candidate Presence
                  </span>
                  <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="#2F7D5B">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    1 Candidate Verified
                  </span>
                </div>

                <div
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(201, 209, 220, 0.12)',
                    borderRadius: '8px',
                    padding: '0.85rem',
                  }}
                >
                  <span style={{ fontSize: '0.75rem', color: '#C9D1DC', display: 'block', marginBottom: '4px' }}>
                    Server Suspicion Metric
                  </span>
                  <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#2F7D5B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="#2F7D5B">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    0.00 (Tamper Free)
                  </span>
                </div>
              </div>

              {/* HUD Footer note */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: '#C9D1DC' }}>
                <span>Institutional Encryption: AES-256-GCM + SHA-256 HMAC</span>
                <span style={{ color: '#9DB6F5' }}>MediaPipe & Gemini Engine Connected</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section style={{ padding: '5.5rem 0 6rem', backgroundColor: '#F7F9FC' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 3.75rem' }}>
            <div style={{ display: 'inline-flex', marginBottom: '0.85rem' }}>
              <Badge variant="student">Core Capabilities</Badge>
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '2.35rem',
                color: '#0B1B33',
                marginBottom: '0.85rem',
                letterSpacing: '-0.015em',
              }}
            >
              Comprehensive evaluation capabilities
            </h2>
            <p style={{ fontSize: '1.025rem', color: '#5F6B7D', lineHeight: 1.6 }}>
              Built specifically for universities and examination boards seeking seamless, trustworthy digital testing with verified authenticity.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(265px, 1fr))',
              gap: '1.85rem',
            }}
          >
            {features.map((feat, idx) => (
              <FeatureCard
                key={idx}
                index={idx}
                title={feat.title}
                description={feat.description}
                highlights={feat.highlights}
                iconType={feat.iconType}
              />
            ))}
          </div>
        </div>
      </section>

      {/* "Fair by Design" Section */}
      <section
        style={{
          padding: '5.5rem 0',
          backgroundColor: '#FFFFFF',
          borderTop: '1px solid #E1E6EE',
          borderBottom: '1px solid #E1E6EE',
        }}
      >
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '3.5rem',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ display: 'inline-flex', marginBottom: '1rem' }}>
                <Badge variant="admin">Security Architecture</Badge>
              </div>

              <h2
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '2.25rem',
                  color: '#0B1B33',
                  marginBottom: '1.15rem',
                  lineHeight: 1.25,
                }}
              >
                Fair by design: Server-verified proctoring
              </h2>

              <p
                style={{
                  fontSize: '1.025rem',
                  color: '#5F6B7D',
                  lineHeight: 1.65,
                  marginBottom: '1.5rem',
                }}
              >
                In conventional proctoring tools, suspicion scores can be spoofed or altered using browser developer tools. ExamAI eliminates this vulnerability: proctoring suspicion scores and event telemetry are signed and recorded exclusively on the server so they cannot be tampered with on the client.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: '#E3F1EC',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="#0E6B58">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.95rem', color: '#14233C', display: 'block', marginBottom: '2px' }}>
                      Cryptographic event logging
                    </strong>
                    <span style={{ fontSize: '0.875rem', color: '#5F6B7D', lineHeight: 1.5 }}>
                      Suspicion scores are computed and committed server-side to an append-only audit trail.
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: '#E3F1EC',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="#0E6B58">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.95rem', color: '#14233C', display: 'block', marginBottom: '2px' }}>
                      Multi-signal correlation engine
                    </strong>
                    <span style={{ fontSize: '0.875rem', color: '#5F6B7D', lineHeight: 1.5 }}>
                      Correlates facial landmarks, eye gaze angles, and background acoustic levels to eliminate false positives.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Architecture Card */}
            <div
              style={{
                backgroundColor: '#0B1B33',
                borderRadius: '16px',
                padding: '2.25rem',
                color: '#FFFFFF',
                boxShadow: '0 16px 36px -6px rgba(11, 27, 51, 0.22)',
                border: '1px solid rgba(201, 209, 220, 0.2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '0.8125rem', color: '#9DB6F5', fontWeight: 600, letterSpacing: '0.04em' }}>
                  IMMUTABLE AUDIT PIPELINE
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.75rem',
                    color: '#2F7D5B',
                    backgroundColor: 'rgba(47, 125, 91, 0.2)',
                    padding: '3px 10px',
                    borderRadius: '9999px',
                    border: '1px solid rgba(47, 125, 91, 0.4)',
                    fontWeight: 500,
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#2F7D5B' }} />
                  Server Verified
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '1rem 1.15rem', borderRadius: '8px', border: '1px solid rgba(201, 209, 220, 0.14)' }}>
                  <span style={{ fontSize: '0.75rem', color: '#C9D1DC', display: 'block', marginBottom: '2px' }}>1. Client Sandbox (Browser)</span>
                  <span style={{ fontSize: '0.875rem', color: '#FFFFFF', fontWeight: 600 }}>MediaPipe Edge Landmark Extraction</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9DB6F5" strokeWidth="2.2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <polyline points="19 12 12 19 5 12" />
                  </svg>
                </div>

                <div style={{ backgroundColor: 'rgba(45, 91, 208, 0.18)', padding: '1rem 1.15rem', borderRadius: '8px', border: '1px solid rgba(45, 91, 208, 0.45)' }}>
                  <span style={{ fontSize: '0.75rem', color: '#9DB6F5', display: 'block', marginBottom: '2px' }}>2. Server-Side Security Vault</span>
                  <span style={{ fontSize: '0.875rem', color: '#FFFFFF', fontWeight: 600 }}>Tamper-Proof Audit Vault & Suspicion Scorer</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9DB6F5" strokeWidth="2.2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <polyline points="19 12 12 19 5 12" />
                  </svg>
                </div>

                <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '1rem 1.15rem', borderRadius: '8px', border: '1px solid rgba(201, 209, 220, 0.14)' }}>
                  <span style={{ fontSize: '0.75rem', color: '#C9D1DC', display: 'block', marginBottom: '2px' }}>3. Institutional Educator Dashboard</span>
                  <span style={{ fontSize: '0.875rem', color: '#FFFFFF', fontWeight: 600 }}>Cryptographic Audit Logs with Timestamp Anchors</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

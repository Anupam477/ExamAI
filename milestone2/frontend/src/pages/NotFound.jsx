import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';

/**
 * 404 Not Found Page
 */
export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F7F9FC',
        padding: '2rem 1.5rem',
      }}
    >
      <div
        style={{
          maxWidth: '460px',
          width: '100%',
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E1E6EE',
          padding: '3rem 2rem',
          textAlign: 'center',
          boxShadow: '0 8px 24px -4px rgba(11, 27, 51, 0.06)',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            fontSize: '3.5rem',
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            color: '#0B1B33',
            lineHeight: 1,
            marginBottom: '1rem',
          }}
        >
          404
        </span>

        <h1
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1.5rem',
            color: '#14233C',
            marginBottom: '0.75rem',
          }}
        >
          Page not found
        </h1>

        <p
          style={{
            fontSize: '0.9375rem',
            color: '#5F6B7D',
            lineHeight: 1.5,
            marginBottom: '2rem',
          }}
        >
          The page or portal route you requested does not exist or has been relocated within the ExamAI platform.
        </p>

        <Link to="/" style={{ textDecoration: 'none' }}>
          <Button variant="primary" fullWidth>
            Return to landing page
          </Button>
        </Link>
      </div>
    </div>
  );
}

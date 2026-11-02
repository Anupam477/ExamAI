import React from 'react';
import { getPasswordStrength } from '../utils/validators';

/**
 * Live Password Strength Indicator Component
 * Visual segments and criteria checklist.
 * STRICTLY complies with design constraints: NO GOLD / NO YELLOW.
 * 
 * @param {object} props
 * @param {string} props.password
 */
export default function PasswordStrength({ password = '' }) {
  const { score, label, checks } = getPasswordStrength(password);

  if (!password) {
    return null;
  }

  // Get color without using any gold or yellow
  const getStrengthColor = () => {
    switch (score) {
      case 1:
        return '#B8433F'; // error red
      case 2:
        return '#5F6B7D'; // slate neutral
      case 3:
        return '#2D5BD0'; // sapphire
      case 4:
        return '#2F7D5B'; // success emerald
      default:
        return '#E1E6EE';
    }
  };

  const strengthColor = getStrengthColor();

  const criteriaList = [
    { key: 'minLength', text: 'At least 8 characters', met: checks.minLength },
    { key: 'hasUpper', text: 'At least one uppercase letter (A-Z)', met: checks.hasUpper },
    { key: 'hasLower', text: 'At least one lowercase letter (a-z)', met: checks.hasLower },
    { key: 'hasNumber', text: 'At least one number (0-9)', met: checks.hasNumber },
  ];

  return (
    <div
      className="password-strength-container"
      style={{
        marginTop: '-0.5rem',
        marginBottom: '1.25rem',
        padding: '0.75rem',
        backgroundColor: '#FFFFFF',
        borderRadius: '6px',
        border: '1px solid #E1E6EE',
      }}
      aria-live="polite"
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.5rem',
        }}
      >
        <span style={{ fontSize: '0.8125rem', color: '#5F6B7D', fontWeight: 500 }}>
          Password strength:
        </span>
        <span
          style={{
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: strengthColor,
          }}
        >
          {label}
        </span>
      </div>

      {/* Progress Bars (4 segments) */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          height: '4px',
          marginBottom: '0.75rem',
        }}
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin="0"
        aria-valuemax="4"
        aria-valuetext={`Password strength is ${label}`}
      >
        {[1, 2, 3, 4].map((step) => {
          const isFilled = step <= score;
          return (
            <div
              key={step}
              style={{
                flex: 1,
                borderRadius: '2px',
                backgroundColor: isFilled ? strengthColor : '#E1E6EE',
                transition: 'background-color 200ms ease',
              }}
            />
          );
        })}
      </div>

      {/* Requirements checklist */}
      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '4px 12px',
        }}
      >
        {criteriaList.map((criterion) => (
          <li
            key={criterion.key}
            style={{
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: criterion.met ? '#2F7D5B' : '#5F6B7D',
              transition: 'color 150ms ease',
            }}
          >
            {criterion.met ? (
              <svg
                width="12"
                height="12"
                viewBox="0 0 20 20"
                fill="#2F7D5B"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#C9D1DC',
                  display: 'inline-block',
                  marginLeft: '3px',
                  marginRight: '3px',
                }}
                aria-hidden="true"
              />
            )}
            <span>{criterion.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

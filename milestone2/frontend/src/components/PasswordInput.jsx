import React, { useState } from 'react';

/**
 * Password Input Component with Show/Hide Toggle
 * Accessible button with aria attributes and role-specific styling.
 * 
 * @param {object} props
 * @param {string} props.id
 * @param {string} props.name
 * @param {string} props.label
 * @param {string} [props.value='']
 * @param {function} props.onChange
 * @param {function} [props.onBlur]
 * @param {string} [props.error]
 * @param {string} [props.placeholder]
 * @param {boolean} [props.required=true]
 * @param {string} [props.autoComplete='current-password']
 * @param {'student'|'teacher'|'admin'|'primary'} [props.roleAccent='student']
 * @param {React.ReactNode} [props.helperText]
 */
export default function PasswordInput({
  id,
  name,
  label,
  value = '',
  onChange,
  onBlur,
  error,
  placeholder = '••••••••',
  required = true,
  autoComplete = 'current-password',
  roleAccent = 'student',
  helperText,
  ...rest
}) {
  const [showPassword, setShowPassword] = useState(false);

  const getFocusRing = () => {
    switch (roleAccent) {
      case 'teacher':
        return 'rgba(14, 107, 88, 0.22)';
      case 'admin':
        return 'rgba(34, 38, 46, 0.22)';
      case 'student':
      default:
        return 'rgba(45, 91, 208, 0.22)';
    }
  };

  const getBorderColor = () => {
    switch (roleAccent) {
      case 'teacher':
        return '#0E6B58';
      case 'admin':
        return '#22262E';
      case 'student':
      default:
        return '#2D5BD0';
    }
  };

  const hasError = Boolean(error);
  const errorId = `${id}-error`;
  const helperId = `${id}-helper`;

  const toggleVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="input-group" style={{ marginBottom: '1.25rem', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
        <label
          htmlFor={id}
          style={{
            fontSize: '0.875rem',
            fontWeight: 500,
            color: '#14233C',
            display: 'inline-block',
          }}
        >
          {label}
          {required && (
            <span
              style={{ color: '#B8433F', marginLeft: '3px', fontWeight: 600 }}
              aria-hidden="true"
            >
              *
            </span>
          )}
        </label>
      </div>

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          id={id}
          name={name}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          aria-invalid={hasError ? 'true' : 'false'}
          aria-describedby={hasError ? errorId : helperText ? helperId : undefined}
          style={{
            width: '100%',
            height: '42px',
            padding: '0 2.75rem 0 0.875rem',
            fontSize: '0.9375rem',
            fontFamily: 'var(--font-body)',
            color: '#14233C',
            backgroundColor: '#FFFFFF',
            border: `1px solid ${hasError ? '#B8433F' : '#E1E6EE'}`,
            borderRadius: '6px',
            outline: 'none',
            transition: 'border-color 150ms ease, box-shadow 150ms ease',
            boxShadow: hasError ? '0 0 0 2px rgba(184, 67, 63, 0.12)' : 'none',
          }}
          onFocus={(e) => {
            if (!hasError) {
              e.currentTarget.style.borderColor = getBorderColor();
              e.currentTarget.style.boxShadow = `0 0 0 3px ${getFocusRing()}`;
            }
          }}
          onBlurCapture={(e) => {
            if (!hasError) {
              e.currentTarget.style.borderColor = '#E1E6EE';
              e.currentTarget.style.boxShadow = 'none';
            }
          }}
          {...rest}
        />

        <button
          type="button"
          onClick={toggleVisibility}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          aria-pressed={showPassword}
          style={{
            position: 'absolute',
            right: '8px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            padding: '6px',
            cursor: 'pointer',
            color: '#5F6B7D',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#14233C';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#5F6B7D';
          }}
        >
          {showPassword ? (
            /* Eye Off Icon */
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          ) : (
            /* Eye Icon */
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>

      {hasError ? (
        <p
          id={errorId}
          role="alert"
          style={{
            color: '#B8433F',
            fontSize: '0.8125rem',
            marginTop: '0.35rem',
            lineHeight: 1.4,
            display: 'flex',
            alignItems: 'flex-start',
            gap: '5px',
          }}
        >
          <svg
            style={{ width: '14px', height: '14px', flexShrink: 0, marginTop: '2px' }}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p
          id={helperId}
          style={{
            color: '#5F6B7D',
            fontSize: '0.8125rem',
            marginTop: '0.35rem',
            lineHeight: 1.4,
          }}
        >
          {helperText}
        </p>
      ) : null}
    </div>
  );
}

import React from 'react';

/**
 * Reusable Form Input Component
 * Fully accessible with label pairing, role-aware focus ring, and explicit error message display.
 * 
 * @param {object} props
 * @param {string} props.id
 * @param {string} props.name
 * @param {string} props.label
 * @param {string} [props.type='text']
 * @param {string} [props.value='']
 * @param {function} props.onChange
 * @param {function} [props.onBlur]
 * @param {string} [props.error]
 * @param {string} [props.placeholder]
 * @param {boolean} [props.required=true]
 * @param {string} [props.autoComplete]
 * @param {'student'|'teacher'|'admin'|'primary'} [props.roleAccent='student']
 * @param {React.ReactNode} [props.helperText]
 */
export default function Input({
  id,
  name,
  label,
  type = 'text',
  value = '',
  onChange,
  onBlur,
  error,
  placeholder,
  required = true,
  autoComplete,
  roleAccent = 'student',
  helperText,
  ...rest
}) {
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

      <div style={{ position: 'relative' }}>
        <input
          id={id}
          name={name}
          type={type}
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
            padding: '0 0.875rem',
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

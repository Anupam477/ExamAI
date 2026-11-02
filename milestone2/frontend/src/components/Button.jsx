import React from 'react';

/**
 * Reusable Button Component
 * High-performance pure CSS hover/active states with role-based accents.
 * Merges custom styles properly without overwriting base styles.
 * 
 * @param {object} props
 * @param {'student'|'teacher'|'admin'|'primary'|'secondary'|'outline'} [props.variant='primary']
 * @param {boolean} [props.loading=false]
 * @param {string} [props.loadingText]
 * @param {React.ReactNode} props.children
 * @param {boolean} [props.fullWidth=false]
 * @param {string} [props.type='button']
 * @param {function} [props.onClick]
 * @param {boolean} [props.disabled=false]
 * @param {string} [props.className]
 * @param {object} [props.style]
 */
export default function Button({
  variant = 'primary',
  loading = false,
  loadingText,
  children,
  fullWidth = false,
  type = 'button',
  onClick,
  disabled = false,
  className = '',
  style = {},
  ...rest
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`btn btn-${variant} ${fullWidth ? 'btn-full' : ''} ${className}`}
      style={style}
      {...rest}
    >
      {loading ? (
        <>
          <span className="btn-spinner" aria-hidden="true" />
          <span>{loadingText || 'Please wait...'}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

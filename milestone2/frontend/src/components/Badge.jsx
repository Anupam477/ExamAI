import React from 'react';

/**
 * Badge Component
 * Displays role or AI status with exact design token colors.
 * Always includes readable text.
 * 
 * @param {object} props
 * @param {'student'|'teacher'|'admin'|'ai'|'default'} [props.variant='default']
 * @param {React.ReactNode} props.children
 * @param {string} [props.className]
 */
export default function Badge({ variant = 'default', children, className = '' }) {
  const stylesByVariant = {
    student: {
      backgroundColor: '#E6EDFB',
      color: '#2347A8',
      borderColor: '#BFD0F3',
    },
    teacher: {
      backgroundColor: '#E3F1EC',
      color: '#0E6B58',
      borderColor: '#B7DACD',
    },
    admin: {
      backgroundColor: '#E9EAEC',
      color: '#22262E',
      borderColor: '#CDD0D5',
    },
    ai: {
      backgroundColor: '#0B1B33',
      color: '#9DB6F5',
      borderColor: '#23375C',
    },
    default: {
      backgroundColor: '#F0F3F8',
      color: '#14233C',
      borderColor: '#E1E6EE',
    },
  };

  const currentStyle = stylesByVariant[variant] || stylesByVariant.default;

  return (
    <span
      className={`role-badge ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '3px 10px',
        fontSize: '12.5px',
        fontWeight: 500,
        lineHeight: 1.4,
        borderRadius: '9999px',
        border: `1px solid ${currentStyle.borderColor}`,
        backgroundColor: currentStyle.backgroundColor,
        color: currentStyle.color,
        letterSpacing: '0.01em',
        userSelect: 'none',
      }}
    >
      {children}
    </span>
  );
}

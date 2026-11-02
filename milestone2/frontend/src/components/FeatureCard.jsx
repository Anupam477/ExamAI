import React from 'react';

/**
 * FeatureCard Component - Enhanced SaaS Polish
 * Displays platform features with bespoke iconography, subtle tinted badges, and hover lift.
 * 
 * @param {object} props
 * @param {string} props.title
 * @param {string} props.description
 * @param {string[]} props.highlights
 * @param {string} props.iconType
 * @param {number} props.index
 */
export default function FeatureCard({ title, description, highlights = [], iconType, _index }) {
  const getIconData = () => {
    switch (iconType) {
      case 'questions':
        return {
          bg: '#E6EDFB',
          border: '#BFD0F3',
          stroke: '#2D5BD0',
          dot: '#2D5BD0',
          icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2D5BD0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          ),
        };
      case 'proctoring':
        return {
          bg: '#E3F1EC',
          border: '#B7DACD',
          stroke: '#0E6B58',
          dot: '#0E6B58',
          icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0E6B58" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          ),
        };
      case 'ocr':
        return {
          bg: '#EBEFF8',
          border: '#CAD7EC',
          stroke: '#2347A8',
          dot: '#2347A8',
          icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2347A8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="4 7 4 4 20 4 20 7" />
              <line x1="9" y1="20" x2="15" y2="20" />
              <line x1="12" y1="4" x2="12" y2="20" />
              <path d="M5 13a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4" strokeDasharray="2 2" />
            </svg>
          ),
        };
      case 'grading':
      default:
        return {
          bg: '#E9EAEC',
          border: '#CDD0D5',
          stroke: '#22262E',
          dot: '#22262E',
          icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22262E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          ),
        };
    }
  };

  const iconData = getIconData();

  return (
    <div className="feature-card">
      <div>
        {/* Icon Emblem with soft background */}
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '10px',
            backgroundColor: iconData.bg,
            border: `1px solid ${iconData.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.35rem',
            boxShadow: '0 2px 5px rgba(11, 27, 51, 0.04)',
          }}
        >
          {iconData.icon}
        </div>

        <h3
          style={{
            fontSize: '1.3rem',
            color: '#0B1B33',
            marginBottom: '0.65rem',
            fontFamily: 'var(--font-heading)',
            lineHeight: 1.3,
          }}
        >
          {title}
        </h3>

        <p
          style={{
            fontSize: '0.9375rem',
            color: '#5F6B7D',
            lineHeight: 1.6,
            marginBottom: '1.5rem',
          }}
        >
          {description}
        </p>
      </div>

      <div
        style={{
          paddingTop: '1.15rem',
          borderTop: '1px solid #EEF2F7',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '7px',
        }}
      >
        {highlights.map((item, idx) => (
          <span
            key={idx}
            style={{
              fontSize: '0.75rem',
              fontWeight: 500,
              color: '#14233C',
              backgroundColor: '#F7F9FC',
              border: '1px solid #E1E6EE',
              borderRadius: '6px',
              padding: '3px 9px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <span
              style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                backgroundColor: iconData.dot,
                opacity: 0.85,
              }}
              aria-hidden="true"
            />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

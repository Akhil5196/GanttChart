import React from 'react';

interface Props {
  filtered:                number;
  behindProjectionCount:   number;
  onOpenLegend:            () => void;
}

export function Header({ filtered, behindProjectionCount, onOpenLegend }: Props) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '0 18px', height: 48,
      background: '#FFFFFF', borderBottom: '1px solid #E5E7EB', flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#1B2D3E', letterSpacing: '-0.01em' }}>
          Gantt Chart
        </span>
      </div>

      <div style={{ flex: 1, minWidth: 0 }} />

      <span
        style={{
          fontSize: 12,
          color: '#4B5563',
          lineHeight: '20px',
          textAlign: 'right',
          minWidth: 0,
          maxWidth: 480,
        }}
      >
        {filtered === 0 ? (
          'No conversions match the current filters.'
        ) : (
          <>
            <strong style={{ fontWeight: 600, color: '#B91C1C', fontVariantNumeric: 'tabular-nums' }}>
              {behindProjectionCount}
            </strong>
            {' out of '}
            <strong style={{ fontWeight: 600, color: '#111827', fontVariantNumeric: 'tabular-nums' }}>
              {filtered}
            </strong>
            {` ${filtered === 1 ? 'conversion' : 'conversions'} ${filtered === 1 ? 'is' : 'are'} behind the projected timeline`}
          </>
        )}
      </span>

      <button
        type="button"
        onClick={onOpenLegend}
        style={{
          height: 30, padding: '0 13px', background: 'transparent',
          border: '1px solid #D1D5DB', borderRadius: 6,
          fontSize: 12, fontWeight: 500, color: '#374151', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
          transition: 'border-color 0.15s, color 0.15s', fontFamily: 'inherit',
          flexShrink: 0,
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#4DC8B4'; e.currentTarget.style.color = '#2A9A8A'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.color = '#374151'; }}
      >
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
          <rect x="1" y="4"  width="4" height="4" rx="1" fill="currentColor" opacity="0.7"/>
          <rect x="1" y="10" width="4" height="4" rx="1" fill="currentColor" opacity="0.7"/>
          <path d="M8 6h7M8 12h7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
        Guide
      </button>
    </div>
  );
}

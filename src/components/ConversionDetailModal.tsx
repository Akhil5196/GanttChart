import React, { useEffect } from 'react';
import type { DerivedAccount, HealthRule, Status } from '../types';
import {
  MILESTONES,
  STATUS_COLORS,
  STATUS_OPTS,
  getHealthRulesForConversion,
  getMilestonePalette,
  scheduleDeviationDays,
  formatScheduleDeviationDays,
  scheduleDeviationColor,
} from '../data';

interface Props {
  account: DerivedAccount;
  onClose: () => void;
}

function formatGoLiveDate(gl: Date): string {
  return gl.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const SEVERITY_ORDER: Record<Status, number> = {
  critical: 4, 'needs-attention': 3, 'minor-issue': 2, 'on-track': 1,
};

/** Shared modal chrome (keeps borders / type ramp consistent). */
const MOD = {
  border:     '#E5E7EB',
  borderSoft: '#F3F4F6',
  surface:    '#FAFAFA',
  text:       '#111827',
  textMuted:  '#6B7280',
  textSubtle: '#9CA3AF',
  shadow:     '0 12px 40px rgba(0,0,0,0.14)',
  padX:       20,
} as const;

export function ConversionDetailModal({ account: acc, onClose }: Props) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  const ms    = MILESTONES.find(m => m.id === acc.milestoneId);
  const msPal = getMilestonePalette(ms?.color ?? '#94A3B8');
  const stColor = STATUS_COLORS[acc.status];
  const stLabel = STATUS_OPTS.find(s => s.value === acc.status)?.label ?? '—';
  const r = parseInt(stColor.slice(1, 3), 16);
  const g = parseInt(stColor.slice(3, 5), 16);
  const b = parseInt(stColor.slice(5, 7), 16);
  const bgAlpha =
    acc.status === 'critical' ? 0.40
    : acc.status === 'needs-attention' ? 0.20
    : acc.status === 'minor-issue' ? 0.10
    : 0.15;

  const rules = getHealthRulesForConversion(acc);
  const sortedRules = [...rules].sort(
    (a, b) => SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity],
  );
  const scheduleDev = scheduleDeviationDays(acc);

  const onTrackColor = STATUS_COLORS['on-track'];
  const otr = parseInt(onTrackColor.slice(1, 3), 16);
  const otg = parseInt(onTrackColor.slice(3, 5), 16);
  const otb = parseInt(onTrackColor.slice(5, 7), 16);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="conv-detail-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10050,
        background: 'rgba(17, 24, 39, 0.40)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 'min(720px, calc(100vw - 48px))',
          maxHeight: 'min(90vh, 720px)',
          background: '#FFFFFF',
          borderRadius: 12,
          border: `1px solid ${MOD.border}`,
          boxShadow: MOD.shadow,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{
          padding: `14px ${MOD.padX}px 12px`,
          borderBottom: `1px solid ${MOD.border}`,
          background: MOD.surface,
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                id="conv-detail-title"
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: MOD.text,
                  lineHeight: '22px',
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <span>{acc.name}</span>
                {acc.conversion && (<><Pipe /><span>{acc.conversion}</span></>)}
                {(acc.isSquat || acc.pms) && (
                  <>
                    <Pipe />
                    <span style={{ fontWeight: acc.isSquat ? 700 : 500 }}>
                      {acc.isSquat ? 'Squat/Denovo' : acc.pms}
                    </span>
                  </>
                )}
              </div>
              {acc.locations && acc.locations.length > 0 && (
                <div style={{
                  fontSize: 12,
                  color: MOD.textMuted,
                  marginTop: 6,
                  lineHeight: '20px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '2px 0',
                }}>
                  {acc.locations.map((loc, i) => {
                    const isNHS = loc.endsWith(' [NHS]');
                    const name  = isNHS ? loc.slice(0, -6) : loc;
                    return (
                      <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {i > 0 && <span style={{ marginRight: 4 }}>,</span>}
                        {name}
                        {isNHS && <NhsBadge />}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '3px 9px',
                borderRadius: 20,
                background: `rgba(${r},${g},${b},${bgAlpha})`,
                border: `1px solid rgba(${r},${g},${b},0.45)`,
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: stColor, flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>{stLabel}</span>
              </div>
              {ms && (
                <div style={{
                  display: 'flex',
                  alignItems: 'stretch',
                  borderRadius: 6,
                  border: `1px solid ${msPal.dot}55`,
                  background: '#F9FAFB',
                  overflow: 'hidden',
                  maxWidth: 200,
                }}>
                  <div style={{ width: 4, minWidth: 8, flexShrink: 0, background: msPal.dot }} />
                  <span style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: '#374151',
                    padding: '3px 8px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {ms.name}
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: '#FFFFFF',
                  border: `1px solid ${MOD.border}`,
                  cursor: 'pointer',
                  fontSize: 18,
                  lineHeight: 1,
                  color: MOD.textMuted,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  outline: 'none',
                  transition: 'background 0.15s, border-color 0.15s, color 0.15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#F9FAFB';
                  e.currentTarget.style.borderColor = '#D1D5DB';
                  e.currentTarget.style.color = '#374151';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = '#FFFFFF';
                  e.currentTarget.style.borderColor = MOD.border;
                  e.currentTarget.style.color = MOD.textMuted;
                }}
                onFocus={e => { e.currentTarget.style.boxShadow = '0 0 0 2px #FFFFFF, 0 0 0 4px rgba(20, 123, 141, 0.35)'; }}
                onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
              >
                ×
              </button>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: `18px ${MOD.padX}px 24px`, minHeight: 0 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
            gap: '12px 28px',
            alignItems: 'start',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
              <InfoLine label="PMO">{acc.pmo}</InfoLine>
              <InfoLine label="Implementation lead">{acc.implLead}</InfoLine>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
              <InfoLine label="Go-Live">{formatGoLiveDate(acc.goLiveDate)}</InfoLine>
              <InfoLine label="Confirmed go-live">{acc.confirmed ? 'Confirmed' : 'Tentative'}</InfoLine>
            </div>
          </div>

          {scheduleDev < 0 && (
            <div
              style={{
                marginTop: 20,
                padding: '12px 14px',
                borderRadius: 8,
                border: '1px solid rgba(185, 28, 28, 0.22)',
                background: 'rgba(185, 28, 28, 0.06)',
              }}
              role="status"
            >
              <div style={{
                fontSize: 10,
                fontWeight: 700,
                color: MOD.textMuted,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 6,
              }}>
                Schedule Deviation
              </div>
              <p style={{ margin: 0, fontSize: 13, lineHeight: '22px' }}>
                <span style={{ color: scheduleDeviationColor(scheduleDev), fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                  {Math.abs(scheduleDev)}
                </span>
                <span style={{ color: MOD.textMuted, fontWeight: 400 }}>
                  {' '} days behind the projected timeline.
                </span>
              </p>
            </div>
          )}

          <div style={{ marginTop: scheduleDev < 0 ? 22 : 24 }}>
            <SectionHeading>Health rules</SectionHeading>
            {sortedRules.length === 0 ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 8,
                border: `1px solid rgba(${otr},${otg},${otb},0.40)`,
                background: `rgba(${otr},${otg},${otb},0.10)`,
              }}>
                <div style={{ width: 5, alignSelf: 'stretch', flexShrink: 0, background: onTrackColor, borderRadius: 2 }} />
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: onTrackColor, flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: onTrackColor }}>Everything is on track</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {sortedRules.map(rule => (
                  <HealthRuleCard key={rule.id} rule={rule} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function HealthRuleCard({ rule }: { rule: HealthRule }) {
  const col = STATUS_COLORS[rule.severity];
  const rr = parseInt(col.slice(1, 3), 16);
  const rg = parseInt(col.slice(3, 5), 16);
  const rb = parseInt(col.slice(5, 7), 16);
  const bgAlpha = rule.severity === 'critical' ? 0.10 : 0.06;
  const sevLabel = STATUS_OPTS.find(s => s.value === rule.severity)?.label ?? rule.severity;
  return (
    <div style={{
      display: 'flex',
      alignItems: 'stretch',
      borderRadius: 8,
      border: `1px solid rgba(${rr},${rg},${rb},0.45)`,
      background: `rgba(${rr},${rg},${rb},${bgAlpha})`,
      overflow: 'hidden',
    }}>
      <div style={{ width: 5, flexShrink: 0, background: col }} />
      <div style={{ flex: 1, padding: '8px 10px', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#111827', lineHeight: '15px' }}>{rule.name}</span>
          <span style={{
            fontSize: 10,
            fontWeight: 600,
            color: col,
            flexShrink: 0,
            background: `rgba(${rr},${rg},${rb},0.12)`,
            padding: '1px 7px',
            borderRadius: 20,
            border: `1px solid rgba(${rr},${rg},${rb},0.30)`,
          }}>
            {sevLabel}
          </span>
        </div>
        <p style={{ margin: 0, fontSize: 11, color: '#6B7280', lineHeight: '16px', wordBreak: 'break-word' }}>
          {rule.description}
        </p>
      </div>
    </div>
  );
}

function Pipe() {
  return <span style={{ margin: '0 8px', color: MOD.textSubtle, fontWeight: 300, fontSize: 15 }}>|</span>;
}

function NhsBadge() {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#005EB8',
      color: '#FFFFFF',
      fontSize: 9,
      fontWeight: 800,
      lineHeight: '12px',
      padding: '1px 4px',
      borderRadius: 2,
      letterSpacing: '0.04em',
      flexShrink: 0,
    }}>
      NHS
    </span>
  );
}

function InfoLine({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <p style={{ margin: 0, fontSize: 13, lineHeight: '22px' }}>
      <span style={{ fontWeight: 400, color: MOD.textMuted }}>{label}: </span>
      <span style={{ color: MOD.text, fontWeight: 500 }}>{children}</span>
    </p>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 10,
      fontWeight: 700,
      color: MOD.textMuted,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      marginBottom: 12,
    }}>
      {children}
    </div>
  );
}

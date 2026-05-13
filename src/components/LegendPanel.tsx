import React, { useEffect, useId, useState } from 'react';
import {
  PHASE_COLOR,
  PHASE_LABEL,
  PHASE_ORDER,
  SANDBOX_COLOR,
  STATUS_COLORS,
  STATUS_OPTS,
  MILESTONES,
  getMilestonePalette,
} from '../data';
import type { Milestone } from '../types';
import { CheckIcon, ClockIcon } from './icons';

interface Props { onClose: () => void; }

/** Rota LegendModal-style section title (see rota-board LegendModal SectionLabel). */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, color: '#6B7280',
      textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10,
    }}>
      {children}
    </div>
  );
}

/** Rota milestone row: left colour bar + label (HubSpot milestone — not timeline phase). */
function MilestoneLegendRow({ milestone }: { milestone: Milestone }) {
  const pal = getMilestonePalette(milestone.color);
  return (
    <div
      style={{
        display: 'flex', alignItems: 'stretch',
        borderRadius: 8,
        border: `1px solid ${pal.border}`,
        background: '#FFFFFF',
        overflow: 'hidden',
      }}
    >
      <div style={{ width: 10, flexShrink: 0, background: pal.dot }} />
      <span style={{
        flex: 1, fontSize: 13, fontWeight: 500,
        color: '#111827',
        padding: '8px 12px',
      }}>
        {milestone.name}
      </span>
    </div>
  );
}

function GuideTabButton({
  id,
  controlsId,
  selected,
  onClick,
  children,
}: {
  id: string;
  controlsId: string;
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      id={id}
      role="tab"
      aria-selected={selected}
      aria-controls={controlsId}
      tabIndex={selected ? 0 : -1}
      onClick={onClick}
      style={{
        position: 'relative',
        padding: '10px 10px 11px',
        marginBottom: -1,
        border: 'none',
        borderBottom: selected ? '2px solid #147B8D' : '2px solid transparent',
        background: 'transparent',
        fontSize: 13,
        fontWeight: selected ? 600 : 500,
        color: selected ? '#147B8D' : '#6B7280',
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      {children}
    </button>
  );
}

function HowToReadContent() {
  return (
    <Section title="">
      <p style={{ fontSize: 12, color: '#6B7280', lineHeight: '20px', margin: 0 }}>
        Each row represents a conversion timeline with two rails:
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', lineHeight: '18px' }}>
          Projection (Upper Hatched Rail)
        </div>
        <p style={{ fontSize: 12, color: '#6B7280', lineHeight: '20px', margin: 0 }}>
          The upper hatched rail shows the projected timeline based on the planned go-live date.
        </p>
        <p style={{ fontSize: 12, color: '#6B7280', lineHeight: '20px', margin: 0 }}>
          The projection is built backward from the go-live date using the following standard phase durations:
        </p>
        <ul style={{
          margin: 0,
          paddingLeft: 20,
          listStyleType: 'disc',
          fontSize: 12,
          color: '#6B7280',
          lineHeight: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}>
          <li style={{ margin: 0 }}>Go-Live — 1 week</li>
          <li style={{ margin: 0 }}>Interim Live Setup + Training — 2 weeks</li>
          <li style={{ margin: 0 }}>Data Cleanup + Sandbox Signoff — 3 weeks</li>
          <li style={{ margin: 0 }}>Kick-Off Call + Discovery — 1 week</li>
          <li style={{ margin: 0 }}>Pre Kick-Off Call — Remaining duration from the HubSpot Close Won date</li>
        </ul>
        <p style={{ fontSize: 12, color: '#6B7280', lineHeight: '20px', margin: 0 }}>
          For Squat/Denovo conversions, the Data Cleanup + Sandbox Signoff phase is omitted.
        </p>
        <p style={{ fontSize: 12, color: '#6B7280', lineHeight: '20px', margin: 0 }}>
          {'The projection rail represents the expected "on-track" timeline.'}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', lineHeight: '18px' }}>
          Actual Progress (Lower Solid Rail)
        </div>
        <p style={{ fontSize: 12, color: '#6B7280', lineHeight: '20px', margin: 0 }}>
          The lower solid rail shows actual milestone progress recorded in Deriviz.
        </p>
        <ul style={{
          margin: 0,
          paddingLeft: 20,
          listStyleType: 'disc',
          fontSize: 12,
          color: '#6B7280',
          lineHeight: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}>
          <li style={{ margin: 0 }}>Progress is drawn only up to the end of today</li>
          <li style={{ margin: 0 }}>Completed phases appear as solid segments</li>
          <li style={{ margin: 0 }}>The active phase may extend up to today to indicate ongoing progress</li>
        </ul>
        <p style={{ fontSize: 12, color: '#6B7280', lineHeight: '20px', margin: 0 }}>
          This allows comparison between actual progress and the projected timeline.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', lineHeight: '18px' }}>
          Markers
        </div>
        <ul style={{
          margin: 0,
          paddingLeft: 20,
          listStyleType: 'disc',
          fontSize: 12,
          color: '#6B7280',
          lineHeight: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}>
          <li style={{ margin: 0 }}>Vertical line → Represents today</li>
          <li style={{ margin: 0 }}>
            Purple tick → Represents the Committed Sandbox delivery date, when available. This may appear outside the default visible area; scroll horizontally to view future milestones
          </li>
        </ul>
      </div>

      <p style={{ fontSize: 12, color: '#6B7280', lineHeight: '20px', margin: 0 }}>
        Only conversions with a valid go-live date are displayed in the chart.
      </p>
    </Section>
  );
}

function LegendTabContent({ hatchId }: { hatchId: string }) {
  const demoPhase: keyof typeof PHASE_COLOR = 'kocDiscovery';
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
        gap: '8px 32px',
        alignItems: 'start',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
        <Section title="Rails">
          <LegendRow>
            <svg width={34} height={12} style={{ display: 'block', flexShrink: 0 }}>
              <defs>
                <pattern id={`${hatchId}-h`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <rect width="8" height="8" fill={PHASE_COLOR[demoPhase]} opacity={0.18} />
                  <line x1="0" y1="0" x2="0" y2="8" stroke={PHASE_COLOR[demoPhase]} strokeWidth="4" opacity={0.48} />
                </pattern>
              </defs>
              <rect x={1} y={1} width={30} height={10} rx={3} fill={`url(#${hatchId}-h)`} stroke={PHASE_COLOR[demoPhase]} strokeWidth={1} />
            </svg>
            <span style={{ flex: 1, minWidth: 0 }}>
              Projection (Planned)
            </span>
          </LegendRow>
          <LegendRow>
            <div style={{
              width: 30, height: 16, borderRadius: 3,
              background: PHASE_COLOR.kocDiscovery,
              opacity: 0.75,
              flexShrink: 0,
            }} />
            <span style={{ flex: 1, minWidth: 0 }}>
              Actual Progress
            </span>
          </LegendRow>
        </Section>

        <Section title="Conversion Phases (rails)">
          {PHASE_ORDER.map(key => (
            <LegendRow key={key}>
              <div style={{
                width: 30, height: 16, borderRadius: 2, background: PHASE_COLOR[key], flexShrink: 0,
              }} />
              <span style={{ flex: 1, minWidth: 0 }}>{PHASE_LABEL[key]}</span>
            </LegendRow>
          ))}
        </Section>

        <Section title="Markers & Labels">
          <LegendRow>
            <div style={{ width: 2, height: 18, background: '#1B2D3E', borderRadius: 1, flexShrink: 0 }} />
            <span style={{ flex: 1, minWidth: 0 }}>Today</span>
          </LegendRow>
          <LegendRow>
            <svg width={18} height={18} style={{ display: 'block', flexShrink: 0 }}>
              <polygon points="9,2 16,9 9,16 2,9" fill={SANDBOX_COLOR} />
            </svg>
            <span style={{ flex: 1, minWidth: 0 }}>
              Sandbox delivery
            </span>
          </LegendRow>
          <LegendRow>
            <CheckIcon size={13} color="#166534" />
            <span style={{ flex: 1, minWidth: 0 }}>Confirmed go-live</span>
          </LegendRow>
          <LegendRow>
            <ClockIcon size={13} color="#64748B" />
            <span style={{ flex: 1, minWidth: 0 }}>Tentative go-live</span>
          </LegendRow>
          <LegendRow>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              background: '#005EB8', color: '#FFFFFF',
              fontSize: 7, fontWeight: 800, lineHeight: '10px',
              padding: '1px 3px', borderRadius: 2, letterSpacing: '0.04em', flexShrink: 0,
            }}>NHS</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              One of the locations in the conversion is an NHS location
            </span>
          </LegendRow>
        </Section>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0, maxWidth: 300 }}>
        <Section title="Health status of conversions">
          {STATUS_OPTS.map(({ value: s, label }) => {
            const hex = STATUS_COLORS[s];
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            const bgAlpha =
              s === 'critical' ? 0.40
              : s === 'needs-attention' ? 0.20
              : s === 'minor-issue' ? 0.10
              : 0.15;
            const borderAlpha = s === 'critical' || s === 'needs-attention' ? 0.80 : 0.65;
            return (
              <LegendRow key={s}>
                <div style={{
                  display: 'flex', alignItems: 'center',
                  padding: '6px 10px',
                  borderRadius: 8,
                  background: `rgba(${r},${g},${b},${bgAlpha})`,
                  border: `1px solid rgba(${r},${g},${b},${borderAlpha})`,
                  gap: 8,
                  flex: 1, minWidth: 0,
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                    background: hex,
                  }} />
                  <span style={{ fontSize: 12, fontWeight: 500, color: '#111827' }}>
                    {label}
                  </span>
                </div>
              </LegendRow>
            );
          })}
        </Section>

        <div style={{ minWidth: 0 }}>
          <SectionLabel>Milestones</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 2, maxWidth: 300 }}>
            {MILESTONES.map(ms => (
              <MilestoneLegendRow key={ms.id} milestone={ms} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

type GuideTab = 'howToRead' | 'legend';

/** Centred modal (same interaction pattern as rota-board LegendModal). */
export function LegendPanel({ onClose }: Props) {
  const hatchId = useId().replace(/:/g, '');
  const [tab, setTab] = useState<GuideTab>('howToRead');

  useEffect(() => {
    const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gantt-legend-title"
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(0, 0, 0, 0.40)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px 16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 'min(700px, calc(100vw - 32px))',
          maxHeight: 'min(88vh, 900px)',
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: 12,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{
          padding: '8px 20px',
          background: '#F8F9FA',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex', alignItems: 'center', flexShrink: 0,
        }}>
          <span id="gantt-legend-title" style={{ fontSize: 15, fontWeight: 700, color: '#147B8D', flex: 1 }}>
            Guide
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close guide"
            style={{
              width: 28, height: 28, borderRadius: 6,
              background: '#FFFFFF', border: '1px solid #E5E7EB',
              cursor: 'pointer', fontSize: 18, lineHeight: 1, color: '#6B7280',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        <div
          role="tablist"
          aria-label="Guide sections"
          style={{
            display: 'flex',
            gap: 4,
            padding: '0 16px',
            background: '#F8F9FA',
            borderBottom: '1px solid #E5E7EB',
            flexShrink: 0,
          }}
        >
          <GuideTabButton
            id="guide-tab-read"
            controlsId="guide-panel-read"
            selected={tab === 'howToRead'}
            onClick={() => setTab('howToRead')}
          >
            How to Read
          </GuideTabButton>
          <GuideTabButton
            id="guide-tab-legend"
            controlsId="guide-panel-legend"
            selected={tab === 'legend'}
            onClick={() => setTab('legend')}
          >
            Legend
          </GuideTabButton>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 22px 28px', minHeight: 0 }}>
          <div
            id="guide-panel-read"
            role="tabpanel"
            aria-labelledby="guide-tab-read"
            hidden={tab !== 'howToRead'}
            style={{ display: tab === 'howToRead' ? 'block' : 'none' }}
          >
            <HowToReadContent />
          </div>
          <div
            id="guide-panel-legend"
            role="tabpanel"
            aria-labelledby="guide-tab-legend"
            hidden={tab !== 'legend'}
            style={{ display: tab === 'legend' ? 'block' : 'none' }}
          >
            <LegendTabContent hatchId={hatchId} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <SectionLabel>{title}</SectionLabel>
      {hint && (
        <p style={{ fontSize: 11.5, color: '#9CA3AF', lineHeight: '17px', marginTop: -4, marginBottom: 10 }}>
          {hint}
        </p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>
    </div>
  );
}

function LegendRow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: '#374151', lineHeight: 1.45,
    }}>
      {children}
    </div>
  );
}

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  PHASE_COLOR, PHASE_LABEL, PHASE_ORDER, SANDBOX_COLOR,
  STATUS_COLORS, TODAY, addDays, fmt, fmtShort,
  MILESTONES, getMilestonePalette,
  scheduleDeviationDays, formatScheduleDeviationDays, scheduleDeviationColor,
} from '../data';
import type { DerivedAccount, PhaseSpan, PhaseKey, TooltipState } from '../types';
import { CheckIcon, ClockIcon } from './icons';

// ─── Chart layout constants ────────────────────────────────────────────────
const LEFT_W  = 268;
const ROW_H   = 54;
const HDR_H   = 44;
/** Month dividers only span the compact month label row. */
const HDR_MONTH_LINE_BOTTOM = 12;
/** Short week ticks flush to the header bottom. */
const HDR_WEEK_TICK_H = 5;
const HDR_WEEK_TICK_TOP = HDR_H - HDR_WEEK_TICK_H;
/** Week range digits sit just above the tick strip (minimal dead space). */
const HDR_WEEK_LABEL_BASELINE = HDR_WEEK_TICK_TOP - 2;
const RAIL_H  = 14;
const PROJ_Y  = 9;
const ACT_Y   = PROJ_Y + RAIL_H + 7;
const BAR_R   = 3;

// ─── Time constants ────────────────────────────────────────────────────────
const PPD       = 9;
const BACK_DAYS = 182;
const FWD_DAYS  = 364;
const CHART_W   = (BACK_DAYS + FWD_DAYS) * PPD;
const TODAY_X   = BACK_DAYS * PPD;
const INIT_SCROLL = (BACK_DAYS - 56) * PPD;

function dayToX(dayOffset: number): number {
  return (dayOffset + BACK_DAYS) * PPD;
}

// ─── Time scale grid ────────────────────────────────────────────────────────
interface WeekMark  { off: number; mStart: boolean }
interface MonthMark { off: number; label: string }

function buildTimeScale(): { weeks: WeekMark[]; months: MonthMark[] } {
  const chartStart = addDays(TODAY, -BACK_DAYS);
  const chartEnd   = addDays(TODAY,  FWD_DAYS);

  const weeks: WeekMark[] = [];
  let wd = new Date(chartStart);
  wd = addDays(wd, (8 - wd.getDay()) % 7 || 7);
  while (wd <= chartEnd) {
    const off = Math.round((wd.getTime() - TODAY.getTime()) / 86_400_000);
    weeks.push({ off, mStart: wd.getDate() <= 7 });
    wd = addDays(wd, 7);
  }

  const months: MonthMark[] = [];
  let md = new Date(chartStart.getFullYear(), chartStart.getMonth(), 1);
  while (md <= chartEnd) {
    months.push({
      off: Math.round((md.getTime() - TODAY.getTime()) / 86_400_000),
      label: md.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    });
    md = new Date(md.getFullYear(), md.getMonth() + 1, 1);
  }

  return { weeks, months };
}

const { weeks: WEEKS, months: MONTHS } = buildTimeScale();

/** Week column: start–end day of month only (e.g. 10-16); month label is in the band above. */
function fmtWeekDaySpan(weekStartOff: number): string {
  const start = addDays(TODAY, weekStartOff);
  const end   = addDays(TODAY, weekStartOff + 6);
  return `${start.getDate()}-${end.getDate()}`;
}

// ─── Tooltip helpers ───────────────────────────────────────────────────────
function projTip(p: PhaseSpan, acc: DerivedAccount): string {
  const endIncl = p.e - 1;
  return [
    `${PHASE_LABEL[p.key as PhaseKey]} (Planned)`,
    `${fmtShort(addDays(TODAY, p.s))} → ${fmtShort(addDays(TODAY, endIncl))}`,
    ' ',
    'Upcoming milestones:',
    ...(acc.sandboxDate ? [`• Sandbox delivery — ${fmt(acc.sandboxDate)}`] : []),
    `• Go-Live — ${fmt(acc.goLiveDate)}`,
  ].filter(Boolean).join('\n');
}

/** Actual bar reaches today but the planned phase continues — show fade (not yet complete). */
function isActualSegmentOpenAtToday(p: PhaseSpan, acc: DerivedAccount): boolean {
  const proj = acc.projection.find(pr => pr.key === p.key);
  return proj !== undefined && p.e === 0 && proj.e > 0;
}

function actualFadeGradientId(accId: string, p: PhaseSpan): string {
  return `act-fade-${accId}-${p.key}-${p.s}-${p.e}`;
}

function actualTip(p: PhaseSpan, acc: DerivedAccount): string {
  const dealDate = acc.projection.length > 0
    ? fmtShort(addDays(TODAY, acc.projection[0].s + acc.daysBehind))
    : '—';
  const open = isActualSegmentOpenAtToday(p, acc);
  const endLabel = open
    ? 'Present'
    : fmtShort(addDays(TODAY, p.e - 1));
  const statusLine = open
    ? 'Status: In progress'
    : 'Status: Completed';
  const dev = scheduleDeviationDays(acc);
  const lines = [
    `${PHASE_LABEL[p.key as PhaseKey]} (Actual)`,
    `${fmtShort(addDays(TODAY, p.s))} → ${endLabel}`,
    statusLine,
  ];
  if (dev < 0) {
    lines.push(
      '',
      `Schedule deviation: ${formatScheduleDeviationDays(dev)} (lagging vs projection)`,
    );
  }
  lines.push(
    '',
    'Milestones completed:',
    `• Deal allocation — ${dealDate}`,
  );
  return lines.join('\n');
}

// ─── Component ─────────────────────────────────────────────────────────────
interface Props {
  accounts: DerivedAccount[];
  onSelectAccount?: (acc: DerivedAccount) => void;
}

export function GanttChart({ accounts, onSelectAccount }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({ content: '', x: 0, y: 0, visible: false });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = INIT_SCROLL;
    }
  }, []);

  const showTip = useCallback((content: string, e: React.MouseEvent) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const { clientX, clientY } = e;
    timerRef.current = setTimeout(() => {
      setTooltip({ content, x: clientX, y: clientY, visible: true });
    }, 180);
  }, []);

  const moveTip = useCallback((e: React.MouseEvent) => {
    setTooltip(prev => prev.visible ? { ...prev, x: e.clientX, y: e.clientY } : prev);
  }, []);

  const hideTip = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setTooltip(prev => ({ ...prev, visible: false }));
  }, []);

  const TOTAL_BODY_H = accounts.length * ROW_H;

  if (accounts.length === 0) {
    return (
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 10, color: '#9CA3AF',
      }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.5" opacity={0.4}>
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/>
        </svg>
        <p style={{ fontSize: 13, fontWeight: 500, color: '#6B7280' }}>No accounts match your filters</p>
        <p style={{ fontSize: 12, color: '#9CA3AF' }}>Try adjusting or clearing the filters above</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', background: '#F8FAFC' }}>

      {/* ── Gantt scrollable area ─────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        className="gantt-scroll"
        style={{ flex: 1, overflow: 'auto', position: 'relative' }}
        onMouseMove={moveTip}
      >
        <div style={{ minWidth: LEFT_W + CHART_W, position: 'relative' }}>

          {/* ── Sticky time-scale header ──────────────────────────────────── */}
          <div style={{
            position: 'sticky', top: 0, zIndex: 20,
            display: 'flex', height: HDR_H,
            background: '#F8FAFC',
            borderBottom: '1px solid #E5E7EB',
          }}>
            <div style={{
              position: 'sticky', left: 0, zIndex: 21,
              width: LEFT_W, flexShrink: 0,
              display: 'flex', alignItems: 'flex-end',
              padding: '0 12px 6px 20px',
              background: '#F8FAFC',
              borderRight: '1px solid #E5E7EB',
            }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.06em', alignSelf: 'center' }}>
                Account | Conversion | PMS
              </span>
            </div>

            <svg width={CHART_W} height={HDR_H} style={{ display: 'block', flexShrink: 0 }}>
              {MONTHS.map((m, i) => (
                <line
                  key={`m-div-${i}`}
                  x1={dayToX(m.off)}
                  y1={0}
                  x2={dayToX(m.off)}
                  y2={HDR_MONTH_LINE_BOTTOM}
                  stroke="#D1D5DB"
                  strokeWidth={1}
                />
              ))}
              {MONTHS.map((m, i) => {
                const x0 = dayToX(m.off);
                const x1 = i + 1 < MONTHS.length ? dayToX(MONTHS[i + 1].off) : CHART_W;
                const cx = (x0 + x1) / 2;
                return (
                  <text
                    key={`m-lab-${i}`}
                    x={cx}
                    y={12}
                    fontSize={11}
                    fontWeight={600}
                    fill="#6B7280"
                    textAnchor="middle"
                    fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
                  >
                    {m.label}
                  </text>
                );
              })}
              {WEEKS.map((w, i) => (
                <line
                  key={`wk-tick-${i}`}
                  x1={dayToX(w.off)}
                  y1={HDR_WEEK_TICK_TOP}
                  x2={dayToX(w.off)}
                  y2={HDR_H}
                  stroke="#E5E7EB"
                  strokeWidth={1}
                />
              ))}
              {WEEKS.map((w, i) => {
                const wx0 = dayToX(w.off);
                const wcx = wx0 + (7 * PPD) / 2;
                return (
                  <text
                    key={`wk-lab-${i}`}
                    x={wcx}
                    y={HDR_WEEK_LABEL_BASELINE}
                    fontSize={11}
                    fontWeight={500}
                    fill="#64748B"
                    textAnchor="middle"
                    fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
                  >
                    {fmtWeekDaySpan(w.off)}
                  </text>
                );
              })}
              <line x1={TODAY_X} y1={0} x2={TODAY_X} y2={HDR_H} stroke="#1B2D3E" strokeWidth={2} />
              <rect x={TODAY_X - 22} y={1} width={44} height={12} rx={6} fill="#1B2D3E" />
              <text
                x={TODAY_X}
                y={10}
                fontSize={8}
                fontWeight={700}
                fill="#FFFFFF"
                textAnchor="middle"
                fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
              >
                TODAY
              </text>
            </svg>
          </div>

          {/* ── Gantt body ─────────────────────────────────────────────────── */}
          <div style={{ display: 'flex' }}>

            {/* Left panel */}
            <div style={{
              position: 'sticky', left: 0, zIndex: 10,
              width: LEFT_W, flexShrink: 0,
              background: '#FFFFFF',
              borderRight: '1px solid #E5E7EB',
            }}>
              {accounts.map(acc => (
                <LeftRow key={acc.id} acc={acc} onSelect={onSelectAccount} />
              ))}
            </div>

            {/* Gantt SVG */}
            <svg width={CHART_W} height={TOTAL_BODY_H} style={{ display: 'block', flexShrink: 0 }}>
              <defs>
                {(Object.keys(PHASE_COLOR) as PhaseKey[]).map(key => (
                  <pattern key={key} id={`hatch-${key}`}
                    width="8" height="8"
                    patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <rect width="8" height="8" fill={PHASE_COLOR[key]} opacity={0.18} />
                    <line x1="0" y1="0" x2="0" y2="8" stroke={PHASE_COLOR[key]} strokeWidth="4" opacity={0.48} />
                  </pattern>
                ))}
                {accounts.flatMap(acc =>
                  acc.actual.flatMap(p => {
                    if (!isActualSegmentOpenAtToday(p, acc)) return [];
                    const col = PHASE_COLOR[p.key as PhaseKey];
                    const gid = actualFadeGradientId(acc.id, p);
                    return [(
                      <linearGradient
                        key={gid}
                        id={gid}
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="0"
                        gradientUnits="objectBoundingBox"
                      >
                        <stop offset="0%" stopColor={col} stopOpacity={0.92} />
                        <stop offset="52%" stopColor={col} stopOpacity={0.72} />
                        <stop offset="82%" stopColor={col} stopOpacity={0.52} />
                        <stop offset="100%" stopColor={col} stopOpacity={0} />
                      </linearGradient>
                    )];
                  }),
                )}
              </defs>

              {accounts.map((_, i) => i % 2 === 1 && (
                <rect key={`bg-${i}`} x={0} y={i * ROW_H} width={CHART_W} height={ROW_H}
                  fill="#F9FAFB" />
              ))}

              {WEEKS.map((w, i) => (
                <line key={`wk-${i}`}
                  x1={dayToX(w.off)} y1={0} x2={dayToX(w.off)} y2={TOTAL_BODY_H}
                  stroke={w.mStart ? '#D1D5DB' : '#F3F4F6'} strokeWidth={1} />
              ))}

              {accounts.map((_, i) => i < accounts.length - 1 && (
                <line key={`sep-${i}`}
                  x1={0} y1={(i + 1) * ROW_H} x2={CHART_W} y2={(i + 1) * ROW_H}
                  stroke="#F3F4F6" strokeWidth={1} />
              ))}

              {accounts.map((acc, i) => {
                const ry    = i * ROW_H;
                const sbOff = acc.sandboxOffset;
                return (
                  <g key={acc.id} transform={`translate(0,${ry})`}>

                    {acc.projection.map(p => {
                      const px = dayToX(p.s);
                      const pw = Math.max(0, (p.e - p.s) * PPD);
                      const col = PHASE_COLOR[p.key as PhaseKey];
                      return (
                        <rect key={`proj-${p.key}`}
                          x={px} y={PROJ_Y} width={pw} height={RAIL_H} rx={BAR_R}
                          fill={`url(#hatch-${p.key})`}
                          stroke={col}
                          strokeWidth={1}
                          style={{ cursor: 'default' }}
                          onMouseEnter={e => showTip(projTip(p, acc), e)}
                          onMouseLeave={hideTip}
                        />
                      );
                    })}

                    {acc.actual.map(p => {
                      const ax = dayToX(p.s);
                      const aw = Math.max(0, (p.e - p.s) * PPD);
                      const col = PHASE_COLOR[p.key as PhaseKey];
                      const fadeOpen = isActualSegmentOpenAtToday(p, acc) && aw >= 6;
                      return (
                        <rect key={`act-${p.key}-${p.s}`}
                          x={ax} y={ACT_Y} width={aw} height={RAIL_H} rx={BAR_R}
                          fill={fadeOpen ? `url(#${actualFadeGradientId(acc.id, p)})` : col}
                          opacity={fadeOpen ? 1 : 0.75}
                          style={{ cursor: 'default' }}
                          onMouseEnter={e => showTip(actualTip(p, acc), e)}
                          onMouseLeave={hideTip}
                        />
                      );
                    })}

                    {sbOff !== null && (() => {
                      const sx  = dayToX(sbOff);
                      const ty  = ACT_Y - 3;
                      const th  = RAIL_H + 6;
                      const tip = acc.sandboxDate
                        ? `Sandbox delivery: ${fmt(acc.sandboxDate)}`
                        : 'Sandbox not scheduled';
                      return (
                        <g style={{ cursor: 'default' }}
                          onMouseEnter={e => showTip(tip, e)}
                          onMouseLeave={hideTip}>
                          <rect x={sx - 1.5} y={ty} width={3} height={th} rx={1}
                            fill={SANDBOX_COLOR} />
                          <polygon
                            points={`${sx},${ty-7} ${sx+5},${ty-2} ${sx},${ty+3} ${sx-5},${ty-2}`}
                            fill={SANDBOX_COLOR} />
                        </g>
                      );
                    })()}
                  </g>
                );
              })}

              <line x1={TODAY_X} y1={0} x2={TODAY_X} y2={TOTAL_BODY_H}
                stroke="#1B2D3E" strokeWidth={2} opacity={0.85} />
            </svg>

          </div>
        </div>
      </div>

      {/* ── Tooltip overlay ────────────────────────────────────────────────── */}
      {tooltip.visible && (
        <div style={{
          position: 'fixed',
          left: tooltip.x + 14,
          top:  tooltip.y + 10,
          background: '#1B2D3E',
          color: '#E5E7EB',
          padding: '8px 12px',
          borderRadius: 6,
          fontSize: 12,
          lineHeight: '18px',
          maxWidth: 300,
          zIndex: 9999,
          whiteSpace: 'pre-line',
          pointerEvents: 'none',
          border: '1px solid rgba(255,255,255,0.10)',
        }}>
          {tooltip.content}
        </div>
      )}
    </div>
  );
}

/** First + last token of a full name (drops middle names). */
function firstLastName(full: string): string {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1]}`;
}

// ─── Left panel row ────────────────────────────────────────────────────────
function ScheduleDeviationPill({ acc }: { acc: DerivedAccount }) {
  const d = scheduleDeviationDays(acc);
  if (d >= 0) return null;
  const color = scheduleDeviationColor(d);
  const tip =
    'Actual (lower solid) rail vs projection (upper hatched): '
    + `lagging by ${Math.abs(d)} calendar day${Math.abs(d) === 1 ? '' : 's'} (negative = behind plan).`;
  return (
    <span
      title={tip}
      style={{
        flexShrink: 0,
        fontSize: 10,
        fontWeight: 700,
        fontVariantNumeric: 'tabular-nums',
        color,
        lineHeight: '14px',
        padding: '1px 5px',
        borderRadius: 4,
        border: '1px solid rgba(185, 28, 28, 0.35)',
        background: 'rgba(185, 28, 28, 0.10)',
        cursor: 'default',
      }}
    >
      {formatScheduleDeviationDays(d)}
    </span>
  );
}

function LeftRow({ acc, onSelect }: { acc: DerivedAccount; onSelect?: (a: DerivedAccount) => void }) {
  // Status-derived background (like rota chip)
  const statusColor = STATUS_COLORS[acc.status];
  const r = parseInt(statusColor.slice(1, 3), 16);
  const g = parseInt(statusColor.slice(3, 5), 16);
  const b = parseInt(statusColor.slice(5, 7), 16);
  const bgAlpha =
    acc.status === 'critical'        ? 0.20
    : acc.status === 'needs-attention' ? 0.20
    : acc.status === 'minor-issue'     ? 0.15
    : 0.15;
  const statusBg = `rgba(${r},${g},${b},${bgAlpha})`;
  const borderColor = `rgba(${r},${g},${b},0.25)`;

  // Milestone strip (HubSpot) — separate from timeline phase rails
  const milestone = MILESTONES.find(m => m.id === acc.milestoneId);
  const barPal    = milestone ? getMilestonePalette(milestone.color) : getMilestonePalette('#94A3B8');
  const barColor  = barPal.dot;
  const barTitle  = milestone ? `Milestone: ${milestone.name}` : 'Milestone not set';

  const locs   = acc.locations ?? [];
  const hasNHS = locs.some(l => l.endsWith(' [NHS]'));

  return (
    <div
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={() => onSelect?.(acc)}
      onKeyDown={e => {
        if (!onSelect) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(acc);
        }
      }}
      style={{
        height: ROW_H,
        display: 'flex',
        alignItems: 'stretch',
        borderBottom: `1px solid ${borderColor}`,
        background: statusBg,
        overflow: 'hidden',
        cursor: onSelect ? 'pointer' : 'default',
        outline: 'none',
      }}
    >
      {/* HubSpot milestone colour (not the same as phase rails) */}
      <div title={barTitle} style={{ width: 10, flexShrink: 0, background: barColor, cursor: 'default' }} />

      {/* Content */}
      <div style={{
        flex: 1, minWidth: 0,
        padding: '6px 10px 6px 10px',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4,
      }}>

        {/* Line 1: Account | Conversion | PMS + NHS + go-live confirmation (rota pattern) */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, lineHeight: '16px',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', flex: 1, minWidth: 0, overflow: 'hidden',
            fontSize: 12, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap',
          }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 1, minWidth: 0 }}>
              {acc.name}
            </span>
            {acc.conversion && (
              <>
                <span style={{ margin: '0 4px', color: '#9CA3AF', fontWeight: 400, flexShrink: 0 }}>|</span>
                <span style={{ flexShrink: 0, color: '#374151' }}>{acc.conversion}</span>
              </>
            )}
            {(acc.isSquat || acc.pms) && (
              <>
                <span style={{ margin: '0 4px', color: '#9CA3AF', fontWeight: 400, flexShrink: 0 }}>|</span>
                <span style={{ flexShrink: 0, color: '#374151', fontWeight: acc.isSquat ? 600 : 400 }}>
                  {acc.isSquat ? 'Squat/Denovo' : acc.pms}
                </span>
              </>
            )}
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            {hasNHS && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                background: '#005EB8', color: '#FFFFFF',
                fontSize: 7, fontWeight: 800, lineHeight: '10px',
                padding: '1px 3px', borderRadius: 2, letterSpacing: '0.04em',
              }}>NHS</span>
            )}
            <span title={acc.confirmed ? 'Confirmed go-live' : 'Tentative go-live'} style={{ display: 'flex', alignItems: 'center' }}>
              {acc.confirmed
                ? <CheckIcon size={13} color="#166534" />
                : <ClockIcon size={13} color="#64748B" />}
            </span>
          </span>
        </div>

        {/* Line 2: PMO + Impl + schedule deviation vs projection rail */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 8, minWidth: 0, fontSize: 10.5, color: '#4B5563',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
            minWidth: 0, flex: 1,
          }}>
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <span style={{ fontWeight: 600, color: '#64748B' }}>PMO: </span>
              {firstLastName(acc.pmo)}
            </span>
            <span style={{ color: '#D1D5DB', flexShrink: 0 }}>·</span>
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <span style={{ fontWeight: 600, color: '#64748B' }}>Impl: </span>
              {firstLastName(acc.implLead)}
            </span>
          </div>
          <ScheduleDeviationPill acc={acc} />
        </div>
      </div>
    </div>
  );
}

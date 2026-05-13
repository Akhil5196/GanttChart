import React, { useState, useRef, useEffect, useMemo, CSSProperties } from 'react';
import { STATUS_COLORS, STATUS_OPTS, PMO_LIST, IMPL_LEADS } from '../data';
import type { GanttFilters, DeviationCompare, DeviationLagPreset, Region, Status, ViewFilter, ViewMode, Week } from '../types';

type DeviationLagChoice = Exclude<DeviationLagPreset, ''>;

const DEVIATION_COMPARE_OPTIONS: { id: DeviationCompare; label: string }[] = [
  { id: 'more', label: 'More than' },
  { id: 'less', label: 'Less than' },
];

const DEVIATION_LAG_OPTIONS: { id: DeviationLagChoice; label: string }[] = [
  { id: '5', label: '5' },
  { id: '10', label: '10' },
  { id: '15', label: '15' },
  { id: '20', label: '20' },
  { id: '25', label: '25' },
  { id: '30', label: '30' },
];

const inputStyle: CSSProperties = {
  height: 30, padding: '0 10px', fontSize: 12,
  border: '1px solid #D1D5DB', borderRadius: 6,
  background: '#FFFFFF', color: '#1F2937', outline: 'none',
  transition: 'border-color 0.15s', fontFamily: 'inherit',
};

const calNavBtnStyle: CSSProperties = {
  width: 28, height: 28, border: 'none', borderRadius: 6,
  background: 'none', cursor: 'pointer', fontSize: 18, color: '#6B7280',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: 'inherit',
};

/* ── Date utilities ────────────────────────────────────────────────────────── */

function isoFromParts(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function parseIso(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return { year: y, month: m - 1, day: d };
}

function addDaysIso(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + n);
  return isoFromParts(date.getFullYear(), date.getMonth(), date.getDate());
}

function buildMonthGrid(year: number, month: number): string[][] {
  const firstDow  = new Date(year, month, 1).getDay();
  const offset    = firstDow === 0 ? 6 : firstDow - 1;
  const startDate = new Date(year, month, 1 - offset);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const numRows   = Math.ceil((daysInMonth + offset) / 7);
  const rows: string[][] = [];
  for (let r = 0; r < numRows; r++) {
    const row: string[] = [];
    for (let c = 0; c < 7; c++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + r * 7 + c);
      row.push(isoFromParts(d.getFullYear(), d.getMonth(), d.getDate()));
    }
    rows.push(row);
  }
  return rows;
}

function todayIso(): string {
  const t = new Date();
  return isoFromParts(t.getFullYear(), t.getMonth(), t.getDate());
}

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTH_FULL  = ['January','February','March','April','May','June','July','August','September','October','November','December'];

/* ── FilterGroup ─────────────────────────────────────────────────────────────*/
function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={{
        fontSize: 10, fontWeight: 600, color: '#6B7280',
        letterSpacing: '0.06em', textTransform: 'uppercase',
      }}>
        {label}
      </span>
      {children}
    </div>
  );
}

/* ── MultiSelectDropdown ──────────────────────────────────────────────────────*/
interface DropdownOption {
  id:      string;
  label:   string;
  prefix?: React.ReactNode;
}

function MultiSelectDropdown({
  placeholder, options, selected, onToggle, onClear,
}: {
  placeholder: string;
  options:     DropdownOption[];
  selected:    string[];
  onToggle:    (id: string) => void;
  onClear:     () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  const label = selected.length === 0
    ? placeholder
    : selected.length === 1
      ? (options.find(o => o.id === selected[0])?.label ?? placeholder)
      : `${selected.length} selected`;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          ...inputStyle, padding: '0 28px 0 10px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
          minWidth: 136, position: 'relative',
        }}
      >
        <span style={{ flex: 1, textAlign: 'left', color: selected.length > 0 ? '#1F2937' : '#9CA3AF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {label}
        </span>
        <svg style={{ position: 'absolute', right: 8, pointerEvents: 'none' }}
          width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M2 3.5L5 6.5L8 3.5" stroke="#9CA3AF" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, marginTop: 4,
          background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8,
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)', zIndex: 200, minWidth: 180, overflow: 'hidden',
        }}>
          {options.map(o => (
            <label key={o.id} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px',
              cursor: 'pointer', fontSize: 12, color: '#374151',
              background: selected.includes(o.id) ? 'rgba(77,200,180,0.07)' : 'transparent',
            }}
              onMouseEnter={e => { if (!selected.includes(o.id)) e.currentTarget.style.background = '#F9FAFB'; }}
              onMouseLeave={e => { e.currentTarget.style.background = selected.includes(o.id) ? 'rgba(77,200,180,0.07)' : 'transparent'; }}
            >
              <input type="checkbox" checked={selected.includes(o.id)} onChange={() => onToggle(o.id)}
                style={{ width: 13, height: 13, accentColor: '#147B8D' }} />
              {o.prefix}
              {o.label}
            </label>
          ))}
          {selected.length > 0 && (
            <>
              <div style={{ height: 1, background: '#F3F4F6', margin: '2px 0' }} />
              <button onClick={() => { onClear(); setOpen(false); }} style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '7px 12px', fontSize: 11.5, color: '#6B7280',
                background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              }}>
                Clear selection
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ── SingleSelectDropdown (Region — rota pattern) ────────────────────────────*/

function SingleSelectDropdown({
  options, value, onChange, placeholder, minWidth = 80,
}: {
  options:      { id: string; label: string }[];
  value:        string;
  onChange:     (id: string) => void;
  /** When `value` matches no option (e.g. empty), show this instead of a blank label. */
  placeholder?: string;
  minWidth?:    number;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const selected = options.find(o => o.id === value);
  const usePlaceholder = Boolean(placeholder) && !selected;
  const labelText = selected?.label ?? (usePlaceholder ? placeholder! : value);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          height: 30, padding: '0 10px',
          display: 'flex', alignItems: 'center', gap: 6,
          border: '1px solid var(--cf-border-primary, #D1D5DB)',
          borderRadius: 6,
          background: 'var(--cf-bg-chrome, #F9FAFB)',
          color: 'var(--cf-text-secondary, #374151)',
          fontSize: 12, fontWeight: 400,
          cursor: 'pointer', whiteSpace: 'nowrap', minWidth,
          fontFamily: 'inherit',
        }}
      >
        <span style={{
          flex: 1,
          textAlign: 'left',
          color: usePlaceholder ? '#9CA3AF' : '#374151',
        }}>{labelText}</span>
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
          <path d="M2 4.5l4 4 4-4" stroke="#9CA3AF" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 220,
          background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8,
          boxShadow: '0 4px 16px rgba(0,0,0,0.10)', minWidth: 100,
          padding: '4px 0',
        }}>
          {options.map(opt => {
            const isSelected = opt.id === value;
            return (
              <div
                key={opt.id}
                role="menuitem"
                onClick={() => { onChange(opt.id); setOpen(false); }}
                style={{
                  padding: '6px 12px', fontSize: 12, cursor: 'pointer',
                  color: isSelected ? '#2A9A8A' : '#374151',
                  background: isSelected ? 'rgba(77,200,180,0.06)' : 'transparent',
                  fontWeight: isSelected ? 500 : 400,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#F9FAFB'; }}
                onMouseLeave={e => { e.currentTarget.style.background = isSelected ? 'rgba(77,200,180,0.06)' : 'transparent'; }}
              >
                {isSelected && (
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
                    <path d="M2 6l3 3 5-5" stroke="#2A9A8A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
                {!isSelected && <span style={{ width: 10, flexShrink: 0 }} />}
                {opt.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── ViewToggle (All | Conversion | Squat/Denovo) ────────────────────────────*/
function ViewToggle({ value, onChange }: { value: ViewFilter; onChange: (v: ViewFilter) => void }) {
  const opts: { v: ViewFilter; label: string }[] = [
    { v: 'all', label: 'All' }, { v: 'standard', label: 'Conversion' }, { v: 'squat', label: 'Squat/Denovo' },
  ];
  return (
    <div style={{
      display: 'flex', border: '1px solid #D1D5DB',
      borderRadius: 6, overflow: 'hidden', background: '#F9FAFB', flexShrink: 0,
    }}>
      {opts.map(o => (
        <button key={o.v} onClick={() => onChange(o.v)} style={{
          height: 30, padding: '0 12px',
          background: value === o.v ? '#147B8D' : 'transparent',
          color: value === o.v ? '#fff' : '#6B7280',
          fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer',
          transition: 'background 0.15s, color 0.15s', whiteSpace: 'nowrap', fontFamily: 'inherit',
        }}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Lag vs projection: compare + day threshold (no outer chrome — matches Region + View by spacing). */
function DeviationFilterControl({
  compare,
  threshold,
  onChange,
}: {
  compare:    DeviationCompare;
  threshold:  DeviationLagPreset;
  onChange:     (patch: Partial<Pick<GanttFilters, 'deviationCompare' | 'deviationLagMinDays'>>) => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        flexShrink: 0,
      }}
      title="More than: lag strictly greater than N days. Less than: lag from 1 day up to (but not including) N days — excludes on-track and ahead of projection."
    >
      <SingleSelectDropdown
        options={DEVIATION_COMPARE_OPTIONS}
        value={compare}
        minWidth={100}
        onChange={id => onChange({ deviationCompare: id as DeviationCompare })}
      />
      <SingleSelectDropdown
        options={DEVIATION_LAG_OPTIONS}
        value={threshold}
        placeholder="Select"
        minWidth={64}
        onChange={id => onChange({ deviationLagMinDays: id as DeviationLagPreset })}
      />
      <span
        style={{
          fontSize: 12,
          fontWeight: 400,
          color: '#6B7280',
          whiteSpace: 'nowrap',
          userSelect: 'none',
          lineHeight: '30px',
        }}
      >
        days
      </span>
    </div>
  );
}

/* ── WeekRangeChip ────────────────────────────────────────────────────────── */

interface WeekRangeChipProps {
  fromWeek:        string;
  toWeek:          string;
  defaultFromWeek: string;
  defaultToWeek:   string;
  weeks:           Week[];
  onChange:        (patch: { fromWeek?: string; toWeek?: string }) => void;
}

function WeekRangeChip({ fromWeek, toWeek, defaultFromWeek, defaultToWeek, weeks, onChange }: WeekRangeChipProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  const isActive = fromWeek !== defaultFromWeek || toWeek !== defaultToWeek;

  function weekLabel(): string {
    const from = weeks.find(w => w.id === fromWeek);
    const to   = weeks.find(w => w.id === toWeek);
    if (!from || !to) return 'All weeks';
    const fs = parseIso(from.startDate);
    const te = parseIso(addDaysIso(to.startDate, 6));
    if (fs.year === te.year) {
      if (fs.month === te.month)
        return `${MONTH_SHORT[fs.month]} ${fs.day}–${te.day}, ${fs.year}`;
      return `${MONTH_SHORT[fs.month]} ${fs.day} – ${MONTH_SHORT[te.month]} ${te.day}, ${fs.year}`;
    }
    return `${MONTH_SHORT[fs.month]} ${fs.day}, ${fs.year} – ${MONTH_SHORT[te.month]} ${te.day}, ${te.year}`;
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          height: 30, padding: '0 10px',
          display: 'flex', alignItems: 'center', gap: 6,
          border: `1px solid ${isActive ? '#4DC8B4' : '#D1D5DB'}`,
          borderRadius: 6,
          background: isActive ? 'rgba(77,200,180,0.06)' : '#F9FAFB',
          color: isActive ? '#2A9A8A' : '#9CA3AF',
          fontSize: 12, fontWeight: isActive ? 500 : 400,
          cursor: 'pointer', whiteSpace: 'nowrap', minWidth: 172,
          transition: 'border-color 0.15s', fontFamily: 'inherit',
        }}
      >
        <svg width="11" height="11" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
          <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M5 1v3M11 1v3M2 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <span style={{ flex: 1, textAlign: 'left' }}>{weekLabel()}</span>
        {isActive ? (
          <span
            role="button"
            onClick={e => {
              e.stopPropagation();
              onChange({ fromWeek: defaultFromWeek, toWeek: defaultToWeek });
              setOpen(false);
            }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 16, height: 16, color: '#6B7280',
              fontSize: 16, fontWeight: 700, lineHeight: 1,
              flexShrink: 0, cursor: 'pointer',
            }}
          >
            ×
          </span>
        ) : (
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
            <path d="M2 4.5l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      {open && (
        <WeekRangePicker
          fromId={fromWeek}
          toId={toWeek}
          weeks={weeks}
          onApply={(fId, tId) => {
            onChange({ fromWeek: fId, toWeek: tId });
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}

/* ── WeekRangePicker ─────────────────────────────────────────────────────── */

interface WeekRangePickerProps {
  fromId:  string;
  toId:    string;
  weeks:   Week[];
  onApply: (fromId: string, toId: string) => void;
}

function WeekRangePicker({ fromId, toId, weeks, onApply }: WeekRangePickerProps) {
  const weekByMonday = useMemo(() => new Map(weeks.map(w => [w.startDate, w.id])), [weeks]);
  const idToMonday   = useMemo(() => new Map(weeks.map(w => [w.id, w.startDate])), [weeks]);

  const initFrom = idToMonday.get(fromId) ?? weeks[0]?.startDate ?? '';
  const initTo   = idToMonday.get(toId)   ?? weeks[weeks.length - 1]?.startDate ?? '';

  const [phase,     setPhase]     = useState<'from' | 'to'>('from');
  const [anchor,    setAnchor]    = useState(initFrom);
  const [hoverWeek, setHoverWeek] = useState<string | null>(null);

  const today = new Date();
  const [calYear,  setCalYear]  = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  const rightMonth = calMonth === 11 ? 0  : calMonth + 1;
  const rightYear  = calMonth === 11 ? calYear + 1 : calYear;

  function navMonth(delta: -1 | 1) {
    setCalMonth(m => {
      const nm = (m + 12 + delta) % 12;
      if (delta === 1  && m === 11) setCalYear(y => y + 1);
      if (delta === -1 && m === 0)  setCalYear(y => y - 1);
      return nm;
    });
  }

  const pre      = phase === 'from';
  const liveEnd  = hoverWeek ?? anchor;
  const dispFrom = pre ? initFrom : (anchor <= liveEnd ? anchor  : liveEnd);
  const dispTo   = pre ? initTo   : (anchor <= liveEnd ? liveEnd : anchor);

  function handleWeekClick(monday: string) {
    if (!weekByMonday.has(monday)) return;
    if (phase === 'from') {
      setAnchor(monday);
      setPhase('to');
    } else {
      const a  = anchor <= monday ? anchor  : monday;
      const b  = anchor <= monday ? monday  : anchor;
      const fId = weekByMonday.get(a) ?? weeks[0].id;
      const tId = weekByMonday.get(b) ?? weeks[weeks.length - 1].id;
      onApply(fId, tId);
    }
  }

  function renderMonth(year: number, month: number) {
    const grid  = buildMonthGrid(year, month);
    const todayStr = todayIso();
    return (
      <div style={{ width: 203 }}>
        <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#111827', marginBottom: 8 }}>
          {MONTH_FULL[month]} {year}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 29px)' }}>
          {['M','T','W','T','F','S','S'].map((h, i) => (
            <div key={i} style={{
              textAlign: 'center', fontSize: 10, fontWeight: 600,
              color: '#9CA3AF', height: 20, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>{h}</div>
          ))}
        </div>
        {grid.map((weekRow, ri) => {
          const rowMonday  = weekRow[0];
          const selectable = weekByMonday.has(rowMonday);
          const inRange    = rowMonday >= dispFrom && rowMonday <= dispTo;
          const isStart    = rowMonday === dispFrom && dispFrom !== '';
          const isEnd      = rowMonday === dispTo   && dispTo   !== '';
          const isHovered  = rowMonday === hoverWeek && !pre;

          let rowBg = 'transparent';
          if (pre && inRange)          rowBg = 'rgba(77,200,180,0.10)';
          else if (!pre) {
            if (isStart || isEnd)      rowBg = 'rgba(20,123,141,0.18)';
            else if (inRange)          rowBg = 'rgba(77,200,180,0.14)';
            else if (isHovered && selectable) rowBg = '#F3F4F6';
          }

          return (
            <div
              key={ri}
              onMouseEnter={() => selectable && setHoverWeek(rowMonday)}
              onMouseLeave={() => setHoverWeek(null)}
              onClick={() => handleWeekClick(rowMonday)}
              style={{
                display: 'grid', gridTemplateColumns: 'repeat(7, 29px)',
                borderRadius: 6, background: rowBg,
                cursor: selectable ? 'pointer' : 'default',
                transition: 'background 0.1s', marginBottom: 1,
              }}
            >
              {weekRow.map((iso, ci) => {
                const { month: cm, day } = parseIso(iso);
                const isCurrentMonth = cm === month;
                const isTodayCel     = iso === todayStr;
                return (
                  <div key={ci} style={{
                    height: 28, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: 12,
                    color: !isCurrentMonth ? '#D1D5DB'
                          : isTodayCel    ? '#147B8D'
                          : '#374151',
                    fontWeight: isTodayCel ? 700 : 400,
                    opacity: selectable ? 1 : 0.4,
                  }}>
                    {day}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{
      position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 300,
      background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 10,
      boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: '14px 16px',
      minWidth: 480,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <button onClick={() => navMonth(-1)} style={calNavBtnStyle}>‹</button>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
          {phase === 'from' ? 'Select start week' : 'Select end week'}
        </span>
        <button onClick={() => navMonth(1)}  style={calNavBtnStyle}>›</button>
      </div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        {renderMonth(calYear, calMonth)}
        <div style={{ width: 1, background: '#F3F4F6', alignSelf: 'stretch', flexShrink: 0 }} />
        {renderMonth(rightYear, rightMonth)}
      </div>
    </div>
  );
}

/* ── FilterBar ────────────────────────────────────────────────────────────────*/
interface Props {
  filters:         GanttFilters;
  onChange:        (f: GanttFilters) => void;
  weeks:           Week[];
  defaultFromWeek: string;
  defaultToWeek:   string;
}

export function FilterBar({ filters, onChange, weeks, defaultFromWeek, defaultToWeek }: Props) {
  const set = (partial: Partial<GanttFilters>) => onChange({ ...filters, ...partial });

  const isFullRange =
    filters.fromWeek === defaultFromWeek &&
    filters.toWeek   === defaultToWeek;

  const hasActive =
    !!filters.search ||
    filters.statuses.length > 0 ||
    filters.view !== 'all' ||
    filters.pmoIds.length > 0 ||
    filters.implLeadIds.length > 0 ||
    filters.region !== 'UK' ||
    !isFullRange ||
    filters.deviationLagMinDays !== '' ||
    filters.deviationCompare !== 'more';

  const statusOptions: DropdownOption[] = STATUS_OPTS.map(s => ({
    id:     s.value,
    label:  s.label,
    prefix: <span style={{
      display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
      background: STATUS_COLORS[s.value], flexShrink: 0,
    }} />,
  }));

  const columnOptions: DropdownOption[] = (filters.viewMode === 'pmo' ? PMO_LIST : IMPL_LEADS).map(name => ({
    id: name, label: name,
  }));
  const columnSelected    = filters.viewMode === 'pmo' ? filters.pmoIds : filters.implLeadIds;
  const columnPlaceholder = filters.viewMode === 'pmo' ? 'All PMOs' : 'All Impl. Leads';

  function toggleColumn(id: string) {
    if (filters.viewMode === 'pmo') {
      set({ pmoIds: filters.pmoIds.includes(id) ? filters.pmoIds.filter(x => x !== id) : [...filters.pmoIds, id] });
    } else {
      set({ implLeadIds: filters.implLeadIds.includes(id) ? filters.implLeadIds.filter(x => x !== id) : [...filters.implLeadIds, id] });
    }
  }

  function toggleStatus(v: Status) {
    set({ statuses: filters.statuses.includes(v) ? filters.statuses.filter(s => s !== v) : [...filters.statuses, v] });
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-end', gap: 10, flexWrap: 'wrap',
      padding: '8px 20px',
      background: 'var(--cf-bg-surface)',
      borderBottom: '1px solid var(--cf-border-secondary)',
      flexShrink: 0,
    }}>

      {/* Search */}
      <FilterGroup label="Search">
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <svg style={{ position: 'absolute', left: 8, pointerEvents: 'none' }}
            width="12" height="12" viewBox="0 0 16 16" fill="none">
            <circle cx="6.5" cy="6.5" r="4.5" stroke="#9CA3AF" strokeWidth="1.5"/>
            <path d="M10.5 10.5L14 14" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            type="search" value={filters.search}
            onChange={e => set({ search: e.target.value })}
            placeholder="Search accounts…"
            style={{ ...inputStyle, paddingLeft: 26, width: 170 }}
            onFocus={e => { e.currentTarget.style.borderColor = '#4DC8B4'; }}
            onBlur={e  => { e.currentTarget.style.borderColor = '#D1D5DB'; }}
          />
        </div>
      </FilterGroup>

      {/* Week range */}
      <FilterGroup label="Week">
        <WeekRangeChip
          fromWeek={filters.fromWeek}
          toWeek={filters.toWeek}
          defaultFromWeek={defaultFromWeek}
          defaultToWeek={defaultToWeek}
          weeks={weeks}
          onChange={patch => set(patch)}
        />
      </FilterGroup>

      {/* Region */}
      <FilterGroup label="Region">
        <SingleSelectDropdown
          options={[
            { id: 'UK', label: 'UK' },
            { id: 'US', label: 'US' },
            { id: 'AU', label: 'AU' },
          ]}
          value={filters.region}
          onChange={v => set({ region: v as Region })}
        />
      </FilterGroup>

      {/* View by — PMO | Impl. Lead toggle + column multi-select */}
      <FilterGroup label="View by">
        <div style={{ display: 'flex', gap: 4 }}>
          <div style={{
            display: 'flex', border: '1px solid #D1D5DB',
            borderRadius: 6, overflow: 'hidden', background: '#F9FAFB', flexShrink: 0,
          }}>
            {(['impl-lead', 'pmo'] as ViewMode[]).map(mode => (
              <button key={mode}
                onClick={() => set({ viewMode: mode, pmoIds: [], implLeadIds: [] })}
                style={{
                  height: 30, padding: '0 12px',
                  background: filters.viewMode === mode ? '#147B8D' : 'transparent',
                  color: filters.viewMode === mode ? '#fff' : '#6B7280',
                  fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer',
                  transition: 'background 0.15s, color 0.15s', whiteSpace: 'nowrap', fontFamily: 'inherit',
                }}>
                {mode === 'pmo' ? 'PMO' : 'Impl. Lead'}
              </button>
            ))}
          </div>
          <MultiSelectDropdown
            placeholder={columnPlaceholder}
            options={columnOptions}
            selected={columnSelected}
            onToggle={toggleColumn}
            onClear={() => filters.viewMode === 'pmo' ? set({ pmoIds: [] }) : set({ implLeadIds: [] })}
          />
        </div>
      </FilterGroup>

      {/* Health */}
      <FilterGroup label="Health">
        <MultiSelectDropdown
          placeholder="All statuses"
          options={statusOptions}
          selected={filters.statuses}
          onToggle={v => toggleStatus(v as Status)}
          onClear={() => set({ statuses: [] })}
        />
      </FilterGroup>

      {/* View (All | Conversion | Squat/Denovo) */}
      <FilterGroup label="View By">
        <ViewToggle value={filters.view} onChange={v => set({ view: v })} />
      </FilterGroup>

      {/* Deviation: more than N days behind projection (empty = all) */}
      <FilterGroup label="Deviation">
        <DeviationFilterControl
          compare={filters.deviationCompare}
          threshold={filters.deviationLagMinDays}
          onChange={patch => set(patch)}
        />
      </FilterGroup>

      {/* Clear all */}
      {hasActive && (
        <div style={{ paddingBottom: 1 }}>
          <button
            onClick={() => onChange({
              search: '', statuses: [], view: 'all', viewMode: filters.viewMode,
              pmoIds: [], implLeadIds: [],
              fromWeek: defaultFromWeek, toWeek: defaultToWeek,
              region: 'UK',
              deviationCompare: 'more',
              deviationLagMinDays: '',
            })}
            style={{
              height: 30, padding: '0 10px', fontSize: 11, fontWeight: 500,
              background: 'none', border: '1px solid #E5E7EB', borderRadius: 6,
              color: '#6B7280', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
              fontFamily: 'inherit',
            }}
          >
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M2 2l8 8M10 2L2 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}

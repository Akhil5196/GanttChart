import type {
  RawAccount,
  DerivedAccount,
  PhaseSpan,
  PhaseKey,
  Status,
  Week,
  Milestone,
  HealthRule,
} from './types';

// ─── Status ────────────────────────────────────────────────────────────────
export const STATUS_COLORS: Record<Status, string> = {
  'on-track':        '#00772E',
  'minor-issue':     '#3B82F6',
  'needs-attention': '#F59E0B',
  'critical':        '#CD1C18',
};

export const STATUS_LABEL: Record<Status, string> = {
  'on-track':        'On Track',
  'minor-issue':     'Minor Issue',
  'needs-attention': 'Needs Attention',
  'critical':        'Critical',
};

export const STATUS_OPTS: { value: Status; label: string }[] = [
  { value: 'on-track',        label: 'On Track'        },
  { value: 'minor-issue',     label: 'Minor Issue'     },
  { value: 'needs-attention', label: 'Needs Attention' },
  { value: 'critical',        label: 'Critical'        },
];

// ─── Phase metadata ────────────────────────────────────────────────────────
export const PHASE_COLOR: Record<PhaseKey, string> = {
  preKoc:             '#78716C',
  kocDiscovery:       '#EA580C',
  dataCleanupSandbox: '#8EAB12',
  setupTraining:      '#2563EB',
  goLive:             '#1A7A42',
};

export const PHASE_LABEL: Record<PhaseKey, string> = {
  preKoc:             'Pre Kick-Off Call',
  kocDiscovery:       'Kick-Off Call + Discovery',
  dataCleanupSandbox: 'Data Cleanup + Sandbox Signoff',
  setupTraining:      'Interim Live Setup + Training',
  goLive:             'Go-Live',
};

export const PHASE_ORDER: PhaseKey[] = [
  'preKoc', 'kocDiscovery', 'dataCleanupSandbox', 'setupTraining', 'goLive',
];

export const SANDBOX_COLOR = '#7C3AED';

// ─── Milestones (left strip on account row — aligned with rota SEED_MILESTONES) ─
export const MILESTONE_COLORS: Record<string, { bg: string; dot: string; border: string }> = {
  blue:    { bg: 'rgba(54,133,191,0.12)',  dot: '#3685BF', border: 'rgba(54,133,191,0.28)'   },
  indigo:  { bg: 'rgba(79,70,229,0.10)',   dot: '#4338CA', border: 'rgba(79,70,229,0.25)'    },
  violet:  { bg: 'rgba(139,92,246,0.10)',  dot: '#7C3AED', border: 'rgba(139,92,246,0.25)'   },
  pink:    { bg: 'rgba(219,39,119,0.10)',  dot: '#DB2777', border: 'rgba(219,39,119,0.25)'   },
  red:     { bg: 'rgba(220,38,38,0.10)',   dot: '#DC2626', border: 'rgba(220,38,38,0.25)'    },
  orange:  { bg: 'rgba(234,88,12,0.10)',   dot: '#EA580C', border: 'rgba(234,88,12,0.25)'    },
  amber:   { bg: 'rgba(217,119,6,0.10)',   dot: '#D97706', border: 'rgba(217,119,6,0.25)'    },
  yellow:  { bg: 'rgba(202,138,4,0.10)',   dot: '#CA8A04', border: 'rgba(202,138,4,0.25)'    },
  lime:    { bg: 'rgba(101,163,13,0.10)',  dot: '#65A30D', border: 'rgba(101,163,13,0.25)'   },
  green:   { bg: 'rgba(22,163,74,0.10)',   dot: '#16A34A', border: 'rgba(22,163,74,0.25)'    },
  teal:    { bg: 'rgba(13,148,136,0.10)',  dot: '#0D9488', border: 'rgba(13,148,136,0.25)'   },
  slate:   { bg: 'rgba(71,85,105,0.10)',   dot: '#475569', border: 'rgba(71,85,105,0.25)'    },
};

export function getMilestonePalette(color: string): { bg: string; dot: string; border: string } {
  if (MILESTONE_COLORS[color]) return MILESTONE_COLORS[color];
  if (color.startsWith('#') && color.length >= 7) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return {
      dot:    color,
      bg:     `rgba(${r},${g},${b},0.10)`,
      border: `rgba(${r},${g},${b},0.25)`,
    };
  }
  return MILESTONE_COLORS.blue;
}

export const MILESTONES: Milestone[] = [
  { id: 'ms1',  name: 'Pre Kick-Off Call',                  color: '#78716C',  system: true },
  { id: 'ms2',  name: 'Kick-Off Call/Discovery Completed', color: '#EA580C', system: true },
  { id: 'ms3',  name: 'Waiting for Sandbox',                color: '#9333EA',  system: true },
  { id: 'ms4',  name: 'Sandbox Completed',                  color: '#8EAB12',  system: true },
  { id: 'ms5',  name: 'Internal SB Validation Completed',   color: '#D946EF',  system: true },
  { id: 'ms6',  name: 'Sandbox Signoff Received',           color: '#EC4899',  system: true },
  { id: 'ms7',  name: 'Interim Live Completed',             color: '#2563EB',  system: true },
  { id: 'ms8',  name: 'Interim Live Setup Completed',       color: '#0E7490',  system: true },
  { id: 'ms9',  name: 'Interim Live Setup Approved',        color: '#A855F8',  system: true },
  { id: 'ms10', name: 'Go-Live Completed',                  color: '#1A7A42',  system: true },
];

// ─── PMO / Impl. Lead lists ────────────────────────────────────────────────
export const PMO_LIST   = ['Alice Chen', 'Bob Martinez', 'Carol Wu', 'David Okafor'] as const;
export const IMPL_LEADS = ['Sarah Patel', 'James Osei', 'Nina Kovač', 'Ravi Nair'] as const;

// ─── Date helpers ──────────────────────────────────────────────────────────
export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function fmt(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function fmtShort(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export const TODAY: Date = (() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
})();

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Week list for filters: 8 before current week through N after (default N=18 so far go-lives stay in-range). */
function generateWeeks(weeksBefore = 8, weeksAfter = 18): Week[] {
  const dow = TODAY.getDay();
  const diffToMonday = dow === 0 ? -6 : 1 - dow;
  const thisMonday = addDays(TODAY, diffToMonday);
  const weeks: Week[] = [];
  for (let i = -weeksBefore; i <= weeksAfter; i++) {
    const start = addDays(thisMonday, i * 7);
    const end   = addDays(start, 6);
    const startIso = toISODate(start);
    const endIso   = toISODate(end);
    const fmt2 = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    weeks.push({ id: startIso, startDate: startIso, label: `${fmt2(start)} – ${fmt2(end)} ${end.getFullYear()}` });
  }
  return weeks;
}

export const WEEKS: Week[] = generateWeeks(8, 18);
export const DEFAULT_FROM_WEEK: string = WEEKS[0].id;
export const DEFAULT_TO_WEEK:   string = WEEKS[WEEKS.length - 1].id;

// ─── Projection rail (sequential from HubSpot Close Won → Go-Live) ─────────
// Half-open day offsets from TODAY: [s, e) so span days = e − s.
// Standard: Pre Kick-Off [closeWon → KOC), KOC 1wk, Data+Sandbox 3wk, Setup+Training 2wk, Go-Live 1wk ending on go-live date.
// Squat/Denovo: no 3-wk data block — Pre, KOC 1wk, Setup+Training 2wk, Go-Live 1wk.

const PROJ_KOC_DAYS = 7;       // 1 week
const PROJ_DATA_DAYS = 21;    // 3 weeks
const PROJ_SETUP_DAYS = 14;   // 2 weeks
const PROJ_GOLIVE_DAYS = 7;   // 1 week (ends on go-live day)

const STANDARD_PRECEDING = PROJ_KOC_DAYS + PROJ_DATA_DAYS + PROJ_SETUP_DAYS + PROJ_GOLIVE_DAYS; // 49
const SQUAT_PRECEDING    = PROJ_KOC_DAYS + PROJ_SETUP_DAYS + PROJ_GOLIVE_DAYS; // 28

export function buildProjection(glOff: number, isSquat: boolean, closeWonOff: number): PhaseSpan[] {
  const goLiveStart = glOff - PROJ_GOLIVE_DAYS;

  if (isSquat) {
    const kocStart = glOff - SQUAT_PRECEDING; // GL − 27
    const out: PhaseSpan[] = [];
    if (closeWonOff < kocStart) {
      out.push({ key: 'preKoc', s: closeWonOff, e: kocStart });
    }
    out.push(
      { key: 'kocDiscovery', s: kocStart, e: kocStart + PROJ_KOC_DAYS },
      { key: 'setupTraining', s: kocStart + PROJ_KOC_DAYS, e: goLiveStart },
      { key: 'goLive', s: goLiveStart, e: glOff + 1 },
    );
    return out;
  }

  const kocStart = glOff - STANDARD_PRECEDING; // GL − 48
  const out: PhaseSpan[] = [];
  if (closeWonOff < kocStart) {
    out.push({ key: 'preKoc', s: closeWonOff, e: kocStart });
  }
  out.push(
    { key: 'kocDiscovery', s: kocStart, e: kocStart + PROJ_KOC_DAYS },
    { key: 'dataCleanupSandbox', s: kocStart + PROJ_KOC_DAYS, e: kocStart + PROJ_KOC_DAYS + PROJ_DATA_DAYS },
    { key: 'setupTraining', s: kocStart + PROJ_KOC_DAYS + PROJ_DATA_DAYS, e: goLiveStart },
    { key: 'goLive', s: goLiveStart, e: glOff + 1 },
  );
  return out;
}

export function buildActual(projection: PhaseSpan[], lag: number): PhaseSpan[] {
  return projection
    .map(p => ({ key: p.key, s: p.s + lag, e: Math.min(p.e + lag, 0) }))
    .filter(p => p.s < 0 && p.e > p.s);
}

/**
 * Signed offset of the actual rail vs the projection rail (same basis as `daysBehind` / `buildActual` lag).
 * Negative = actual timeline is lagging vs projection; positive = ahead of projection; 0 = aligned.
 */
export function scheduleDeviationDays(acc: DerivedAccount): number {
  return -acc.daysBehind;
}

export function formatScheduleDeviationDays(signedDays: number): string {
  if (signedDays === 0) return '0 D';
  const n = Math.abs(signedDays);
  return signedDays > 0 ? `+${n} d` : `−${n} D`;
}

export function scheduleDeviationColor(signedDays: number): string {
  if (signedDays < 0) return '#B91C1C';
  if (signedDays > 0) return '#047857';
  return '#6B7280';
}

export function deriveStatus(lag: number): Status {
  if (lag <= 3)  return 'on-track';
  if (lag <= 7)  return 'minor-issue';
  if (lag <= 14) return 'needs-attention';
  return 'critical';
}

/** Health rules for the conversion detail panel (read-only; derived from dates and status). */
export function getHealthRulesForConversion(acc: DerivedAccount): HealthRule[] {
  const rules: HealthRule[] = [];
  const daysToGl = Math.ceil((acc.goLiveDate.getTime() - TODAY.getTime()) / 86_400_000);

  if (!acc.confirmed && daysToGl >= 0 && daysToGl <= 14) {
    rules.push({
      id: 'tentative-near-gl',
      name: 'Go-Live Not Confirmed',
      description:
        'Go-live is still tentative with the target date approaching. Confirm with stakeholders once dates are locked so downstream planning stays accurate.',
      severity: daysToGl <= 7 ? 'critical' : 'needs-attention',
    });
  }

  if (!acc.isSquat && acc.sandboxDate === null && daysToGl >= 0 && daysToGl <= 28) {
    rules.push({
      id: 'sandbox-missing',
      name: 'Sandbox Delivery Not Scheduled',
      description:
        'No planned sandbox delivery date is set. For standard conversions, aligning sandbox sign-off with go-live reduces risk of late-stage surprises.',
      severity: daysToGl <= 14 ? 'needs-attention' : 'minor-issue',
    });
  }

  if (acc.daysBehind > 14) {
    rules.push({
      id: 'behind-plan',
      name: 'Schedule Behind Plan',
      description: `${acc.daysBehind} days behind the projected timeline. Review blockers with PMO and implementation lead and update the project plan.`,
      severity: 'critical',
    });
  } else if (acc.daysBehind > 7) {
    rules.push({
      id: 'behind-moderate',
      name: 'Schedule Slippage',
      description: `${acc.daysBehind} days behind plan. Track open tasks and dependencies to recover buffer before go-live.`,
      severity: 'needs-attention',
    });
  } else if (acc.daysBehind > 3) {
    rules.push({
      id: 'behind-minor',
      name: 'Minor Timeline Variance',
      description: `${acc.daysBehind} days behind plan. Within tolerance for a minor issue — continue monitoring week on week.`,
      severity: 'minor-issue',
    });
  }

  const sevOrder: Record<Status, number> = {
    critical: 4, 'needs-attention': 3, 'minor-issue': 2, 'on-track': 1,
  };
  rules.sort((a, b) => sevOrder[b.severity] - sevOrder[a.severity]);
  return rules;
}

// ─── Raw account data ──────────────────────────────────────────────────────
const RAW: RawAccount[] = [
  { id: 'a1',  name: 'Mercy Health System',    conversion: 'Conv 1',  pms: 'Dentally',  isSquat: false, goLiveOffset: 56,  closeWonOffset: -25, sandboxOffset: 28,   daysBehind: 0,  pmo: 'Alice Chen',   implLead: 'Sarah Patel',  confirmed: true,  locations: ['Main Campus [NHS]', 'East Wing'], region: 'UK', milestoneId: 'ms4' },
  { id: 'a2',  name: "St. Joseph's Medical",   conversion: 'Conv 2',  pms: 'SoeasyPro', isSquat: false, goLiveOffset: 42,  closeWonOffset: -18, sandboxOffset: 14,   daysBehind: 5,  pmo: 'Bob Martinez', implLead: 'James Osei',   confirmed: false, locations: ['Downtown Clinic'], region: 'US', milestoneId: 'ms6' },
  { id: 'a3',  name: 'Valley Care Network',    conversion: 'Conv 1',  pms: 'Dentally',  isSquat: false, goLiveOffset: 28,  closeWonOffset: -35, sandboxOffset: null, daysBehind: 12, pmo: 'Carol Wu',     implLead: 'Nina Kovač',   confirmed: false, locations: ['Leeds Practice [NHS]'], region: 'UK', milestoneId: 'ms3' },
  { id: 'a4',  name: 'Sunrise Hospital',       conversion: 'Conv 3',  pms: 'iDentalSoft', isSquat: false, goLiveOffset: 84, closeWonOffset: 5,  sandboxOffset: 56,  daysBehind: 0,  pmo: 'David Okafor', implLead: 'Ravi Nair',    confirmed: true,  locations: ['North Campus'], region: 'US', milestoneId: 'ms10' },
  { id: 'a5',  name: 'Pacific Medical Center', conversion: 'Conv 1',  pms: 'Dentally',  isSquat: false, goLiveOffset: 70,  closeWonOffset: -10, sandboxOffset: 42,   daysBehind: 6,  pmo: 'Alice Chen',   implLead: 'James Osei',   confirmed: true,  locations: ['Site A [NHS]'], region: 'UK', milestoneId: 'ms5' },
  { id: 'a6',  name: 'Mountain View Health',   conversion: 'Conv 2',  pms: 'SoeasyPro', isSquat: false, goLiveOffset: 98,  closeWonOffset: 12, sandboxOffset: 70,   daysBehind: 0,  pmo: 'Bob Martinez', implLead: 'Nina Kovač',   confirmed: false, region: 'AU', milestoneId: 'ms8' },
  { id: 'a7',  name: 'Coastal Partners',       conversion: 'Conv 1',                    isSquat: true,  goLiveOffset: 14,  closeWonOffset: -20, sandboxOffset: null, daysBehind: 18, pmo: 'Carol Wu',     implLead: 'Sarah Patel',  confirmed: false, locations: ['Brighton [NHS]'], region: 'UK', milestoneId: 'ms2' },
  { id: 'a8',  name: 'Summit Healthcare',      conversion: 'Conv 4',  pms: 'iDentalSoft', isSquat: false, goLiveOffset: 112, closeWonOffset: 20, sandboxOffset: 84, daysBehind: 0,  pmo: 'David Okafor', implLead: 'Ravi Nair',    confirmed: true, region: 'AU', milestoneId: 'ms7' },
  { id: 'a9',  name: 'Harbor Medical Group',   conversion: 'Conv 2',                    isSquat: true,  goLiveOffset: 49,  closeWonOffset: -5, sandboxOffset: null, daysBehind: 8,  pmo: 'Alice Chen',   implLead: 'James Osei',   confirmed: true,  locations: ['Harbor NHS Trust [NHS]'], region: 'US', milestoneId: 'ms1' },
  { id: 'a10', name: 'Riverside Clinic',       conversion: 'Conv 1',  pms: 'Dentally',  isSquat: false, goLiveOffset: 63,  closeWonOffset: -12, sandboxOffset: 35,   daysBehind: 2,  pmo: 'Bob Martinez', implLead: 'Sarah Patel',  confirmed: false, region: 'UK', milestoneId: 'ms9' },
  // Ahead of projection: negative daysBehind shifts actual rail left vs hatched projection.
  { id: 'a11', name: 'Cedar Brook Family Dental', conversion: 'Conv 2', pms: 'Dentally',  isSquat: false, goLiveOffset: 55,  closeWonOffset: -24, sandboxOffset: 26,   daysBehind: -5, pmo: 'Carol Wu',     implLead: 'Nina Kovač',   confirmed: true,  locations: ['Cedar Brook [NHS]'], region: 'UK', milestoneId: 'ms6' },
  { id: 'a12', name: 'Maple Grove Oral Health',   conversion: 'Conv 1', pms: 'SoeasyPro', isSquat: false, goLiveOffset: 48,  closeWonOffset: -30, sandboxOffset: 18,   daysBehind: -4, pmo: 'Alice Chen',   implLead: 'James Osei',   confirmed: true,  locations: ['Maple Grove [NHS]'], region: 'UK', milestoneId: 'ms5' },
  { id: 'a13', name: 'Bayview Denovo',            conversion: 'Conv 3',                    isSquat: true,  goLiveOffset: 35,  closeWonOffset: -18, sandboxOffset: null, daysBehind: -6, pmo: 'David Okafor', implLead: 'Ravi Nair',    confirmed: false, locations: ['Bayview Clinic [NHS]'], region: 'UK', milestoneId: 'ms4' },
  // Large positive lag: projection at “today” sits in Setup+Training while actual (shifted right) is still in Kick-Off + Discovery in progress.
  { id: 'a14', name: 'Willowmere Dental Practice', conversion: 'Conv 2', pms: 'Dentally',  isSquat: false, goLiveOffset: 18,  closeWonOffset: -38, sandboxOffset: 8,    daysBehind: 25, pmo: 'Alice Chen',   implLead: 'Sarah Patel',  confirmed: false, locations: ['Willowmere [NHS]'], region: 'UK', milestoneId: 'ms2' },
  { id: 'a15', name: 'Hearthstone Dental', conversion: 'Conv 1', pms: 'Dentally',  isSquat: false, goLiveOffset: 19,  closeWonOffset: -40, sandboxOffset: 9,    daysBehind: 26, pmo: 'Carol Wu', implLead: 'James Osei',   confirmed: false, locations: ['Hearthstone Clinic'], region: 'UK', milestoneId: 'ms2' },
  { id: 'a16', name: 'Greenfield NHS Smiles',      conversion: 'Conv 3', pms: 'SoeasyPro', isSquat: false, goLiveOffset: 20,  closeWonOffset: -36, sandboxOffset: 10,   daysBehind: 28, pmo: 'Carol Wu',     implLead: 'Nina Kovač',   confirmed: true,  locations: ['Greenfield [NHS]'], region: 'UK', milestoneId: 'ms2' },
  // a17 — stalled vs plan: projection “today” = Setup+Training, actual still Kick-Off + Discovery (positive daysBehind).
  { id: 'a17', name: 'Larkspur Community Dental',  conversion: 'Conv 2', pms: 'Dentally',  isSquat: false, goLiveOffset: 17,  closeWonOffset: -37, sandboxOffset: 7,    daysBehind: 27, pmo: 'David Okafor', implLead: 'Ravi Nair',    confirmed: false, locations: ['Larkspur [NHS]'], region: 'UK', milestoneId: 'ms2' },
  // a18 — fast delivery: projection still Data+Sandbox at “today”, actual already in Setup+Training (negative daysBehind).
  { id: 'a18', name: 'Silverline Ortho & Dental',  conversion: 'Conv 1', pms: 'Dentally',  isSquat: false, goLiveOffset: 25,  closeWonOffset: -35, sandboxOffset: 12,   daysBehind: -14, pmo: 'Alice Chen',   implLead: 'Sarah Patel',  confirmed: true,  locations: ['Silverline [NHS]'], region: 'UK', milestoneId: 'ms7' },
  // Projection Pre K-O begins +14d (2w ahead); actual Pre K-O already underway (today / few days ago) via negative daysBehind.
  { id: 'a19', name: 'Thornbury Bridge Dental',    conversion: 'Conv 2', pms: 'Dentally',  isSquat: false, goLiveOffset: 72,  closeWonOffset: 14,  sandboxOffset: 44,   daysBehind: -17, pmo: 'Bob Martinez', implLead: 'James Osei',   confirmed: false, locations: ['Thornbury [NHS]'], region: 'UK', milestoneId: 'ms1' },
  { id: 'a20', name: 'Elm Court Dental Practice',  conversion: 'Conv 1', pms: 'SoeasyPro', isSquat: false, goLiveOffset: 78,  closeWonOffset: 14,  sandboxOffset: 50,   daysBehind: -15, pmo: 'Carol Wu',     implLead: 'Nina Kovač',   confirmed: true,  locations: ['Elm Court [NHS]'], region: 'UK', milestoneId: 'ms1' },
];

// ─── Derived accounts ─────────────────────────────────────────────────────
export const ACCOUNTS: DerivedAccount[] = RAW.map(a => {
  const projection = buildProjection(a.goLiveOffset, a.isSquat, a.closeWonOffset);
  return {
    ...a,
    status:      deriveStatus(a.daysBehind),
    projection,
    actual:      buildActual(projection, a.daysBehind),
    goLiveDate:  addDays(TODAY, a.goLiveOffset),
    sandboxDate: a.sandboxOffset !== null ? addDays(TODAY, a.sandboxOffset) : null,
  };
});

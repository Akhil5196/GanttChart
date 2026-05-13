export type Status     = 'on-track' | 'minor-issue' | 'needs-attention' | 'critical';
export type ViewMode   = 'pmo' | 'impl-lead';
export type ViewFilter = 'all' | 'standard' | 'squat';
export type Region     = 'AU' | 'US' | 'UK';

export interface HealthRule {
  id:          string;
  name:        string;
  description: string;
  severity:    Status;
}

export interface RawAccount {
  id:            string;
  name:          string;
  conversion?:   string;
  pms?:          string;
  isSquat:       boolean;
  goLiveOffset:  number;
  /** Days from TODAY to Close Won (HubSpot); projection Pre Kick-Off starts here. */
  closeWonOffset: number;
  sandboxOffset: number | null;
  /** Internal lag (days): positive shifts the actual rail later vs projection; negative = ahead. */
  daysBehind:    number;
  pmo:           string;
  implLead:      string;
  /** Go-live confirmation — matches rota `confirmed` */
  confirmed:     boolean;
  /** Location names; suffix ` [NHS]` marks NHS sites (rota pattern). */
  locations?:    string[];
  region:        Region;
  /** Current milestone (HubSpot); left strip colour comes from this, not from phase rails. */
  milestoneId:   string;
}

export interface PhaseSpan {
  key: PhaseKey;
  s:   number;
  e:   number;
}

export type PhaseKey =
  | 'preKoc'
  | 'kocDiscovery'
  | 'dataCleanupSandbox'
  | 'setupTraining'
  | 'goLive';

/** HubSpot / system milestone — drives the left colour bar on the account row (not the same as timeline phases). */
export interface Milestone {
  id:     string;
  name:   string;
  /** Named preset (e.g. `blue`) or hex `#RRGGBB` — passed to getMilestonePalette */
  color:  string;
  system?: boolean;
}

export interface DerivedAccount extends RawAccount {
  status:      Status;
  projection:  PhaseSpan[];
  actual:      PhaseSpan[];
  goLiveDate:  Date;
  sandboxDate: Date | null;
}

export interface TooltipState {
  content: string;
  x:       number;
  y:       number;
  visible: boolean;
}

export interface Week {
  id:        string; // ISO date of Monday (e.g. '2026-04-27')
  startDate: string; // same as id
  label:     string; // display label e.g. 'Apr 27 – May 3'
}

export type DeviationLagPreset = '' | '5' | '10' | '15' | '20' | '25' | '30';

/** Lag vs projection: strictly greater or strictly fewer `daysBehind` than the chosen threshold. */
export type DeviationCompare = 'more' | 'less';

export interface GanttFilters {
  search:      string;
  statuses:    Status[];
  view:        ViewFilter;
  viewMode:    ViewMode;
  pmoIds:      string[];
  implLeadIds: string[];
  fromWeek:    string; // ISO date of Monday of start week
  toWeek:      string; // ISO date of Monday of end week
  region:      Region;
  /** `more` = strictly more than N days behind; `less` = from 1 day behind up to (excluding) N (default `more`). */
  deviationCompare: DeviationCompare;
  /**
   * Lag threshold in days (`daysBehind` vs projection). `''` = no deviation filter (unselected).
   * Presets `5`…`30`.
   */
  deviationLagMinDays: DeviationLagPreset;
}

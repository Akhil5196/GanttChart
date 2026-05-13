import React, { useState, useMemo } from 'react';
import { TopBar }      from './components/TopBar';
import { Sidebar }     from './components/Sidebar';
import { Header }      from './components/Header';
import { FilterBar }   from './components/FilterBar';
import { GanttChart }  from './components/GanttChart';
import { LegendPanel } from './components/LegendPanel';
import { ConversionDetailModal } from './components/ConversionDetailModal';
import { ACCOUNTS, WEEKS, DEFAULT_FROM_WEEK, DEFAULT_TO_WEEK } from './data';
import type { GanttFilters, DerivedAccount } from './types';

const DEFAULT_FILTERS: GanttFilters = {
  search:      '',
  statuses:    [],
  view:        'all',
  viewMode:    'impl-lead',
  pmoIds:      [],
  implLeadIds: [],
  fromWeek:    DEFAULT_FROM_WEEK,
  toWeek:      DEFAULT_TO_WEEK,
  region:      'UK',
  deviationCompare: 'more',
  deviationLagMinDays: '',
};

export default function App() {
  const [activeNav,   setActiveNav]   = useState('rota');   // Work Bench = Gantt Chart
  const [legendOpen,  setLegendOpen]  = useState(false);
  const [detailAccount, setDetailAccount] = useState<DerivedAccount | null>(null);
  const [filters,     setFilters]     = useState<GanttFilters>(DEFAULT_FILTERS);

  const filteredAccounts = useMemo(() => {
    let list = [...ACCOUNTS];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(a => a.name.toLowerCase().includes(q));
    }
    if (filters.statuses.length > 0) {
      list = list.filter(a => filters.statuses.includes(a.status));
    }
    if (filters.view === 'standard') {
      list = list.filter(a => !a.isSquat);
    } else if (filters.view === 'squat') {
      list = list.filter(a => a.isSquat);
    }
    if (filters.pmoIds.length > 0) {
      list = list.filter(a => filters.pmoIds.includes(a.pmo));
    }
    if (filters.implLeadIds.length > 0) {
      list = list.filter(a => filters.implLeadIds.includes(a.implLead));
    }
    list = list.filter(a => a.region === filters.region);

    // Week range filter: keep accounts whose go-live date falls within selected weeks
    const fromDate = new Date(filters.fromWeek + 'T00:00:00');
    const toDate   = new Date(filters.toWeek   + 'T00:00:00');
    toDate.setDate(toDate.getDate() + 6); // include full last week (Sun)
    list = list.filter(a => a.goLiveDate >= fromDate && a.goLiveDate <= toDate);

    const preset = filters.deviationLagMinDays;
    if (preset !== '') {
      const threshold = Number(preset);
      if (!Number.isNaN(threshold)) {
        if (filters.deviationCompare === 'more') {
          list = list.filter(a => a.daysBehind > threshold);
        } else {
          // At least 1 day behind projection; exclude on-track (0) and ahead (negative).
          list = list.filter(a => a.daysBehind >= 1 && a.daysBehind < threshold);
        }
      }
    }

    // Earliest go-live first
    list.sort((a, b) => a.goLiveDate.getTime() - b.goLiveDate.getTime());
    return list;
  }, [filters]);

  const behindProjectionInView = useMemo(
    () => filteredAccounts.filter(a => a.daysBehind > 0).length,
    [filteredAccounts],
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <TopBar />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar activeId={activeNav} onNavigate={setActiveNav} />
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {activeNav === 'rota' ? (
            <>
              <Header
                filtered={filteredAccounts.length}
                behindProjectionCount={behindProjectionInView}
                onOpenLegend={() => setLegendOpen(true)}
              />
              <FilterBar
                filters={filters}
                onChange={setFilters}
                weeks={WEEKS}
                defaultFromWeek={DEFAULT_FROM_WEEK}
                defaultToWeek={DEFAULT_TO_WEEK}
              />
              <GanttChart
                accounts={filteredAccounts}
                onSelectAccount={a => setDetailAccount(a)}
              />
              {legendOpen && <LegendPanel onClose={() => setLegendOpen(false)} />}
              {detailAccount && (
                <ConversionDetailModal
                  account={detailAccount}
                  onClose={() => setDetailAccount(null)}
                />
              )}
            </>
          ) : (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 8, color: '#9CA3AF',
            }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.5" opacity={0.4}>
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <path d="M8 12h8M12 8v8" strokeLinecap="round" />
              </svg>
              <p style={{ fontSize: 14, fontWeight: 500 }}>
                Select <strong style={{ color: '#374151' }}>Work Bench</strong> from the sidebar
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

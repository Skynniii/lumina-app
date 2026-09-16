import { useState, useMemo } from 'react';
import { useTimeTracker } from '../../hooks/useTimeTracker';
import { TopBar } from '../ui/TopBar';
import { TrackerSummary } from './TrackerSummary';
import { TrackerChart } from './TrackerChart';
import { ActivityStatCard } from './ActivityStatCard';
import { TrackerSessionList } from './TrackerSessionList';
import { type Period, PERIOD_LABELS, filterSessionsByPeriod, getActivityStats, getDailyTotals } from './trackerUtils';

interface Props {
  onMenuClick: () => void;
  onOpenAccount: () => void;
}

export function Tracker({ onMenuClick, onOpenAccount }: Props) {
  const tracker = useTimeTracker();
  const [period, setPeriod] = useState<Period>('today');

  const { activities, sessions, running, elapsed, isTicking, draft } = tracker;

  const filteredSessions = useMemo(() => filterSessionsByPeriod(sessions, period), [sessions, period]);
  const activityStats = useMemo(() => getActivityStats(filteredSessions, activities), [filteredSessions, activities]);
  const dailyTotals = useMemo(() => getDailyTotals(sessions), [sessions]);

  const totalSeconds = filteredSessions.reduce((sum, s) => sum + s.duration, 0);
  const sessionCount = filteredSessions.length;
  const avgSeconds = sessionCount > 0 ? Math.round(totalSeconds / sessionCount) : 0;

  const liveElapsed = running && isTicking ? elapsed : 0;
  const liveActivityId = running ? draft.activityId : undefined;

  const recentSessions = useMemo(
    () => [...filteredSessions].sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime()).slice(0, 10),
    [filteredSessions],
  );

  const hasData = totalSeconds > 0 || liveElapsed > 0;

  return (
    <section className="absolute top-0 left-0 w-full h-full flex flex-col bg-[#f7f6f9]">
      <div className="px-5 pt-5 pb-2 shrink-0 z-50 bg-[#f7f6f9]">
        <TopBar title="Tracker" onMenuClick={onMenuClick} onOpenAccount={onOpenAccount} />
      </div>

      {/* Pestañas de período */}
      <div className="px-5 pb-3 shrink-0">
        <div className="flex gap-2">
          {(['today', 'week', 'month'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-full text-[14px] font-medium border-none cursor-pointer transition-colors ${
                period === p ? 'bg-[#7f70ff] text-white' : 'bg-white text-[#666] shadow-[4px_4px_10px_#e6e6e6,-4px_-4px_10px_#ffffff]'
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido scrollable */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-[110px]">
        {!hasData ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-16 h-16 rounded-2xl bg-[#f0edff] flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7f70ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18" /><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
              </svg>
            </div>
            <p className="text-[16px] font-semibold text-[#555] m-0">Sin registros en este período</p>
            <p className="text-[14px] text-[#999] m-0">Inicia un contador para rastrear tu tiempo</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5 mt-2">
            <TrackerSummary
              totalSeconds={totalSeconds}
              sessionCount={sessionCount}
              avgSeconds={avgSeconds}
              activityStats={activityStats}
              liveElapsed={liveElapsed}
              isRunning={isTicking}
              liveActivityId={liveActivityId}
            />

            {period === 'week' && <TrackerChart dailyTotals={dailyTotals} />}

            {activityStats.length > 0 && (
              <>
                <div className="flex items-center gap-3 pt-1">
                  <div className="flex-1 h-px bg-[#eceaf3]" />
                  <span className="text-[12px] font-bold uppercase tracking-wider text-[#a0a0a0]">Actividades</span>
                  <div className="flex-1 h-px bg-[#eceaf3]" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {activityStats.map((stat) => (
                    <ActivityStatCard key={stat.activity.id} stat={stat} />
                  ))}
                </div>
              </>
            )}

            {recentSessions.length > 0 && (
              <>
                <div className="flex items-center gap-3 pt-1">
                  <div className="flex-1 h-px bg-[#eceaf3]" />
                  <span className="text-[12px] font-bold uppercase tracking-wider text-[#a0a0a0]">Sesiones recientes</span>
                  <div className="flex-1 h-px bg-[#eceaf3]" />
                </div>
                <TrackerSessionList sessions={recentSessions} activities={activities} showDate={period !== 'today'} />
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

import { useState, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useTimeTracker } from '../../hooks/useTimeTracker';
import { useFirestoreCollection } from '../../hooks/useFirestoreCollection';
import { TopBar } from '../ui/TopBar';
import { TrackerSummary } from './TrackerSummary';
import { TrackerChart } from './TrackerChart';
import { ActivityStatCard } from './ActivityStatCard';
import { TrackerSessionList } from './TrackerSessionList';
import { TrackerTasks } from './TrackerTasks';
import { ActivityDetailModal } from './ActivityDetailModal';
import {
  type Period, PERIOD_LABELS, filterSessionsByPeriod, getActivityStats, getDailyTotals,
  getStreak, getPreviousPeriodSeconds, getBestDay, getCompletedTasks,
} from './trackerUtils';
import type { Task } from '../../types';

interface Props {
  onMenuClick: () => void;
  onOpenAccount: () => void;
}

export function Tracker({ onMenuClick, onOpenAccount }: Props) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const tracker = useTimeTracker();
  const [period, setPeriod] = useState<Period>('today');
  const [selectedActivityIdx, setSelectedActivityIdx] = useState<number | null>(null);

  const tasksColl = useFirestoreCollection<Task>(uid, 'tasks');
  const tasks = tasksColl.items;

  const { activities, sessions, running, elapsed, isTicking, draft } = tracker;

  const filteredSessions = useMemo(() => filterSessionsByPeriod(sessions, period), [sessions, period]);
  const activityStats = useMemo(() => getActivityStats(filteredSessions, activities, tasks), [filteredSessions, activities, tasks]);
  const dailyTotals = useMemo(() => getDailyTotals(sessions), [sessions]);

  const totalSeconds = filteredSessions.reduce((sum, s) => sum + s.duration, 0);
  const sessionCount = filteredSessions.length;
  const avgSeconds = sessionCount > 0 ? Math.round(totalSeconds / sessionCount) : 0;
  const previousSeconds = useMemo(() => getPreviousPeriodSeconds(sessions, period), [sessions, period]);

  const streak = useMemo(() => getStreak(sessions), [sessions]);
  const bestDay = useMemo(() => getBestDay(sessions, period), [sessions, period]);
  const completedTasks = useMemo(() => getCompletedTasks(tasks, period), [tasks, period]);

  const liveElapsed = running && isTicking ? elapsed : 0;
  const liveActivityId = running ? draft.activityId : undefined;

  const recentSessions = useMemo(
    () => [...filteredSessions].sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime()).slice(0, 10),
    [filteredSessions],
  );

  const hasData = totalSeconds > 0 || liveElapsed > 0 || completedTasks.length > 0;
  const selectedActivity = selectedActivityIdx != null ? activityStats[selectedActivityIdx] : null;

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
              previousSeconds={previousSeconds}
            />

            {/* Stats row: racha, mejor día, tareas */}
            <div className="grid grid-cols-3 gap-3">
              {streak > 0 && (
                <div className="bg-white p-3 rounded-2xl shadow-[4px_4px_10px_#e6e6e6,-4px_-4px_10px_#ffffff] flex flex-col gap-1 items-center text-center">
                  <span className="text-[16px]">🔥</span>
                  <p className="text-[15px] font-bold text-[#333] tabular-nums leading-none m-0">{streak}</p>
                  <p className="text-[10px] font-medium text-[#999] m-0">{streak === 1 ? 'día' : 'días'}</p>
                </div>
              )}
              {bestDay && (
                <div className="bg-white p-3 rounded-2xl shadow-[4px_4px_10px_#e6e6e6,-4px_-4px_10px_#ffffff] flex flex-col gap-1 items-center text-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7f70ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6" /><path d="M12 14v8" /><path d="M9 18l3 3 3-3" /></svg>
                  <p className="text-[13px] font-bold text-[#333] leading-none m-0 capitalize">{bestDay.label}</p>
                  <p className="text-[10px] font-medium text-[#999] m-0">Mejor día</p>
                </div>
              )}
              {completedTasks.length > 0 && (
                <div className="bg-white p-3 rounded-2xl shadow-[4px_4px_10px_#e6e6e6,-4px_-4px_10px_#ffffff] flex flex-col gap-1 items-center text-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34c77b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  <p className="text-[15px] font-bold text-[#333] tabular-nums leading-none m-0">{completedTasks.length}</p>
                  <p className="text-[10px] font-medium text-[#999] m-0">Tareas ✓</p>
                </div>
              )}
            </div>

            {period === 'week' && <TrackerChart dailyTotals={dailyTotals} />}

            {activityStats.length > 0 && (
              <>
                <div className="flex items-center gap-3 pt-1">
                  <div className="flex-1 h-px bg-[#eceaf3]" />
                  <span className="text-[12px] font-bold uppercase tracking-wider text-[#a0a0a0]">Actividades</span>
                  <div className="flex-1 h-px bg-[#eceaf3]" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {activityStats.map((stat, idx) => (
                    <ActivityStatCard key={stat.activity.id} stat={stat} onClick={() => setSelectedActivityIdx(idx)} />
                  ))}
                </div>
              </>
            )}

            {completedTasks.length > 0 && (
              <>
                <div className="flex items-center gap-3 pt-1">
                  <div className="flex-1 h-px bg-[#eceaf3]" />
                  <span className="text-[12px] font-bold uppercase tracking-wider text-[#a0a0a0]">Tareas completadas</span>
                  <div className="flex-1 h-px bg-[#eceaf3]" />
                </div>
                <TrackerTasks tasks={completedTasks} activities={activities} />
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

      <AnimatePresence>
        {selectedActivity && (
          <ActivityDetailModal
            key={selectedActivity.activity.id}
            activity={selectedActivity.activity}
            stat={selectedActivity}
            sessions={filteredSessions}
            tasks={tasks}
            onBack={() => setSelectedActivityIdx(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

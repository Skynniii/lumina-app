import { useState, useMemo, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { deleteField } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useTimeTracker } from '../../hooks/useTimeTracker';
import { useFirestoreCollection } from '../../hooks/useFirestoreCollection';
import { TopBar } from '../ui/TopBar';
import { WeeklyCircularChart } from './WeeklyCircularChart';
import { ActivityStatCard } from './ActivityStatCard';
import { ActivityDetailModal } from './ActivityDetailModal';
import { NewActivityModal } from './NewActivityModal';
import {
  getActivityStats, getWeekRange, getWeekLabel, filterSessionsByDateRange, type ActivityStats,
} from './trackerUtils';
import type { Activity, Task } from '../../types';

interface Props {
  onMenuClick: () => void;
  onOpenAccount: () => void;
}

const GHOST_ACTIVITY: Activity = { id: '__no_activity__', name: 'Sin actividad', color: '#c8c8d0' };

export function Tracker({ onMenuClick, onOpenAccount }: Props) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const tracker = useTimeTracker();
  const [selectedActivityIdx, setSelectedActivityIdx] = useState<number | null>(null);
  const [showNewActivity, setShowNewActivity] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);

  const tasksColl = useFirestoreCollection<Task>(uid, 'tasks');
  const tasks = tasksColl.items;

  const { activities, sessions } = tracker;

  // Escuchar botón + de la barra de navegación
  useEffect(() => {
    const handler = () => setShowNewActivity(true);
    window.addEventListener('app-add', handler);
    return () => window.removeEventListener('app-add', handler);
  }, []);

  // Semana seleccionable
  const weekRange = useMemo(() => getWeekRange(weekOffset), [weekOffset]);
  const weekLabel = useMemo(() => getWeekLabel(weekOffset), [weekOffset]);
  const weekSessions = useMemo(() => filterSessionsByDateRange(sessions, weekRange.start, weekRange.end), [sessions, weekRange]);
  const activityStats = useMemo(() => getActivityStats(weekSessions, activities, tasks), [weekSessions, activities, tasks]);

  // Detectar sesiones sin actividad válida
  const noActivityStats = useMemo(() => {
    const noActSessions = weekSessions.filter(
      (s) => !s.activityId || !activities.find((a) => a.id === s.activityId),
    );
    if (noActSessions.length === 0) return null;
    const totalSeconds = noActSessions.reduce((sum, s) => sum + s.duration, 0);
    const totalAll = weekSessions.reduce((sum, s) => sum + s.duration, 0);
    const stat: ActivityStats = {
      activity: GHOST_ACTIVITY,
      totalSeconds,
      sessionCount: noActSessions.length,
      avgSeconds: Math.round(totalSeconds / noActSessions.length),
      percentage: totalAll > 0 ? (totalSeconds / totalAll) * 100 : 0,
      taskCount: 0,
      completedTaskCount: 0,
    };
    return stat;
  }, [weekSessions, activities]);

  // Combinar stats reales con la actividad fantasma
  const allStats = useMemo(() => {
    if (noActivityStats) return [...activityStats, noActivityStats];
    return activityStats;
  }, [activityStats, noActivityStats]);

  const totalSeconds = weekSessions.reduce((sum, s) => sum + s.duration, 0);
  const hasData = totalSeconds > 0;
  const selectedActivity = selectedActivityIdx != null ? allStats[selectedActivityIdx] : null;
  const isGhost = selectedActivity?.activity.id === GHOST_ACTIVITY.id;

  const handleToggleTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const completing = !task.completed;
    tasksColl.update(taskId, {
      completed: completing,
      completedAt: completing ? new Date().toISOString() : deleteField(),
    } as Partial<Task>);
  };

  return (
    <section className="absolute top-0 left-0 w-full h-full flex flex-col bg-[#f7f6f9]">
      <div className="px-5 pt-5 pb-2 shrink-0 z-50 bg-[#f7f6f9]">
        <TopBar title="Tracker" onMenuClick={onMenuClick} onOpenAccount={onOpenAccount} />
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
            <p className="text-[16px] font-semibold text-[#555] m-0">Sin registros esta semana</p>
            <p className="text-[14px] text-[#999] m-0">Inicia un contador para rastrear tu tiempo</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5 mt-2">
            {/* Selector de rango semanal */}
            <div className="flex items-center justify-center gap-4 py-1">
              <button
                onClick={() => setWeekOffset((o) => o - 1)}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 active:scale-90 border-none bg-transparent cursor-pointer transition-transform"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              <span className="text-[14px] font-semibold text-[#333] tabular-nums min-w-[120px] text-center">{weekLabel}</span>
              <button
                onClick={() => setWeekOffset((o) => Math.min(0, o + 1))}
                disabled={weekOffset >= 0}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 active:scale-90 border-none bg-transparent cursor-pointer transition-transform disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
              </button>
            </div>

            {/* Gráfico circular del tiempo semanal */}
            <WeeklyCircularChart activityStats={allStats} totalSeconds={totalSeconds} subtitle={weekOffset === 0 ? 'esta semana' : weekOffset === -1 ? 'semana pasada' : weekLabel} />

            {/* Separador */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[#eceaf3]" />
              <span className="text-[12px] font-bold uppercase tracking-wider text-[#a0a0a0]">Actividades</span>
              <div className="flex-1 h-px bg-[#eceaf3]" />
            </div>

            {/* Barras de actividades */}
            <div className="flex flex-col gap-3">
              {allStats.map((stat, idx) => (
                <ActivityStatCard
                  key={stat.activity.id}
                  stat={stat}
                  onClick={stat.activity.id === GHOST_ACTIVITY.id ? undefined : () => setSelectedActivityIdx(idx)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedActivity && !isGhost && (
          <ActivityDetailModal
            key={selectedActivity.activity.id}
            activity={selectedActivity.activity}
            stat={selectedActivity}
            sessions={sessions}
            tasks={tasks}
            onBack={() => setSelectedActivityIdx(null)}
            onUpdateActivity={tracker.updateActivity}
            onToggleTask={handleToggleTask}
          />
        )}
      </AnimatePresence>

      <NewActivityModal
        isOpen={showNewActivity}
        onClose={() => setShowNewActivity(false)}
        onCreate={(name, color) => tracker.addActivity(name, color)}
      />
    </section>
  );
}

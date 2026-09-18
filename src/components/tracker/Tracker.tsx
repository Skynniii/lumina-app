import { useState, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useTimeTracker } from '../../hooks/useTimeTracker';
import { useFirestoreCollection } from '../../hooks/useFirestoreCollection';
import { TopBar } from '../ui/TopBar';
import { WeeklyCircularChart } from './WeeklyCircularChart';
import { ActivityStatCard } from './ActivityStatCard';
import { ActivityDetailModal } from './ActivityDetailModal';
import {
  filterSessionsByPeriod, getActivityStats,
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
  const [selectedActivityIdx, setSelectedActivityIdx] = useState<number | null>(null);

  const tasksColl = useFirestoreCollection<Task>(uid, 'tasks');
  const tasks = tasksColl.items;

  const { activities, sessions } = tracker;

  // Siempre mostrar la semana
  const weekSessions = useMemo(() => filterSessionsByPeriod(sessions, 'week'), [sessions]);
  const activityStats = useMemo(() => getActivityStats(weekSessions, activities, tasks), [weekSessions, activities, tasks]);

  const totalSeconds = weekSessions.reduce((sum, s) => sum + s.duration, 0);
  const hasData = totalSeconds > 0;
  const selectedActivity = selectedActivityIdx != null ? activityStats[selectedActivityIdx] : null;

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
            {/* Gráfico circular del tiempo semanal */}
            <WeeklyCircularChart activityStats={activityStats} totalSeconds={totalSeconds} />

            {/* Separador */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[#eceaf3]" />
              <span className="text-[12px] font-bold uppercase tracking-wider text-[#a0a0a0]">Actividades</span>
              <div className="flex-1 h-px bg-[#eceaf3]" />
            </div>

            {/* Barras de actividades */}
            <div className="flex flex-col gap-3">
              {activityStats.map((stat, idx) => (
                <ActivityStatCard key={stat.activity.id} stat={stat} onClick={() => setSelectedActivityIdx(idx)} />
              ))}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedActivity && (
          <ActivityDetailModal
            key={selectedActivity.activity.id}
            activity={selectedActivity.activity}
            stat={selectedActivity}
            sessions={weekSessions}
            tasks={tasks}
            onBack={() => setSelectedActivityIdx(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

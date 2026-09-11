import { motion, AnimatePresence } from 'framer-motion';
import { formatElapsed, formatClock, todayKey } from '../../hooks/useTimeTracker';
import type { Activity, TimeEntry } from '../../types';

interface Props {
  entries: TimeEntry[];
  activities: Activity[];
  liveElapsed: number;
  isRunning: boolean;
  liveActivityId?: string;
  liveDescription?: string;
}

interface TodaySession {
  id: string;
  description: string;
  activityName: string;
  color: string;
  seconds: number;
  startedAt: number;
  endedAt: number;
  isLive?: boolean;
}

export function TodaySummary({ entries, activities, liveElapsed, isRunning, liveActivityId, liveDescription }: Props) {
  const todayEntries = entries.filter((e) => e.date === todayKey());

  const sessions: TodaySession[] = todayEntries
    .slice()
    .sort((a, b) => b.endedAt - a.endedAt)
    .map((e) => {
      const activity = activities.find((a) => a.id === e.activityId);
      return {
        id: e.id,
        description: e.description.trim() || 'Sin descripción',
        activityName: activity?.name ?? 'Sin actividad',
        color: activity?.color ?? '#bbb',
        seconds: e.seconds,
        startedAt: e.startedAt,
        endedAt: e.endedAt,
      };
    });

  // Sesión en vivo al principio
  if (liveElapsed >= 1 && liveActivityId !== undefined) {
    const activity = activities.find((a) => a.id === liveActivityId);
    sessions.unshift({
      id: 'live',
      description: liveDescription?.trim() || 'En curso',
      activityName: activity?.name ?? 'Sin actividad',
      color: activity?.color ?? '#34c77b',
      seconds: liveElapsed,
      startedAt: 0,
      endedAt: 0,
      isLive: true,
    });
  }

  const total = todayEntries.reduce((s, e) => s + e.seconds, 0) + (liveElapsed >= 1 ? liveElapsed : 0);

  return (
    <div className="bg-white p-5 rounded-[24px] shadow-[6px_6px_12px_#e6e6e6,-6px_-6px_12px_#ffffff] flex flex-col gap-3">
      <div className="text-center">
        <p className="text-[13px] font-semibold text-[#999] uppercase tracking-wide m-0">Tiempo de Hoy</p>
        <div className="flex items-center justify-center gap-2 mt-1">
          {isRunning && <span className="w-2 h-2 rounded-full bg-[#34c77b] animate-pulse" />}
          <p className="text-[36px] font-bold text-[#333] tabular-nums m-0 leading-none">{formatElapsed(total)}</p>
        </div>
      </div>

      {sessions.length > 0 && (
        <div className="flex flex-col">
          <AnimatePresence initial={false}>
            {sessions.map((s) => (
              <motion.div
                key={s.id}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="flex items-center gap-3 py-2.5 border-t border-[#f2f2f2] overflow-hidden"
              >
                <span className="w-1 h-8 rounded-full shrink-0" style={{ background: s.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-[#333] m-0 truncate flex items-center gap-1.5">
                    {s.isLive && <span className="w-1.5 h-1.5 rounded-full bg-[#34c77b] animate-pulse shrink-0" />}
                    {s.description}
                  </p>
                  <p className="text-[12px] text-[#999] m-0 mt-0.5">
                    {s.isLive ? `${s.activityName} · En curso` : `${s.activityName} · ${formatClock(s.startedAt)} – ${formatClock(s.endedAt)}`}
                  </p>
                </div>
                <span className="text-[14px] font-semibold text-[#555] tabular-nums shrink-0">{formatElapsed(s.seconds)}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

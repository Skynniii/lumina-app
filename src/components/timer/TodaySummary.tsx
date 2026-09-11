import { motion, AnimatePresence } from 'framer-motion';
import { formatElapsed, todayKey } from '../../hooks/useTimeTracker';
import type { Activity, TimeEntry } from '../../types';

interface Props {
  entries: TimeEntry[];
  activities: Activity[];
  liveElapsed: number;
  isRunning: boolean;
  liveActivityId?: string;
  liveDescription?: string;
}

interface SessionInfo {
  key: string;
  description: string;
  seconds: number;
  isLive?: boolean;
}

interface ActivityGroup {
  key: string;
  activityName: string;
  color: string;
  totalSeconds: number;
  hasLive: boolean;
  sessions: SessionInfo[];
}

export function TodaySummary({ entries, activities, liveElapsed, isRunning, liveActivityId, liveDescription }: Props) {
  const todayEntries = entries.filter((e) => e.date === todayKey());

  const activityMap = new Map<string, ActivityGroup>();

  todayEntries.forEach((e) => {
    const activity = activities.find((a) => a.id === e.activityId);
    const group = activityMap.get(e.activityId) ?? {
      key: e.activityId,
      activityName: activity?.name ?? 'Sin actividad',
      color: activity?.color ?? '#bbb',
      totalSeconds: 0,
      hasLive: false,
      sessions: [],
    };
    group.totalSeconds += e.seconds;
    const desc = e.description.trim() || 'Sin descripción';
    const session = group.sessions.find((s) => s.description === desc);
    if (session) session.seconds += e.seconds;
    else group.sessions.push({ key: `${e.activityId}-${desc}`, description: desc, seconds: e.seconds });
    activityMap.set(e.activityId, group);
  });

  // Sesión en vivo — se fusiona con sesión existente si la descripción coincide
  if (liveElapsed >= 1 && liveActivityId !== undefined) {
    const activity = activities.find((a) => a.id === liveActivityId);
    const group = activityMap.get(liveActivityId) ?? {
      key: liveActivityId,
      activityName: activity?.name ?? 'Sin actividad',
      color: activity?.color ?? '#34c77b',
      totalSeconds: 0,
      hasLive: false,
      sessions: [],
    };
    group.totalSeconds += liveElapsed;
    group.hasLive = true;
    const desc = liveDescription?.trim() || 'En curso';
    const existing = group.sessions.find((s) => s.description === desc);
    if (existing) {
      existing.seconds += liveElapsed;
      existing.isLive = true;
    } else {
      group.sessions.unshift({ key: 'live', description: desc, seconds: liveElapsed, isLive: true });
    }
    activityMap.set(liveActivityId, group);
  }

  const groups = Array.from(activityMap.values()).sort((a, b) => b.totalSeconds - a.totalSeconds);
  const total = todayEntries.reduce((s, e) => s + e.seconds, 0) + (liveElapsed >= 1 ? liveElapsed : 0);

  return (
    <div className="bg-white p-5 rounded-[24px] shadow-[6px_6px_12px_#e6e6e6,-6px_-6px_12px_#ffffff] flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold text-[#999] uppercase tracking-wide m-0">Hoy</p>
        <div className="flex items-center gap-2">
          {isRunning && <span className="w-2 h-2 rounded-full bg-[#34c77b] animate-pulse" />}
          <span className="text-2xl font-bold text-[#333] tabular-nums m-0">{formatElapsed(total)}</span>
        </div>
      </div>

      {groups.length > 0 && (
        <div className="flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {groups.map((g) => {
              const pct = total > 0 ? Math.min(100, (g.totalSeconds / total) * 100) : 0;
              return (
                <motion.div key={g.key} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.35, ease: 'easeInOut' }} className="flex flex-col gap-1.5 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: g.color }} />
                      <span className="text-[13px] font-semibold text-[#555]">{g.activityName}</span>
                    </div>
                    <span className="text-[13px] font-semibold text-[#777] tabular-nums">{formatElapsed(g.totalSeconds)}</span>
                  </div>
                  {/* Barra de progreso — animada si hay sesión en vivo */}
                  <div className="h-1.5 rounded-full bg-[#f0f0f0] overflow-hidden">
                    <div className="h-full rounded-full transition-[width] duration-700 ease-out relative overflow-hidden" style={{ width: `${pct}%`, background: g.color }}>
                      {g.hasLive && (
                        <motion.div className="absolute inset-0" style={{ background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)` }} animate={{ x: ['-100%', '200%'] }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }} />
                      )}
                    </div>
                  </div>
                  {/* Sesiones individuales */}
                  {g.sessions.length > 1 && (
                    <div className="flex flex-col gap-0.5 pl-[18px]">
                      {g.sessions.map((s) => (
                        <div key={s.key} className="flex items-center justify-between">
                          <span className="text-[12px] text-[#999] truncate flex items-center gap-1.5">
                            {s.isLive && <span className="w-1.5 h-1.5 rounded-full bg-[#34c77b] animate-pulse shrink-0" />}
                            {s.description}
                          </span>
                          <span className="text-[12px] text-[#b0b0b0] tabular-nums shrink-0 ml-2">{formatElapsed(s.seconds)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

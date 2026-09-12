import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatElapsed, todayKey, isoToDateKey } from '../../hooks/useTimeTracker';
import type { Activity, TimeSession } from '../../types';

interface Props {
  entries: TimeSession[];
  activities: Activity[];
  liveElapsed: number;
  isRunning: boolean;
  liveActivityId?: string;
  liveDescription?: string;
  onSelectEntry?: (entry: TimeSession) => void;
}

interface Session {
  id: string;
  entry: TimeSession | null;
  description: string;
  seconds: number;
  activityId: string;
  isLive?: boolean;
  sortTime: number;
}

interface ActivityGroup {
  activityId: string;
  activityName: string;
  color: string;
  totalSeconds: number;
  hasLive: boolean;
  sessions: Session[];
  latestTime: number;
}

export function TodaySummary({ entries, activities, liveElapsed, isRunning, liveActivityId, liveDescription, onSelectEntry }: Props) {
  const [expanded, setExpanded] = useState(false);
  const todayEntries = entries.filter((e) => isoToDateKey(e.startTime) === todayKey());

  const allSessions: Session[] = todayEntries.map((e) => ({
    id: e.id,
    entry: e,
    description: e.description.trim() || 'Sin descripción',
    seconds: e.duration,
    activityId: e.activityId,
    sortTime: new Date(e.endTime).getTime(),
  }));

  if (liveElapsed >= 1 && liveActivityId !== undefined) {
    allSessions.push({
      id: 'live',
      entry: null,
      description: liveDescription?.trim() || 'En curso',
      seconds: liveElapsed,
      activityId: liveActivityId,
      isLive: true,
      sortTime: Infinity,
    });
  }

  const groupMap = new Map<string, Session[]>();
  for (const s of allSessions) {
    const arr = groupMap.get(s.activityId) ?? [];
    arr.push(s);
    groupMap.set(s.activityId, arr);
  }

  const groups: ActivityGroup[] = Array.from(groupMap.entries()).map(([activityId, sessions]) => {
    const activity = activities.find((a) => a.id === activityId);
    sessions.sort((a, b) => b.sortTime - a.sortTime);
    return {
      activityId,
      activityName: activity?.name ?? 'Sin actividad',
      color: activity?.color ?? '#bbb',
      totalSeconds: sessions.reduce((s, e) => s + e.seconds, 0),
      hasLive: sessions.some((s) => s.isLive),
      sessions,
      latestTime: Math.max(...sessions.map((s) => s.sortTime)),
    };
  });

  groups.sort((a, b) => b.latestTime - a.latestTime);

  const total = todayEntries.reduce((s, e) => s + e.duration, 0) + (liveElapsed >= 1 ? liveElapsed : 0);

  return (
    <div className="flex flex-col gap-2">
      <div className="bg-white p-5 rounded-[24px] shadow-[6px_6px_12px_#e6e6e6,-6px_-6px_12px_#ffffff] flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-semibold text-[#999] uppercase tracking-wide m-0">Hoy</p>
          <div className="flex items-center gap-2">
            {isRunning && <span className="w-2 h-2 rounded-full bg-[#34c77b] animate-pulse" />}
            <span className="text-[36px] font-bold text-[#333] tabular-nums leading-none">{formatElapsed(total)}</span>
          </div>
        </div>

        {groups.length > 0 && (
          <div className="flex flex-col gap-3">
            <AnimatePresence initial={false}>
                {groups.map((g) => {
                const pct = total > 0 ? Math.min(100, (g.totalSeconds / total) * 100) : 0;
                return (
                  <motion.div key={g.activityId} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.35, ease: 'easeInOut' }} className="flex flex-col gap-1.5 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: g.color }} />
                        <span className="text-[13px] font-semibold text-[#555]">{g.activityName}</span>
                      </div>
                      <span className="text-[13px] font-semibold text-[#777] tabular-nums">{formatElapsed(g.totalSeconds)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#f0f0f0] overflow-hidden">
                      <div className="h-full rounded-full transition-[width] duration-700 ease-out relative overflow-hidden" style={{ width: `${pct}%`, background: g.color }}>
                        {g.hasLive && (
                          <motion.div className="absolute inset-0" style={{ background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)` }} animate={{ x: ['-100%', '200%'] }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }} />
                        )}
                      </div>
                    </div>
                          <AnimatePresence initial={false}>
                      {expanded && (
                        <motion.div
                          key="sessions"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ height: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }, opacity: { duration: 0.2, ease: 'easeInOut' } }}
                          className="overflow-hidden flex flex-col"
                        >
                          {g.sessions.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => s.entry && onSelectEntry?.(s.entry)}
                        className={`flex items-center gap-3 py-1.5 pl-[18px] text-left bg-transparent border-none w-full ${s.entry ? 'cursor-pointer' : 'cursor-default'}`}
                      >
                        <span className="w-1 h-6 rounded-full shrink-0" style={{ background: g.color }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] text-[#999] truncate flex items-center gap-1.5 m-0">
                            {s.isLive && <span className="w-1.5 h-1.5 rounded-full bg-[#34c77b] animate-pulse shrink-0" />}
                            {s.description}
                          </p>
                          <p className="text-[11px] text-[#b0b0b0] m-0">
                            {s.isLive ? 'En curso' : `${new Date(s.entry!.startTime).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false })} – ${new Date(s.entry!.endTime).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false })}`}
                          </p>
                        </div>
                        <span className="text-[12px] font-semibold text-[#555] tabular-nums shrink-0">{formatElapsed(s.seconds)}</span>
                      </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
      {groups.length > 0 && (
        <button onClick={() => setExpanded(!expanded)} className="self-center flex items-center gap-1.5 text-[13px] font-semibold text-[#7f70ff] bg-transparent border-none cursor-pointer py-1">
          {expanded ? 'Ver menos' : 'Ver más'}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${expanded ? 'rotate-180' : ''}`}><path d="M6 9l6 6 6-6" /></svg>
        </button>
      )}
    </div>
  );
}

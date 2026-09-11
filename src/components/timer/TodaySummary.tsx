import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatElapsed, todayKey } from '../../hooks/useTimeTracker';
import { useSettings } from '../../context/SettingsContext';
import type { Activity, TimeEntry } from '../../types';

interface Props {
  entries: TimeEntry[];
  activities: Activity[];
  liveElapsed: number;
  isRunning: boolean;
  liveActivityId?: string;
  liveDescription?: string;
}

interface Session {
  id: string;
  entry: TimeEntry | null;
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

export function TodaySummary({ entries, activities, liveElapsed, isRunning, liveActivityId, liveDescription }: Props) {
  const { settings } = useSettings();
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null);

  const todayEntries = entries.filter((e) => e.date === todayKey());

  const fmtTime = (epoch: number) => {
    const d = new Date(epoch);
    const h = d.getHours();
    const min = d.getMinutes();
    if (settings.timeFormat === '12h') {
      return `${h % 12 || 12}:${String(min).padStart(2, '0')} ${h >= 12 ? 'pm' : 'am'}`;
    }
    return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  };

  // Build all sessions
  const allSessions: Session[] = todayEntries.map((e) => ({
    id: e.id,
    entry: e,
    description: e.description.trim() || 'Sin descripción',
    seconds: e.seconds,
    activityId: e.activityId,
    sortTime: e.endedAt,
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

  // Group by activity
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

  const total = todayEntries.reduce((s, e) => s + e.seconds, 0) + (liveElapsed >= 1 ? liveElapsed : 0);

  return (
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
                  {g.sessions.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => s.entry && setSelectedEntry(s.entry)}
                      className={`flex items-center gap-3 py-1.5 pl-[18px] text-left bg-transparent border-none w-full ${s.entry ? 'cursor-pointer' : 'cursor-default'}`}
                    >
                      <span className="w-1 h-6 rounded-full shrink-0" style={{ background: g.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] text-[#999] truncate flex items-center gap-1.5 m-0">
                          {s.isLive && <span className="w-1.5 h-1.5 rounded-full bg-[#34c77b] animate-pulse shrink-0" />}
                          {s.description}
                        </p>
                        <p className="text-[11px] text-[#b0b0b0] m-0">
                          {s.isLive ? 'En curso' : `${fmtTime(s.entry!.startedAt)} – ${fmtTime(s.entry!.endedAt)}`}
                        </p>
                      </div>
                      <span className="text-[12px] font-semibold text-[#555] tabular-nums shrink-0">{formatElapsed(s.seconds)}</span>
                    </button>
                  ))}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Session detail modal */}
      <AnimatePresence>
        {selectedEntry && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-[9998] flex items-end" onClick={() => setSelectedEntry(null)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="w-full bg-white rounded-t-[28px] max-h-[80vh] overflow-y-auto no-scrollbar" onClick={(e) => e.stopPropagation()}>
              <div className="w-10 h-1 bg-[#e0e0e0] rounded-full mx-auto mt-3" />
              <div className="px-6 pt-4 pb-8">
                <div className="text-center mb-6">
                  <p className="text-[40px] font-bold text-[#333] tabular-nums m-0 leading-none">{formatElapsed(selectedEntry.seconds)}</p>
                  <p className="text-[13px] text-[#999] uppercase tracking-wide mt-2 m-0">Hoy</p>
                </div>
                <div className="flex flex-col gap-0">
                  <div className="flex items-center justify-between py-3 border-b border-[#f0f0f5]">
                    <span className="text-[14px] text-[#999]">Actividad</span>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: activities.find((a) => a.id === selectedEntry.activityId)?.color ?? '#bbb' }} />
                      <span className="text-[14px] font-medium text-[#333]">{activities.find((a) => a.id === selectedEntry.activityId)?.name ?? 'Sin actividad'}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-[#f0f0f5]">
                    <span className="text-[14px] text-[#999]">Descripción</span>
                    <span className="text-[14px] font-medium text-[#333] text-right">{selectedEntry.description || 'Sin descripción'}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-[#f0f0f5]">
                    <span className="text-[14px] text-[#999]">Inicio</span>
                    <span className="text-[14px] font-medium text-[#333] tabular-nums">{fmtTime(selectedEntry.startedAt)}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-[#f0f0f5]">
                    <span className="text-[14px] text-[#999]">Fin</span>
                    <span className="text-[14px] font-medium text-[#333] tabular-nums">{fmtTime(selectedEntry.endedAt)}</span>
                  </div>
                  {selectedEntry.notes && (
                    <div className="py-3 border-b border-[#f0f0f5]">
                      <span className="text-[14px] text-[#999] block mb-1">Notas</span>
                      <p className="text-[14px] text-[#333] m-0">{selectedEntry.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { dayLabel, formatClock, formatElapsed, isoToDateKey } from '../../hooks/useTimeTracker';
import type { Activity, TimeSession } from '../../types';

interface Props {
  entries: TimeSession[];
  activities: Activity[];
  onDelete: (id: string) => void;
  onSelectEntry?: (entry: TimeSession) => void;
}

export function EntryList({ entries, activities, onDelete, onSelectEntry }: Props) {
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  const groups = useMemo(() => {
    const map = new Map<string, TimeSession[]>();
    entries.forEach((e) => {
      const dk = isoToDateKey(e.startTime);
      const list = map.get(dk) ?? [];
      list.push(e);
      map.set(dk, list);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, list]) => ({
        date,
        entries: list.sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime()),
        total: list.reduce((s, e) => s + e.duration, 0),
      }));
  }, [entries]);

  const toggleDay = (date: string) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3">
        <div className="w-16 h-16 rounded-2xl bg-[#f0edff] flex items-center justify-center">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#7f70ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2" /><path d="M9 2h6" /><path d="M12 5V2" /></svg>
        </div>
        <p className="text-[15px] font-semibold text-[#555] m-0">Sin registros todavía</p>
        <p className="text-[13px] text-[#999] m-0">Inicia un contador para rastrear tu tiempo</p>
      </div>
    );
  }

  const activityGroupsForDay = (dayEntries: TimeSession[]) => {
    const map = new Map<string, { activity?: Activity; total: number; color: string }>();
    for (const e of dayEntries) {
      const activity = activities.find((a) => a.id === e.activityId);
      const key = e.activityId;
      const existing = map.get(key);
      if (existing) existing.total += e.duration;
      else map.set(key, { activity, total: e.duration, color: activity?.color ?? '#bbb' });
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  };

  return (
    <div className="flex flex-col gap-5">
      {groups.map((g) => {
        const isExpanded = expandedDays.has(g.date);
        const actGroups = activityGroupsForDay(g.entries);
        return (
          <div key={g.date} className="bg-white rounded-[24px] shadow-[6px_6px_12px_#e6e6e6,-6px_-6px_12px_#ffffff] overflow-hidden">
            <button onClick={() => toggleDay(g.date)} className="w-full flex items-center justify-between px-5 py-3.5 bg-transparent border-none cursor-pointer hover:bg-[#fafafa] transition-colors">
              <div className="flex items-center gap-2">
                <p className="text-[14px] font-bold text-[#333] m-0 capitalize">{dayLabel(g.date)}</p>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}><path d="M6 9l6 6 6-6" /></svg>
              </div>
              <span className="text-[13px] font-semibold text-[#999] tabular-nums">{formatElapsed(g.total)}</span>
            </button>

            {!isExpanded && (
              <div className="px-5 pb-3.5 flex flex-col gap-2">
                {actGroups.map((ag) => {
                  const pct = g.total > 0 ? Math.min(100, (ag.total / g.total) * 100) : 0;
                  return (
                    <div key={ag.activity?.id ?? 'none'} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: ag.color }} />
                          <span className="text-[12px] font-semibold text-[#777]">{ag.activity?.name ?? 'Sin actividad'}</span>
                        </div>
                        <span className="text-[12px] font-semibold text-[#999] tabular-nums">{formatElapsed(ag.total)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#f0f0f0] overflow-hidden">
                        <div className="h-full rounded-full transition-[width] duration-500 ease-out" style={{ width: `${pct}%`, background: ag.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ height: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }, opacity: { duration: 0.2, ease: 'easeInOut' } }} className="overflow-hidden">
                  {g.entries.map((e) => {
                    const activity = activities.find((a) => a.id === e.activityId);
                    return (
                      <button key={e.id} onClick={() => onSelectEntry?.(e)} className="w-full flex items-center gap-3 px-5 py-3.5 border-t border-[#f2f2f2] bg-transparent border-none cursor-pointer hover:bg-[#fafafa] transition-colors text-left">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ background: activity?.color ?? '#bbb' }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[15px] font-medium text-[#333] m-0 truncate">{e.description || 'Sin descripción'}</p>
                          <p className="text-[12px] text-[#999] m-0 mt-0.5">{activity?.name ?? 'Sin actividad'} · {formatClock(e.startTime)} – {formatClock(e.endTime)}</p>
                        </div>
                        <span className="text-[15px] font-semibold text-[#555] tabular-nums shrink-0">{formatElapsed(e.duration)}</span>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

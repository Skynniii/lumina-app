import { useMemo } from 'react';
import { dayLabel, formatClock, formatElapsed } from '../../hooks/useTimeTracker';
import type { Activity, TimeEntry } from '../../types';

interface Props {
  entries: TimeEntry[];
  activities: Activity[];
  onDelete: (id: string) => void;
  onSelectEntry?: (entry: TimeEntry) => void;
}

export function EntryList({ entries, activities, onDelete, onSelectEntry }: Props) {
  const groups = useMemo(() => {
    const map = new Map<string, TimeEntry[]>();
    entries.forEach((e) => {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, list]) => ({
        date,
        entries: list.sort((a, b) => b.endedAt - a.endedAt),
        total: list.reduce((s, e) => s + e.seconds, 0),
      }));
  }, [entries]);

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

  return (
    <div className="flex flex-col gap-5">
      {groups.map((g) => (
        <div key={g.date} className="bg-white rounded-[24px] shadow-[6px_6px_12px_#e6e6e6,-6px_-6px_12px_#ffffff] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5">
            <p className="text-[14px] font-bold text-[#333] m-0 capitalize">{dayLabel(g.date)}</p>
            <span className="text-[13px] font-semibold text-[#999] tabular-nums">{formatElapsed(g.total)}</span>
          </div>
          {g.entries.map((e) => {
            const activity = activities.find((a) => a.id === e.activityId);
            return (
              <button key={e.id} onClick={() => onSelectEntry?.(e)} className="w-full flex items-center gap-3 px-5 py-3.5 border-t border-[#f2f2f2] bg-transparent border-none cursor-pointer hover:bg-[#fafafa] transition-colors text-left">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ background: activity?.color ?? '#bbb' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-medium text-[#333] m-0 truncate">{e.description || 'Sin descripción'}</p>
                  <p className="text-[12px] text-[#999] m-0 mt-0.5">{activity?.name ?? 'Sin actividad'} · {formatClock(e.startedAt)} – {formatClock(e.endedAt)}</p>
                </div>
                <span className="text-[15px] font-semibold text-[#555] tabular-nums shrink-0">{formatElapsed(e.seconds)}</span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

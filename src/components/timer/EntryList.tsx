import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { dayLabel, formatClock, formatElapsed } from '../../hooks/useTimeTracker';
import { ModalNeuromorfico } from '../ui/ModalNeuromorfico';
import type { Activity, TimeEntry } from '../../types';

interface Props {
  entries: TimeEntry[];
  activities: Activity[];
  onDelete: (id: string) => void;
}

export function EntryList({ entries, activities, onDelete }: Props) {
  const [pendingDelete, setPendingDelete] = useState<TimeEntry | null>(null);

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
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#7f70ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="13" r="8" />
            <path d="M12 9v4l2 2" />
            <path d="M9 2h6" />
            <path d="M12 5V2" />
          </svg>
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
              <div key={e.id} className="flex items-center gap-3 px-5 py-3.5 border-t border-[#f2f2f2]">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ background: activity?.color ?? '#bbb' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-medium text-[#333] m-0 truncate">{e.description || 'Sin descripción'}</p>
                  <p className="text-[12px] text-[#999] m-0 mt-0.5">
                    {activity?.name ?? 'Otra'} · {formatClock(e.startedAt)} – {formatClock(e.endedAt)}
                  </p>
                </div>
                <span className="text-[15px] font-semibold text-[#555] tabular-nums shrink-0">{formatElapsed(e.seconds)}</span>
                <motion.button
                  onClick={() => setPendingDelete(e)}
                  whileTap={{ scale: 0.8 }}
                  aria-label="Eliminar registro"
                  className="w-8 h-8 rounded-full border-none bg-transparent cursor-pointer flex items-center justify-center shrink-0 hover:bg-[#fff5f5] transition-colors"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#c9c9c9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18" />
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  </svg>
                </motion.button>
              </div>
            );
          })}
        </div>
      ))}

      <ModalNeuromorfico
        isOpen={pendingDelete !== null}
        type="confirm"
        title="¿Eliminar este registro?"
        onConfirm={() => {
          if (pendingDelete) onDelete(pendingDelete.id);
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

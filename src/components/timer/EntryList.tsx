import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { dayLabel, formatClock, formatElapsed, todayKey } from '../../hooks/useTimeTracker';
import { ModalNeuromorfico } from '../ui/ModalNeuromorfico';
import type { Activity, TimeEntry } from '../../types';

interface Props {
  entries: TimeEntry[];
  activities: Activity[];
  onDelete: (id: string) => void;
}

export function EntryList({ entries, activities, onDelete }: Props) {
  const [selected, setSelected] = useState<TimeEntry | null>(null);
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
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#7f70ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2" /><path d="M9 2h6" /><path d="M12 5V2" /></svg>
        </div>
        <p className="text-[15px] font-semibold text-[#555] m-0">Sin registros todavía</p>
        <p className="text-[13px] text-[#999] m-0">Inicia un contador para rastrear tu tiempo</p>
      </div>
    );
  }

  const selectedActivity = selected ? activities.find((a) => a.id === selected.activityId) : null;

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
              <button key={e.id} onClick={() => setSelected(e)} className="w-full flex items-center gap-3 px-5 py-3.5 border-t border-[#f2f2f2] bg-transparent border-none cursor-pointer hover:bg-[#fafafa] transition-colors text-left">
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

      {/* Vista detallada */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-[9998] flex items-end" onClick={() => setSelected(null)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="w-full bg-white rounded-t-[28px] max-h-[80vh] overflow-y-auto no-scrollbar" onClick={(e) => e.stopPropagation()}>
              <div className="w-10 h-1 bg-[#e0e0e0] rounded-full mx-auto mt-3" />
              <div className="px-6 pt-4 pb-8">
                {/* Tiempo total destacado */}
                <div className="text-center mb-6">
                  <p className="text-[40px] font-bold text-[#333] tabular-nums m-0 leading-none">{formatElapsed(selected.seconds)}</p>
                  <p className="text-[13px] text-[#999] uppercase tracking-wide mt-2 m-0">{dayLabel(selected.date)}</p>
                </div>

                {/* Info de la sesión */}
                <div className="flex flex-col gap-0">
                  <div className="flex items-center justify-between py-3 border-b border-[#f0f0f5]">
                    <span className="text-[14px] text-[#999]">Actividad</span>
                    <div className="flex items-center gap-2">
                      {selectedActivity && <span className="w-2.5 h-2.5 rounded-full" style={{ background: selectedActivity.color }} />}
                      <span className="text-[14px] font-medium text-[#333]">{selectedActivity?.name ?? 'Sin actividad'}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-[#f0f0f5]">
                    <span className="text-[14px] text-[#999]">Descripción</span>
                    <span className="text-[14px] font-medium text-[#333]">{selected.description || 'Sin descripción'}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-[#f0f0f5]">
                    <span className="text-[14px] text-[#999]">Inicio</span>
                    <span className="text-[14px] font-medium text-[#333] tabular-nums">{formatClock(selected.startedAt)}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-[#f0f0f5]">
                    <span className="text-[14px] text-[#999]">Fin</span>
                    <span className="text-[14px] font-medium text-[#333] tabular-nums">{formatClock(selected.endedAt)}</span>
                  </div>
                  {selected.notes && (
                    <div className="py-3 border-b border-[#f0f0f5]">
                      <span className="text-[14px] text-[#999] block mb-1">Notas</span>
                      <p className="text-[14px] text-[#333] m-0">{selected.notes}</p>
                    </div>
                  )}
                </div>

                {/* Botón eliminar */}
                <button onClick={() => { setPendingDelete(selected); setSelected(null); }} className="w-full mt-6 py-3 rounded-xl text-[15px] font-semibold text-[#ff6b81] bg-[#fff5f5] border-none cursor-pointer transition-colors hover:bg-[#ffeeee]">
                  Eliminar registro
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ModalNeuromorfico isOpen={pendingDelete !== null} type="confirm" title="¿Eliminar este registro?" onConfirm={() => { if (pendingDelete) onDelete(pendingDelete.id); setPendingDelete(null); }} onCancel={() => setPendingDelete(null)} />
    </div>
  );
}

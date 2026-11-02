import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { isoToDateKey } from '../../hooks/useTimeTracker';
import { formatDuration } from '../tracker/trackerUtils';
import { LAYER_META, minToHHMM, type CalendarItem } from '../../hooks/useCalendarData';
import type { Task } from '../../types';

interface Props {
  date: string; // YYYY-MM-DD
  items: CalendarItem[];
  allTasks: Task[];
  onSelectItem: (i: CalendarItem) => void;
}

/** Formatea hora en 24h (HH:MM) para evitar salto de línea del a.m./p.m. */
function formatTime24(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7f70ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
);
const CheckResumenIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34c77b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
);
const ClockResumenIcon = ({ color }: { color: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" /></svg>
);

type ActivityEntry = {
  time: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  item?: CalendarItem;
};

/**
 * "Resumen del día": 3 recuadros (Agregadas, Completadas, Registros) +
 * lista cronológica de actividad. Colapsable por defecto.
 */
export function DayResumen({ date, items, allTasks, onSelectItem }: Props) {
  const [expanded, setExpanded] = useState(false);

  const completedItems = items.filter((i) => i.kind === 'completed');
  const sessionItems = items.filter((i) => i.kind === 'session');

  // Tareas agregadas (creadas) ese día
  const addedTasks = allTasks.filter((t) => {
    if (t.isSeparator) return false;
    if (!t.createdAt) return false;
    return isoToDateKey(t.createdAt) === date;
  });

  const hasActivity = completedItems.length > 0 || addedTasks.length > 0 || sessionItems.length > 0;

  // Lista cronológica de actividad
  const activity: ActivityEntry[] = [];

  for (const it of completedItems) {
    activity.push({
      time: it.task?.completedAt ? formatTime24(it.task.completedAt) : '',
      title: it.title, subtitle: 'Completada',
      icon: <CheckResumenIcon />, item: it,
    });
  }
  for (const t of addedTasks) {
    activity.push({
      time: t.createdAt ? formatTime24(t.createdAt) : '',
      title: t.title?.trim() || 'Tarea', subtitle: 'Agregada',
      icon: <PlusIcon />,
    });
  }
  for (const it of sessionItems) {
    const startStr = it.startMin !== undefined ? minToHHMM(it.startMin) : '';
    const endStr = it.endMin !== undefined ? minToHHMM(it.endMin) : '';
    const timeRange = startStr && endStr ? `${startStr} - ${endStr}` : startStr;
    activity.push({
      time: timeRange,
      title: it.title, subtitle: `Registro · ${formatDuration(it.session?.duration ?? 0)}`,
      icon: <ClockResumenIcon color={it.color} />, item: it,
    });
  }
  activity.sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="bg-white rounded-[24px] shadow-[6px_6px_12px_#e6e6e6,-6px_-6px_12px_#ffffff] p-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full p-0 border-none bg-transparent cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 3" /><circle cx="12" cy="12" r="9" /></svg>
          <span className="text-[15px] font-bold text-[#333]">Resumen del día</span>
        </div>
        <motion.svg animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></motion.svg>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            {/* 3 recuadros */}
            <div className="grid grid-cols-3 gap-2 pt-3">
              <div className="rounded-2xl bg-[#f7f6f9] py-2.5 flex flex-col items-center gap-0.5">
                <span className="text-[17px] font-bold leading-none tabular-nums" style={{ color: addedTasks.length > 0 ? '#7f70ff' : '#c8c8d0' }}>{addedTasks.length}</span>
                <span className="text-[10px] text-[#999] leading-none">Agregadas</span>
              </div>
              <div className="rounded-2xl bg-[#f7f6f9] py-2.5 flex flex-col items-center gap-0.5">
                <span className="text-[17px] font-bold leading-none tabular-nums" style={{ color: completedItems.length > 0 ? LAYER_META.completed.color : '#c8c8d0' }}>{completedItems.length}</span>
                <span className="text-[10px] text-[#999] leading-none">Completadas</span>
              </div>
              <div className="rounded-2xl bg-[#f7f6f9] py-2.5 flex flex-col items-center gap-0.5">
                <span className="text-[17px] font-bold leading-none tabular-nums" style={{ color: sessionItems.length > 0 ? LAYER_META.session.color : '#c8c8d0' }}>{sessionItems.length}</span>
                <span className="text-[10px] text-[#999] leading-none">Registros</span>
              </div>
            </div>

            {/* Lista de actividad */}
            {hasActivity && (
              <div className="flex flex-col gap-2.5 pt-3">
                {activity.map((a, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-[11px] font-semibold text-[#aaa] tabular-nums shrink-0 w-[85px] text-right whitespace-nowrap">{a.time}</span>
                    <span className="shrink-0">{a.icon}</span>
                    {a.item ? (
                      <button onClick={() => onSelectItem(a.item!)} className="flex-1 min-w-0 p-0 border-none bg-transparent cursor-pointer text-left">
                        <p className="text-[13px] font-medium text-[#555] m-0 truncate">{a.title}</p>
                        <p className="text-[10px] text-[#bbb] m-0">{a.subtitle}</p>
                      </button>
                    ) : (
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-[#555] m-0 truncate">{a.title}</p>
                        <p className="text-[10px] text-[#bbb] m-0">{a.subtitle}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

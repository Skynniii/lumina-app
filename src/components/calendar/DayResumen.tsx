import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../../context/SettingsContext';
import { isoToDateKey, todayKey } from '../../hooks/useTimeTracker';
import { formatEventTime } from '../../hooks/useCalendarEvents';
import { LAYER_META, minToHHMM, type CalendarItem } from '../../hooks/useCalendarData';
import type { Activity, CalendarEvent, Task, TaskList } from '../../types';

interface Props {
  date: string; // YYYY-MM-DD
  items: CalendarItem[];
  allTasks: Task[];
  allEvents: CalendarEvent[];
  lists: TaskList[];
  activities: Activity[];
  onSelectItem: (i: CalendarItem) => void;
}

/** Hora en 24h (HH:MM) a partir de un ISO. */
function formatTime24(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Momento de creación de un evento: su id guarda `ev-<epoch>`. */
function eventCreatedAt(e: CalendarEvent): Date | null {
  const epoch = Number(e.id.split('-')[1]);
  return Number.isFinite(epoch) && epoch > 0 ? new Date(epoch) : null;
}

const PlusIcon = ({ color }: { color: string }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
);
const CheckCircleIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7f70ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><polyline points="8 12 11 15 16 9" /></svg>
);
const ClockIcon = ({ color }: { color: string }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" /></svg>
);

type DetailRow = {
  key: string;
  time: string;        // hora a la izquierda (HH:MM)
  icon: ReactNode;
  title: string;
  label?: string;      // texto bajo el título ("Tarea: X", "Evento", actividad…)
  dotColor?: string;   // puntito de la actividad
  range?: string;      // rango de horas a la derecha (registros)
  item?: CalendarItem; // si se puede abrir
};

/**
 * "Detalles del día": qué pasó ese día (agregado, completado y registros de
 * tiempo) con su hora. Solo se muestra para hoy y días pasados. Colapsable.
 */
export function DayResumen({ date, items, allTasks, allEvents, lists, activities, onSelectItem }: Props) {
  const { settings } = useSettings();
  const [expanded, setExpanded] = useState(true);
  const fmt = (hhmm: string) => (hhmm ? formatEventTime(hhmm, settings.timeFormat) : '');

  // Los días futuros no tienen detalles que contar
  if (date > todayKey()) return null;

  const activityOfTask = (t: Task): Activity | undefined => {
    const id = t.activityId || lists.find((l) => l.id === t.listId)?.activityId;
    return id ? activities.find((a) => a.id === id) : undefined;
  };
  const findItemForTask = (taskId: string) => items.find((i) => i.task?.id === taskId);

  const completedItems = items.filter((i) => i.kind === 'completed');
  const sessionItems = items.filter((i) => i.kind === 'session');

  const addedTasks = allTasks.filter((t) =>
    !t.isSeparator && !!t.createdAt && isoToDateKey(t.createdAt) === date
  );
  const addedEvents = allEvents.filter((e) => {
    const created = eventCreatedAt(e);
    return !!created && isoToDateKey(created.toISOString()) === date;
  });

  const rows: DetailRow[] = [];

  // Tareas agregadas ese día
  for (const t of addedTasks) {
    const activity = activityOfTask(t);
    rows.push({
      key: `add-${t.id}`,
      time: t.createdAt ? formatTime24(t.createdAt) : '',
      icon: <PlusIcon color={LAYER_META.pending.color} />,
      title: t.title?.trim() || activity?.name || 'Tarea',
      label: activity ? `Tarea: ${activity.name}` : 'Tarea',
      dotColor: activity?.color,
      item: findItemForTask(t.id),
    });
  }

  // Eventos agregados ese día
  for (const e of addedEvents) {
    const created = eventCreatedAt(e);
    rows.push({
      key: `ev-${e.id}`,
      time: created ? formatTime24(created.toISOString()) : e.start,
      icon: <PlusIcon color={e.color} />,
      title: e.title?.trim() || 'Evento',
      label: 'Evento',
      item: items.find((i) => i.event?.id === e.id),
    });
  }

  // Tareas completadas ese día
  for (const it of completedItems) {
    const activity = it.task ? activityOfTask(it.task) : undefined;
    rows.push({
      key: `done-${it.id}`,
      time: it.task?.completedAt ? formatTime24(it.task.completedAt) : '',
      icon: <CheckCircleIcon />,
      title: it.title,
      label: activity ? `Tarea: ${activity.name}` : 'Tarea',
      dotColor: activity?.color,
      item: it,
    });
  }

  // Registros de tiempo: hora de fin a la izquierda, rango a la derecha
  for (const it of sessionItems) {
    const s = it.session;
    const startStr = s ? formatTime24(s.startTime) : it.startMin !== undefined ? minToHHMM(it.startMin) : '';
    const endStr = s ? formatTime24(s.endTime) : it.endMin !== undefined ? minToHHMM(it.endMin) : '';
    const activity = s?.activityId ? activities.find((a) => a.id === s.activityId) : undefined;
    rows.push({
      key: `ses-${it.id}`,
      time: endStr,
      icon: <ClockIcon color={activity?.color || LAYER_META.session.color} />,
      title: s?.description?.trim() || 'Sin descripción',
      label: activity?.name,
      dotColor: activity?.color,
      range: startStr && endStr ? `${fmt(startStr)} - ${fmt(endStr)}` : fmt(startStr),
      item: it,
    });
  }

  // Más reciente arriba, más antiguo abajo
  rows.sort((a, b) => (b.time || '').localeCompare(a.time || ''));

  const addedCount = addedTasks.length + addedEvents.length;

  return (
    <div className="bg-white rounded-[24px] shadow-[6px_6px_12px_#e6e6e6,-6px_-6px_12px_#ffffff] p-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full p-0 border-none bg-transparent cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 3" /><circle cx="12" cy="12" r="9" /></svg>
          <span className="text-[15px] font-bold text-[#333]">Detalles del día</span>
        </div>
        <motion.svg animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></motion.svg>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            {/* Contadores */}
            <div className="grid grid-cols-3 gap-2 pt-3">
              <div className="rounded-2xl bg-[#f7f6f9] py-2.5 flex flex-col items-center gap-0.5">
                <span className="text-[17px] font-bold leading-none tabular-nums" style={{ color: addedCount > 0 ? LAYER_META.pending.color : '#c8c8d0' }}>{addedCount}</span>
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

            {/* Actividad cronológica */}
            {rows.length === 0 ? (
              <p className="text-[13px] text-[#bbb] pt-3 m-0">Sin actividad registrada</p>
            ) : (
              <div className="flex flex-col gap-3 pt-3">
                {rows.map((r) => {
                  const content = (
                    <>
                      <span className="text-[11px] font-semibold text-[#aaa] tabular-nums shrink-0 w-[54px] pt-[1px]">{fmt(r.time)}</span>
                      <span className="shrink-0 flex items-center justify-center w-[18px] h-[18px] mt-[1px]">{r.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-[#333] m-0 truncate">{r.title}</p>
                        {(r.label || r.range) && (
                          <div className="flex items-center justify-between gap-2 mt-[1px]">
                            <span className="flex items-center gap-1.5 min-w-0">
                              {r.dotColor && <span className="w-[6px] h-[6px] rounded-full shrink-0" style={{ background: r.dotColor }} />}
                              {r.label && <span className="text-[10px] text-[#aaa] truncate">{r.label}</span>}
                            </span>
                            {r.range && <span className="text-[10px] font-semibold text-[#aaa] tabular-nums shrink-0 whitespace-nowrap">{r.range}</span>}
                          </div>
                        )}
                      </div>
                    </>
                  );
                  return r.item ? (
                    <button key={r.key} onClick={() => onSelectItem(r.item!)} className="flex items-start gap-2.5 w-full p-0 border-none bg-transparent cursor-pointer text-left active:scale-[0.99] transition-transform">
                      {content}
                    </button>
                  ) : (
                    <div key={r.key} className="flex items-start gap-2.5">
                      {content}
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

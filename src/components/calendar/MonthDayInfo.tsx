import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../../context/SettingsContext';
import { formatEventTime } from '../../hooks/useCalendarEvents';
import { isoToDateKey } from '../../hooks/useTimeTracker';
import { formatDuration } from '../tracker/trackerUtils';
import { LAYER_META, minToHHMM, type CalendarItem } from '../../hooks/useCalendarData';
import type { Task } from '../../types';

interface Props {
  date: string; // YYYY-MM-DD
  items: CalendarItem[];
  allTasks: Task[];
  onSelectItem: (i: CalendarItem) => void;
  onNewTask: () => void;
  onNewEvent: () => void;
}

const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const TaskIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7f70ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /></svg>
);
const EventIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4d7cfe" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
);
const CheckIcon = ({ color }: { color: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
);
const ClockIcon = ({ color }: { color: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" /></svg>
);
const PlusIcon = ({ color }: { color: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
);

type ActivityEntry = {
  time: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  item?: CalendarItem;
};

/**
 * Información del día en la vista de mes: fecha grande, tareas pendientes,
 * eventos y actividad del día (completadas, agregadas, registros) colapsable.
 */
export function MonthDayInfo({ date, items, allTasks, onSelectItem, onNewTask, onNewEvent }: Props) {
  const { settings } = useSettings();
  const [activityExpanded, setActivityExpanded] = useState(false);
  const [y, m, d] = date.split('-').map(Number);
  const weekday = WEEKDAYS[new Date(y, m - 1, d).getDay()];

  const pendingItems = items.filter((i) => i.kind === 'pending');
  const eventItems = items.filter((i) => i.kind === 'event');
  const completedItems = items.filter((i) => i.kind === 'completed');
  const sessionItems = items.filter((i) => i.kind === 'session');

  // Tareas agregadas (creadas) ese día
  const addedTasks = allTasks.filter((t) => {
    if (t.isSeparator) return false;
    if (!t.createdAt) return false;
    return isoToDateKey(t.createdAt) === date;
  });

  const hasActivity = completedItems.length > 0 || addedTasks.length > 0 || sessionItems.length > 0;

  // Construir lista cronológica de actividad
  const activity: ActivityEntry[] = [];

  for (const it of completedItems) {
    activity.push({
      time: it.task?.completedAt ? new Date(it.task.completedAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '',
      title: it.title, subtitle: 'Completada',
      icon: <CheckIcon color={LAYER_META.completed.color} />,
      color: LAYER_META.completed.color, item: it,
    });
  }
  for (const t of addedTasks) {
    activity.push({
      time: t.createdAt ? new Date(t.createdAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '',
      title: t.title?.trim() || 'Tarea', subtitle: 'Agregada',
      icon: <PlusIcon color="#7f70ff" />, color: '#7f70ff',
    });
  }
  for (const it of sessionItems) {
    activity.push({
      time: it.session ? new Date(it.session.startTime).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '',
      title: it.title, subtitle: `Registro · ${formatDuration(it.session?.duration ?? 0)}`,
      icon: <ClockIcon color={it.color} />, color: it.color, item: it,
    });
  }
  activity.sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="flex flex-col gap-3">
      {/* Encabezado de fecha grande */}
      <div className="bg-white rounded-[24px] shadow-[6px_6px_12px_#e6e6e6,-6px_-6px_12px_#ffffff] p-5">
        <div className="flex items-baseline gap-3">
          <span className="text-[42px] font-bold text-[#333] leading-none tabular-nums">{d}</span>
          <div className="flex flex-col">
            <span className="text-[16px] font-semibold text-[#7f70ff] capitalize leading-tight">{weekday}</span>
            <span className="text-[14px] text-[#999] capitalize">{MONTHS[m - 1]} {y}</span>
          </div>
        </div>
      </div>

      {/* Sección de tareas */}
      <div className="bg-white rounded-[24px] shadow-[6px_6px_12px_#e6e6e6,-6px_-6px_12px_#ffffff] p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TaskIcon />
            <span className="text-[15px] font-bold text-[#333]">Tasks</span>
            {pendingItems.length > 0 && <span className="text-[12px] font-semibold text-[#aaa]">{pendingItems.length}</span>}
          </div>
          <button onClick={onNewTask} className="w-7 h-7 rounded-xl bg-[#f0edff] text-[#7f70ff] border-none cursor-pointer flex items-center justify-center active:scale-95 transition-transform">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          </button>
        </div>
        {pendingItems.length === 0 ? (
          <p className="text-[13px] text-[#bbb] py-2 m-0">Sin tareas para este día</p>
        ) : (
          <div className="flex flex-col gap-2">
            {pendingItems.map((it) => (
              <button key={it.id} onClick={() => onSelectItem(it)} className="flex items-center gap-3 w-full p-0 border-none bg-transparent cursor-pointer text-left active:scale-[0.98] transition-transform">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: it.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-[#333] m-0 truncate">{it.title}</p>
                  {it.subtitle && <p className="text-[11px] text-[#aaa] m-0 truncate">{it.subtitle}</p>}
                </div>
                {it.startMin !== undefined && (
                  <span className="text-[11px] font-semibold text-[#999] tabular-nums shrink-0">{formatEventTime(minToHHMM(it.startMin), settings.timeFormat)}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Sección de eventos */}
      <div className="bg-white rounded-[24px] shadow-[6px_6px_12px_#e6e6e6,-6px_-6px_12px_#ffffff] p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <EventIcon />
            <span className="text-[15px] font-bold text-[#333]">Events</span>
            {eventItems.length > 0 && <span className="text-[12px] font-semibold text-[#aaa]">{eventItems.length}</span>}
          </div>
          <button onClick={onNewEvent} className="w-7 h-7 rounded-xl bg-[#eef4ff] text-[#4d7cfe] border-none cursor-pointer flex items-center justify-center active:scale-95 transition-transform">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          </button>
        </div>
        {eventItems.length === 0 ? (
          <p className="text-[13px] text-[#bbb] py-2 m-0">Sin eventos para este día</p>
        ) : (
          <div className="flex flex-col gap-2">
            {eventItems.map((it) => (
              <button key={it.id} onClick={() => onSelectItem(it)} className="flex items-center gap-3 w-full p-0 border-none bg-transparent cursor-pointer text-left active:scale-[0.98] transition-transform">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: it.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-[#333] m-0 truncate">{it.title}</p>
                  {it.subtitle && <p className="text-[11px] text-[#aaa] m-0 truncate">{it.subtitle}</p>}
                </div>
                {it.startMin !== undefined && (
                  <span className="text-[11px] font-semibold text-[#999] tabular-nums shrink-0">
                    {formatEventTime(minToHHMM(it.startMin), settings.timeFormat)}
                    {it.endMin !== undefined && ` - ${formatEventTime(minToHHMM(it.endMin), settings.timeFormat)}`}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Sección de actividad (colapsada por defecto) */}
      {hasActivity && (
        <div className="bg-white rounded-[24px] shadow-[6px_6px_12px_#e6e6e6,-6px_-6px_12px_#ffffff] p-4">
          <button
            onClick={() => setActivityExpanded(!activityExpanded)}
            className="flex items-center justify-between w-full p-0 border-none bg-transparent cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 3" /><circle cx="12" cy="12" r="9" /></svg>
              <span className="text-[15px] font-bold text-[#333]">Actividad del día</span>
              <span className="text-[12px] font-semibold text-[#aaa]">{activity.length}</span>
            </div>
            <motion.svg animate={{ rotate: activityExpanded ? 180 : 0 }} transition={{ duration: 0.2 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></motion.svg>
          </button>
          <AnimatePresence>
            {activityExpanded && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                <div className="flex flex-col gap-2 pt-3">
                  {activity.map((a, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-[11px] font-semibold text-[#aaa] tabular-nums shrink-0 w-[40px] text-right">{a.time}</span>
                      {a.icon}
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

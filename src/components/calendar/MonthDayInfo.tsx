import { useSettings } from '../../context/SettingsContext';
import { formatEventTime } from '../../hooks/useCalendarEvents';
import { minToHHMM, type CalendarItem } from '../../hooks/useCalendarData';

interface Props {
  date: string; // YYYY-MM-DD
  items: CalendarItem[];
  onSelectItem: (i: CalendarItem) => void;
  onNewTask: () => void;
  onNewEvent: () => void;
}

const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

// Círculo con chulo (icono de Tasks)
const TaskSectionIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7f70ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <polyline points="8 12 11 15 16 9" />
  </svg>
);

const EventSectionIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4d7cfe" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

/**
 * Tarjeta consolidada del día: fecha grande + Tasks + Events en una sola tarjeta.
 */
export function MonthDayInfo({ date, items, onSelectItem, onNewTask, onNewEvent }: Props) {
  const { settings } = useSettings();
  const [y, m, d] = date.split('-').map(Number);
  const weekday = WEEKDAYS[new Date(y, m - 1, d).getDay()];

  const pendingItems = items.filter((i) => i.kind === 'pending');
  const eventItems = items.filter((i) => i.kind === 'event');

  return (
    <div className="bg-white rounded-[24px] shadow-[6px_6px_12px_#e6e6e6,-6px_-6px_12px_#ffffff] p-5">
      {/* Encabezado de fecha */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-[42px] font-bold text-[#333] leading-none tabular-nums">{d}</span>
        <div className="flex flex-col justify-center">
          <span className="text-[16px] font-semibold text-[#7f70ff] capitalize leading-tight">{weekday}</span>
          <span className="text-[14px] text-[#999] capitalize">{MONTHS[m - 1]} {y}</span>
        </div>
      </div>

      <div className="h-px bg-[#f0f0f5] mb-4" />

      {/* Sección Tasks */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TaskSectionIcon />
            <span className="text-[15px] font-bold text-[#333]">Tasks</span>
            {pendingItems.length > 0 && <span className="text-[12px] font-semibold text-[#aaa]">{pendingItems.length}</span>}
          </div>
          <button onClick={onNewTask} className="w-7 h-7 rounded-xl bg-[#f0edff] text-[#7f70ff] border-none cursor-pointer flex items-center justify-center active:scale-95 transition-transform">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          </button>
        </div>
        {pendingItems.length === 0 ? (
          <p className="text-[13px] text-[#bbb] py-1 m-0">Sin tareas para este día</p>
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
                  <span className="text-[11px] font-semibold text-[#999] tabular-nums shrink-0 whitespace-nowrap">{formatEventTime(minToHHMM(it.startMin), settings.timeFormat)}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="h-px bg-[#f0f0f5] mb-4" />

      {/* Sección Events */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <EventSectionIcon />
            <span className="text-[15px] font-bold text-[#333]">Events</span>
            {eventItems.length > 0 && <span className="text-[12px] font-semibold text-[#aaa]">{eventItems.length}</span>}
          </div>
          <button onClick={onNewEvent} className="w-7 h-7 rounded-xl bg-[#eef4ff] text-[#4d7cfe] border-none cursor-pointer flex items-center justify-center active:scale-95 transition-transform">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          </button>
        </div>
        {eventItems.length === 0 ? (
          <p className="text-[13px] text-[#bbb] py-1 m-0">Sin eventos para este día</p>
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
                  <span className="text-[11px] font-semibold text-[#999] tabular-nums shrink-0 whitespace-nowrap">
                    {formatEventTime(minToHHMM(it.startMin), settings.timeFormat)}
                    {it.endMin !== undefined && ` - ${formatEventTime(minToHHMM(it.endMin), settings.timeFormat)}`}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { useSettings } from '../../context/SettingsContext';
import { formatEventTime } from '../../hooks/useCalendarEvents';
import { minToHHMM, type CalendarItem } from '../../hooks/useCalendarData';
import { todayKey } from '../../hooks/useTimeTracker';
import { holidayName } from '../../utils/holidays';

interface Props {
  date: string; // YYYY-MM-DD
  items: CalendarItem[];
  /** Tareas pendientes de días anteriores: se muestran en el día de hoy como "Atrasado". */
  overdueItems?: CalendarItem[];
  onSelectItem: (i: CalendarItem) => void;
  onNewTask: () => void;
  onNewEvent: () => void;
}

const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const CARD = 'bg-white rounded-[24px] shadow-[6px_6px_12px_#e6e6e6,-6px_-6px_12px_#ffffff] p-5';

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

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34c77b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 12 9 17 20 6" />
  </svg>
);

const AddButton = ({ tone, onClick }: { tone: 'task' | 'event'; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`w-7 h-7 rounded-xl border-none cursor-pointer flex items-center justify-center active:scale-95 transition-transform ${
      tone === 'task' ? 'bg-[#f0edff] text-[#7f70ff]' : 'bg-[#eef4ff] text-[#4d7cfe]'
    }`}
  >
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
  </button>
);

/** Fila de un ítem del día (tarea, tarea completada o evento). */
function DayRow({ item, late, onSelectItem }: { item: CalendarItem; late?: boolean; onSelectItem: (i: CalendarItem) => void }) {
  const { settings } = useSettings();
  const done = item.kind === 'completed';

  const time = item.startMin !== undefined
    ? `${formatEventTime(minToHHMM(item.startMin), settings.timeFormat)}${item.endMin !== undefined ? ` - ${formatEventTime(minToHHMM(item.endMin), settings.timeFormat)}` : ''}`
    : '';

  return (
    <button
      onClick={() => onSelectItem(item)}
      className="flex items-center gap-3 w-full p-0 border-none bg-transparent cursor-pointer text-left active:scale-[0.98] transition-transform"
    >
      {done ? (
        <span className="shrink-0 flex items-center justify-center" style={{ width: 8 }}><CheckIcon /></span>
      ) : (
        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color }} />
      )}
      <div className="flex-1 min-w-0">
        <p className={`text-[14px] font-medium m-0 truncate ${done ? 'text-[#8b8b97] line-through' : 'text-[#333]'}`}>{item.title}</p>
        {(late || item.subtitle) && (
          <p className="flex items-center gap-1.5 m-0 min-w-0">
            {late && <span className="text-[10px] font-bold uppercase tracking-wide text-[#e5484d] shrink-0">Atrasado</span>}
            {item.subtitle && <span className="text-[11px] text-[#aaa] truncate">{item.subtitle}</span>}
          </p>
        )}
      </div>
      {time && (
        <span className="text-[11px] font-semibold text-[#999] tabular-nums shrink-0 whitespace-nowrap">{time}</span>
      )}
    </button>
  );
}

/**
 * Tarjeta del día seleccionado en la vista de mes.
 * Hoy y días futuros: Tasks + Events con sus botones "+".
 * Días pasados: solo lo completado ese día (minimalista, sin botones ni vacíos).
 */
export function MonthDayInfo({ date, items, overdueItems = [], onSelectItem, onNewTask, onNewEvent }: Props) {
  const [y, m, d] = date.split('-').map(Number);
  const weekday = WEEKDAYS[new Date(y, m - 1, d).getDay()];
  const today = todayKey();
  const isPast = date < today;
  const holiday = holidayName(date);

  const pending = items.filter((i) => i.kind === 'pending');
  const completed = items.filter((i) => i.kind === 'completed');
  const eventsOfDay = items.filter((i) => i.kind === 'event');
  const late = date === today ? overdueItems : [];
  const tasks = isPast ? completed : [...late, ...pending];

  const header = (
    <div className="flex items-center gap-3">
      <span className={`font-bold text-[#333] leading-none tabular-nums ${isPast ? 'text-[32px]' : 'text-[42px]'}`}>{d}</span>
      <div className="flex flex-col justify-center min-w-0">
        <span className={`text-[16px] font-semibold capitalize leading-tight ${isPast ? 'text-[#9a9aa8]' : 'text-[#7f70ff]'}`}>{weekday}</span>
        <span className="text-[14px] text-[#999] capitalize">{MONTHS[m - 1]} {y}</span>
        {holiday && (
          <span className="text-[12px] font-semibold text-[#c99a06] leading-tight truncate">Festivo · {holiday}</span>
        )}
      </div>
    </div>
  );

  // ─── Día pasado: solo lo completado ───
  if (isPast) {
    if (tasks.length === 0 && eventsOfDay.length === 0) {
      return <div className={CARD}>{header}</div>;
    }
    return (
      <div className={CARD}>
        <div className="mb-4">{header}</div>
        <div className="h-px bg-[#f0f0f5] mb-4" />
        <div className="flex flex-col gap-4">
          {tasks.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-2">
                <TaskSectionIcon />
                <span className="text-[15px] font-bold text-[#333]">Tasks</span>
                <span className="text-[12px] font-semibold text-[#aaa]">{tasks.length}</span>
              </div>
              <div className="flex flex-col gap-2">
                {tasks.map((it) => <DayRow key={it.id} item={it} onSelectItem={onSelectItem} />)}
              </div>
            </section>
          )}
          {eventsOfDay.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-2">
                <EventSectionIcon />
                <span className="text-[15px] font-bold text-[#333]">Events</span>
                <span className="text-[12px] font-semibold text-[#aaa]">{eventsOfDay.length}</span>
              </div>
              <div className="flex flex-col gap-2">
                {eventsOfDay.map((it) => <DayRow key={it.id} item={it} onSelectItem={onSelectItem} />)}
              </div>
            </section>
          )}
        </div>
      </div>
    );
  }

  // ─── Hoy y días futuros ───
  return (
    <div className={CARD}>
      <div className="mb-4">{header}</div>
      <div className="h-px bg-[#f0f0f5] mb-4" />

      {/* Sección Tasks */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TaskSectionIcon />
            <span className="text-[15px] font-bold text-[#333]">Tasks</span>
            {tasks.length > 0 && <span className="text-[12px] font-semibold text-[#aaa]">{tasks.length}</span>}
          </div>
          <AddButton tone="task" onClick={onNewTask} />
        </div>
        {tasks.length === 0 ? (
          <p className="text-[13px] text-[#bbb] py-1 m-0">Sin tareas para este día</p>
        ) : (
          <div className="flex flex-col gap-2">
            {tasks.map((it) => (
              <DayRow key={it.id} item={it} late={late.some((l) => l.id === it.id)} onSelectItem={onSelectItem} />
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
            {eventsOfDay.length > 0 && <span className="text-[12px] font-semibold text-[#aaa]">{eventsOfDay.length}</span>}
          </div>
          <AddButton tone="event" onClick={onNewEvent} />
        </div>
        {eventsOfDay.length === 0 ? (
          <p className="text-[13px] text-[#bbb] py-1 m-0">Sin eventos para este día</p>
        ) : (
          <div className="flex flex-col gap-2">
            {eventsOfDay.map((it) => <DayRow key={it.id} item={it} onSelectItem={onSelectItem} />)}
          </div>
        )}
      </div>
    </div>
  );
}

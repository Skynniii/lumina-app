import { parseKey, type CalendarItem } from '../../hooks/useCalendarData';

interface Props {
  date: string; // YYYY-MM-DD
  items: CalendarItem[];
  onSelectItem: (i: CalendarItem) => void;
}

const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/** Ancho de la columna de las horas en `TimeGrid`. */
const TIME_COL = 40;

const TaskIcon = ({ color }: { color: string }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><polyline points="8 12 11 15 16 9" /></svg>
);
const EventIcon = ({ color }: { color: string }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
);
const SessionIcon = ({ color }: { color: string }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" /></svg>
);

/** Icono de la familia del ítem: tarea, evento o registro. */
function FamilyIcon({ item }: { item: CalendarItem }) {
  if (item.kind === 'event') return <EventIcon color={item.color} />;
  if (item.kind === 'session') return <SessionIcon color={item.color} />;
  return <TaskIcon color={item.color} />;
}

/**
 * Cabecera de la vista de día: el número del día centrado sobre la columna de
 * las horas y, a su derecha, el día de la semana y las barritas de tareas y
 * eventos (alineadas con las cajas blancas de la rejilla).
 */
export function DayHeadline({ date, items, onSelectItem }: Props) {
  const dt = parseKey(date);

  return (
    <div
      className="grid gap-x-[3px] px-1 pt-3 pb-3 items-start"
      style={{ gridTemplateColumns: `${TIME_COL}px minmax(0, 1fr)` }}
    >
      <span className="text-[30px] font-bold text-[#333] leading-none tabular-nums text-center">{dt.getDate()}</span>

      <div className="min-w-0 flex flex-col gap-1">
        <div className="flex items-baseline gap-2 min-w-0">
          <span className="text-[15px] font-semibold text-[#7f70ff] capitalize leading-tight">{WEEKDAYS[dt.getDay()]}</span>
          <span className="text-[12px] text-[#999] capitalize leading-tight truncate">{MONTHS[dt.getMonth()]} {dt.getFullYear()}</span>
        </div>

        {items.length > 0 && (
          <div className="flex flex-col gap-1.5 mt-1">
            {items.map((it) => (
              <button
                key={it.id}
                onClick={() => onSelectItem(it)}
                className="flex items-center gap-2 w-full min-w-0 rounded-full pl-2 pr-3 py-[5px] border-none cursor-pointer text-left active:scale-[0.99] transition-transform"
                style={{ background: `${it.color}26` }}
              >
                <span className="shrink-0 flex"><FamilyIcon item={it} /></span>
                <span className={`flex-1 min-w-0 text-[13px] font-medium truncate ${it.kind === 'completed' ? 'text-[#a0a0a0] line-through' : 'text-[#333]'}`}>
                  {it.title}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { itemColor, parseKey, type CalendarItem } from '../../hooks/useCalendarData';
import { holidayItem } from '../../utils/holidayItem';
import { sortByFamily } from '../../utils/itemOrder';

interface Props {
  date: string; // YYYY-MM-DD
  items: CalendarItem[];
  /** Tareas completadas del día: solo si el ajuste las muestra. */
  completedItems?: CalendarItem[];
  /** Tareas atrasadas: solo en el día de hoy, marcadas como "Atrasado". */
  overdueItems?: CalendarItem[];
  onSelectItem: (i: CalendarItem) => void;
}

const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

/** Ancho de la columna de las horas en `TimeGrid` + su separación. */
const DAY_COL_OFFSET = 47;

const TaskIcon = ({ color }: { color: string }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><polyline points="8 12 11 15 16 9" /></svg>
);
const EventIcon = ({ color }: { color: string }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
);
const SessionIcon = ({ color }: { color: string }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" /></svg>
);
const CakeIcon = ({ color }: { color: string }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8" /><path d="M4 16h16" /><path d="M12 8V5" /><circle cx="12" cy="4" r="1" /></svg>
);

const HolidayIcon = ({ color }: { color: string }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l2.6 5.6 6.1.8-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.4l6.1-.8z" /></svg>
);

/** Icono de la familia del ítem: festivo, cumpleaños, evento, registro o tarea. */
function FamilyIcon({ item, color }: { item: CalendarItem; color: string }) {
  if (item.holiday) return <HolidayIcon color={color} />;
  if (item.birthday) return <CakeIcon color={color} />;
  if (item.kind === 'event') return <EventIcon color={color} />;
  if (item.kind === 'session') return <SessionIcon color={color} />;
  return <TaskIcon color={color} />;
}

/**
 * Cabecera de la vista de día en dos filas: arriba el número del día (que llega
 * deslizándose desde la cabecera de la semana) con el día de la semana a su
 * derecha, y debajo las tareas y eventos del día alineados con la columna de
 * las cajas blancas (no con la de las horas).
 */
export function DayHeadline({ date, items, completedItems = [], overdueItems = [], onSelectItem }: Props) {
  const dt = parseKey(date);
  const holiday = holidayItem(date);
  // Orden: festivo, cumpleaños, tareas (atrasadas incluidas), eventos y completadas
  const rows = sortByFamily([
    ...(holiday ? [holiday] : []),
    ...overdueItems,
    ...items,
    ...completedItems,
  ]);

  return (
    <div className="flex flex-col gap-2.5 pt-3 pb-3">
      {/* Fila 1: número del día + día de la semana */}
      <div className="flex items-center gap-2.5 min-w-0 px-3">
        <span className="text-[34px] font-bold text-[#333] leading-none tabular-nums">
          {dt.getDate()}
        </span>
        <span className="text-[17px] font-semibold text-[#7f70ff] capitalize leading-none pb-[3px]">
          {WEEKDAYS[dt.getDay()]}
        </span>
      </div>

      {/* Fila 2: tareas y eventos del día, alineados con la columna del día */}
      {rows.length > 0 && (
        <div className="pr-1" style={{ paddingLeft: DAY_COL_OFFSET }}>
          <div className="flex flex-col gap-1.5 overflow-hidden">
            {rows.map((it) => {
              const late = overdueItems.some((o) => o.id === it.id);
              const done = it.kind === 'completed';
              const color = itemColor(it);
              const pillStyle = { background: late ? '#e5484d1a' : `${color}${done ? '14' : '26'}` };
              const content = (
                <>
                  <span className="shrink-0 flex" style={done ? { opacity: 0.5 } : undefined}>
                    <FamilyIcon item={it} color={color} />
                  </span>
                  {late && <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide text-[#e5484d]">Atrasado</span>}
                  <span className={`flex-1 min-w-0 text-[13px] truncate ${done ? 'text-[#aeadb8] line-through' : 'text-[#333] font-medium'}`}>
                    {it.title}
                  </span>
                </>
              );

              // Los festivos no se pueden abrir ni editar
              if (it.holiday) {
                return (
                  <div key={it.id} className="flex items-center gap-2 w-full min-w-0 rounded-full pl-2 pr-3 py-[5px]" style={pillStyle}>
                    {content}
                  </div>
                );
              }

              return (
                <button
                  key={it.id}
                  onClick={() => onSelectItem(it)}
                  className="flex items-center gap-2 w-full min-w-0 rounded-full pl-2 pr-3 py-[5px] border-none cursor-pointer text-left active:scale-[0.99] transition-transform"
                  style={pillStyle}
                >
                  {content}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

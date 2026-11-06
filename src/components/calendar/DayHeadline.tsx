import { motion } from 'framer-motion';
import { parseKey, type CalendarItem } from '../../hooks/useCalendarData';

interface Props {
  date: string; // YYYY-MM-DD
  items: CalendarItem[];
  /** Tareas atrasadas: solo en el día de hoy, marcadas como "Atrasado". */
  overdueItems?: CalendarItem[];
  onSelectItem: (i: CalendarItem) => void;
}

const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

/** Muelle compartido con el número de la cabecera de la semana. */
const DAY_NUM_TRANSITION = { type: 'spring' as const, stiffness: 260, damping: 30 };

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

/** Icono de la familia del ítem: tarea, evento, cumpleaños o registro. */
function FamilyIcon({ item }: { item: CalendarItem }) {
  if (item.birthday) return <CakeIcon color={item.color} />;
  if (item.kind === 'event') return <EventIcon color={item.color} />;
  if (item.kind === 'session') return <SessionIcon color={item.color} />;
  return <TaskIcon color={item.color} />;
}

/**
 * Cabecera de la vista de día en dos filas: arriba el número del día (que llega
 * deslizándose desde la cabecera de la semana) con el día de la semana a su
 * derecha, y debajo las tareas y eventos del día alineados con la columna de
 * las cajas blancas (no con la de las horas).
 */
export function DayHeadline({ date, items, overdueItems = [], onSelectItem }: Props) {
  const dt = parseKey(date);
  const rows = [...overdueItems, ...items];

  return (
    <div className="flex flex-col gap-2.5 pt-3 pb-3">
      {/* Fila 1: número del día + día de la semana */}
      <div className="flex items-center gap-2.5 min-w-0 px-3">
        <motion.span
          layoutId={`day-num-${date}`}
          transition={DAY_NUM_TRANSITION}
          className="text-[34px] font-bold text-[#333] leading-none tabular-nums"
        >
          {dt.getDate()}
        </motion.span>
        <motion.span
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25, delay: 0.06, ease: 'easeOut' }}
          className="text-[17px] font-semibold text-[#7f70ff] capitalize leading-none pb-[3px]"
        >
          {WEEKDAYS[dt.getDay()]}
        </motion.span>
      </div>

      {/* Fila 2: tareas y eventos del día, alineados con la columna del día */}
      {rows.length > 0 && (
        <div className="pr-1" style={{ paddingLeft: DAY_COL_OFFSET }}>
          <motion.div
            initial={{ width: '20%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-1.5 overflow-hidden"
          >
            {rows.map((it) => {
              const late = overdueItems.some((o) => o.id === it.id);
              return (
                <motion.button
                  key={it.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => onSelectItem(it)}
                  className="flex items-center gap-2 w-full min-w-0 rounded-full pl-2 pr-3 py-[5px] border-none cursor-pointer text-left active:scale-[0.99] transition-transform"
                  style={{ background: late ? '#e5484d1a' : `${it.color}26` }}
                >
                  <span className="shrink-0 flex"><FamilyIcon item={it} /></span>
                  {late && <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide text-[#e5484d]">Atrasado</span>}
                  <span className={`flex-1 min-w-0 text-[13px] font-medium truncate ${it.kind === 'completed' ? 'text-[#a0a0a0] line-through' : 'text-[#333]'}`}>
                    {it.title}
                  </span>
                </motion.button>
              );
            })}
          </motion.div>
        </div>
      )}
    </div>
  );
}

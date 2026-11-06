import type { ReactElement } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { dateKey } from '../../hooks/useCalendarEvents';
import {
  DAY_MARKER_META, dayMarkerKeys, parseKey, type CalendarItem,
} from '../../hooks/useCalendarData';
import { weekdayShort } from '../../utils/calendarDates';

interface Props {
  days: string[]; // 7 fechas YYYY-MM-DD (según el inicio de semana)
  itemsByDate: Map<string, CalendarItem[]>;
  selectedDate: string;
  /** Días con tareas completadas: se marca un punto bajo el número. */
  completedKeys?: Set<string>;
  onOpenDay: (key: string) => void;
}

/** Rojo de las tareas atrasadas (días ya pasados). */
const OVERDUE_COLOR = '#e5484d';

const TaskBarIcon = ({ color }: { color: string }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><polyline points="8 12 11 15 16 9" /></svg>
);
const EventBarIcon = ({ color }: { color: string }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
);
const ClockBarIcon = ({ color }: { color: string }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" /></svg>
);

const BAR_ICONS: Record<string, (p: { color: string }) => ReactElement> = {
  task: TaskBarIcon,
  event: EventBarIcon,
  session: ClockBarIcon,
};

/**
 * Cabecera de la semana: días con su fecha y, debajo, una sola "barrita" por
 * familia de información (Tasks, Events, Registros…) aunque haya varias.
 * Tocar el número abre la vista de día con la transición animada.
 */
export function WeekHeader({ days, itemsByDate, selectedDate, completedKeys, onOpenDay }: Props) {
  const { settings } = useSettings();
  const today = dateKey();

  return (
    <div className="grid bg-[#f2f1f6]" style={{ gridTemplateColumns: `40px repeat(${days.length}, minmax(0, 1fr))` }}>
      <div />
      {days.map((d) => {
        const dt = parseKey(d);
        const isToday = d === today;
        const isSel = d === selectedDate;
        const isOverdueDay = d < today;
        const keys = dayMarkerKeys(itemsByDate.get(d) ?? []);
        return (
          <div key={d} className="flex flex-col items-center gap-1 pt-1.5 pb-2 min-w-0">
            <span className={`text-[10px] font-semibold leading-none uppercase ${isToday || isSel ? 'text-[#7f70ff]' : 'text-[#aaa]'}`}>
              {weekdayShort(settings.language, dt.getDay())}
            </span>
            <button
              onClick={() => onOpenDay(d)}
              className="flex items-center justify-center w-8 h-8 p-0 border-none bg-transparent cursor-pointer"
              aria-label={`Ver el día ${dt.getDate()}`}
            >
              <span
                className={`flex items-center justify-center w-7 h-7 rounded-[9px] text-[13px] leading-none tabular-nums ${
                  isToday ? 'bg-[#7f70ff] text-white font-bold' : isSel ? 'bg-[#f0edff] text-[#7f70ff] font-bold' : 'text-[#555] font-medium'
                }`}
              >
                {dt.getDate()}
              </span>
            </button>
            {/* Tareas completadas: punto morado bajo el número */}
            <span
              className="w-[4px] h-[4px] rounded-full -mt-[3px]"
              style={{ background: completedKeys?.has(d) ? '#7f70ff' : 'transparent' }}
            />
            <div className="w-full flex flex-col gap-1 px-[2px] mt-[2px]">
              {keys.map((k) => {
                const meta = DAY_MARKER_META[k];
                const Icon = BAR_ICONS[k];
                // Tareas de un día ya pasado: atrasadas, en rojo
                const color = k === 'task' && isOverdueDay ? OVERDUE_COLOR : meta.color;
                // En móvil la columna es tan estrecha que la etiqueta no cabe:
                // solo el icono (el color ya identifica la familia).
                return (
                  <span
                    key={k}
                    className="flex items-center justify-center sm:justify-start gap-1 rounded-full px-1 sm:pl-1.5 sm:pr-2 py-[4px] w-full min-w-0"
                    style={{ background: `${color}1a` }}
                  >
                    {Icon && <span className="shrink-0 flex"><Icon color={color} /></span>}
                    <span
                      className="hidden sm:block flex-1 min-w-0 truncate text-[12px] font-bold leading-none"
                      style={{ color }}
                    >
                      {meta.label}
                    </span>
                  </span>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

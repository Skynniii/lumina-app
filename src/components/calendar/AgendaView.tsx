import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from 'react';
import { motion } from 'framer-motion';
import { useSettings } from '../../context/SettingsContext';
import { formatEventTime, dateKey, MONTHS } from '../../hooks/useCalendarEvents';
import { LAYER_META, minToHHMM, type CalendarItem } from '../../hooks/useCalendarData';
import { todayKey } from '../../hooks/useTimeTracker';
import { smoothScrollTo } from '../../utils/smoothScroll';
import { weekStartIndex, weekdayShort } from '../../utils/calendarDates';
import { MonthArt } from './MonthArt';

interface Props {
  itemsByDate: Map<string, CalendarItem[]>;
  onSelectItem: (i: CalendarItem) => void;
  /** Tocar el número de un día abre su vista diaria. */
  onOpenDay: (key: string) => void;
  todayPulse?: number;
  /** Contenedor con scroll de la agenda (para situar el día de hoy). */
  scrollRef: RefObject<HTMLDivElement | null>;
}

/** Años de agenda hacia atrás y hacia adelante desde el mes actual. */
const YEARS_AROUND = 5;
const MONTHS_TOTAL = YEARS_AROUND * 12;

type AgendaDay = { key: string; date: Date; items: CalendarItem[] };
type AgendaWeek = { label: string; days: AgendaDay[] };
type AgendaMonth = { year: number; month: number; weeks: AgendaWeek[] };

const ICON = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', strokeWidth: 2.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

const TaskIcon = ({ color }: { color: string }) => (
  <svg {...ICON} stroke={color}><circle cx="12" cy="12" r="9" /><polyline points="8 12 11 15 16 9" /></svg>
);
const EventIcon = ({ color }: { color: string }) => (
  <svg {...ICON} stroke={color}><rect x="3" y="5" width="18" height="16" rx="2" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
);
const ClockIcon = ({ color }: { color: string }) => (
  <svg {...ICON} stroke={color}><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" /></svg>
);
const CakeIcon = ({ color }: { color: string }) => (
  <svg {...ICON} stroke={color}><path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8" /><path d="M4 16h16" /><path d="M12 8V5" /><circle cx="12" cy="4" r="1" /></svg>
);

/**
 * Vista de agenda: cinco años atrás y cinco adelante, con una ilustración por
 * mes y las semanas de cada mes (solo las que tienen algo). Las tareas se pintan
 * con el color de su actividad (barrita a la izquierda + tarjeta suave + icono)
 * y los eventos a color pleno con su icono.
 */
function AgendaViewBase({ itemsByDate, onSelectItem, onOpenDay, todayPulse = 0, scrollRef }: Props) {
  const { settings } = useSettings();
  const today = todayKey();
  /** 0 = domingo, 1 = lunes (ajuste "Día de inicio de semana"). */
  const weekStartDay = weekStartIndex(settings.weekStart);
  const todayRef = useRef<HTMLDivElement>(null);

  const months = useMemo<AgendaMonth[]>(() => {
    const base = new Date();
    const result: AgendaMonth[] = [];

    for (let offset = -MONTHS_TOTAL; offset <= MONTHS_TOTAL; offset++) {
      const d = new Date(base.getFullYear(), base.getMonth() + offset, 1);
      const year = d.getFullYear();
      const month = d.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      const weeks: AgendaWeek[] = [];
      let currentWeek: AgendaDay[] = [];
      let weekStart: Date | null = null;
      // Último día de la semana, según el ajuste de inicio de semana
      const weekEnd = (weekStartDay + 6) % 7;

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const key = dateKey(date);
        if (!weekStart) weekStart = date;
        const items = itemsByDate.get(key) ?? [];
        // Solo se listan los días con algo y el día de hoy (aunque esté vacío)
        if (items.length > 0 || key === today) currentWeek.push({ key, date, items });

        // Cerrar semana en el último día de la semana o el último del mes
        if (date.getDay() === weekEnd || day === daysInMonth) {
          if (weekStart) {
            const ws: Date = weekStart;
            const we = date;
            const label = ws.getMonth() === we.getMonth()
              ? `${ws.getDate()} – ${we.getDate()} ${MONTHS[we.getMonth()].slice(0, 3)} ${we.getFullYear()}`
              : `${ws.getDate()} ${MONTHS[ws.getMonth()].slice(0, 3)} – ${we.getDate()} ${MONTHS[we.getMonth()].slice(0, 3)} ${we.getFullYear()}`;
            weeks.push({ label, days: currentWeek });
          }
          currentWeek = [];
          weekStart = null;
        }
      }

      result.push({ year, month, weeks });
    }
    return result;
  }, [itemsByDate, today, weekStartDay]);

  /** Deja el día de hoy como primero de la agenda. */
  const scrollToToday = useCallback((smooth: boolean) => {
    const scroller = scrollRef.current;
    const target = todayRef.current;
    if (!scroller || !target) return;
    const top = scroller.scrollTop + target.getBoundingClientRect().top - scroller.getBoundingClientRect().top - 6;
    if (smooth) smoothScrollTo(scroller, top, 700);
    else scroller.scrollTop = Math.max(0, top);
  }, [scrollRef]);

  // Al entrar en la agenda, hoy queda de primero (tenga o no ítems)
  useLayoutEffect(() => {
    scrollToToday(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // El botón "Hoy" se desliza hasta la fecha actual (no salta de golpe)
  useEffect(() => {
    if (todayPulse) scrollToToday(true);
  }, [todayPulse, scrollToToday]);

  return (
    <div className="flex flex-col gap-6">
      {months.map(({ year, month, weeks }) => (
        <div key={`${year}-${month}`} data-agenda-month={`${year}-${String(month + 1).padStart(2, '0')}`}>
          {/* Ilustración del mes con su nombre encima */}
          <div className="relative">
            <MonthArt month={month} />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-11 rounded-b-[18px] bg-gradient-to-t from-white via-white/60 to-transparent" />
            <span className="absolute left-3 bottom-2 text-[17px] font-bold text-[#333] capitalize">{MONTHS[month]} {year}</span>
          </div>

          {weeks.map((week, wi) => (
            <div key={wi} className="mt-4">
              {/* Etiqueta de la semana */}
              <p className="text-[11px] font-medium text-[#9a9aa8] m-0 mb-2">{week.label}</p>

              <div className="flex flex-col gap-3">
                {week.days.map(({ key, date, items }) => {
                  const isToday = key === today;
                  return (
                    <motion.div
                      key={key}
                      ref={isToday ? todayRef : undefined}
                      data-agenda-today={isToday ? '' : undefined}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-start gap-3"
                    >
                      <button
                        onClick={() => onOpenDay(key)}
                        className="w-9 shrink-0 flex flex-col items-center p-0 pt-0.5 border-none bg-transparent cursor-pointer active:scale-95 transition-transform"
                      >
                        <span className={`text-[11px] font-medium leading-none ${isToday ? 'text-[#7f70ff]' : 'text-[#8b8b97]'}`}>
                          {weekdayShort(settings.language, date.getDay())}
                        </span>
                        <span className={`text-[22px] font-bold leading-tight tabular-nums ${isToday ? 'text-[#7f70ff]' : 'text-[#333]'}`}>
                          {date.getDate()}
                        </span>
                      </button>

                      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                        {items.length === 0 ? (
                          <p className="text-[12px] text-[#bbb] m-0 py-1">Día sin actividad</p>
                        ) : (
                          items.map((it) => {
                            const time = it.startMin !== undefined
                              ? `${formatEventTime(minToHHMM(it.startMin), settings.timeFormat)}${it.endMin !== undefined ? ` – ${formatEventTime(minToHHMM(it.endMin), settings.timeFormat)}` : ''}`
                              : '';
                            const second = time || it.subtitle || '';
                            const isTask = it.kind === 'pending' || it.kind === 'completed';
                            const accent = it.accent || LAYER_META.pending.color;
                            const Icon = it.birthday ? CakeIcon : isTask ? TaskIcon : it.kind === 'event' ? EventIcon : ClockIcon;
                            const iconColor = isTask ? accent : '#ffffff';

                            return (
                              <button
                                key={it.id}
                                onClick={() => onSelectItem(it)}
                                className="w-full min-w-0 text-left rounded-[10px] px-3 py-2 border-none cursor-pointer active:scale-[0.99] transition-transform"
                                style={isTask
                                  ? { background: `${accent}26`, borderLeft: `3px solid ${accent}`, paddingLeft: 10 }
                                  : { background: it.color }}
                              >
                                <span className="flex items-center gap-2.5 min-w-0">
                                  <span className="shrink-0 flex items-center justify-center"><Icon color={iconColor} /></span>
                                  <span className="flex-1 min-w-0">
                                    <span className={`block text-[13px] font-semibold leading-tight truncate ${isTask ? (it.kind === 'completed' ? 'text-[#a0a0a0] line-through' : 'text-[#3a3a44]') : 'text-white'}`}>
                                      {it.title}
                                    </span>
                                    {second && (
                                      <span className={`block text-[11px] leading-tight truncate mt-0.5 ${isTask ? 'text-[#8b8b97]' : 'text-white/85'}`}>{second}</span>
                                    )}
                                  </span>
                                </span>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export const AgendaView = memo(AgendaViewBase);

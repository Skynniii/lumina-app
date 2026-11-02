import { useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { useSettings } from '../../context/SettingsContext';
import { formatEventTime, dateKey, MONTHS } from '../../hooks/useCalendarEvents';
import { LAYER_META, minToHHMM, type CalendarItem } from '../../hooks/useCalendarData';
import { todayKey } from '../../hooks/useTimeTracker';
import { MonthArt } from './MonthArt';

interface Props {
  itemsByDate: Map<string, CalendarItem[]>;
  selectedDate: string;
  onSelectDate: (d: string) => void;
  onSelectItem: (i: CalendarItem) => void;
  anchor: Date;
  todayPulse?: number;
}

const SHORT_WEEKDAY = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/** Meses visibles hacia atrás y hacia adelante desde el mes actual. */
const MONTHS_AROUND = 12;

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

/**
 * Vista de agenda: de un año atrás a un año adelante, con una ilustración por
 * mes y todas las semanas del mes (tengan o no actividad). Las tareas se pintan
 * con el color de su actividad (barrita a la izquierda + tarjeta suave + icono)
 * y los eventos a color pleno con su icono.
 */
export function AgendaView({ itemsByDate, onSelectDate, onSelectItem, anchor, todayPulse = 0 }: Props) {
  const { settings } = useSettings();
  const today = todayKey();
  const currentRef = useRef<HTMLDivElement>(null);

  const months = useMemo(() => {
    const result: { year: number; month: number; weeks: { label: string; days: { key: string; date: Date; items: CalendarItem[] }[] }[] }[] = [];

    for (let offset = -MONTHS_AROUND; offset <= MONTHS_AROUND; offset++) {
      const d = new Date(anchor.getFullYear(), anchor.getMonth() + offset, 1);
      const year = d.getFullYear();
      const month = d.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      // Agrupar días por semana (lunes-domingo): todas las semanas se listan
      const weeks: { label: string; days: { key: string; date: Date; items: CalendarItem[] }[] }[] = [];
      let currentWeek: { key: string; date: Date; items: CalendarItem[] }[] = [];

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const key = dateKey(date);
        currentWeek.push({ key, date, items: itemsByDate.get(key) ?? [] });

        // Cerrar semana en domingo o último día del mes
        if (date.getDay() === 0 || day === daysInMonth) {
          const ws = currentWeek[0].date;
          const we = currentWeek[currentWeek.length - 1].date;
          const label = ws.getMonth() === we.getMonth()
            ? `${ws.getDate()} – ${we.getDate()} ${MONTHS[we.getMonth()].slice(0, 3)} ${we.getFullYear()}`
            : `${ws.getDate()} ${MONTHS[ws.getMonth()].slice(0, 3)} – ${we.getDate()} ${MONTHS[we.getMonth()].slice(0, 3)} ${we.getFullYear()}`;
          weeks.push({ label, days: [...currentWeek] });
          currentWeek = [];
        }
      }

      result.push({ year, month, weeks });
    }
    return result;
  }, [anchor, itemsByDate]);

  // El botón "Hoy" baja hasta el mes en curso
  useEffect(() => {
    if (!todayPulse) return;
    currentRef.current?.scrollIntoView({ block: 'start' });
  }, [todayPulse]);

  return (
    <div className="flex flex-col gap-6">
      {months.map(({ year, month, weeks }) => {
        const isAnchorMonth = year === anchor.getFullYear() && month === anchor.getMonth();
        return (
          <div key={`${year}-${month}`} ref={isAnchorMonth ? currentRef : undefined}>
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

                {/* Días con actividad */}
                <div className="flex flex-col gap-3">
                  {week.days
                    .filter((d) => d.items.length > 0 || d.key === today)
                    .map(({ key, date, items }) => {
                      const isToday = key === today;
                      return (
                        <motion.div
                          key={key}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-start gap-3"
                        >
                          <button
                            onClick={() => onSelectDate(key)}
                            className="w-9 shrink-0 flex flex-col items-center p-0 pt-0.5 border-none bg-transparent cursor-pointer"
                          >
                            <span className={`text-[11px] font-medium leading-none ${isToday ? 'text-[#7f70ff]' : 'text-[#8b8b97]'}`}>
                              {SHORT_WEEKDAY[date.getDay()]}
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
                                const Icon = isTask ? TaskIcon : it.kind === 'event' ? EventIcon : ClockIcon;
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
        );
      })}
    </div>
  );
}

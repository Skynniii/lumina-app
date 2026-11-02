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
}

const SHORT_WEEKDAY = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/** Meses visibles hacia atrás y hacia adelante desde el mes actual. */
const MONTHS_AROUND = 12;

const TaskIcon = ({ color }: { color: string }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><polyline points="8 12 11 15 16 9" /></svg>
);
const EventIcon = ({ color }: { color: string }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
);
const ClockIcon = ({ color }: { color: string }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" /></svg>
);

/**
 * Vista de agenda: de un año atrás a un año adelante, con una ilustración por
 * mes. Las tareas se pintan con el color de su actividad (barrita a la
 * izquierda + tarjeta suave + icono) y los eventos a color pleno con su icono.
 */
export function AgendaView({ itemsByDate, onSelectDate, onSelectItem, anchor }: Props) {
  const { settings } = useSettings();
  const today = todayKey();
  const currentRef = useRef<HTMLDivElement>(null);
  const scrolledOnce = useRef(false);

  const months = useMemo(() => {
    const result: { year: number; month: number; weeks: { label: string; days: { key: string; date: Date; items: CalendarItem[] }[] }[] }[] = [];

    for (let offset = -MONTHS_AROUND; offset <= MONTHS_AROUND; offset++) {
      const d = new Date(anchor.getFullYear(), anchor.getMonth() + offset, 1);
      const year = d.getFullYear();
      const month = d.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      // Agrupar días por semana (lunes-domingo)
      const weeks: { label: string; days: { key: string; date: Date; items: CalendarItem[] }[] }[] = [];
      let currentWeek: { key: string; date: Date; items: CalendarItem[] }[] = [];

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const key = dateKey(date);
        const items = itemsByDate.get(key) ?? [];
        currentWeek.push({ key, date, items });

        // Cerrar semana en domingo o último día del mes
        if (date.getDay() === 0 || day === daysInMonth) {
          const hasItems = currentWeek.some((w) => w.items.length > 0);
          const hasToday = currentWeek.some((w) => w.key === today);
          if (hasItems || hasToday) {
            const ws = currentWeek[0].date;
            const we = currentWeek[currentWeek.length - 1].date;
            const label = ws.getMonth() === we.getMonth()
              ? `${ws.getDate()} – ${we.getDate()} ${MONTHS[we.getMonth()].slice(0, 3)} ${we.getFullYear()}`
              : `${ws.getDate()} ${MONTHS[ws.getMonth()].slice(0, 3)} – ${we.getDate()} ${MONTHS[we.getMonth()].slice(0, 3)} ${we.getFullYear()}`;
            weeks.push({ label, days: [...currentWeek] });
          }
          currentWeek = [];
        }
      }

      result.push({ year, month, weeks });
    }
    return result;
  }, [anchor, itemsByDate, today]);

  // Al abrir la agenda se baja hasta el mes actual (los anteriores quedan arriba)
  useEffect(() => {
    if (scrolledOnce.current) return;
    const el = currentRef.current;
    if (!el) return;
    el.scrollIntoView({ block: 'start' });
    scrolledOnce.current = true;
  }, [months]);

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

                                if (isTask) {
                                  // Tarea: barrita del color de su actividad + tarjeta suave
                                  return (
                                    <button
                                      key={it.id}
                                      onClick={() => onSelectItem(it)}
                                      className="w-full min-w-0 text-left rounded-[10px] pl-2.5 pr-3 py-2 border-none cursor-pointer active:scale-[0.99] transition-transform"
                                      style={{ background: `${accent}26`, borderLeft: `3px solid ${accent}` }}
                                    >
                                      <span className="flex items-center gap-2 min-w-0">
                                        <span className="shrink-0 flex"><TaskIcon color={accent} /></span>
                                        <span className={`flex-1 min-w-0 text-[13px] font-semibold leading-tight truncate text-[#3a3a44] ${it.kind === 'completed' ? 'line-through opacity-70' : ''}`}>
                                          {it.title}
                                        </span>
                                      </span>
                                      {second && (
                                        <span className="block text-[11px] leading-tight truncate text-[#8b8b97] mt-0.5 pl-[20px]">{second}</span>
                                      )}
                                    </button>
                                  );
                                }

                                // Eventos y registros: color pleno con su icono
                                const Icon = it.kind === 'event' ? EventIcon : ClockIcon;
                                return (
                                  <button
                                    key={it.id}
                                    onClick={() => onSelectItem(it)}
                                    className="w-full min-w-0 text-left rounded-[10px] px-3 py-2 border-none cursor-pointer active:scale-[0.99] transition-transform"
                                    style={{ background: it.color }}
                                  >
                                    <span className="flex items-center gap-2 min-w-0">
                                      <span className="shrink-0 flex"><Icon color="#ffffff" /></span>
                                      <span className={`flex-1 min-w-0 text-[13px] font-semibold leading-tight truncate text-white ${it.kind === 'completed' ? 'line-through opacity-80' : ''}`}>
                                        {it.title}
                                      </span>
                                    </span>
                                    {second && (
                                      <span className="block text-[11px] leading-tight truncate text-white/85 mt-0.5 pl-[20px]">{second}</span>
                                    )}
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

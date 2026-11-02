import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useSettings } from '../../context/SettingsContext';
import { formatEventTime, dateKey, MONTHS } from '../../hooks/useCalendarEvents';
import { minToHHMM, type CalendarItem } from '../../hooks/useCalendarData';
import { todayKey } from '../../hooks/useTimeTracker';

interface Props {
  itemsByDate: Map<string, CalendarItem[]>;
  selectedDate: string;
  onSelectDate: (d: string) => void;
  onSelectItem: (i: CalendarItem) => void;
  anchor: Date;
}

const WEEKDAYS_FULL = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

/**
 * Vista de agenda: agrupa la información por meses y semanas, mostrando
 * el día de hoy y los días que tienen tareas o eventos.
 */
export function AgendaView({ itemsByDate, selectedDate, onSelectDate, onSelectItem, anchor }: Props) {
  const { settings } = useSettings();
  const today = todayKey();

  const months = useMemo(() => {
    const result: { year: number; month: number; weeks: { label: string; days: { key: string; date: Date; items: CalendarItem[] }[] }[] }[] = [];

    for (let offset = -3; offset <= 3; offset++) {
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
              ? `${ws.getDate()} – ${we.getDate()} ${MONTHS[we.getMonth()].slice(0, 3)}`
              : `${ws.getDate()} ${MONTHS[ws.getMonth()].slice(0, 3)} – ${we.getDate()} ${MONTHS[we.getMonth()].slice(0, 3)}`;
            weeks.push({ label, days: [...currentWeek] });
          }
          currentWeek = [];
        }
      }

      if (weeks.length > 0) result.push({ year, month, weeks });
    }
    return result;
  }, [anchor, itemsByDate, today]);

  return (
    <div className="flex flex-col gap-4">
      {months.map(({ year, month, weeks }) => (
        <div key={`${year}-${month}`}>
          {/* Encabezado de mes */}
          <div className="sticky top-0 z-10 bg-[#f7f6f9] py-2 px-1">
            <span className="text-[18px] font-bold text-[#333] capitalize">{MONTHS[month]} {year}</span>
          </div>

          {weeks.map((week, wi) => (
            <div key={wi} className="mb-4">
              {/* Etiqueta de semana */}
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="text-[12px] font-semibold text-[#aaa]">{week.label}</span>
                <div className="flex-1 h-px bg-[#eee]" />
              </div>

              {/* Días con actividad */}
              <div className="flex flex-col gap-2">
                {week.days
                  .filter((d) => d.items.length > 0 || d.key === today)
                  .map(({ key, date, items }) => {
                    const isToday = key === today;
                    const weekday = WEEKDAYS_FULL[date.getDay()];
                    return (
                      <motion.div
                        key={key}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white rounded-[20px] shadow-[4px_4px_10px_#ececec,-4px_-4px_10px_#ffffff] p-3"
                      >
                        <button
                          onClick={() => onSelectDate(key)}
                          className="flex items-baseline gap-2 w-full p-0 border-none bg-transparent cursor-pointer text-left mb-2"
                        >
                          <span className={`text-[20px] font-bold leading-none tabular-nums ${isToday ? 'text-[#7f70ff]' : 'text-[#333]'}`}>{date.getDate()}</span>
                          <span className={`text-[12px] font-semibold capitalize ${isToday ? 'text-[#7f70ff]' : 'text-[#999]'}`}>{weekday}</span>
                          {isToday && <span className="text-[10px] font-bold text-white bg-[#7f70ff] rounded-full px-2 py-0.5">Hoy</span>}
                        </button>
                        {items.length > 0 ? (
                          <div className="flex flex-col gap-1.5">
                            {items.map((it) => (
                              <button
                                key={it.id}
                                onClick={() => onSelectItem(it)}
                                className="flex items-center gap-2.5 w-full p-0 border-none bg-transparent cursor-pointer text-left active:scale-[0.98] transition-transform"
                              >
                                <span className="w-[6px] h-[6px] rounded-full shrink-0" style={{ background: it.color }} />
                                <div className="flex-1 min-w-0">
                                  <p className={`text-[13px] font-medium m-0 truncate ${it.kind === 'completed' ? 'text-[#a0a0a0] line-through' : 'text-[#444]'}`}>{it.title}</p>
                                </div>
                                {it.startMin !== undefined && (
                                  <span className="text-[10px] font-semibold text-[#aaa] tabular-nums shrink-0">
                                    {formatEventTime(minToHHMM(it.startMin), settings.timeFormat)}
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[12px] text-[#ccc] m-0">Día sin actividad</p>
                        )}
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

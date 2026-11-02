import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useSettings } from '../../context/SettingsContext';
import { formatEventTime, dateKey, MONTHS } from '../../hooks/useCalendarEvents';
import { minToHHMM, type CalendarItem } from '../../hooks/useCalendarData';
import { todayKey } from '../../hooks/useTimeTracker';
import { AgendaArt } from './AgendaArt';

interface Props {
  itemsByDate: Map<string, CalendarItem[]>;
  selectedDate: string;
  onSelectDate: (d: string) => void;
  onSelectItem: (i: CalendarItem) => void;
  anchor: Date;
}

const SHORT_WEEKDAY = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/**
 * Vista de agenda: por meses, con una ilustración de cabecera, las semanas
 * etiquetadas y cada día con su fecha a la izquierda y sus barritas a la derecha.
 */
export function AgendaView({ itemsByDate, onSelectDate, onSelectItem, anchor }: Props) {
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
              ? `${ws.getDate()} – ${we.getDate()} ${MONTHS[we.getMonth()].slice(0, 3)} ${we.getFullYear()}`
              : `${ws.getDate()} ${MONTHS[ws.getMonth()].slice(0, 3)} – ${we.getDate()} ${MONTHS[we.getMonth()].slice(0, 3)} ${we.getFullYear()}`;
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
    <div className="flex flex-col gap-6">
      {months.map(({ year, month, weeks }) => (
        <div key={`${year}-${month}`}>
          {/* Encabezado de mes */}
          <div className="sticky top-0 z-10 bg-[#f7f6f9] pt-1 pb-1">
            <span className="block text-center text-[19px] font-bold text-[#333] capitalize">{MONTHS[month]} {year}</span>
          </div>

          <AgendaArt />

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
                              return (
                                <button
                                  key={it.id}
                                  onClick={() => onSelectItem(it)}
                                  className="w-full min-w-0 text-left rounded-[10px] px-3 py-2 border-none cursor-pointer active:scale-[0.99] transition-transform"
                                  style={{ background: it.color }}
                                >
                                  <span className={`block text-[13px] font-semibold leading-tight truncate text-white ${it.kind === 'completed' ? 'line-through opacity-80' : ''}`}>
                                    {it.title}
                                  </span>
                                  {second && (
                                    <span className="block text-[11px] leading-tight truncate text-white/85 mt-0.5">{second}</span>
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
      ))}
    </div>
  );
}

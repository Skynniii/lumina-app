import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MONTHS, monthWeeks, dateKey } from '../../hooks/useCalendarEvents';
import type { CalendarEvent } from '../../types';

interface Props {
  anchorMonth: Date;
  onMonthChange: (d: Date) => void;
  selectedDate: string;
  onSelectDate: (key: string) => void;
  eventsByDate: Map<string, CalendarEvent[]>;
}

const DOW = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export function MonthGrid({ anchorMonth, onMonthChange, selectedDate, onSelectDate, eventsByDate }: Props) {
  const [direction, setDirection] = useState(0);
  const touchStart = useRef(0);

  const y = anchorMonth.getFullYear();
  const m = anchorMonth.getMonth();
  const today = dateKey();

  const prevMonth = () => { setDirection(-1); onMonthChange(new Date(y, m - 1, 1)); };
  const nextMonth = () => { setDirection(1); onMonthChange(new Date(y, m + 1, 1)); };

  const goToday = () => {
    setDirection(0);
    onMonthChange(new Date());
    onSelectDate(today);
  };

  const weeks = monthWeeks(y, m);

  return (
    <div className="bg-white rounded-[24px] shadow-[6px_6px_12px_#e6e6e6,-6px_-6px_12px_#ffffff] p-4">
      {/* Encabezado con navegación */}
      <div className="flex items-center justify-between mb-3 px-1">
        <button onClick={prevMonth} aria-label="Mes anterior" className="w-9 h-9 flex items-center justify-center rounded-full bg-white shadow-[3px_3px_7px_#e6e6e6,-3px_-3px_7px_#ffffff] active:shadow-[inset_2px_2px_5px_#e6e6e6] transition-shadow">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>

        <div className="flex flex-col items-center">
          <span className="font-bold text-[16px] text-[#333] leading-tight">{MONTHS[m]} {y}</span>
          <button onClick={goToday} className="text-[11px] font-semibold text-[#7f70ff] bg-transparent border-none cursor-pointer hover:opacity-75 transition-opacity mt-0.5">Hoy</button>
        </div>

        <button onClick={nextMonth} aria-label="Mes siguiente" className="w-9 h-9 flex items-center justify-center rounded-full bg-white shadow-[3px_3px_7px_#e6e6e6,-3px_-3px_7px_#ffffff] active:shadow-[inset_2px_2px_5px_#e6e6e6] transition-shadow">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 mb-1">
        {DOW.map((d) => (
          <span key={d} className="text-center text-[11px] font-bold text-[#aaa] py-1">{d}</span>
        ))}
      </div>

      {/* Rejilla del mes con deslizamiento */}
      <div
        onTouchStart={(e) => { touchStart.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          const diff = touchStart.current - e.changedTouches[0].clientX;
          if (Math.abs(diff) > 50) { if (diff > 0) nextMonth(); else prevMonth(); }
        }}
      >
        <div className="relative overflow-hidden rounded-2xl">
          <AnimatePresence custom={direction} mode="popLayout">
            <motion.div
              key={`${y}-${m}`}
              custom={direction}
              variants={{
                enter: (d: number) => ({ x: d > 0 ? '60%' : d < 0 ? '-60%' : 0, opacity: 0 }),
                center: { x: 0, opacity: 1 },
                exit: (d: number) => ({ x: d > 0 ? '-60%' : '60%', opacity: 0 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'tween', ease: 'easeOut', duration: 0.22 }}
            >
              {weeks.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7 gap-y-0.5">
                  {week.map((key, di) => {
                    if (!key) return <div key={`b${wi}-${di}`} className="h-[46px]" />;
                    const day = Number(key.slice(8));
                    const dayEvents = eventsByDate.get(key) ?? [];
                    const isSelected = key === selectedDate;
                    const isToday = key === today;
                    return (
                      <button
                        key={key}
                        onClick={() => onSelectDate(key)}
                        className={`h-[46px] w-full flex flex-col items-center justify-center gap-[3px] rounded-[12px] border-none cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-[#7f70ff]'
                            : isToday
                              ? 'bg-[#f0edff]'
                              : 'bg-transparent hover:bg-[#f7f6f9]'
                        }`}
                      >
                        <span className={`text-[13px] leading-none ${isSelected ? 'text-white font-bold' : isToday ? 'text-[#7f70ff] font-bold' : 'text-[#444] font-medium'}`}>
                          {day}
                        </span>
                        {dayEvents.length > 0 && (
                          <span className="flex gap-[2.5px] h-[4px] items-center">
                            {dayEvents.slice(0, 3).map((e, i) => (
                              <span
                                key={e.id}
                                className={`w-[4px] h-[4px] rounded-full ${dayEvents.length > 1 && i === 2 ? '' : ''}`}
                                style={{ background: isSelected ? 'rgba(255,255,255,0.9)' : e.color }}
                              />
                            ))}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

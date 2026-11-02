import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { monthWeeks, dateKey } from '../../hooks/useCalendarEvents';
import type { CalendarItem } from '../../hooks/useCalendarData';

interface Props {
  anchorMonth: Date;
  onMonthChange: (d: Date) => void;
  selectedDate: string;
  onSelectDate: (key: string) => void;
  itemsByDate: Map<string, CalendarItem[]>;
  fillHeight?: boolean;
}

const DOW = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

/** Vista de mes: rejilla con la actividad de cada día (puntos por color y tipo). */
export function MonthGrid({ anchorMonth, onMonthChange, selectedDate, onSelectDate, itemsByDate, fillHeight }: Props) {
  const [direction, setDirection] = useState(0);
  const touchStart = useRef(0);

  const y = anchorMonth.getFullYear();
  const m = anchorMonth.getMonth();
  const today = dateKey();

  const prevMonth = () => { setDirection(-1); onMonthChange(new Date(y, m - 1, 1)); };
  const nextMonth = () => { setDirection(1); onMonthChange(new Date(y, m + 1, 1)); };

  const weeks = monthWeeks(y, m);

  const containerCls = fillHeight
    ? 'bg-white rounded-[24px] shadow-[6px_6px_12px_#e6e6e6,-6px_-6px_12px_#ffffff] p-4 h-full flex flex-col'
    : 'bg-white rounded-[24px] shadow-[6px_6px_12px_#e6e6e6,-6px_-6px_12px_#ffffff] p-4';

  return (
    <div className={containerCls}>
      {/* Días de la semana */}
      <div className="grid grid-cols-7 mb-1 shrink-0">
        {DOW.map((d) => (
          <span key={d} className="text-center text-[11px] font-bold text-[#aaa] py-1">{d}</span>
        ))}
      </div>

      {/* Rejilla del mes con deslizamiento */}
      <div
        className={fillHeight ? 'flex-1 min-h-0' : ''}
        onTouchStart={(e) => { touchStart.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          const diff = touchStart.current - e.changedTouches[0].clientX;
          if (Math.abs(diff) > 50) { if (diff > 0) nextMonth(); else prevMonth(); }
        }}
      >
        <div className={`relative overflow-hidden rounded-2xl ${fillHeight ? 'h-full' : ''}`}>
          <AnimatePresence custom={direction}>
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
              className={fillHeight ? 'absolute inset-0 flex flex-col gap-y-0.5' : ''}
            >
              {weeks.map((week, wi) => (
                <div key={wi} className={fillHeight ? 'flex-1 grid grid-cols-7 min-h-0' : 'grid grid-cols-7 gap-y-0.5'}>
                  {week.map((key, di) => {
                    if (!key) return <div key={`b${wi}-${di}`} className={fillHeight ? 'h-full' : 'h-[48px]'} />;
                    const day = Number(key.slice(8));
                    const dayItems = itemsByDate.get(key) ?? [];
                    const isSelected = key === selectedDate;
                    const isToday = key === today;
                    const dots = dayItems.slice(0, 3);
                    return (
                      <button
                        key={key}
                        onClick={() => onSelectDate(key)}
                        className={`${fillHeight ? 'h-full w-full' : 'h-[48px] w-full'} flex flex-col items-center justify-center gap-[3px] rounded-[12px] border-none cursor-pointer transition-colors ${
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
                        {dayItems.length > 0 && (
                          <span className="flex items-center gap-[2.5px] h-[5px]">
                            {dots.map((it) => (
                              <span key={it.id} className="w-[4px] h-[4px] rounded-full" style={{ background: isSelected ? 'rgba(255,255,255,0.9)' : it.color }} />
                            ))}
                            {dayItems.length > 3 && (
                              <span className={`text-[8px] font-bold leading-none ${isSelected ? 'text-white/90' : 'text-[#aaa]'}`}>+{dayItems.length - 3}</span>
                            )}
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

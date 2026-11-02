import { monthWeeks, dateKey } from '../../hooks/useCalendarEvents';
import { dayMarkers, type CalendarItem } from '../../hooks/useCalendarData';

interface Props {
  anchorMonth: Date;
  selectedDate: string;
  onSelectDate: (key: string) => void;
  itemsByDate: Map<string, CalendarItem[]>;
}

const DOW = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

/** Vista de mes: rejilla con la actividad de cada día (puntos por color y tipo). */
export function MonthGrid({ anchorMonth, selectedDate, onSelectDate, itemsByDate }: Props) {
  const y = anchorMonth.getFullYear();
  const m = anchorMonth.getMonth();
  const today = dateKey();

  const weeks = monthWeeks(y, m);

  return (
    <div className="bg-white rounded-[24px] shadow-[6px_6px_12px_#e6e6e6,-6px_-6px_12px_#ffffff] p-4">
      {/* Días de la semana */}
      <div className="grid grid-cols-7 mb-1 shrink-0">
        {DOW.map((d) => (
          <span key={d} className="text-center text-[11px] font-bold text-[#aaa] py-1">{d}</span>
        ))}
      </div>

      <div className="flex flex-col gap-y-0.5">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-y-0.5">
            {week.map((key, di) => {
              if (!key) return <div key={`b${wi}-${di}`} className="h-[48px]" />;
              const day = Number(key.slice(8));
              const dayItems = itemsByDate.get(key) ?? [];
              const isSelected = key === selectedDate;
              const isToday = key === today;
              const dots = dayMarkers(dayItems);
              return (
                <button
                  key={key}
                  onClick={() => onSelectDate(key)}
                  className={`h-[48px] w-full relative flex items-center justify-center rounded-[12px] border-none cursor-pointer transition-colors ${
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
                  {/* Puntos en posición absoluta: el número queda siempre centrado */}
                  {dots.length > 0 && (
                    <span className="absolute bottom-[6px] left-0 right-0 flex items-center justify-center gap-[3px]">
                      {dots.map((c) => (
                        <span key={c} className="w-[4px] h-[4px] rounded-full" style={{ background: isSelected ? 'rgba(255,255,255,0.9)' : c }} />
                      ))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

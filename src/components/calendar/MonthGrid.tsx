import { monthWeeks, dateKey } from '../../hooks/useCalendarEvents';
import { useSettings } from '../../context/SettingsContext';
import type { CalendarItem } from '../../hooks/useCalendarData';
import { weekdayHeaders, weekNumber, weekStartIndex } from '../../utils/calendarDates';

interface Props {
  anchorMonth: Date;
  selectedDate: string;
  onSelectDate: (key: string) => void;
  itemsByDate: Map<string, CalendarItem[]>;
  /** Días con tareas completadas: en el pasado se marca con el punto morado. */
  completedKeys: Set<string>;
}

/** Filas fijas: todos los meses miden lo mismo al deslizar entre ellos. */
const ROWS = 6;

/** Morado de las tareas: punto del pasado y pequeño icono del futuro. */
const TASK_COLOR = '#7f70ff';

const TaskGlyph = ({ color }: { color: string }) => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <polyline points="8 12 11 15 16 9" />
  </svg>
);

/**
 * Vista de mes: rejilla a todo el ancho (sin esquinas redondeadas) para que al
 * deslizar solo se muevan los números. Los días futuros con tareas llevan un
 * pequeño icono de tarea y los pasados con tareas completadas, un punto morado.
 */
export function MonthGrid({ anchorMonth, selectedDate, onSelectDate, itemsByDate, completedKeys }: Props) {
  const { settings } = useSettings();
  const y = anchorMonth.getFullYear();
  const m = anchorMonth.getMonth();
  const today = dateKey();

  const weeks = monthWeeks(y, m, weekStartIndex(settings.weekStart));
  while (weeks.length < ROWS) weeks.push(Array(7).fill(null));

  const headers = weekdayHeaders(settings.language, settings.weekStart);
  const cols = settings.showWeekNumbers ? '26px repeat(7, minmax(0, 1fr))' : 'repeat(7, minmax(0, 1fr))';

  return (
    <div className="bg-white w-full pt-2 pb-1">
      {/* Días de la semana */}
      <div className="grid mb-1 shrink-0" style={{ gridTemplateColumns: cols }}>
        {settings.showWeekNumbers && <span />}
        {headers.map(({ day, label }) => (
          <span key={day} className="text-center text-[10px] font-bold text-[#aaa] py-1 uppercase">{label}</span>
        ))}
      </div>

      <div className="flex flex-col gap-y-0.5">
        {weeks.map((week, wi) => {
          const firstKey = week.find((k): k is string => !!k);
          return (
            <div key={wi} className="grid gap-y-0.5" style={{ gridTemplateColumns: cols }}>
              {settings.showWeekNumbers && (
                <span className="flex items-center justify-center text-[9px] font-semibold text-[#c0c0c8] tabular-nums">
                  {firstKey ? weekNumber(new Date(Number(firstKey.slice(0, 4)), Number(firstKey.slice(5, 7)) - 1, Number(firstKey.slice(8)))) : ''}
                </span>
              )}
              {week.map((key, di) => {
                if (!key) return <div key={`b${wi}-${di}`} className="h-[48px]" />;
                const day = Number(key.slice(8));
                const dayItems = itemsByDate.get(key) ?? [];
                const isSelected = key === selectedDate;
                const isToday = key === today;
                const isPast = key < today;
                const eventColors = dayItems.filter((i) => i.kind === 'event').map((i) => i.color);
                const hasPending = dayItems.some((i) => i.kind === 'pending');
                const done = completedKeys.has(key);
                return (
                  <button
                    key={key}
                    data-cal-day={key}
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
                    {/* Marcadores en posición absoluta: el número queda siempre centrado */}
                    {isPast ? (
                      (done || eventColors.length > 0) && (
                        <span className="absolute bottom-[6px] left-0 right-0 flex items-center justify-center gap-[3px]">
                          {done && <span className="w-[4px] h-[4px] rounded-full" style={{ background: isSelected ? 'rgba(255,255,255,0.9)' : TASK_COLOR }} />}
                          {eventColors.map((c, i) => (
                            <span key={i} className="w-[4px] h-[4px] rounded-full" style={{ background: isSelected ? 'rgba(255,255,255,0.9)' : c }} />
                          ))}
                        </span>
                      )
                    ) : (
                      (hasPending || eventColors.length > 0) && (
                        <span className="absolute bottom-[5px] left-0 right-0 flex items-center justify-center gap-[3px]">
                          {hasPending && <TaskGlyph color={isSelected ? '#ffffff' : TASK_COLOR} />}
                          {eventColors.map((c, i) => (
                            <span key={i} className="w-[4px] h-[4px] rounded-full" style={{ background: isSelected ? 'rgba(255,255,255,0.9)' : c }} />
                          ))}
                        </span>
                      )
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

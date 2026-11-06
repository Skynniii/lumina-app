import { monthWeeks, dateKey } from '../../hooks/useCalendarEvents';
import { useSettings } from '../../context/SettingsContext';
import { LAYER_META, type CalendarItem } from '../../hooks/useCalendarData';
import { weekdayHeaders, weekNumber, weekStartIndex } from '../../utils/calendarDates';
import { holidayName } from '../../utils/holidays';

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
const TASK_COLOR = LAYER_META.pending.color;
const EVENT_COLOR = LAYER_META.event.color;
const BIRTHDAY_COLOR = '#ff6b9d';

const TaskGlyph = ({ color }: { color: string }) => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <polyline points="8 12 11 15 16 9" />
  </svg>
);

const EventGlyph = ({ color }: { color: string }) => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const BirthdayGlyph = ({ color }: { color: string }) => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8" />
    <path d="M4 16h16" />
    <path d="M12 8V5" />
    <circle cx="12" cy="4" r="1" />
  </svg>
);

const Dot = ({ color }: { color: string }) => (
  <span className="w-[4px] h-[4px] rounded-full" style={{ background: color }} />
);

/**
 * Vista de mes: rejilla a todo el ancho (sin esquinas redondeadas) para que al
 * deslizar solo se muevan los números.
 * Futuro y hoy: un icono por familia (tarea, evento, cumpleaños), como máximo tres.
 * Pasado: solo un punto por familia.
 * Festivos: barrita amarilla sobre el número (siempre del mismo color).
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
                const pending = dayItems.filter((i) => i.kind === 'pending');
                const events = dayItems.filter((i) => i.kind === 'event' && !i.birthday);
                const birthdays = dayItems.filter((i) => i.kind === 'event' && i.birthday);
                const done = completedKeys.has(key);
                const hasTask = pending.length > 0 || done;
                const hasEvent = events.length > 0;
                const hasBirthday = birthdays.length > 0;
                const eventColor = events[0]?.color ?? EVENT_COLOR;
                const birthdayColor = birthdays[0]?.color ?? BIRTHDAY_COLOR;
                const muted = 'rgba(255,255,255,0.9)';
                return (
                  <button
                    key={key}
                    data-cal-day={key}
                    title={holidayName(key) ?? undefined}
                    onClick={() => onSelectDate(key)}
                    className={`h-[48px] w-full relative flex items-center justify-center rounded-[12px] border-none cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#7f70ff]'
                        : isToday
                          ? 'bg-[#f0edff]'
                          : 'bg-transparent hover:bg-[#f7f6f9]'
                    }`}
                  >
                    {/* Festivo: barrita amarilla sobre el número (su color no cambia) */}
                    {holidayName(key) && (
                      <span className="absolute top-[8px] left-1/2 -translate-x-1/2 w-[13px] h-[3px] rounded-full bg-[#f5c518]" />
                    )}
                    <span className={`text-[13px] leading-none ${isSelected ? 'text-white font-bold' : isToday ? 'text-[#7f70ff] font-bold' : 'text-[#444] font-medium'}`}>
                      {day}
                    </span>
                    {/* Marcadores en posición absoluta: el número queda siempre centrado */}
                    {isPast ? (
                      (hasTask || hasEvent || hasBirthday) && (
                        <span className="absolute bottom-[6px] left-0 right-0 flex items-center justify-center gap-[3px]">
                          {hasTask && <Dot color={isSelected ? muted : TASK_COLOR} />}
                          {hasEvent && <Dot color={isSelected ? muted : eventColor} />}
                          {hasBirthday && <Dot color={isSelected ? muted : birthdayColor} />}
                        </span>
                      )
                    ) : (
                      (hasTask || hasEvent || hasBirthday) && (
                        <span className="absolute bottom-[5px] left-0 right-0 flex items-center justify-center gap-[3px]">
                          {hasTask && <TaskGlyph color={isSelected ? '#ffffff' : TASK_COLOR} />}
                          {hasEvent && <EventGlyph color={isSelected ? '#ffffff' : eventColor} />}
                          {hasBirthday && <BirthdayGlyph color={isSelected ? '#ffffff' : birthdayColor} />}
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

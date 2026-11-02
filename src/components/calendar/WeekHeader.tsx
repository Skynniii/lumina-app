import type { ReactElement } from 'react';
import { dateKey } from '../../hooks/useCalendarEvents';
import {
  DAY_MARKER_META, dayMarkerKeys, parseKey, type CalendarItem,
} from '../../hooks/useCalendarData';
import { MarqueeText } from './MarqueeText';

interface Props {
  days: string[]; // 7 fechas YYYY-MM-DD (lunes → domingo)
  itemsByDate: Map<string, CalendarItem[]>;
  selectedDate: string;
  onSelectDate: (key: string) => void;
}

const LETTER = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

const TaskBarIcon = ({ color }: { color: string }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><polyline points="8 12 11 15 16 9" /></svg>
);
const EventBarIcon = ({ color }: { color: string }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
);
const ClockBarIcon = ({ color }: { color: string }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" /></svg>
);

const BAR_ICONS: Record<string, (p: { color: string }) => ReactElement> = {
  task: TaskBarIcon,
  event: EventBarIcon,
  session: ClockBarIcon,
};

/**
 * Cabecera de la semana: días con su fecha y, debajo, una sola "barrita" por
 * familia de información (Tasks, Events, Registros…) aunque haya varias.
 */
export function WeekHeader({ days, itemsByDate, selectedDate, onSelectDate }: Props) {
  const today = dateKey();

  return (
    <div className="grid bg-[#f2f1f6] border-b border-[#e0deec]" style={{ gridTemplateColumns: `40px repeat(${days.length}, minmax(0, 1fr))` }}>
      <div />
      {days.map((d) => {
        const dt = parseKey(d);
        const isToday = d === today;
        const isSel = d === selectedDate;
        const keys = dayMarkerKeys(itemsByDate.get(d) ?? []);
        return (
          <button
            key={d}
            onClick={() => onSelectDate(d)}
            className="flex flex-col items-center gap-1 pt-1.5 pb-2 min-w-0 border-none bg-transparent cursor-pointer"
          >
            <span className={`text-[10px] font-semibold leading-none ${isToday || isSel ? 'text-[#7f70ff]' : 'text-[#aaa]'}`}>
              {LETTER[dt.getDay()]}
            </span>
            <span
              className={`flex items-center justify-center w-7 h-7 rounded-[9px] text-[13px] leading-none tabular-nums ${
                isToday ? 'bg-[#7f70ff] text-white font-bold' : isSel ? 'bg-[#f0edff] text-[#7f70ff] font-bold' : 'text-[#555] font-medium'
              }`}
            >
              {dt.getDate()}
            </span>
            <div className="w-full flex flex-col gap-1 px-[2px] mt-[2px]">
              {keys.map((k) => {
                const meta = DAY_MARKER_META[k];
                const Icon = BAR_ICONS[k];
                return (
                  <span
                    key={k}
                    className="flex items-center gap-1 rounded-full pl-1.5 pr-2 py-[4px] w-full min-w-0"
                    style={{ background: `${meta.color}1a` }}
                  >
                    {Icon && <span className="shrink-0 flex"><Icon color={meta.color} /></span>}
                    <MarqueeText
                      text={meta.label}
                      className="flex-1"
                      textClassName="text-[12px] font-bold leading-none"
                      textStyle={{ color: meta.color }}
                    />
                  </span>
                );
              })}
            </div>
          </button>
        );
      })}
    </div>
  );
}

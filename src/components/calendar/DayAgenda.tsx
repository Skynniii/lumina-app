import { motion } from 'framer-motion';
import { useSettings } from '../../context/SettingsContext';
import { formatEventTime } from '../../hooks/useCalendarEvents';
import type { CalendarEvent } from '../../types';

interface Props {
  date: string; // YYYY-MM-DD
  events: CalendarEvent[];
  onSelectEvent: (e: CalendarEvent) => void;
}

const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export function DayAgenda({ date, events, onSelectEvent }: Props) {
  const { settings } = useSettings();
  const [y, m, d] = date.split('-').map(Number);
  const weekday = WEEKDAYS[new Date(y, m - 1, d).getDay()];

  return (
    <div className="bg-white rounded-[24px] shadow-[6px_6px_12px_#e6e6e6,-6px_-6px_12px_#ffffff] p-5">
      {/* Encabezado del día */}
      <div className="flex items-end justify-between mb-4">
        <div className="flex items-baseline gap-2.5">
          <span className="text-[32px] font-bold text-[#333] leading-none tabular-nums">{d}</span>
          <div className="flex flex-col">
            <span className="text-[13px] font-semibold text-[#7f70ff] capitalize leading-tight">{weekday}</span>
            <span className="text-[12px] text-[#999] capitalize">{MONTHS[m - 1]} {y}</span>
          </div>
        </div>
        <span className="text-[12px] font-medium text-[#999]">
          {events.length === 0 ? 'Sin eventos' : events.length === 1 ? '1 evento' : `${events.length} eventos`}
        </span>
      </div>

      {events.length === 0 ? (
        <div className="flex flex-col items-center py-8 gap-3">
          <div className="w-14 h-14 rounded-2xl bg-[#f0edff] flex items-center justify-center">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#7f70ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <p className="text-[14px] font-semibold text-[#555] m-0">Nada programado</p>
          <p className="text-[12px] text-[#999] m-0">Toca + para agregar un evento este día</p>
        </div>
      ) : (
        <div className="flex flex-col">
          {events.map((e, i) => (
            <motion.button
              key={e.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onSelectEvent(e)}
              whileTap={{ scale: 0.98 }}
              className="flex items-stretch w-full p-0 border-none bg-transparent cursor-pointer text-left py-1.5"
            >
              {/* Columna de horas */}
              <div className="w-[52px] flex flex-col items-end justify-center shrink-0 pr-1">
                <span className="text-[13px] font-bold text-[#555] tabular-nums leading-tight">{formatEventTime(e.start, settings.timeFormat)}</span>
                <span className="text-[11px] text-[#aaa] tabular-nums">{formatEventTime(e.end, settings.timeFormat)}</span>
              </div>

              {/* Línea de tiempo */}
              <div className="relative self-stretch w-[2px] bg-[#f0f0f0] rounded-full mx-2.5 shrink-0">
                <span className="absolute -left-[3px] top-[calc(50%-4px)] w-[8px] h-[8px] rounded-full" style={{ background: e.color }} />
              </div>

              {/* Tarjeta del evento */}
              <div className="flex-1 min-w-0 rounded-2xl px-4 py-3 bg-white shadow-[4px_4px_10px_#ececec,-4px_-4px_10px_#ffffff]">
                <p className="text-[14px] font-semibold text-[#333] m-0 truncate">{e.title}</p>
                {e.location && (
                  <p className="text-[12px] text-[#999] m-0 mt-0.5 truncate flex items-center gap-1">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {e.location}
                  </p>
                )}
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}

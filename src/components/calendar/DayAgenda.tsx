import { motion } from 'framer-motion';
import { useSettings } from '../../context/SettingsContext';
import { formatEventTime } from '../../hooks/useCalendarEvents';
import { LAYER_META, minToHHMM, type CalendarItem, type CalendarLayer } from '../../hooks/useCalendarData';

interface Props {
  date: string;   // YYYY-MM-DD
  items: CalendarItem[];
  onSelectItem: (i: CalendarItem) => void;
  onNewTask: () => void;
  onNewEvent: () => void;
}

const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const KIND_ICON: Record<CalendarLayer, React.ReactNode> = {
  pending: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /></svg>
  ),
  completed: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
  ),
  session: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" /></svg>
  ),
  event: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
  ),
};

/** Agenda cronológica del día: tareas, registros de tiempo y eventos, con su tipo y color. */
export function DayAgenda({ date, items, onSelectItem, onNewTask, onNewEvent }: Props) {
  const { settings } = useSettings();
  const [y, m, d] = date.split('-').map(Number);
  const weekday = WEEKDAYS[new Date(y, m - 1, d).getDay()];

  return (
    <div className="bg-white rounded-[24px] shadow-[6px_6px_12px_#e6e6e6,-6px_-6px_12px_#ffffff] p-5">
      <div className="flex items-end justify-between mb-4">
        <div className="flex items-baseline gap-2.5">
          <span className="text-[26px] font-bold text-[#333] leading-none tabular-nums">{d}</span>
          <div className="flex flex-col">
            <span className="text-[13px] font-semibold text-[#7f70ff] capitalize leading-tight">{weekday}</span>
            <span className="text-[12px] text-[#999] capitalize">{MONTHS[m - 1]} {y}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onNewTask} aria-label="Nueva tarea" className="w-9 h-9 rounded-2xl bg-[#f0edff] text-[#7f70ff] border-none cursor-pointer flex items-center justify-center active:scale-95 transition-transform">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          </button>
          <button onClick={onNewEvent} aria-label="Nuevo evento" className="w-9 h-9 rounded-2xl bg-[#eef4ff] text-[#4d7cfe] border-none cursor-pointer flex items-center justify-center active:scale-95 transition-transform">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center py-8 gap-3">
          <div className="w-14 h-14 rounded-2xl bg-[#f0edff] flex items-center justify-center">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#7f70ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <p className="text-[14px] font-semibold text-[#555] m-0">Nada este día</p>
          <p className="text-[12px] text-[#999] m-0 text-center">Crea una tarea fechada o un evento para este día</p>
        </div>
      ) : (
        <div className="flex flex-col">
          {items.map((it, i) => {
            const meta = LAYER_META[it.kind];
            const hasTime = it.startMin !== undefined;
            return (
              <motion.button
                key={it.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
                onClick={() => onSelectItem(it)}
                className="flex items-stretch w-full p-0 border-none bg-transparent cursor-pointer text-left py-1.5 active:scale-[0.98] transition-transform"
              >
                <div className="w-[54px] flex flex-col items-end justify-center shrink-0 pr-1">
                  {hasTime ? (
                    <>
                      <span className="text-[13px] font-bold text-[#555] tabular-nums leading-tight">{formatEventTime(minToHHMM(it.startMin!), settings.timeFormat)}</span>
                      {it.endMin !== undefined && <span className="text-[11px] text-[#aaa] tabular-nums">{formatEventTime(minToHHMM(it.endMin), settings.timeFormat)}</span>}
                    </>
                  ) : (
                    <span className="text-[10px] font-semibold text-[#aaa] text-right leading-tight">Todo<br />el día</span>
                  )}
                </div>

                <div className="relative self-stretch w-[2px] bg-[#f0f0f0] rounded-full mx-2.5 shrink-0">
                  <span className="absolute -left-[3px] top-[calc(50%-4px)] w-[8px] h-[8px] rounded-full" style={{ background: it.color }} />
                </div>

                <div className="flex-1 min-w-0 rounded-2xl px-4 py-2.5 bg-white shadow-[4px_4px_10px_#ececec,-4px_-4px_10px_#ffffff]">
                  <p className={`text-[14px] font-semibold m-0 truncate ${it.kind === 'completed' ? 'text-[#a0a0a0] line-through' : 'text-[#333]'}`}>{it.title}</p>
                  <p className="text-[11px] m-0 mt-0.5 truncate flex items-center gap-1.5" style={{ color: it.kind === 'pending' ? '#9b93d8' : meta.color }}>
                    <span className="shrink-0">{KIND_ICON[it.kind]}</span>
                    <span className="font-medium">{meta.short}</span>
                    {it.subtitle && <span className="text-[#b0b0b8] truncate">· {it.subtitle}</span>}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}

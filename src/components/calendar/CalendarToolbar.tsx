import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MonthStrip } from './MonthStrip';

export type CalendarViewMode = 'month' | 'week' | 'day' | 'agenda';

const VIEW_LABELS: Record<CalendarViewMode, string> = {
  month: 'Mes',
  week: 'Semana',
  day: 'Día',
  agenda: 'Agenda',
};

function ViewIcon({ mode }: { mode: CalendarViewMode }) {
  const p = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (mode) {
    case 'month':
      return (<svg {...p}><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="3" y1="10" x2="21" y2="10" /><line x1="9" y1="10" x2="9" y2="22" /><line x1="15" y1="10" x2="15" y2="22" /></svg>);
    case 'week':
      return (<svg {...p}><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="9" y1="4" x2="9" y2="22" /><line x1="15" y1="4" x2="15" y2="22" /></svg>);
    case 'day':
      return (<svg {...p}><rect x="6" y="4" width="12" height="18" rx="2" /><line x1="6" y1="9" x2="18" y2="9" /></svg>);
    case 'agenda':
      return (<svg {...p}><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><circle cx="4" cy="6" r="1" fill="currentColor" stroke="none" /><circle cx="4" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="4" cy="18" r="1" fill="currentColor" stroke="none" /></svg>);
  }
}

interface Props {
  mode: CalendarViewMode;
  onCycleMode: () => void;
  title: string;
  onToday: () => void;
  onSearch: () => void;
  anchor: Date;
  onMonthSelect: (year: number, month: number) => void;
}

/** Barra de herramientas del calendario: mes expandible + buscar + hoy + vista. */
export function CalendarToolbar({ mode, onCycleMode, title, onToday, onSearch, anchor, onMonthSelect }: Props) {
  const [monthExpanded, setMonthExpanded] = useState(false);

  const todayDay = new Date().getDate();

  return (
    <div className="shrink-0 bg-white border-b border-[#f0f0f5]">
      <div className="px-5 py-2.5 flex items-center justify-between">
        {/* Izquierda: Mes + expandir */}
        <button
          onClick={() => setMonthExpanded(!monthExpanded)}
          className="flex items-center gap-1.5 bg-transparent border-none cursor-pointer min-w-0"
        >
          <span className="relative block overflow-hidden h-[24px]">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={title}
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: '0%', opacity: 1 }}
                exit={{ y: '-100%', opacity: 0 }}
                transition={{ duration: 0.24, ease: 'easeOut' }}
                className="block text-[18px] font-bold text-[#333] whitespace-nowrap leading-[24px]"
              >
                {title}
              </motion.span>
            </AnimatePresence>
          </span>
          <motion.svg
            animate={{ rotate: monthExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            className="shrink-0"
          >
            <path d="M6 9l6 6 6-6" />
          </motion.svg>
        </button>

        {/* Derecha: Buscar + Hoy + Vista */}
        <div className="flex items-center gap-2">
          <button
            onClick={onSearch}
            aria-label="Buscar"
            className="w-9 h-9 rounded-xl bg-[#f5f5f7] flex items-center justify-center cursor-pointer hover:bg-[#eee] transition-colors border-none text-[#666]"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <line x1="16.5" y1="16.5" x2="21" y2="21" />
            </svg>
          </button>

          {/* Botón Hoy con número de día */}
          <button
            onClick={onToday}
            className="w-9 h-9 rounded-xl bg-[#f0edff] flex flex-col items-center justify-center cursor-pointer hover:bg-[#e8e4ff] transition-colors border-none"
          >
            <span className="text-[7px] font-bold text-[#7f70ff] leading-none uppercase">Hoy</span>
            <span className="text-[13px] font-bold text-[#7f70ff] leading-none">{todayDay}</span>
          </button>

          {/* Cycler de vista */}
          <button
            onClick={onCycleMode}
            className="w-9 h-9 rounded-xl bg-[#f5f5f7] flex items-center justify-center cursor-pointer hover:bg-[#eee] transition-colors border-none text-[#666]"
            aria-label={VIEW_LABELS[mode]}
          >
            <ViewIcon mode={mode} />
          </button>
        </div>
      </div>

      {/* Franja de meses expandible */}
      <AnimatePresence>
        {monthExpanded && (
          <MonthStrip
            anchor={anchor}
            onMonthSelect={(yr, mo) => { onMonthSelect(yr, mo); setMonthExpanded(false); }}
            onCollapse={() => setMonthExpanded(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

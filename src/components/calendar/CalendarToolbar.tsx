import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ALL_LAYERS, LAYER_META, type CalendarLayer } from '../../hooks/useCalendarData';
import { MonthStrip } from './MonthStrip';

export type CalendarViewMode = 'month' | 'week' | 'day' | 'agenda';

const VIEW_ORDER: CalendarViewMode[] = ['month', 'week', 'day', 'agenda'];

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
  layers: Record<CalendarLayer, boolean>;
  onToggleLayer: (l: CalendarLayer) => void;
  anchor: Date;
  onMonthSelect: (year: number, month: number) => void;
}

/** Barra de herramientas del calendario: mes expandible + hoy + vista + filtro. */
export function CalendarToolbar({ mode, onCycleMode, title, onToday, layers, onToggleLayer, anchor, onMonthSelect }: Props) {
  const [monthExpanded, setMonthExpanded] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const todayDay = new Date().getDate();

  useEffect(() => {
    if (!filterOpen) return;
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [filterOpen]);

  return (
    <div className="shrink-0 bg-white border-b border-[#f0f0f5]">
      <div className="px-5 py-2.5 flex items-center justify-between">
        {/* Izquierda: Mes + expandir */}
        <button
          onClick={() => setMonthExpanded(!monthExpanded)}
          className="flex items-center gap-1.5 bg-transparent border-none cursor-pointer"
        >
          <span className="text-[18px] font-bold text-[#333]">{title}</span>
          <motion.svg
            animate={{ rotate: monthExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M6 9l6 6 6-6" />
          </motion.svg>
        </button>

        {/* Derecha: Hoy + Vista + Filtro */}
        <div className="flex items-center gap-2">
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

          {/* Filtro */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className={`w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-colors border-none ${
                filterOpen ? 'bg-[#f0edff] text-[#7f70ff]' : 'bg-[#f5f5f7] text-[#666] hover:bg-[#eee]'
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
            </button>
            <AnimatePresence>
              {filterOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1 bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-[#eaeaea] py-2 w-[180px] z-10 origin-top-right"
                >
                  <p className="text-[11px] font-bold text-[#999] uppercase tracking-wide px-4 py-1 m-0">Filtros</p>
                  {ALL_LAYERS.map((l) => (
                    <button
                      key={l}
                      onClick={() => onToggleLayer(l)}
                      className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-[#f8f9fa] transition-colors border-none bg-transparent cursor-pointer"
                    >
                      <span
                        className="w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors"
                        style={{
                          borderColor: layers[l] ? LAYER_META[l].color : '#d5d5dd',
                          background: layers[l] ? LAYER_META[l].color : 'transparent',
                        }}
                      >
                        {layers[l] && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </span>
                      <span className={`text-[14px] ${layers[l] ? 'text-[#333] font-medium' : 'text-[#aaa]'}`}>
                        {LAYER_META[l].label}
                      </span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Franja de meses expandible */}
      <AnimatePresence>
        {monthExpanded && (
          <MonthStrip
            anchor={anchor}
            onMonthSelect={(yr, mo) => { onMonthSelect(yr, mo); setMonthExpanded(false); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

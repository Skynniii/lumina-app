import { ALL_LAYERS, LAYER_META, type CalendarLayer } from '../../hooks/useCalendarData';

export type CalendarViewMode = 'month' | 'week' | 'day';

const MODES: { id: CalendarViewMode; label: string }[] = [
  { id: 'month', label: 'Mes' },
  { id: 'week', label: 'Semana' },
  { id: 'day', label: 'Día' },
];

interface Props {
  mode: CalendarViewMode;
  onModeChange: (m: CalendarViewMode) => void;
  layers: Record<CalendarLayer, boolean>;
  onToggleLayer: (l: CalendarLayer) => void;
  title: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  isToday: boolean;
}

/** Selector de vista + navegación + filtros de capas del calendario. */
export function CalendarToolbar({ mode, onModeChange, layers, onToggleLayer, title, onPrev, onNext, onToday, isToday }: Props) {
  const navBtn = 'w-8 h-8 flex items-center justify-center rounded-full bg-white border-none cursor-pointer shadow-[3px_3px_7px_#e6e6e6,-3px_-3px_7px_#ffffff] active:shadow-[inset_2px_2px_5px_#e6e6e6] transition-shadow';

  return (
    <div className="shrink-0 px-5 pt-2 pb-1">
      <div className="flex items-center gap-2">
        <button onClick={onPrev} aria-label="Anterior" className={navBtn}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>

        <div className="flex-1 flex flex-col items-center min-w-0">
          <span className="text-[15px] font-bold text-[#333] leading-tight truncate max-w-full">{title}</span>
          {!isToday && (
            <button onClick={onToday} className="text-[11px] font-semibold text-[#7f70ff] bg-transparent border-none cursor-pointer p-0 hover:opacity-75 transition-opacity">Volver a hoy</button>
          )}
        </div>

        <button onClick={onNext} aria-label="Siguiente" className={navBtn}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      </div>

      {/* Selector de vista */}
      <div className="mt-2 flex bg-[#eceaf3] rounded-2xl p-1">
        {MODES.map((m) => {
          const active = mode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onModeChange(m.id)}
              className={`flex-1 py-1.5 rounded-xl text-[13px] font-semibold border-none cursor-pointer transition-colors ${
                active ? 'bg-white text-[#7f70ff] shadow-[2px_2px_6px_#dedbe8]' : 'bg-transparent text-[#888]'
              }`}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Capas de información */}
      <div className="mt-2 flex gap-2 overflow-x-auto no-scrollbar">
        {ALL_LAYERS.map((l) => {
          const on = layers[l];
          return (
            <button
              key={l}
              onClick={() => onToggleLayer(l)}
              aria-pressed={on}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap shrink-0 border-none cursor-pointer transition-all ${
                on ? 'bg-white text-[#333] shadow-[2px_2px_6px_#e6e6e6,-2px_-2px_6px_#ffffff]' : 'bg-transparent text-[#b0b0bb]'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: on ? LAYER_META[l].color : '#d5d5dd' }} />
              {LAYER_META[l].label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

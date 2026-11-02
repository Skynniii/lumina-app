import { ALL_LAYERS, LAYER_META, type CalendarItem, type CalendarLayer } from '../../hooks/useCalendarData';
import { formatDuration } from '../tracker/trackerUtils';

interface Props {
  date: string;   // YYYY-MM-DD
  items: CalendarItem[];
}

const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/** Resumen del día seleccionado: cuántas tareas, registros y eventos hay, y el tiempo acumulado. */
export function DaySummary({ date, items }: Props) {
  const [y, m, d] = date.split('-').map(Number);
  const weekday = WEEKDAYS[new Date(y, m - 1, d).getDay()];

  const counts: Record<CalendarLayer, number> = { pending: 0, completed: 0, session: 0, event: 0 };
  let totalSeconds = 0;
  for (const it of items) {
    counts[it.kind] += 1;
    if (it.session) totalSeconds += it.session.duration;
  }

  return (
    <div className="bg-white rounded-[24px] shadow-[6px_6px_12px_#e6e6e6,-6px_-6px_12px_#ffffff] p-4">
      <div className="flex items-end justify-between mb-3">
        <div className="flex items-baseline gap-2.5">
          <span className="text-[30px] font-bold text-[#333] leading-none tabular-nums">{d}</span>
          <div className="flex flex-col">
            <span className="text-[13px] font-semibold text-[#7f70ff] capitalize leading-tight">{weekday}</span>
            <span className="text-[12px] text-[#999] capitalize">{MONTHS[m - 1]} {y}</span>
          </div>
        </div>
        <span className="text-[12px] font-medium text-[#999] shrink-0">
          {items.length === 0 ? 'Sin actividad' : items.length === 1 ? '1 elemento' : `${items.length} elementos`}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {ALL_LAYERS.map((l) => (
          <div key={l} className="rounded-2xl bg-[#f7f6f9] py-2.5 flex flex-col items-center gap-0.5">
            <span className="text-[17px] font-bold leading-none tabular-nums" style={{ color: counts[l] > 0 ? LAYER_META[l].color : '#c8c8d0' }}>{counts[l]}</span>
            <span className="text-[10px] text-[#999] leading-none">{LAYER_META[l].label}</span>
          </div>
        ))}
      </div>

      {totalSeconds > 0 && (
        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#f2f2f5]">
          <span className="text-[12px] text-[#999]">Tiempo registrado</span>
          <span className="text-[13px] font-bold text-[#00b8a9] tabular-nums">{formatDuration(totalSeconds)}</span>
        </div>
      )}
    </div>
  );
}

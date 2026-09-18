import { useMemo, useRef, useEffect } from 'react';
import { getConsistencyData, hexToRgba } from './trackerUtils';
import type { Activity, TimeSession } from '../../types';

interface Props {
  sessions: TimeSession[];
  activity: Activity;
}

export function ConsistencyGraph({ sessions, activity }: Props) {
  const data = useMemo(() => getConsistencyData(sessions, activity.id), [sessions, activity.id]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll a la derecha (último día = hoy)
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [data]);

  // Agrupar por semana (7 días desde el 1 de enero)
  const weeks = useMemo(() => {
    const result: { date: string; total: number; isFuture: boolean }[][] = [];
    for (let w = 0; w < Math.ceil(data.length / 7); w++) {
      result.push(data.slice(w * 7, w * 7 + 7));
    }
    return result;
  }, [data]);

  const maxTotal = useMemo(() => Math.max(...data.map((d) => d.total), 1), [data]);

  const monthLabels = useMemo(() => {
    const labels: { weekIdx: number; label: string }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, wIdx) => {
      const firstDay = week[0];
      if (firstDay) {
        const month = new Date(firstDay.date).getMonth();
        if (month !== lastMonth) {
          labels.push({ weekIdx: wIdx, label: new Date(firstDay.date).toLocaleDateString('es-CO', { month: 'short' }) });
          lastMonth = month;
        }
      }
    });
    return labels;
  }, [weeks]);

  function getColor(day: { total: number; isFuture: boolean }): string {
    if (day.total === 0) return '#f0f0f0';
    const intensity = Math.min(1, day.total / maxTotal);
    return hexToRgba(activity.color, 0.3 + intensity * 0.7);
  }

  const cellSize = 22;
  const gap = 4;

  return (
    <div className="bg-white p-4 rounded-[20px] shadow-[4px_4px_10px_#e6e6e6,-4px_-4px_10px_#ffffff]">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[12px] font-semibold text-[#999] uppercase tracking-wide m-0">Consistencia {new Date().getFullYear()}</p>
      </div>

      <div ref={scrollRef} className="overflow-x-auto no-scrollbar">
        <div className="inline-flex flex-col gap-1">
          {/* Etiquetas de meses */}
          <div className="flex gap-[3px] mb-0.5 relative h-[14px] min-w-fit">
            {monthLabels.map((ml, i) => (
              <span
                key={i}
                className="text-[9px] text-[#aaa] absolute whitespace-nowrap"
                style={{ left: ml.weekIdx * (cellSize + gap) }}
              >
                {ml.label}
              </span>
            ))}
          </div>
          {/* Grid de semanas */}
          <div className="flex gap-[3px] min-w-fit">
            {weeks.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-[3px]">
                {week.map((day, dIdx) => (
                  <div
                    key={dIdx}
                    className="rounded-[3px]"
                    style={{
                      width: cellSize,
                      height: cellSize,
                      background: getColor(day),
                    }}
                    title={`${day.date}: ${day.total > 0 ? Math.round(day.total / 60) + 'm' : 'sin actividad'}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useMemo } from 'react';
import { getConsistencyData, hexToRgba } from './trackerUtils';
import type { Activity, TimeSession } from '../../types';

interface Props {
  sessions: TimeSession[];
  activity: Activity;
}

export function ConsistencyGraph({ sessions, activity }: Props) {
  const data = useMemo(() => getConsistencyData(sessions, activity.id), [sessions, activity.id]);

  // 52 semanas × 7 días, agrupar por semana
  const weeks = useMemo(() => {
    const result: { date: string; total: number }[][] = [];
    for (let w = 0; w < 52; w++) {
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

  const activeDays = data.filter((d) => d.total > 0).length;
  const totalSeconds = data.reduce((sum, d) => sum + d.total, 0);

  function getColor(total: number): string {
    if (total === 0) return '#f0f0f0';
    const intensity = Math.min(1, total / maxTotal);
    return hexToRgba(activity.color, 0.25 + intensity * 0.75);
  }

  const cellSize = 9;
  const gap = 2;

  return (
    <div className="bg-white p-4 rounded-[20px] shadow-[4px_4px_10px_#e6e6e6,-4px_-4px_10px_#ffffff]">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[12px] font-semibold text-[#999] uppercase tracking-wide m-0">Consistencia (52 sem)</p>
        <div className="flex items-center gap-3 text-[11px] text-[#999]">
          <span>{activeDays} días activos</span>
        </div>
      </div>

      <div className="overflow-x-auto no-scrollbar">
        <div className="inline-flex flex-col gap-1">
          {/* Etiquetas de meses */}
          <div className="flex gap-[2px] mb-0.5 relative h-[14px]">
            {monthLabels.map((ml, i) => (
              <span
                key={i}
                className="text-[9px] text-[#aaa] absolute"
                style={{ left: ml.weekIdx * (cellSize + gap) }}
              >
                {ml.label}
              </span>
            ))}
          </div>
          {/* Grid de semanas */}
          <div className="flex gap-[2px]">
            {weeks.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-[2px]">
                {week.map((day, dIdx) => (
                  <div
                    key={dIdx}
                    className="rounded-[2px]"
                    style={{
                      width: cellSize,
                      height: cellSize,
                      background: getColor(day.total),
                    }}
                    title={`${day.date}: ${day.total > 0 ? Math.round(day.total / 60) + 'm' : 'sin actividad'}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex items-center justify-end gap-1.5 mt-2">
        <span className="text-[9px] text-[#aaa]">Menos</span>
        {[0, 0.25, 0.5, 0.75, 1].map((intensity) => (
          <div
            key={intensity}
            className="rounded-[2px]"
            style={{
              width: cellSize,
              height: cellSize,
              background: intensity === 0 ? '#f0f0f0' : hexToRgba(activity.color, 0.25 + intensity * 0.75),
            }}
          />
        ))}
        <span className="text-[9px] text-[#aaa]">Más</span>
      </div>

      {totalSeconds > 0 && (
        <p className="text-[11px] text-[#999] m-0 mt-2 text-center">
          {Math.round(totalSeconds / 3600)}h totales en el último año
        </p>
      )}
    </div>
  );
}

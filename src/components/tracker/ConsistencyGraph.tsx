import { useMemo } from 'react';
import { getConsistencyData, hexToRgba } from './trackerUtils';
import type { Activity, TimeSession } from '../../types';

interface Props {
  sessions: TimeSession[];
  activity: Activity;
}

export function ConsistencyGraph({ sessions, activity }: Props) {
  const data = useMemo(() => getConsistencyData(sessions, activity.id), [sessions, activity.id]);

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

  const activeDays = data.filter((d) => d.total > 0).length;
  const totalSeconds = data.reduce((sum, d) => sum + d.total, 0);

  function getColor(day: { total: number; isFuture: boolean }): string {
    if (day.isFuture) return '#ffffff';
    if (day.total === 0) return '#e8e8e8';
    const intensity = Math.min(1, day.total / maxTotal);
    return hexToRgba(activity.color, 0.3 + intensity * 0.7);
  }

  const cellSize = 13;
  const gap = 3;

  return (
    <div className="bg-white p-4 rounded-[20px] shadow-[4px_4px_10px_#e6e6e6,-4px_-4px_10px_#ffffff]">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[12px] font-semibold text-[#999] uppercase tracking-wide m-0">Consistencia {new Date().getFullYear()}</p>
        <span className="text-[11px] text-[#999]">{activeDays} días activos</span>
      </div>

      <div className="overflow-x-auto no-scrollbar">
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
                    className="rounded-[3px] border border-[#f5f5f5]"
                    style={{
                      width: cellSize,
                      height: cellSize,
                      background: getColor(day),
                    }}
                    title={`${day.date}: ${day.total > 0 ? Math.round(day.total / 60) + 'm' : day.isFuture ? 'futuro' : 'sin actividad'}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
        <div className="flex items-center gap-1">
          <div className="rounded-[3px] border border-[#f5f5f5]" style={{ width: cellSize, height: cellSize, background: '#e8e8e8' }} />
          <span className="text-[9px] text-[#aaa]">Sin registro</span>
        </div>
        <div className="flex items-center gap-1">
          {[0.3, 0.6, 1].map((intensity) => (
            <div key={intensity} className="rounded-[3px]" style={{ width: cellSize, height: cellSize, background: hexToRgba(activity.color, intensity) }} />
          ))}
          <span className="text-[9px] text-[#aaa]">Registrado</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="rounded-[3px] border border-[#f5f5f5]" style={{ width: cellSize, height: cellSize, background: '#ffffff' }} />
          <span className="text-[9px] text-[#aaa]">Futuro</span>
        </div>
      </div>

      {totalSeconds > 0 && (
        <p className="text-[11px] text-[#999] m-0 mt-2 text-center">
          {Math.round(totalSeconds / 3600)}h totales este año
        </p>
      )}
    </div>
  );
}

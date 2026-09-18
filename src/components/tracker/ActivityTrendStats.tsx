import { useState, useMemo } from 'react';
import { formatDuration, filterSessionsByDateRange, hexToRgba, getBiweeklyRange, getBiweeklyLabel } from './trackerUtils';
import { isoToDateKey, dayLabel } from '../../hooks/useTimeTracker';
import type { Activity, TimeSession } from '../../types';

interface Props {
  sessions: TimeSession[];
  activity: Activity;
}

function formatAxisLabel(seconds: number): string {
  if (seconds === 0) return '0';
  return formatDuration(seconds);
}

export function ActivityTrendStats({ sessions, activity }: Props) {
  const [offset, setOffset] = useState(0);

  const actSessions = useMemo(
    () => sessions.filter((s) => s.activityId === activity.id),
    [sessions, activity.id],
  );

  const range = useMemo(() => getBiweeklyRange(offset), [offset]);
  const rangeLabel = useMemo(() => getBiweeklyLabel(offset), [offset]);

  const rangeSessions = useMemo(
    () => filterSessionsByDateRange(actSessions, range.start, range.end),
    [actSessions, range],
  );

  // Totales diarios para 14 días
  const dailyTotals = useMemo(() => {
    const totals: { date: Date; total: number; label: string }[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(range.start);
      d.setDate(range.start.getDate() + i);
      const dateKey = isoToDateKey(d.toISOString());
      const total = actSessions
        .filter((s) => isoToDateKey(s.startTime) === dateKey)
        .reduce((sum, s) => sum + s.duration, 0);
      totals.push({
        date: d,
        total,
        label: d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }),
      });
    }
    return totals;
  }, [actSessions, range]);

  // Stats del rango
  const totalSeconds = rangeSessions.reduce((s, x) => s + x.duration, 0);
  const activeDays = new Set(rangeSessions.map((s) => isoToDateKey(s.startTime))).size;
  const avgPerDay = Math.round(totalSeconds / 14);

  const bestDay = useMemo(() => {
    let best = '';
    let bestTotal = 0;
    for (const dt of dailyTotals) {
      if (dt.total > bestTotal) {
        best = isoToDateKey(dt.date.toISOString());
        bestTotal = dt.total;
      }
    }
    return bestTotal > 0 ? { label: dayLabel(best), total: bestTotal } : null;
  }, [dailyTotals]);

  const maxTotal = Math.max(...dailyTotals.map((d) => d.total), 1);

  // Y-axis: "nice" max y etiquetas
  const niceMax = useMemo(() => {
    if (maxTotal <= 3600) return 3600;
    return Math.ceil(maxTotal / 3600) * 3600;
  }, [maxTotal]);

  const yLabels = useMemo(() => {
    const steps = 4;
    return Array.from({ length: steps + 1 }, (_, i) => formatAxisLabel(Math.round((niceMax * i) / steps)));
  }, [niceMax]);

  const stats = [
    { label: 'Tiempo total', value: formatDuration(totalSeconds), sub: null as string | null },
    { label: 'Promedio/día', value: formatDuration(avgPerDay), sub: null },
    { label: 'Mejor día', value: bestDay ? formatDuration(bestDay.total) : '—', sub: bestDay?.label ?? null },
    { label: 'Días activos', value: `${activeDays}`, sub: null },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Selector de rango de fechas */}
      <div className="flex items-center justify-center gap-4 py-1">
        <button
          onClick={() => setOffset((o) => o - 1)}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 active:scale-90 border-none bg-transparent cursor-pointer transition-transform"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <span className="text-[14px] font-semibold text-[#333] tabular-nums min-w-[120px] text-center">{rangeLabel}</span>
        <button
          onClick={() => setOffset((o) => Math.min(0, o + 1))}
          disabled={offset >= 0}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 active:scale-90 border-none bg-transparent cursor-pointer transition-transform disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
        </button>
      </div>

      {/* Stats en lista */}
      <div className="bg-white rounded-[24px] shadow-[6px_6px_12px_#e6e6e6,-6px_-6px_12px_#ffffff] overflow-hidden">
        {stats.map((s, i) => (
          <div key={i} className={`flex items-center justify-between px-5 py-3.5 ${i > 0 ? 'border-t border-[#f2f2f2]' : ''}`}>
            <div>
              <p className="text-[14px] font-medium text-[#333] m-0">{s.label}</p>
              {s.sub && <p className="text-[11px] text-[#999] m-0 mt-0.5">{s.sub}</p>}
            </div>
            <span className="text-[16px] font-bold text-[#333] tabular-nums shrink-0">{s.value}</span>
          </div>
        ))}
      </div>

      {/* Gráfico Progreso */}
      <div className="bg-white p-4 rounded-[20px] shadow-[4px_4px_10px_#e6e6e6,-4px_-4px_10px_#ffffff]">
        <p className="text-[12px] font-semibold text-[#999] uppercase tracking-wide m-0 mb-3">Progreso</p>
        <div className="flex" style={{ height: '150px' }}>
          {/* Eje Y */}
          <div className="flex flex-col justify-between pr-2 text-[9px] text-[#aaa] tabular-nums items-end" style={{ height: '100%' }}>
            {yLabels.map((label, i) => (
              <span key={i} className="leading-none">{label}</span>
            ))}
          </div>
          {/* Área del gráfico */}
          <div className="flex-1 relative">
            {/* Gridlines */}
            {yLabels.map((_, i) => (
              <div
                key={i}
                className="absolute left-0 right-0 border-t border-[#f5f5f5]"
                style={{ top: `${(i / (yLabels.length - 1)) * 100}%` }}
              />
            ))}
            {/* Barras */}
            <div className="absolute inset-0 flex items-end justify-between gap-[2px]">
              {dailyTotals.map((dt, i) => {
                const heightPct = niceMax > 0 ? (dt.total / niceMax) * 100 : 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center h-full justify-end">
                    <div
                      className="w-full rounded-t-[3px] transition-all"
                      style={{
                        height: `${Math.max(dt.total > 0 ? 4 : 0, heightPct)}%`,
                        background: dt.total > 0 ? hexToRgba(activity.color, 0.3 + (dt.total / maxTotal) * 0.7) : 'transparent',
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {/* Eje X */}
        <div className="flex pl-8 mt-1.5">
          {dailyTotals.map((dt, i) => (
            <div key={i} className="flex-1 text-center">
              <span className="text-[8px] text-[#aaa]">{i % 2 === 0 ? dt.label : ''}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

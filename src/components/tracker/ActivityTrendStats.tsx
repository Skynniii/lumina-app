import { useMemo } from 'react';
import { formatDuration, getStreak, filterSessionsByDateRange, getWeekRange, hexToRgba } from './trackerUtils';
import { isoToDateKey, dayLabel } from '../../hooks/useTimeTracker';
import type { Activity, TimeSession } from '../../types';

interface Props {
  sessions: TimeSession[];
  activity: Activity;
}

export function ActivityTrendStats({ sessions, activity }: Props) {
  const actSessions = useMemo(
    () => sessions.filter((s) => s.activityId === activity.id),
    [sessions, activity.id],
  );

  // Esta semana vs semana anterior
  const thisWeek = useMemo(() => {
    const { start, end } = getWeekRange(0);
    return filterSessionsByDateRange(actSessions, start, end).reduce((s, x) => s + x.duration, 0);
  }, [actSessions]);

  const lastWeek = useMemo(() => {
    const { start, end } = getWeekRange(-1);
    return filterSessionsByDateRange(actSessions, start, end).reduce((s, x) => s + x.duration, 0);
  }, [actSessions]);

  const weekDiff = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : null;

  // Racha específica de la actividad
  const streak = useMemo(() => {
    const sessionDates = new Set(actSessions.map((s) => isoToDateKey(s.startTime)));
    let s = 0;
    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (!sessionDates.has(todayStr)) {
      d.setDate(d.getDate() - 1);
    }
    while (true) {
      const dk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (sessionDates.has(dk)) {
        s++;
        d.setDate(d.getDate() - 1);
      } else break;
    }
    return s;
  }, [actSessions]);

  // Día más productivo (histórico)
  const bestDay = useMemo(() => {
    const dayMap = new Map<string, number>();
    for (const s of actSessions) {
      const dk = isoToDateKey(s.startTime);
      dayMap.set(dk, (dayMap.get(dk) ?? 0) + s.duration);
    }
    let best = '';
    let bestTotal = 0;
    for (const [date, total] of dayMap) {
      if (total > bestTotal) { best = date; bestTotal = total; }
    }
    return best ? { label: dayLabel(best), total: bestTotal } : null;
  }, [actSessions]);

  // Promedio diario (días activos)
  const activeDays = useMemo(() => new Set(actSessions.map((s) => isoToDateKey(s.startTime))).size, [actSessions]);
  const totalSeconds = useMemo(() => actSessions.reduce((s, x) => s + x.duration, 0), [actSessions]);
  const avgPerDay = activeDays > 0 ? Math.round(totalSeconds / activeDays) : 0;

  // Distribución por día de la semana
  const dayOfWeekTotals = useMemo(() => {
    const totals = [0, 0, 0, 0, 0, 0, 0]; // Dom-Sáb
    for (const s of actSessions) {
      const dow = new Date(s.startTime).getDay();
      totals[dow] += s.duration;
    }
    return totals;
  }, [actSessions]);

  const maxDow = Math.max(...dayOfWeekTotals, 1);
  const dowLabels = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

  const stats = [
    { label: 'Esta semana', value: formatDuration(thisWeek), sub: weekDiff != null ? `${weekDiff >= 0 ? '↑' : '↓'} ${Math.abs(weekDiff)}% vs anterior` : null, subColor: weekDiff != null && weekDiff >= 0 ? '#34c77b' : '#ff6b81' },
    { label: 'Racha', value: `${streak}`, sub: streak === 1 ? 'día' : 'días', subColor: '#999' as const },
    { label: 'Prom/día', value: formatDuration(avgPerDay), sub: `${activeDays} días activos`, subColor: '#999' as const },
    { label: 'Mejor día', value: bestDay ? formatDuration(bestDay.total) : '—', sub: bestDay?.label ?? null, subColor: '#999' as const },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s, i) => (
          <div key={i} className="bg-white p-3.5 rounded-2xl shadow-[4px_4px_10px_#e6e6e6,-4px_-4px_10px_#ffffff] flex flex-col gap-1">
            <p className="text-[10px] font-semibold text-[#999] uppercase tracking-wide m-0">{s.label}</p>
            <p className="text-[18px] font-bold text-[#333] tabular-nums leading-none m-0">{s.value}</p>
            {s.sub && (
              <p className="text-[11px] font-medium m-0" style={{ color: s.subColor }}>{s.sub}</p>
            )}
          </div>
        ))}
      </div>

      {/* Distribución por día de la semana */}
      <div className="bg-white p-4 rounded-[20px] shadow-[4px_4px_10px_#e6e6e6,-4px_-4px_10px_#ffffff]">
        <p className="text-[12px] font-semibold text-[#999] uppercase tracking-wide m-0 mb-3">Por día de la semana</p>
        <div className="flex items-end justify-between gap-1.5 h-[80px]">
          {dayOfWeekTotals.map((total, i) => {
            const heightPct = (total / maxDow) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <div className="w-full flex items-end h-full">
                  <div
                    className="w-full rounded-t-[3px] transition-all"
                    style={{
                      height: `${Math.max(total > 0 ? 5 : 2, heightPct)}%`,
                      background: total > 0 ? hexToRgba(activity.color, 0.3 + (total / maxDow) * 0.7) : '#f0f0f0',
                    }}
                  />
                </div>
                <span className="text-[10px] font-medium text-[#aaa]">{dowLabels[i]}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

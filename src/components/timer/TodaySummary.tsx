import { formatElapsed, todayKey } from '../../hooks/useTimeTracker';
import type { Activity, TimeEntry } from '../../types';

interface Props {
  entries: TimeEntry[];
  activities: Activity[];
  liveElapsed: number;
  isRunning: boolean;
}

interface BreakdownRow {
  key: string;
  label: string;
  color: string;
  seconds: number;
}

export function TodaySummary({ entries, activities, liveElapsed, isRunning }: Props) {
  const todayEntries = entries.filter((e) => e.date === todayKey());

  const totals = new Map<string, number>();
  todayEntries.forEach((e) => totals.set(e.activityId, (totals.get(e.activityId) ?? 0) + e.seconds));

  const rows: BreakdownRow[] = [];
  totals.forEach((seconds, activityId) => {
    const activity = activities.find((a) => a.id === activityId);
    rows.push({ key: activityId, label: activity?.name ?? 'Otra', color: activity?.color ?? '#bbb', seconds });
  });
  if (liveElapsed >= 1) {
    rows.unshift({ key: 'live', label: 'En curso', color: '#34c77b', seconds: liveElapsed });
  }
  rows.sort((a, b) => b.seconds - a.seconds);

  const total = todayEntries.reduce((s, e) => s + e.seconds, 0) + (liveElapsed >= 1 ? liveElapsed : 0);

  return (
    <div className="bg-white p-5 rounded-[24px] shadow-[6px_6px_12px_#e6e6e6,-6px_-6px_12px_#ffffff] flex flex-col gap-3.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold text-[#999] uppercase tracking-wide m-0">Hoy</p>
        <div className="flex items-center gap-2">
          {isRunning && <span className="w-2 h-2 rounded-full bg-[#34c77b] animate-pulse" />}
          <span className="text-2xl font-bold text-[#333] tabular-nums m-0">{formatElapsed(total)}</span>
        </div>
      </div>

      {/* Barra apilada horizontal — recorrido visual del día */}
      {rows.length > 0 && (
        <div className="h-3.5 rounded-full overflow-hidden flex bg-[#f0f0f0] shadow-[inset_1px_1px_3px_#e6e6e6]">
          {rows.map((r) => {
            const pct = total > 0 ? (r.seconds / total) * 100 : 0;
            return (
              <div
                key={r.key}
                className="h-full transition-[width] duration-700 ease-out first:rounded-l-full last:rounded-r-full"
                style={{ width: `${pct}%`, background: r.color }}
              />
            );
          })}
        </div>
      )}

      {/* Lista de actividades con barra de color — altura fija con scroll */}
      {rows.length > 0 ? (
        <div className="flex flex-col gap-2 max-h-[120px] overflow-y-auto no-scrollbar -mr-1 pr-1">
          {rows.map((r) => {
            const pct = total > 0 ? Math.min(100, (r.seconds / total) * 100) : 0;
            return (
              <div key={r.key} className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: r.color }} />
                    <span className="text-[13px] text-[#555]">{r.label}</span>
                  </div>
                  <span className="text-[13px] font-semibold text-[#777] tabular-nums">{formatElapsed(r.seconds)}</span>
                </div>
                {/* Liniesita de color que referencia el tiempo de la actividad */}
                <div className="h-1 rounded-full bg-[#f0f0f0] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-[width] duration-700 ease-out"
                    style={{ width: `${pct}%`, background: r.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-[13px] text-[#c0c0c0] text-center py-2 m-0">Sin actividad registrada hoy.</p>
      )}
    </div>
  );
}

import { formatDuration, type ActivityStats } from './trackerUtils';

interface Props {
  stat: ActivityStats;
}

export function ActivityStatCard({ stat }: Props) {
  const { activity, totalSeconds, sessionCount, avgSeconds, percentage } = stat;

  return (
    <div className="bg-white p-4 rounded-2xl shadow-[4px_4px_10px_#e6e6e6,-4px_-4px_10px_#ffffff] flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full shrink-0" style={{ background: activity.color }} />
        <span className="text-[13px] font-semibold text-[#333] truncate">{activity.name}</span>
      </div>
      <p className="text-[22px] font-bold text-[#333] tabular-nums leading-none">{formatDuration(totalSeconds)}</p>
      <div className="flex justify-between text-[11px] text-[#999]">
        <span>{sessionCount} {sessionCount === 1 ? 'sesión' : 'sesiones'}</span>
        <span>Prom: {formatDuration(avgSeconds)}</span>
      </div>
      <div className="h-1 rounded-full bg-[#f0f0f0] overflow-hidden mt-0.5">
        <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${percentage}%`, background: activity.color }} />
      </div>
    </div>
  );
}

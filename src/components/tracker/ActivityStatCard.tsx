import { formatDuration, type ActivityStats } from './trackerUtils';

interface Props {
  stat: ActivityStats;
  onClick?: () => void;
}

export function ActivityStatCard({ stat, onClick }: Props) {
  const { activity, totalSeconds, percentage } = stat;

  return (
    <button
      onClick={onClick}
      className="bg-white p-4 rounded-2xl shadow-[4px_4px_10px_#e6e6e6,-4px_-4px_10px_#ffffff] flex flex-col gap-2 border-none cursor-pointer text-left transition-transform active:scale-[0.97] w-full"
    >
      <div className="flex items-center justify-between">
        <span className="text-[14px] font-semibold text-[#333] truncate">{activity.name}</span>
        <span className="text-[15px] font-bold text-[#333] tabular-nums shrink-0">{formatDuration(totalSeconds)}</span>
      </div>
      <div className="h-2 rounded-full bg-[#f0f0f0] overflow-hidden">
        <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${percentage}%`, background: activity.color }} />
      </div>
    </button>
  );
}

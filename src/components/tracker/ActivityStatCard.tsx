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
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[15px] font-bold text-[#333] tabular-nums">{formatDuration(totalSeconds)}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </div>
      </div>
      <div className="h-2 rounded-full bg-[#f0f0f0] overflow-hidden">
        <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${percentage}%`, background: activity.color }} />
      </div>
    </button>
  );
}

import { formatDuration, type ActivityStats } from './trackerUtils';

interface Props {
  stat: ActivityStats;
  onClick?: () => void;
}

export function ActivityStatCard({ stat, onClick }: Props) {
  const { activity, totalSeconds, sessionCount, avgSeconds, percentage, taskCount, completedTaskCount } = stat;

  return (
    <button
      onClick={onClick}
      className="bg-white p-4 rounded-2xl shadow-[4px_4px_10px_#e6e6e6,-4px_-4px_10px_#ffffff] flex flex-col gap-2 border-none cursor-pointer text-left transition-transform active:scale-[0.97] w-full"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-3 h-3 rounded-full shrink-0" style={{ background: activity.color }} />
          <span className="text-[13px] font-semibold text-[#333] truncate">{activity.name}</span>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M9 18l6-6-6-6" /></svg>
      </div>
      <p className="text-[22px] font-bold text-[#333] tabular-nums leading-none">{formatDuration(totalSeconds)}</p>
      <div className="flex justify-between text-[11px] text-[#999]">
        <span>{sessionCount} {sessionCount === 1 ? 'sesión' : 'sesiones'}</span>
        <span>Prom: {formatDuration(avgSeconds)}</span>
      </div>
      {taskCount > 0 && (
        <div className="flex items-center gap-1.5 text-[11px] text-[#999]">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          <span>{completedTaskCount}/{taskCount} tareas</span>
        </div>
      )}
      <div className="h-1 rounded-full bg-[#f0f0f0] overflow-hidden mt-0.5">
        <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${percentage}%`, background: activity.color }} />
      </div>
    </button>
  );
}

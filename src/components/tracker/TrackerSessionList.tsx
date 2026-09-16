import { formatElapsed, formatClock, isoToDateKey, dayLabel } from '../../hooks/useTimeTracker';
import type { Activity, TimeSession } from '../../types';

interface Props {
  sessions: TimeSession[];
  activities: Activity[];
  showDate?: boolean;
}

export function TrackerSessionList({ sessions, activities, showDate }: Props) {
  return (
    <div className="bg-white rounded-[24px] shadow-[6px_6px_12px_#e6e6e6,-6px_-6px_12px_#ffffff] overflow-hidden">
      {sessions.map((s, i) => {
        const activity = activities.find((a) => a.id === s.activityId);
        const timeLabel = showDate
          ? `${dayLabel(isoToDateKey(s.startTime))} · ${formatClock(s.startTime)}`
          : `${formatClock(s.startTime)} – ${formatClock(s.endTime)}`;
        return (
          <div key={s.id} className={`flex items-center gap-3 px-5 py-3.5 ${i > 0 ? 'border-t border-[#f2f2f2]' : ''}`}>
            <span className="w-3 h-3 rounded-full shrink-0" style={{ background: activity?.color ?? '#bbb' }} />
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-medium text-[#333] truncate m-0">{s.description || 'Sin descripción'}</p>
              <p className="text-[12px] text-[#999] m-0 mt-0.5">{activity?.name ?? 'Sin actividad'} · {timeLabel}</p>
            </div>
            <span className="text-[15px] font-semibold text-[#555] tabular-nums shrink-0">{formatElapsed(s.duration)}</span>
          </div>
        );
      })}
    </div>
  );
}

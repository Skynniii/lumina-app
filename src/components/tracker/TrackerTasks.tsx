import { formatDuration } from './trackerUtils';
import type { Activity, Task } from '../../types';

interface Props {
  tasks: Task[];
  activities: Activity[];
}

export function TrackerTasks({ tasks, activities }: Props) {
  const listNameById: Record<string, string> = {};
  for (const a of activities) listNameById[a.id] = a.name;

  return (
    <div className="bg-white rounded-[24px] shadow-[6px_6px_12px_#e6e6e6,-6px_-6px_12px_#ffffff] overflow-hidden">
      {tasks.map((t, i) => {
        const activity = activities.find((a) => a.id === t.activityId);
        return (
          <div key={t.id} className={`flex items-center gap-3 px-5 py-3.5 ${i > 0 ? 'border-t border-[#f2f2f2]' : ''}`}>
            <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: activity?.color ?? '#7f70ff' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-medium text-[#333] truncate m-0">{t.title}</p>
              <p className="text-[12px] text-[#999] m-0 mt-0.5">
                {activity?.name ?? 'Sin actividad'}
                {t.totalTimeSpent != null && t.totalTimeSpent > 0 ? ` · ${formatDuration(t.totalTimeSpent)}` : ''}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

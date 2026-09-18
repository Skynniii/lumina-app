import { motion } from 'framer-motion';
import { formatDuration, type DayTotal } from './trackerUtils';

interface Props {
  dailyTotals: DayTotal[];
}

export function TrackerChart({ dailyTotals }: Props) {
  const maxTotal = Math.max(...dailyTotals.map((d) => d.total), 1);
  const weekTotal = dailyTotals.reduce((sum, d) => sum + d.total, 0);

  return (
    <div className="bg-white p-5 rounded-[24px] shadow-[6px_6px_12px_#e6e6e6,-6px_-6px_12px_#ffffff]">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[13px] font-semibold text-[#999] uppercase tracking-wide m-0">Esta semana</p>
        <span className="text-[14px] font-bold text-[#333] tabular-nums">{formatDuration(weekTotal)}</span>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-end justify-between gap-1.5 h-[100px]">
          {dailyTotals.map((day, i) => {
            const heightPct = (day.total / maxTotal) * 100;
            return (
              <div key={i} className="flex-1 flex items-end h-full">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(day.total > 0 ? 6 : 2, heightPct)}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut', delay: i * 0.05 }}
                  className="w-full rounded-t-[4px]"
                  style={{ background: day.isToday ? '#7f70ff' : '#d4ceff' }}
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between gap-1.5">
          {dailyTotals.map((day, i) => (
            <span key={i} className="flex-1 text-center text-[10px] font-medium capitalize" style={{ color: day.isToday ? '#7f70ff' : '#999' }}>
              {day.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

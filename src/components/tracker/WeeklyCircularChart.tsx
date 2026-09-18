import { motion } from 'framer-motion';
import { formatDuration, type DayTotal } from './trackerUtils';

interface Props {
  dailyTotals: DayTotal[];
}

export function WeeklyCircularChart({ dailyTotals }: Props) {
  const weekTotal = dailyTotals.reduce((sum, d) => sum + d.total, 0);
  const maxDaily = Math.max(...dailyTotals.map((d) => d.total), 1);

  const size = 140;
  const stroke = 14;
  const gap = 6; // grados entre segmentos
  const radius = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  const segmentAngle = (360 - gap * 7) / 7;

  return (
    <div className="bg-white p-5 rounded-[24px] shadow-[6px_6px_12px_#e6e6e6,-6px_-6px_12px_#ffffff]">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[13px] font-semibold text-[#999] uppercase tracking-wide m-0">Esta semana</p>
        <span className="text-[14px] font-bold text-[#333] tabular-nums">{formatDuration(weekTotal)}</span>
      </div>

      <div className="flex items-center gap-5">
        {/* Gráfico circular */}
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            {dailyTotals.map((day, i) => {
              const fillPct = day.total > 0 ? Math.max(0.08, day.total / maxDaily) : 0;
              const startAngle = i * (segmentAngle + gap) - 90 + gap / 2;
              const arcLength = (segmentAngle / 360) * circumference * fillPct;
              const offset = (startAngle / 360) * circumference;
              return (
                <motion.circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r={radius}
                  fill="none"
                  stroke={day.total > 0 ? (day.isToday ? '#7f70ff' : '#d4ceff') : '#f0f0f0'}
                  strokeWidth={stroke}
                  strokeLinecap="round"
                  strokeDasharray={`${arcLength} ${circumference}`}
                  strokeDashoffset={-offset}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                />
              );
            })}
          </svg>
          {/* Centro */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[20px] font-bold text-[#333] tabular-nums leading-none">{formatDuration(weekTotal)}</span>
            <span className="text-[10px] font-medium text-[#999] mt-1">total</span>
          </div>
        </div>

        {/* Leyenda con barras diarias */}
        <div className="flex-1 flex flex-col gap-1.5">
          {dailyTotals.map((day, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-[10px] font-medium capitalize w-7 shrink-0" style={{ color: day.isToday ? '#7f70ff' : '#999' }}>
                {day.label}
              </span>
              <div className="flex-1 h-2 rounded-full bg-[#f0f0f0] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(day.total / maxDaily) * 100}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut', delay: i * 0.05 }}
                  className="h-full rounded-full"
                  style={{ background: day.isToday ? '#7f70ff' : '#d4ceff' }}
                />
              </div>
              <span className="text-[10px] font-semibold text-[#aaa] tabular-nums w-8 text-right shrink-0">
                {day.total > 0 ? formatDuration(day.total) : '—'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

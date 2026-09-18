import { motion } from 'framer-motion';
import { formatDuration, type ActivityStats } from './trackerUtils';

interface Props {
  activityStats: ActivityStats[];
  totalSeconds: number;
}

export function WeeklyCircularChart({ activityStats, totalSeconds }: Props) {
  const size = 180;
  const stroke = 18;
  const radius = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;

  // Segmentos por actividad
  let accumulatedAngle = 0;
  const segments = activityStats
    .filter((s) => s.totalSeconds > 0)
    .map((stat) => {
      const pct = totalSeconds > 0 ? stat.totalSeconds / totalSeconds : 0;
      const arcLength = pct * circumference;
      const offset = accumulatedAngle;
      accumulatedAngle += arcLength;
      return { stat, arcLength, offset };
    });

  return (
    <div className="flex flex-col items-center pt-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Anillo base */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="#f0f0f0"
            strokeWidth={stroke}
          />
          {/* Segmentos por actividad */}
          {segments.map((seg, i) => (
            <motion.circle
              key={seg.stat.activity.id}
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={seg.stat.activity.color}
              strokeWidth={stroke}
              strokeLinecap="butt"
              strokeDasharray={`${seg.arcLength} ${circumference}`}
              strokeDashoffset={-seg.offset}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            />
          ))}
        </svg>
        {/* Centro */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[26px] font-bold text-[#333] tabular-nums leading-none">{formatDuration(totalSeconds)}</span>
          <span className="text-[11px] font-medium text-[#aaa] mt-1.5">esta semana</span>
        </div>
      </div>
    </div>
  );
}

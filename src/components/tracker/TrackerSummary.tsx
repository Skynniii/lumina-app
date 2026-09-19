import { motion, AnimatePresence } from 'framer-motion';
import { formatElapsed } from '../../hooks/useTimeTracker';
import { formatDuration, type ActivityStats } from './trackerUtils';
import { useDeviceCapability } from '../../context/DeviceCapabilityContext';

interface Props {
  totalSeconds: number;
  sessionCount: number;
  avgSeconds: number;
  activityStats: ActivityStats[];
  liveElapsed: number;
  isRunning: boolean;
  liveActivityId?: string;
  previousSeconds: number;
}

export function TrackerSummary({ totalSeconds, sessionCount, avgSeconds, activityStats, liveElapsed, isRunning, liveActivityId, previousSeconds }: Props) {
  const cap = useDeviceCapability();
  const displayStats = [...activityStats];
  if (liveElapsed > 0 && liveActivityId) {
    const idx = displayStats.findIndex((s) => s.activity.id === liveActivityId);
    if (idx >= 0) {
      displayStats[idx] = { ...displayStats[idx], totalSeconds: displayStats[idx].totalSeconds + liveElapsed };
    }
  }

  const displayTotal = totalSeconds + liveElapsed;

  // Comparison badge vs previous period
  let diffPct: number | null = null;
  let diffUp: boolean | null = null;
  if (previousSeconds > 0) {
    diffPct = Math.round(Math.abs(((displayTotal - previousSeconds) / previousSeconds) * 100));
    diffUp = displayTotal >= previousSeconds;
  }

  return (
    <div className="bg-white p-5 rounded-[24px] shadow-[6px_6px_12px_#e6e6e6,-6px_-6px_12px_#ffffff] flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold text-[#999] uppercase tracking-wide m-0">Tiempo total</p>
        <div className="flex items-center gap-2">
          {isRunning && <span className="w-2 h-2 rounded-full bg-[#34c77b] animate-pulse" />}
          <span className="text-[36px] font-bold text-[#333] tabular-nums leading-none">{formatElapsed(displayTotal)}</span>
          {diffPct != null && diffPct > 0 && (
            <span
              className="text-[12px] font-bold px-2 py-1 rounded-full tabular-nums"
              style={{ background: diffUp ? 'rgba(52,199,123,0.1)' : 'rgba(255,107,129,0.1)', color: diffUp ? '#34c77b' : '#ff6b81' }}
            >
              {diffUp ? '↑' : '↓'} {diffPct}%
            </span>
          )}
        </div>
      </div>

      {sessionCount > 0 && (
        <p className="text-[12px] text-[#999] m-0 -mt-1">
          {sessionCount} {sessionCount === 1 ? 'sesión' : 'sesiones'} · Prom: {formatDuration(avgSeconds)}
        </p>
      )}

      {displayStats.length > 0 && (
        <div className="flex flex-col gap-3 mt-1">
          <AnimatePresence initial={false}>
            {displayStats.map((s) => {
              const pct = displayTotal > 0 ? Math.min(100, (s.totalSeconds / displayTotal) * 100) : 0;
              const hasLive = isRunning && s.activity.id === liveActivityId;
              return (
                <motion.div key={s.activity.id} layout={cap.enableLayout} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.activity.color }} />
                      <span className="text-[13px] font-semibold text-[#555]">{s.activity.name}</span>
                    </div>
                    <span className="text-[13px] font-semibold text-[#777] tabular-nums">{formatElapsed(s.totalSeconds)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#f0f0f0] overflow-hidden">
                    <div className="h-full rounded-full transition-[width] duration-700 ease-out relative overflow-hidden" style={{ width: `${pct}%`, background: s.activity.color }}>
                      {hasLive && (
                        <motion.div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }} animate={{ x: ['-100%', '200%'] }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }} />
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

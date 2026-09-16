import type { Activity, TimeSession } from '../../types';
import { todayKey, isoToDateKey } from '../../hooks/useTimeTracker';

export type Period = 'today' | 'week' | 'month';

export const PERIOD_LABELS: Record<Period, string> = {
  today: 'Hoy',
  week: 'Semana',
  month: 'Mes',
};

/** Formato compacto: "5h 20m", "45m", "30s" */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${seconds}s`;
}

export function filterSessionsByPeriod(sessions: TimeSession[], period: Period): TimeSession[] {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (period === 'today') {
    const todayStr = todayKey();
    return sessions.filter((s) => isoToDateKey(s.startTime) === todayStr);
  }

  const days = period === 'week' ? 7 : 30;
  const start = new Date(todayStart);
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);

  return sessions.filter((s) => new Date(s.startTime) >= start);
}

export interface ActivityStats {
  activity: Activity;
  totalSeconds: number;
  sessionCount: number;
  avgSeconds: number;
  percentage: number;
}

export function getActivityStats(sessions: TimeSession[], activities: Activity[]): ActivityStats[] {
  const totalAll = sessions.reduce((sum, s) => sum + s.duration, 0);
  return activities
    .map((act) => {
      const actSessions = sessions.filter((s) => s.activityId === act.id);
      const totalSeconds = actSessions.reduce((sum, s) => sum + s.duration, 0);
      return {
        activity: act,
        totalSeconds,
        sessionCount: actSessions.length,
        avgSeconds: actSessions.length > 0 ? Math.round(totalSeconds / actSessions.length) : 0,
        percentage: totalAll > 0 ? (totalSeconds / totalAll) * 100 : 0,
      };
    })
    .filter((stat) => stat.sessionCount > 0)
    .sort((a, b) => b.totalSeconds - a.totalSeconds);
}

export interface DayTotal {
  date: string;
  total: number;
  label: string;
  isToday: boolean;
}

export function getDailyTotals(sessions: TimeSession[]): DayTotal[] {
  const days: DayTotal[] = [];
  const now = new Date();
  const todayStr = todayKey();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const total = sessions
      .filter((s) => isoToDateKey(s.startTime) === dateKey)
      .reduce((sum, s) => sum + s.duration, 0);
    const label = d.toLocaleDateString('es-CO', { weekday: 'short' });
    days.push({ date: dateKey, total, label, isToday: dateKey === todayStr });
  }
  return days;
}

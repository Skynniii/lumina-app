import type { Activity, TimeSession, Task } from '../../types';
import { todayKey, isoToDateKey, dayLabel } from '../../hooks/useTimeTracker';

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
  taskCount: number;
  completedTaskCount: number;
}

export function getActivityStats(sessions: TimeSession[], activities: Activity[], tasks: Task[]): ActivityStats[] {
  const totalAll = sessions.reduce((sum, s) => sum + s.duration, 0);
  return activities
    .map((act) => {
      const actSessions = sessions.filter((s) => s.activityId === act.id);
      const actTasks = tasks.filter((t) => t.activityId === act.id && !t.isSeparator);
      const totalSeconds = actSessions.reduce((sum, s) => sum + s.duration, 0);
      return {
        activity: act,
        totalSeconds,
        sessionCount: actSessions.length,
        avgSeconds: actSessions.length > 0 ? Math.round(totalSeconds / actSessions.length) : 0,
        percentage: totalAll > 0 ? (totalSeconds / totalAll) * 100 : 0,
        taskCount: actTasks.length,
        completedTaskCount: actTasks.filter((t) => t.completed).length,
      };
    })
    .filter((stat) => stat.sessionCount > 0 || stat.taskCount > 0)
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

/** Racha de días consecutivos con al menos una sesión (hasta ayer u hoy). */
export function getStreak(sessions: TimeSession[]): number {
  if (sessions.length === 0) return 0;
  const sessionDates = new Set(sessions.map((s) => isoToDateKey(s.startTime)));
  let streak = 0;
  const d = new Date();
  if (!sessionDates.has(todayKey())) {
    d.setDate(d.getDate() - 1);
  }
  while (true) {
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (sessionDates.has(dateKey)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

/** Segundos del período anterior para comparación. */
export function getPreviousPeriodSeconds(sessions: TimeSession[], period: Period): number {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (period === 'today') {
    const yesterday = new Date(todayStart);
    yesterday.setDate(yesterday.getDate() - 1);
    const yKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    return sessions.filter((s) => isoToDateKey(s.startTime) === yKey).reduce((sum, s) => sum + s.duration, 0);
  }

  const days = period === 'week' ? 7 : 30;
  const currentStart = new Date(todayStart);
  currentStart.setDate(currentStart.getDate() - (days - 1));
  currentStart.setHours(0, 0, 0, 0);

  const prevEnd = new Date(currentStart.getTime() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - (days - 1));
  prevStart.setHours(0, 0, 0, 0);

  return sessions
    .filter((s) => {
      const d = new Date(s.startTime);
      return d >= prevStart && d <= prevEnd;
    })
    .reduce((sum, s) => sum + s.duration, 0);
}

/** Día más productivo del período. */
export function getBestDay(sessions: TimeSession[], period: Period): { label: string; total: number } | null {
  const filtered = filterSessionsByPeriod(sessions, period);
  if (filtered.length === 0) return null;

  const dayMap = new Map<string, number>();
  for (const s of filtered) {
    const dk = isoToDateKey(s.startTime);
    dayMap.set(dk, (dayMap.get(dk) ?? 0) + s.duration);
  }

  let bestDate = '';
  let bestTotal = 0;
  for (const [date, total] of dayMap) {
    if (total > bestTotal) {
      bestDate = date;
      bestTotal = total;
    }
  }

  if (!bestDate) return null;
  return { label: dayLabel(bestDate), total: bestTotal };
}

/** Tareas completadas dentro del período. */
export function getCompletedTasks(tasks: Task[], period: Period): Task[] {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (period === 'today') {
    const todayStr = todayKey();
    return tasks.filter((t) => t.completed && t.completedAt && isoToDateKey(t.completedAt) === todayStr && !t.isSeparator);
  }

  const days = period === 'week' ? 7 : 30;
  const start = new Date(todayStart);
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);

  return tasks.filter((t) => t.completed && t.completedAt && new Date(t.completedAt) >= start && !t.isSeparator);
}

/** Tareas vinculadas a una actividad. */
export function getActivityTasks(tasks: Task[], activityId: string): Task[] {
  return tasks.filter((t) => t.activityId === activityId && !t.isSeparator);
}

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

// ===== Navegación semanal =====

export function getWeekStart(offset = 0): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff + offset * 7);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export function getWeekRange(offset = 0): { start: Date; end: Date } {
  const start = getWeekStart(offset);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function filterSessionsByDateRange(sessions: TimeSession[], start: Date, end: Date): TimeSession[] {
  return sessions.filter((s) => {
    const d = new Date(s.startTime);
    return d >= start && d <= end;
  });
}

export function getWeekLabel(offset = 0): string {
  const { start, end } = getWeekRange(offset);
  const startStr = start.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
  const endStr = end.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
  return `${startStr} - ${endStr}`;
}

// ===== Grafo de consistencia (último año, 52 semanas) =====

export function getConsistencyData(sessions: TimeSession[], activityId: string): { date: string; total: number; isFuture: boolean }[] {
  const dailyMap = new Map<string, number>();
  for (const s of sessions) {
    if (s.activityId !== activityId) continue;
    const dk = isoToDateKey(s.startTime);
    dailyMap.set(dk, (dailyMap.get(dk) ?? 0) + s.duration);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = todayKey();

  // Desde el lunes de la semana del 1 de enero hasta hoy (sin días futuros)
  // Así cada columna del grafo empieza en Lunes y termina en Domingo
  const yearStart = new Date(today.getFullYear(), 0, 1);
  const jan1Day = yearStart.getDay(); // 0=domingo, 1=lunes, ...
  const mondayOffset = jan1Day === 0 ? -6 : 1 - jan1Day;
  const firstMonday = new Date(yearStart);
  firstMonday.setDate(yearStart.getDate() + mondayOffset);
  const totalDays = Math.floor((today.getTime() - firstMonday.getTime()) / 86400000) + 1;

  const days: { date: string; total: number; isFuture: boolean }[] = [];
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(firstMonday);
    d.setDate(firstMonday.getDate() + i);
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    days.push({ date: dateKey, total: dailyMap.get(dateKey) ?? 0, isFuture: false });
  }
  return days;
}

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Mejor racha histórica de días consecutivos con sesiones. */
export function getBestStreak(sessions: TimeSession[]): number {
  if (sessions.length === 0) return 0;
  const dates = Array.from(new Set(sessions.map((s) => isoToDateKey(s.startTime)))).sort();
  let bestStreak = 0;
  let currentStreak = 0;
  let prevTime = 0;
  for (const dateStr of dates) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const time = new Date(y, m - 1, d).getTime();
    if (prevTime > 0 && (time - prevTime) / 86400000 === 1) {
      currentStreak++;
    } else {
      currentStreak = 1;
    }
    bestStreak = Math.max(bestStreak, currentStreak);
    prevTime = time;
  }
  return bestStreak;
}

// ===== Rango quincenal (14 días desde lunes) =====

export function getBiweeklyStart(offset = 0): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff + offset * 14);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export function getBiweeklyRange(offset = 0): { start: Date; end: Date } {
  const start = getBiweeklyStart(offset);
  const end = new Date(start);
  end.setDate(start.getDate() + 13);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function getBiweeklyLabel(offset = 0): string {
  const { start, end } = getBiweeklyRange(offset);
  const startStr = start.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
  const endStr = end.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
  return `${startStr} - ${endStr}`;
}

// ===== Tiempo por tareas para una actividad =====

export function getTimeByTasks(sessions: TimeSession[], tasks: Task[], activityId: string): { taskName: string; totalSeconds: number; lastSessionDate: string }[] {
  const actSessions = sessions.filter((s) => s.activityId === activityId);
  const taskMap = new Map<string, { totalSeconds: number; lastSessionDate: string }>();

  for (const s of actSessions) {
    const key = s.taskId ?? 'no-task';
    const existing = taskMap.get(key);
    if (existing) {
      existing.totalSeconds += s.duration;
      if (new Date(s.startTime) > new Date(existing.lastSessionDate)) {
        existing.lastSessionDate = s.startTime;
      }
    } else {
      taskMap.set(key, { totalSeconds: s.duration, lastSessionDate: s.startTime });
    }
  }

  const result = Array.from(taskMap.entries()).map(([key, data]) => {
    let taskName = 'Sin tareas';
    if (key !== 'no-task') {
      const task = tasks.find((t) => t.id === key);
      taskName = task?.title || 'Sin tareas';
    }
    return { taskName, totalSeconds: data.totalSeconds, lastSessionDate: data.lastSessionDate };
  });

  result.sort((a, b) => new Date(b.lastSessionDate).getTime() - new Date(a.lastSessionDate).getTime());
  return result;
}

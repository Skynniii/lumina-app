import { useCallback, useEffect, useState } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { Activity, TimeEntry } from '../types';

/** Estado del contador en curso. startedAt === null significa pausado. */
export interface RunningTimer {
  sessionStart: number; // epoch ms del primer inicio
  startedAt: number | null; // epoch ms del segmento actual
  accumulated: number; // segundos de segmentos anteriores
}

export interface TrackerDraft {
  activityId: string;
  description: string;
}

const DEFAULT_ACTIVITIES: Activity[] = [
  { id: 'trabajo', name: 'Trabajo', color: '#4d7cfe' },
  { id: 'estudio', name: 'Estudio', color: '#7f70ff' },
  { id: 'ejercicio', name: 'Ejercicio', color: '#34c77b' },
  { id: 'lectura', name: 'Lectura', color: '#ffa94d' },
  { id: 'personal', name: 'Personal', color: '#ff6b81' },
];

export const ACTIVITY_COLORS = ['#4d7cfe', '#7f70ff', '#9d51ff', '#34c77b', '#00b8a9', '#ffa94d', '#ff6b81', '#f26f5b'];

export function todayKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatElapsed(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatClock(epoch: number): string {
  return new Date(epoch).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function dayLabel(dateKey: string): string {
  if (dateKey === todayKey()) return 'Hoy';
  if (dateKey === todayKey(new Date(Date.now() - 86400000))) return 'Ayer';
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'short' });
}

export function useTimeTracker() {
  const [activities, setActivities] = useLocalStorage<Activity[]>('tracker-activities', DEFAULT_ACTIVITIES);
  const [entries, setEntries] = useLocalStorage<TimeEntry[]>('tracker-entries', []);
  const [running, setRunning] = useLocalStorage<RunningTimer | null>('tracker-running', null);
  const [draft, setDraft] = useLocalStorage<TrackerDraft>('tracker-draft', {
    activityId: DEFAULT_ACTIVITIES[0].id,
    description: '',
  });
  const [now, setNow] = useState(Date.now());

  const isTicking = running !== null && running.startedAt !== null;

  useEffect(() => {
    if (!isTicking) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [isTicking]);

  const elapsed = running
    ? running.accumulated + (running.startedAt ? Math.max(0, Math.floor((now - running.startedAt) / 1000)) : 0)
    : 0;

  const start = useCallback(() => {
    const t = Date.now();
    setNow(t);
    setRunning({ sessionStart: t, startedAt: t, accumulated: 0 });
  }, [setRunning]);

  const pause = useCallback(() => {
    setRunning((prev) => {
      if (!prev || prev.startedAt === null) return prev;
      return { ...prev, accumulated: prev.accumulated + Math.floor((Date.now() - prev.startedAt) / 1000), startedAt: null };
    });
  }, [setRunning]);

  const resume = useCallback(() => {
    const t = Date.now();
    setNow(t);
    setRunning((prev) => (prev ? { ...prev, startedAt: t } : prev));
  }, [setRunning]);

  /** Detiene el contador y guarda el registro. Devuelve la entrada creada (o null si fue demasiado corto). */
  const stop = useCallback((): TimeEntry | null => {
    if (!running) return null;
    const end = Date.now();
    const seconds = running.accumulated + (running.startedAt ? Math.floor((end - running.startedAt) / 1000) : 0);
    setRunning(null);
    if (seconds < 1) return null;
    const entry: TimeEntry = {
      id: `${end}`,
      activityId: draft.activityId,
      description: draft.description.trim(),
      date: todayKey(),
      startedAt: running.sessionStart,
      endedAt: end,
      seconds,
    };
    setEntries((prev) => [entry, ...prev]);
    return entry;
  }, [running, draft, setRunning, setEntries]);

  const deleteEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, [setEntries]);

  const addActivity = useCallback((name: string, color: string): string => {
    const id = `act-${Date.now()}`;
    setActivities((prev) => [...prev, { id, name: name.trim(), color }]);
    return id;
  }, [setActivities]);

  return {
    activities,
    entries,
    running,
    draft,
    elapsed,
    isTicking,
    start,
    pause,
    resume,
    stop,
    deleteEntry,
    addActivity,
    setDraft,
  };
}

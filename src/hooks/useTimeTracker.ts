import { useCallback, useEffect, useState } from 'react';
import { deleteField } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useFirestoreCollection, incrementTaskTime } from './useFirestoreCollection';
import { useUserStorage } from './useUserStorage';
import type { Activity, TimeSession, TimerMode } from '../types';

/** Estado del contador en curso. startedAt === null significa pausado. */
export interface RunningTimer {
  sessionStart: number; // epoch ms del primer inicio
  startedAt: number | null; // epoch ms del segmento actual
  accumulated: number; // segundos de segmentos anteriores
}

export interface TrackerDraft {
  activityId: string;
  description: string;
  notes: string;
  taskId?: string;
  mode?: TimerMode;
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

/** Convierte un ISO string a clave de fecha local YYYY-MM-DD. */
export function isoToDateKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatElapsed(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatClock(time: number | string): string {
  return new Date(time).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function dayLabel(dateKey: string): string {
  if (dateKey === todayKey()) return 'Hoy';
  if (dateKey === todayKey(new Date(Date.now() - 86400000))) return 'Ayer';
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'short' });
}

export function useTimeTracker() {
  const { user } = useAuth();
  const uid = user?.uid ?? null;

  const activitiesColl = useFirestoreCollection<Activity>(uid, 'activities');
  const sessionsColl = useFirestoreCollection<TimeSession>(uid, 'timeSessions');

  const [activities, setActivities] = useState<Activity[]>([]);
  const [sessions, setSessions] = useState<TimeSession[]>([]);
  const [running, setRunning] = useUserStorage<RunningTimer | null>('tracker-running', null);
  const [draft, setDraft] = useUserStorage<TrackerDraft>('tracker-draft', {
    activityId: '', description: '', notes: '',
  });
  const [now, setNow] = useState(Date.now());

  // Semilla de actividades para usuarios nuevos
  useEffect(() => {
    if (!uid || activitiesColl.loading) return;
    if (activitiesColl.items.length === 0) {
      DEFAULT_ACTIVITIES.forEach((a) => activitiesColl.set(a.id, { name: a.name, color: a.color }));
    }
  }, [uid, activitiesColl]);

  useEffect(() => {
    setActivities(activitiesColl.items);
  }, [activitiesColl.items]);

  useEffect(() => {
    setSessions(sessionsColl.items);
  }, [sessionsColl.items]);

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

  /** Detiene el cronómetro y guarda la sesión en Firestore. */
  const stop = useCallback(async (): Promise<void> => {
    if (!running || !uid) return;
    const end = Date.now();
    const duration = running.accumulated + (running.startedAt ? Math.floor((end - running.startedAt) / 1000) : 0);
    setRunning(null);
    if (duration < 1) return;

    const sessionData: Omit<TimeSession, 'id'> = {
      taskId: draft.taskId || undefined,
      activityId: draft.activityId || '',
      description: draft.description.trim(),
      notes: draft.notes.trim() || undefined,
      startTime: new Date(running.sessionStart).toISOString(),
      endTime: new Date(end).toISOString(),
      duration,
      mode: draft.mode || 'stopwatch',
      createdAt: new Date(end).toISOString(),
    };
    await sessionsColl.add(sessionData);

    // Actualiza el acumulador de la tarea atómicamente
    if (draft.taskId) {
      await incrementTaskTime(uid, draft.taskId, duration);
    }
  }, [running, draft, uid, setRunning, sessionsColl]);

  /** Guarda una sesión con segundos calculados externamente (temporizador/pomodoro). */
  const saveSession = useCallback(async (seconds: number, mode: TimerMode = 'stopwatch'): Promise<void> => {
    if (!uid || seconds < 1) return;
    const end = Date.now();
    const sessionData: Omit<TimeSession, 'id'> = {
      taskId: draft.taskId || undefined,
      activityId: draft.activityId || '',
      description: draft.description.trim(),
      notes: draft.notes.trim() || undefined,
      startTime: new Date(end - seconds * 1000).toISOString(),
      endTime: new Date(end).toISOString(),
      duration: seconds,
      mode,
      createdAt: new Date(end).toISOString(),
    };
    await sessionsColl.add(sessionData);

    if (draft.taskId) {
      await incrementTaskTime(uid, draft.taskId, seconds);
    }
  }, [draft, uid, sessionsColl]);

  const discard = useCallback(() => {
    setRunning(null);
  }, [setRunning]);

  const deleteSession = useCallback((id: string) => {
    sessionsColl.remove(id);
  }, [sessionsColl]);

  const updateSession = useCallback((id: string, updates: Partial<TimeSession>) => {
    sessionsColl.update(id, updates);
  }, [sessionsColl]);

  const addActivity = useCallback((name: string, color: string): string => {
    const id = `act-${Date.now()}`;
    activitiesColl.set(id, { name: name.trim(), color });
    return id;
  }, [activitiesColl]);

  const setStartTime = useCallback((epochMs: number) => {
    setRunning((prev) => {
      if (!prev) return prev;
      const wasTicking = prev.startedAt !== null;
      return {
        ...prev,
        sessionStart: epochMs,
        startedAt: wasTicking ? epochMs : null,
        accumulated: wasTicking ? 0 : prev.accumulated,
      };
    });
  }, [setRunning]);

  const updateActivity = useCallback((id: string, updates: Partial<Activity>) => {
    activitiesColl.update(id, updates);
  }, [activitiesColl]);

  const deleteActivity = useCallback((id: string) => {
    activitiesColl.remove(id);
  }, [activitiesColl]);

  return {
    activities, sessions, running, draft, elapsed, isTicking,
    start, pause, resume, stop, saveSession, discard,
    deleteSession, updateSession, addActivity, setStartTime,
    updateActivity, deleteActivity, setDraft,
  };
}

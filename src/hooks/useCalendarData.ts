import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from './useTasks';
import { useCalendarEvents, dateKey, timeToMinutes, MONTHS } from './useCalendarEvents';
import { useFirestoreCollection } from './useFirestoreCollection';
import { isoToDateKey, todayKey } from './useTimeTracker';
import type { Activity, CalendarEvent, Task, TimeSession } from '../types';

/** Capas de información que el calendario puede mostrar. */
export type CalendarLayer = 'pending' | 'completed' | 'session' | 'event';

export const ALL_LAYERS: CalendarLayer[] = ['pending', 'completed', 'session', 'event'];

export const LAYER_META: Record<CalendarLayer, { label: string; short: string; color: string }> = {
  pending: { label: 'Pendientes', short: 'Tarea', color: '#7f70ff' },
  completed: { label: 'Completadas', short: 'Completada', color: '#34c77b' },
  session: { label: 'Registros', short: 'Registro', color: '#00b8a9' },
  event: { label: 'Eventos', short: 'Evento', color: '#4d7cfe' },
};

export const DEFAULT_LAYERS: Record<CalendarLayer, boolean> = {
  pending: true, completed: true, session: true, event: true,
};

/**
 * Ítem unificado del calendario. Las tareas y los registros de tiempo se derivan
 * de sus colecciones actuales; los eventos son la única fuente propia.
 */
export interface CalendarItem {
  id: string;
  kind: CalendarLayer;
  date: string;             // YYYY-MM-DD
  startMin?: number;        // minutos desde medianoche (undefined = todo el día)
  endMin?: number;
  title: string;
  subtitle?: string;
  color: string;
  task?: Task;
  session?: TimeSession;
  event?: CalendarEvent;
}

// ─── Utilidades de fecha ───

export function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function shiftKey(key: string, days: number): string {
  const d = parseKey(key);
  d.setDate(d.getDate() + days);
  return dateKey(d);
}

export function minToHHMM(min: number): string {
  const h = Math.min(23, Math.floor(min / 60));
  const m = Math.max(0, min % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Días (lunes → domingo) de la semana que contiene `anchor`. */
export function weekDaysOf(anchor: Date): string[] {
  const d = new Date(anchor);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  const start = dateKey(d);
  return Array.from({ length: 7 }, (_, i) => shiftKey(start, i));
}

export function weekRangeLabel(days: string[]): string {
  const a = parseKey(days[0]);
  const b = parseKey(days[days.length - 1]);
  if (a.getMonth() === b.getMonth()) {
    return `${a.getDate()} – ${b.getDate()} ${MONTHS[b.getMonth()].toLowerCase()} ${b.getFullYear()}`;
  }
  return `${a.getDate()} ${MONTHS[a.getMonth()].slice(0, 3).toLowerCase()} – ${b.getDate()} ${MONTHS[b.getMonth()].slice(0, 3).toLowerCase()}`;
}

export function longDateLabel(key: string): string {
  const label = parseKey(key).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Orden dentro de un día: primero lo que no tiene hora, luego por hora de inicio. */
export function sortItems(a: CalendarItem, b: CalendarItem): number {
  const aAll = a.startMin === undefined;
  const bAll = b.startMin === undefined;
  if (aAll !== bAll) return aAll ? -1 : 1;
  if (aAll && bAll) return a.title.localeCompare(b.title);
  return (a.startMin! - b.startMin!) || a.title.localeCompare(b.title);
}

// ─── Hook ───

/**
 * Reúne todo lo que el calendario muestra, sin duplicar fuentes:
 * tareas y listas vienen de sus colecciones (y de `useTasks` para crearlas),
 * los registros de `timeSessions` y los eventos de `calendarEvents`.
 */
export function useCalendarData() {
  const { user } = useAuth();
  const uid = user?.uid ?? null;

  const taskApi = useTasks();
  const sessionsColl = useFirestoreCollection<TimeSession>(uid, 'timeSessions');
  const activitiesColl = useFirestoreCollection<Activity>(uid, 'activities');
  const eventsApi = useCalendarEvents();

  const { tasks, lists, loading: tasksLoading } = taskApi;
  const sessions = sessionsColl.items;
  const activities = activitiesColl.items;
  const events = eventsApi.events;

  const items = useMemo<CalendarItem[]>(() => {
    const listName = (id: string) => lists.find((l) => l.id === id)?.name;
    const listActivityId = (id: string) => lists.find((l) => l.id === id)?.activityId;
    const activityOf = (id?: string) => (id ? activities.find((a) => a.id === id) : undefined);
    const out: CalendarItem[] = [];

    for (const t of tasks) {
      if (t.isSeparator) continue;
      const activity = activityOf(t.activityId || listActivityId(t.listId));
      const label = t.title?.trim() || activity?.name || 'Tarea';

      if (t.completed) {
        if (!t.completedAt) continue;
        out.push({
          id: `c-${t.id}`, kind: 'completed', date: isoToDateKey(t.completedAt),
          title: label, subtitle: listName(t.listId),
          color: LAYER_META.completed.color, task: t,
        });
        continue;
      }

      const date = t.scheduledDate || t.dueDate;
      if (!date) continue;
      const startMin = t.scheduledTime ? timeToMinutes(t.scheduledTime) : undefined;
      out.push({
        id: `p-${t.id}`, kind: 'pending', date, startMin,
        endMin: startMin !== undefined ? startMin + 30 : undefined,
        title: label, subtitle: listName(t.listId),
        color: LAYER_META.pending.color, task: t,
      });
    }

    for (const s of sessions) {
      const start = new Date(s.startTime);
      const startMin = start.getHours() * 60 + start.getMinutes();
      const activity = activityOf(s.activityId);
      out.push({
        id: `s-${s.id}`, kind: 'session', date: isoToDateKey(s.startTime),
        startMin, endMin: Math.max(startMin + 15, Math.round(startMin + s.duration / 60)),
        title: s.description?.trim() || activity?.name || 'Registro',
        subtitle: activity?.name,
        color: activity?.color || LAYER_META.session.color, session: s,
      });
    }

    for (const e of events) {
      out.push({
        id: `e-${e.id}`, kind: 'event', date: e.date,
        startMin: timeToMinutes(e.start), endMin: timeToMinutes(e.end),
        title: e.title, subtitle: e.location, color: e.color, event: e,
      });
    }

    return out.sort(sortItems);
  }, [tasks, lists, activities, sessions, events]);

  const itemsByDate = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    for (const it of items) {
      const arr = map.get(it.date);
      if (arr) arr.push(it);
      else map.set(it.date, [it]);
    }
    return map;
  }, [items]);

  return {
    items, itemsByDate,
    tasks, lists, activities, sessions, events,
    taskApi, sessionApi: sessionsColl, eventsApi,
    loading: tasksLoading || sessionsColl.loading || eventsApi.loading,
    today: todayKey(),
  };
}

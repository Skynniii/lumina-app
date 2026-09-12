export type ViewType = 'cronometro' | 'habitos' | 'tracker' | 'calendar';
export type SortMode = 'custom' | 'date' | 'deadline' | 'recent';
export type TimerMode = 'stopwatch' | 'timer' | 'pomodoro';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface RepeatConfig {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  daysOfWeek?: number[];
  startDate?: string;
  endType: 'never' | 'on' | 'after';
  endDate?: string;
  occurrences?: number;
  hideUntilNextRepeat?: boolean;
}

export interface Task {
  id: string;
  listId: string;
  title: string;
  completed: boolean;
  isImportant: boolean;
  createdAt: string;
  // Campos opcionales (se omiten en Firestore si no tienen datos):
  activityId?: string;
  notes?: string;
  scheduledDate?: string;          // YYYY-MM-DD: fecha de la tarea
  scheduledTime?: string;           // HH:MM: hora de la tarea
  dueDate?: string;                 // YYYY-MM-DD: fecha LÍMITE (deadline)
  totalTimeSpent?: number;          // segundos acumulados
  completedAt?: string;
  subtasks?: SubTask[];
  repeat?: RepeatConfig;
}

export interface TaskList {
  id: string;
  name: string;
  position: number;
  createdAt?: string;
  sortMode?: SortMode;
  hoyListId?: string;
  taskOrder?: string[];             // orden personalizado de tareas (IDs)
}

export interface Activity {
  id: string;
  name: string;
  color: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;                     // YYYY-MM-DD
  start: string;                    // HH:MM
  end: string;                      // HH:MM
  color: string;
  location?: string;
  notes?: string;
}

export interface TimeSession {
  id: string;
  taskId?: string;
  activityId: string;
  description: string;
  notes?: string;
  startTime: string;               // ISO datetime
  endTime: string;                  // ISO datetime
  duration: number;                 // segundos
  mode: TimerMode;
  createdAt: string;                // ISO datetime
}

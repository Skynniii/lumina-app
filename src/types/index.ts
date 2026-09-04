export type ViewType = 'cronometro' | 'habitos' | 'tracker' | 'calendar';

export interface SubTask {
  id: string;
  text: string;
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
}

export interface Task {
  id: string;
  listId: string;
  text: string;
  completed: boolean;
  notes?: string;
  dueDate?: string;
  dueTime?: string;
  isImportant?: boolean;
  subtasks?: SubTask[];
  completedAt?: string;
  repeat?: RepeatConfig;
}

export interface TaskList {
  id: string;
  name: string;
}

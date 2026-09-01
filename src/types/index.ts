export type ViewType = 'cronometro' | 'habitos';

export interface SubTask {
  id: string;
  text: string;
  completed: boolean;
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
}

export interface TaskList {
  id: string;
  name: string;
}

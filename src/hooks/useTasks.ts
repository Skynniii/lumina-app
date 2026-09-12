import { useState, useCallback, useEffect } from 'react';
import { deleteField } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useFirestoreCollection, incrementTaskTime } from './useFirestoreCollection';
import { useSettings } from '../context/SettingsContext';
import type { Task, TaskList, RepeatConfig, SubTask } from '../types';

function calculateNextDate(currentDate: string | undefined, repeat: RepeatConfig): string | undefined {
  if (!currentDate) return undefined;
  const d = new Date(currentDate);
  switch (repeat.frequency) {
    case 'daily': d.setDate(d.getDate() + repeat.interval); break;
    case 'weekly': d.setDate(d.getDate() + repeat.interval * 7); break;
    case 'monthly': d.setMonth(d.getMonth() + repeat.interval); break;
    case 'yearly': d.setFullYear(d.getFullYear() + repeat.interval); break;
  }
  return d.toISOString();
}

const PRINCIPAL_ID = 'principal';

const SEED_LISTS: TaskList[] = [
  { id: PRINCIPAL_ID, name: 'Principal', position: 0 },
  { id: 'general', name: 'General', position: 1 },
  { id: 'books', name: 'Books', position: 2 },
  { id: 'movies', name: 'Movies', position: 3 },
];

const SEED_TASKS: Task[] = [
  { id: 't1', listId: 'general', title: 'Rutina de levantamiento de pesas', completed: false, isImportant: false, createdAt: new Date().toISOString(), subtasks: [] },
  { id: 't2', listId: 'general', title: 'Avanzar en el reporte socioeconómico', completed: false, isImportant: false, createdAt: new Date().toISOString(), subtasks: [] },
  { id: 't3', listId: 'general', title: 'Tomar 2 litros de agua', completed: false, isImportant: false, createdAt: new Date().toISOString(), subtasks: [] },
];

export interface ModalConfig {
  isOpen: boolean;
  type: 'alert' | 'confirm' | 'prompt';
  title: string;
  placeholder?: string;
  defaultValue?: string;
  onConfirm: (val: string) => void;
  onCancel: () => void;
}

const CLOSED: ModalConfig = {
  isOpen: false, type: 'alert', title: '', onConfirm: () => {}, onCancel: () => {},
};

export function useTasks() {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const { settings } = useSettings();

  const listsColl = useFirestoreCollection<TaskList>(uid, 'taskLists');
  const tasksColl = useFirestoreCollection<Task>(uid, 'tasks');

  // Semilla para usuarios nuevos (sin datos en Firestore)
  useEffect(() => {
    if (!uid || listsColl.loading || tasksColl.loading) return;
    if (listsColl.items.length === 0 && tasksColl.items.length === 0) {
      SEED_LISTS.forEach((l) => listsColl.set(l.id, { name: l.name, position: l.position }));
      SEED_TASKS.forEach((t) => tasksColl.set(t.id, {
        listId: t.listId, title: t.title, completed: t.completed, isImportant: t.isImportant, createdAt: t.createdAt, subtasks: t.subtasks,
      }));
    }
  }, [uid, listsColl, tasksColl]);

  const lists = listsColl.items;
  const tasks = tasksColl.items;
  const [modal, setModal] = useState<ModalConfig>(CLOSED);
  const closeModal = useCallback(() => setModal((p) => ({ ...p, isOpen: false })), []);

  const addList = useCallback(() => {
    setModal({
      isOpen: true, type: 'prompt', title: 'Nueva Lista',
      placeholder: '¿Cómo se llamará la nueva lista?', defaultValue: '',
      onConfirm: (name) => {
        const trimmed = name.trim();
        if (trimmed) {
          const id = trimmed.toLowerCase().replace(/\s+/g, '-');
          listsColl.set(id, { name: trimmed, position: lists.length, createdAt: new Date().toISOString() });
        }
        closeModal();
      },
      onCancel: closeModal,
    });
  }, [listsColl, lists.length, closeModal]);

  const deleteList = useCallback((id: string) => {
    if (id === PRINCIPAL_ID) {
      setModal({ isOpen: true, type: 'alert', title: 'La lista Principal no se puede eliminar.', onConfirm: closeModal, onCancel: closeModal });
      return;
    }
    if (lists.length <= 1) {
      setModal({ isOpen: true, type: 'alert', title: 'No puedes eliminar la última lista restante.', onConfirm: closeModal, onCancel: closeModal });
      return;
    }
    setModal({
      isOpen: true, type: 'confirm', title: '¿Estás seguro de que deseas borrar esta lista?',
      onConfirm: () => {
        listsColl.remove(id);
        tasks.filter((t) => t.listId === id).forEach((t) => tasksColl.remove(t.id));
        closeModal();
      },
      onCancel: closeModal,
    });
  }, [lists.length, lists, tasks, listsColl, tasksColl, closeModal]);

  const renameList = useCallback((id: string, currentName: string) => {
    if (id === PRINCIPAL_ID) {
      setModal({ isOpen: true, type: 'alert', title: 'La lista Principal no se puede renombrar.', onConfirm: closeModal, onCancel: closeModal });
      return;
    }
    setModal({
      isOpen: true, type: 'prompt', title: 'Renombrar Lista',
      placeholder: 'Nuevo nombre...', defaultValue: currentName,
      onConfirm: (newName) => {
        const trimmed = newName.trim();
        if (trimmed) listsColl.update(id, { name: trimmed });
        closeModal();
      },
      onCancel: closeModal,
    });
  }, [listsColl, closeModal]);

  const addTask = useCallback((listId: string) => {
    setModal({
      isOpen: true, type: 'prompt', title: 'Nueva Tarea',
      placeholder: '¿Qué nueva tarea quieres añadir?', defaultValue: '',
      onConfirm: (title) => {
        const trimmed = title.trim();
        if (trimmed) {
          tasksColl.add({
            listId, title: trimmed, completed: false, isImportant: false, createdAt: new Date().toISOString(),
          });
        }
        closeModal();
      },
      onCancel: closeModal,
    });
  }, [tasksColl, closeModal]);

  const addTaskWithData = useCallback((listId: string, data: { title: string; notes?: string; scheduledDate?: string; scheduledTime?: string; dueDate?: string; isImportant?: boolean; repeat?: RepeatConfig; activityId?: string }) => {
    const trimmed = (data.title || '').trim();
    if (!trimmed) return;
    tasksColl.add({
      listId, title: trimmed, completed: false, isImportant: !!data.isImportant, createdAt: new Date().toISOString(),
      notes: data.notes || undefined, scheduledDate: data.scheduledDate || undefined, scheduledTime: data.scheduledTime || undefined,
      dueDate: data.dueDate || undefined, repeat: data.repeat, activityId: data.activityId || undefined,
    });
  }, [tasksColl]);

  const toggleTask = useCallback((taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const completing = !task.completed;

    if (completing && task.repeat?.enabled && task.repeat?.hideUntilNextRepeat) {
      const nextDate = calculateNextDate(task.scheduledDate, task.repeat);
      const newSubtasks: SubTask[] | undefined = task.subtasks?.map((s) => ({ ...s, completed: false }));
      tasksColl.add({
        ...task,
        completed: false, completedAt: undefined,
        scheduledDate: nextDate, subtasks: newSubtasks,
      });
      tasksColl.update(taskId, { completed: true, completedAt: new Date().toISOString() });
    } else {
      tasksColl.update(taskId, {
        completed: completing,
        completedAt: completing ? new Date().toISOString() : deleteField(),
      });
    }
  }, [tasks, tasksColl]);

  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    // Convierte undefined a deleteField() para que Firestore elimine el campo
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      cleaned[key] = value === undefined ? deleteField() : value;
    }
    tasksColl.update(taskId, cleaned as Partial<Task>);
  }, [tasksColl]);

  const updateList = useCallback((id: string, updates: Partial<TaskList>) => {
    listsColl.update(id, updates);
  }, [listsColl]);

  const reorderListTasks = useCallback((listId: string, orderedActive: Task[]) => {
    listsColl.update(listId, { taskOrder: orderedActive.map((t) => t.id) });
  }, [listsColl]);

  const deleteTask = useCallback((taskId: string) => {
    setModal({
      isOpen: true, type: 'confirm', title: '¿Estás seguro de eliminar esta tarea de forma permanente?',
      onConfirm: () => { tasksColl.remove(taskId); closeModal(); },
      onCancel: closeModal,
    });
  }, [tasksColl, closeModal]);

  const deleteCompletedTasks = useCallback((listId: string) => {
    setModal({
      isOpen: true, type: 'confirm', title: '¿Eliminar todas las tareas completadas de esta lista?',
      onConfirm: () => {
        tasks.filter((t) => t.listId === listId && t.completed).forEach((t) => tasksColl.remove(t.id));
        closeModal();
      },
      onCancel: closeModal,
    });
  }, [tasks, tasksColl, closeModal]);

  return {
    lists, tasks, addList, deleteList, renameList, addTask, addTaskWithData,
    toggleTask, updateTask, updateList, reorderListTasks, deleteTask, deleteCompletedTasks,
    modalConfig: modal,
  };
}

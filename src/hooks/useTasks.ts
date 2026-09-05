import { useState, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { Task, TaskList, RepeatConfig } from '../types';

function calculateNextDate(currentDate: string | undefined, repeat: RepeatConfig): string | undefined {
  if (!currentDate) return undefined;
  const d = new Date(currentDate + 'T00:00:00');
  switch (repeat.frequency) {
    case 'daily': d.setDate(d.getDate() + repeat.interval); break;
    case 'weekly': d.setDate(d.getDate() + repeat.interval * 7); break;
    case 'monthly': d.setMonth(d.getMonth() + repeat.interval); break;
    case 'yearly': d.setFullYear(d.getFullYear() + repeat.interval); break;
  }
  return d.toISOString().slice(0, 10);
}

const SEED_LISTS: TaskList[] = [
  { id: 'general', name: 'General' },
  { id: 'books', name: 'Books' },
  { id: 'movies', name: 'Movies' },
];

const SEED_TASKS: Task[] = [
  { id: 't1', listId: 'general', text: 'Rutina de levantamiento de pesas', completed: false, subtasks: [] },
  { id: 't2', listId: 'general', text: 'Avanzar en el reporte socioeconómico', completed: false, subtasks: [] },
  { id: 't3', listId: 'general', text: 'Tomar 2 litros de agua', completed: false, subtasks: [] },
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
  isOpen: false,
  type: 'alert',
  title: '',
  onConfirm: () => {},
  onCancel: () => {},
};

export function useTasks() {
  const [lists, setLists] = useLocalStorage<TaskList[]>('lumina_lists', SEED_LISTS);
  const [tasks, setTasks] = useLocalStorage<Task[]>('lumina_tasks', SEED_TASKS);
  const [modal, setModal] = useState<ModalConfig>(CLOSED);

  const closeModal = useCallback(() => setModal((p) => ({ ...p, isOpen: false })), []);

  const addList = useCallback(() => {
    setModal({
      isOpen: true,
      type: 'prompt',
      title: 'Nueva Lista',
      placeholder: '¿Cómo se llamará la nueva lista?',
      defaultValue: '',
      onConfirm: (name) => {
        const trimmed = name.trim();
        if (trimmed) {
          setLists((prev) => [...prev, { id: trimmed.toLowerCase().replace(/\s+/g, '-'), name: trimmed }]);
        }
        closeModal();
      },
      onCancel: closeModal,
    });
  }, [setLists, closeModal]);

  const deleteList = useCallback((id: string) => {
    if (lists.length <= 1) {
      setModal({ isOpen: true, type: 'alert', title: 'No puedes eliminar la última lista restante.', onConfirm: closeModal, onCancel: closeModal });
      return;
    }
    setModal({
      isOpen: true,
      type: 'confirm',
      title: '¿Estás seguro de que deseas borrar esta lista?',
      onConfirm: () => {
        setLists((prev) => prev.filter((l) => l.id !== id));
        setTasks((prev) => prev.filter((t) => t.listId !== id));
        closeModal();
      },
      onCancel: closeModal,
    });
  }, [lists.length, setLists, setTasks, closeModal]);

  const renameList = useCallback((id: string, currentName: string) => {
    setModal({
      isOpen: true,
      type: 'prompt',
      title: 'Renombrar Lista',
      placeholder: 'Nuevo nombre...',
      defaultValue: currentName,
      onConfirm: (newName) => {
        const trimmed = newName.trim();
        if (trimmed) setLists((prev) => prev.map((l) => (l.id === id ? { ...l, name: trimmed } : l)));
        closeModal();
      },
      onCancel: closeModal,
    });
  }, [setLists, closeModal]);

  const addTask = useCallback((listId: string) => {
    setModal({
      isOpen: true,
      type: 'prompt',
      title: 'Nueva Tarea',
      placeholder: '¿Qué nueva tarea quieres añadir?',
      defaultValue: '',
      onConfirm: (text) => {
        const trimmed = text.trim();
        if (trimmed) {
          setTasks((prev) => [{ id: Date.now().toString(), listId, text: trimmed, completed: false, subtasks: [] }, ...prev]);
        }
        closeModal();
      },
      onCancel: closeModal,
    });
  }, [setTasks, closeModal]);

  const toggleTask = useCallback((taskId: string) => {
    setTasks((prev) => {
      const task = prev.find(t => t.id === taskId);
      if (!task) return prev;
      const completing = !task.completed;
      if (completing && task.repeat?.enabled && task.repeat?.hideUntilNextRepeat) {
        const nextDate = calculateNextDate(task.dueDate, task.repeat);
        const newTask: Task = {
          ...task,
          id: Date.now().toString(),
          completed: false,
          completedAt: undefined,
          dueDate: nextDate,
          subtasks: task.subtasks?.map(s => ({ ...s, completed: false })),
        };
        return [
          ...prev.map(t => t.id === taskId ? { ...t, completed: true, completedAt: new Date().toISOString() } : t),
          newTask,
        ];
      }
      return prev.map(t => t.id === taskId ? { ...t, completed: completing, completedAt: completing ? new Date().toISOString() : undefined } : t);
    });
  }, [setTasks]);

  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t)));
  }, [setTasks]);

  const deleteTask = useCallback((taskId: string) => {
    setModal({
      isOpen: true,
      type: 'confirm',
      title: '¿Estás seguro de eliminar esta tarea de forma permanente?',
      onConfirm: () => {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        closeModal();
      },
      onCancel: closeModal,
    });
  }, [setTasks, closeModal]);

  const deleteCompletedTasks = useCallback((listId: string) => {
    setModal({
      isOpen: true,
      type: 'confirm',
      title: '¿Eliminar todas las tareas completadas de esta lista?',
      onConfirm: () => {
        setTasks((prev) => prev.filter(t => !(t.listId === listId && t.completed)));
        closeModal();
      },
      onCancel: closeModal,
    });
  }, [setTasks, closeModal]);

  return { lists, tasks, addList, deleteList, renameList, addTask, toggleTask, updateTask, deleteTask, deleteCompletedTasks, modalConfig: modal };
}

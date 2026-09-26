import { useState, useCallback, useEffect, useRef } from 'react';
import { deleteField } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useFirestoreCollection, incrementTaskTime } from './useFirestoreCollection';
import { useSettings } from '../context/SettingsContext';
import { getMeta, subscribeLocal } from './localDB';
import type { Task, TaskList, RepeatConfig, SubTask, Activity } from '../types';

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
  const { items: lists, loading: listsLoading, set: listSet, batchSet: listBatchSet } = listsColl;
  const { items: tasks, loading: tasksLoading, set: taskSet, update: taskUpdate, batchSet: taskBatchSet, batchRemove: taskBatchRemove } = tasksColl;

  // Esperar a que el primer sync con Firestore termine antes de sembrar datos
  const [syncReady, setSyncReady] = useState(false);
  useEffect(() => {
    if (!uid) return;
    let mounted = true;
    const check = () => getMeta<boolean>('initialSyncDone').then((done) => {
      if (mounted && done) setSyncReady(true);
    });
    check();
    const unsub = subscribeLocal('_syncReady', check);
    return () => { mounted = false; unsub(); };
  }, [uid]);

  // Semilla para usuarios nuevos (sin datos en Firestore ni en local tras el sync)
  useEffect(() => {
    if (!uid || !syncReady || listsLoading || tasksLoading) return;
    if (lists.length === 0 && tasks.length === 0) {
      SEED_LISTS.forEach((l) => listSet(l.id, { name: l.name, position: l.position }));
      SEED_TASKS.forEach((t) => taskSet(t.id, {
        listId: t.listId, title: t.title, completed: t.completed, isImportant: t.isImportant, createdAt: t.createdAt, subtasks: t.subtasks,
      }));
    }
  }, [uid, syncReady, listsLoading, tasksLoading, lists, tasks, listSet, taskSet]);

  // Limpieza de campos de fecha corruptos (objetos enviados por error a Firestore)
  const cleanedTasksRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!uid || tasksLoading) return;
    for (const task of tasks) {
      if (cleanedTasksRef.current.has(task.id)) continue;
      const updates: Record<string, unknown> = {};
      if (task.scheduledDate != null && typeof task.scheduledDate !== 'string') {
        updates.scheduledDate = deleteField();
      }
      if (task.dueDate != null && typeof task.dueDate !== 'string') {
        updates.dueDate = deleteField();
      }
      if (task.scheduledTime != null && typeof task.scheduledTime !== 'string') {
        updates.scheduledTime = deleteField();
      }
      if (Object.keys(updates).length > 0) {
        cleanedTasksRef.current.add(task.id);
        taskUpdate(task.id, updates as Partial<Task>);
      }
    }
  }, [uid, tasks, tasksLoading, taskUpdate]);

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
        const taskIds = tasks.filter((t) => t.listId === id).map((t) => t.id);
        listsColl.remove(id);
        taskBatchRemove(taskIds);
        closeModal();
      },
      onCancel: closeModal,
    });
  }, [lists.length, lists, tasks, listsColl, taskBatchRemove, closeModal]);

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

  const addTaskWithData = useCallback((listId: string, data: { title: string; notes?: string; scheduledDate?: string; scheduledTime?: string; dueDate?: string; isImportant?: boolean; repeat?: RepeatConfig; activityId?: string; linkedTaskId?: string; isActivityOnly?: boolean }) => {
    const trimmed = (data.title || '').trim();
    if (!trimmed && !data.isActivityOnly) return;
    // Referencia: crear solo un puntero ligero, sin copiar datos ni mover de lista
    if (data.linkedTaskId) {
      tasksColl.add({
        listId, title: trimmed, completed: false, isImportant: false, createdAt: new Date().toISOString(),
        linkedTaskId: data.linkedTaskId,
      });
      return;
    }
    // Si la lista tiene una actividad vinculada y la tarea no especifica una, usar la de la lista
    const listActivityId = lists.find((l) => l.id === listId)?.activityId;
    const resolvedActivityId = data.activityId || listActivityId || undefined;
    // La tarea se queda en la lista que el usuario seleccionó
    tasksColl.add({
      listId, title: trimmed, completed: false, isImportant: !!data.isImportant, createdAt: new Date().toISOString(),
      notes: data.notes || undefined, scheduledDate: data.scheduledDate || undefined, scheduledTime: data.scheduledTime || undefined,
      dueDate: data.dueDate || undefined, repeat: data.repeat, activityId: resolvedActivityId,
      isActivityOnly: data.isActivityOnly || undefined,
    });
  }, [tasksColl, lists]);

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
  }, [tasksColl, lists]);

  const updateList = useCallback((id: string, updates: Partial<TaskList>) => {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      cleaned[key] = value === undefined ? deleteField() : value;
    }
    listsColl.update(id, cleaned as Partial<TaskList>);
  }, [listsColl]);

  const reorderListTasks = useCallback((listId: string, orderedActive: Task[]) => {
    listsColl.update(listId, { taskOrder: orderedActive.map((t) => t.id) });
  }, [listsColl]);

  const addSeparator = useCallback((listId: string) => {
    setModal({
      isOpen: true, type: 'prompt', title: 'Nuevo separador',
      placeholder: 'Texto del separador...', defaultValue: '',
      onConfirm: (title) => {
        const trimmed = title.trim();
        if (trimmed) {
          tasksColl.add({
            listId, title: trimmed, completed: false, isImportant: false,
            isSeparator: true, createdAt: new Date().toISOString(),
          });
        }
        closeModal();
      },
      onCancel: closeModal,
    });
  }, [tasksColl, closeModal]);

  const deleteSeparators = useCallback((listId: string) => {
    setModal({
      isOpen: true, type: 'confirm', title: '¿Eliminar todos los separadores de esta lista?',
      onConfirm: () => {
        const ids = tasks.filter((t) => t.listId === listId && t.isSeparator).map((t) => t.id);
        taskBatchRemove(ids);
        closeModal();
      },
      onCancel: closeModal,
    });
  }, [tasks, taskBatchRemove, closeModal]);

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
        const ids = tasks.filter((t) => t.listId === listId && t.completed).map((t) => t.id);
        taskBatchRemove(ids);
        closeModal();
      },
      onCancel: closeModal,
    });
  }, [tasks, taskBatchRemove, closeModal]);

  // Reordenar listas (batch: una sola transacción en vez de N writes)
  const reorderLists = useCallback((orderedIds: string[]) => {
    const updated = orderedIds
      .map((id, i) => { const l = lists.find((x) => x.id === id); return l ? { ...l, position: i } : null; })
      .filter((x): x is TaskList => x !== null);
    listBatchSet(updated);
  }, [lists, listBatchSet]);

  // Vincular/desvincular una actividad a una lista y sincronizar tareas (batch)
  const setListActivity = useCallback((listId: string, activityId: string | null) => {
    if (activityId) {
      listsColl.update(listId, { activityId });
      const toUpdate = tasks
        .filter((t) => t.listId === listId && !t.isSeparator && !t.isActivityOnly && t.activityId !== activityId)
        .map((t) => ({ ...t, activityId }));
      if (toUpdate.length > 0) taskBatchSet(toUpdate);
    } else {
      listsColl.update(listId, { activityId: deleteField() });
      const toUpdate = tasks
        .filter((t) => t.listId === listId && !t.isSeparator && !t.isActivityOnly && t.activityId !== undefined)
        .map((t) => ({ ...t, activityId: undefined }));
      if (toUpdate.length > 0) taskBatchSet(toUpdate);
    }
  }, [lists, tasks, listsColl, taskBatchSet]);

  // Crear una lista para una actividad: reúne todas las tareas con esa actividad (batch)
  const createActivityList = useCallback((activity: Activity) => {
    const id = `act-${activity.id}`;
    listsColl.set(id, {
      name: activity.name,
      position: lists.length,
      activityId: activity.id,
      createdAt: new Date().toISOString(),
    });
    // Mover todas las tareas con esa actividad a la nueva lista en una sola transacción
    const toMove = tasks
      .filter((t) => t.activityId === activity.id && !t.isSeparator && t.listId !== id)
      .map((t) => ({ ...t, listId: id }));
    if (toMove.length > 0) taskBatchSet(toMove);
  }, [lists.length, tasks, listsColl, taskBatchSet]);

  return {
    lists, tasks, addList, deleteList, renameList, addTask, addTaskWithData,
    toggleTask, updateTask, updateList, reorderListTasks, addSeparator, deleteSeparators, deleteTask, deleteCompletedTasks,
    reorderLists, setListActivity, createActivityList,
    modalConfig: modal,
  };
}

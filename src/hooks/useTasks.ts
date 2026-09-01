import { useState } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { Task, TaskList } from '../types';

const initialLists: TaskList[] = [
  { id: 'general', name: 'General' },
  { id: 'books', name: 'Books' },
  { id: 'movies', name: 'Movies' }
];
const initialTasks: Task[] = [
  { id: 't1', listId: 'general', text: 'Rutina de levantamiento de pesas', completed: false, subtasks: [] },
  { id: 't2', listId: 'general', text: 'Avanzar en el reporte socioeconómico', completed: false, subtasks: [] },
  { id: 't3', listId: 'general', text: 'Tomar 2 litros de agua', completed: false, subtasks: [] }
];

export type ModalConfig = {
  isOpen: boolean;
  type: 'alert' | 'confirm' | 'prompt';
  title: string;
  placeholder?: string;
  defaultValue?: string;
  onConfirm: (val: string) => void;
  onCancel: () => void;
};

export const useTasks = () => {
  const [lists, setLists] = useLocalStorage<TaskList[]>('lumina_lists', initialLists);
  const [tasks, setTasks] = useLocalStorage<Task[]>('lumina_tasks', initialTasks);
  const [modal, setModal] = useState<ModalConfig>({ isOpen: false, type: 'alert', title: '', onConfirm: () => {}, onCancel: () => {} });

  const close = () => setModal(prev => ({ ...prev, isOpen: false }));

  const addList = () => { setModal({ isOpen: true, type: 'prompt', title: 'Nueva Lista', placeholder: '¿Cómo se llamará la nueva lista?', defaultValue: '', onConfirm: (name) => { if (name.trim() !== '') { setLists(prev => [...prev, { id: name.trim().toLowerCase().replace(/\s+/g, '-'), name: name.trim() }]); } close(); }, onCancel: close }); };
  const deleteList = (id: string) => { if (lists.length <= 1) { setModal({ isOpen: true, type: 'alert', title: 'No puedes eliminar la última lista restante.', onConfirm: close, onCancel: close }); return; } setModal({ isOpen: true, type: 'confirm', title: '¿Estás seguro de que deseas borrar esta lista?', onConfirm: () => { setLists(prev => prev.filter(l => l.id !== id)); setTasks(prev => prev.filter(t => t.listId !== id)); close(); }, onCancel: close }); };
  const renameList = (id: string, currentName: string) => { setModal({ isOpen: true, type: 'prompt', title: 'Renombrar Lista', placeholder: 'Nuevo nombre...', defaultValue: currentName, onConfirm: (newName) => { if (newName.trim() !== '') { setLists(prev => prev.map(l => l.id === id ? { ...l, name: newName.trim() } : l)); } close(); }, onCancel: close }); };
  const addTask = (listId: string) => { setModal({ isOpen: true, type: 'prompt', title: 'Nueva Tarea', placeholder: '¿Qué nueva tarea quieres añadir?', defaultValue: '', onConfirm: (text) => { if (text.trim() !== '') { setTasks(prev => [{ id: Date.now().toString(), listId, text: text.trim(), completed: false, subtasks: [] }, ...prev]); } close(); }, onCancel: close }); };
  
  const toggleTask = (taskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const isCompleting = !t.completed;
        return { ...t, completed: isCompleting, completedAt: isCompleting ? new Date().toISOString() : undefined };
      }
      return t;
    }));
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => { setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t)); };
  const deleteTask = (taskId: string) => { setModal({ isOpen: true, type: 'confirm', title: '¿Estás seguro de eliminar esta tarea de forma permanente?', onConfirm: () => { setTasks(prev => prev.filter(t => t.id !== taskId)); close(); }, onCancel: close }); };

  return { lists, tasks, addList, deleteList, renameList, addTask, toggleTask, updateTask, deleteTask, modalConfig: modal };
};
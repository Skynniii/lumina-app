import { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Task, TaskList, SortMode } from '../../types';
import { TareaItem } from './TareaItem';
import { DesplegableMenu } from '../ui/DesplegableMenu';
import { SortMenu } from './SortMenu';

interface Props {
  list: TaskList;
  tasks: Task[];
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onDeleteCompleted: (id: string) => void;
  onToggleTask: (id: string) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onUpdateList: (id: string, updates: Partial<TaskList>) => void;
  onReorderTask: (taskId: string, direction: 'up' | 'down') => void;
  onExpandTask: (id: string) => void;
  isProtected?: boolean;
}

function sortByDateKey(key: 'dueDate' | 'deadline') {
  return (a: Task, b: Task) => {
    const av = a[key];
    const bv = b[key];
    if (!av && !bv) return 0;
    if (!av) return 1;
    if (!bv) return -1;
    return av.localeCompare(bv);
  };
}

function groupLabel(dateKey: string | undefined): string {
  if (!dateKey) return 'Sin fecha';
  const d = new Date(dateKey + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Mañana';
  if (diff === -1) return 'Ayer';
  return d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
}

export function ListaTareasCard({
  list, tasks, onRename, onDelete, onDeleteCompleted, onToggleTask, onUpdateTask, onUpdateList, onReorderTask, onExpandTask, isProtected,
}: Props) {
  const [showCompleted, setShowCompleted] = useState(false);
  const [reorderId, setReorderId] = useState<string | null>(null);

  const sortMode: SortMode = list.sortMode || 'custom';
  const active = tasks.filter((t) => !t.completed);
  const completed = tasks.filter((t) => t.completed);

  const activeSorted = useMemo(() => {
    const arr = [...active];
    if (sortMode === 'recent') arr.sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
    else if (sortMode === 'date') arr.sort(sortByDateKey('dueDate'));
    else if (sortMode === 'deadline') arr.sort(sortByDateKey('deadline'));
    return arr;
  }, [active, sortMode]);

  const showGroups = sortMode === 'date' || sortMode === 'deadline';
  const groupKey: 'dueDate' | 'deadline' = sortMode === 'date' ? 'dueDate' : 'deadline';
  const reorderable = sortMode === 'custom';

  // Construye la lista plana de elementos a renderizar (cabeceras de grupo + tareas)
  const rendered = showGroups
    ? activeSorted.flatMap((task, i) => {
        const key = task[groupKey];
        const prev = activeSorted[i - 1];
        const items: React.ReactNode[] = [];
        if (!prev || prev[groupKey] !== key) {
          items.push(
            <motion.li
              key={`hdr-${key ?? 'none'}`}
              layout
              className="list-none pt-3 first:pt-0 pb-1 text-[12px] font-bold uppercase tracking-wider text-[#a0a0a0]"
            >
              {groupLabel(key)}
            </motion.li>
          );
        }
        items.push(
          <TareaItem
            key={task.id}
            task={task}
            sortMode={sortMode}
            reorderable={reorderable}
            isReorderSelected={reorderId === task.id}
            onLongPress={() => setReorderId(task.id)}
            onMove={(dir) => onReorderTask(task.id, dir)}
            onExitReorder={() => setReorderId(null)}
            onToggle={onToggleTask}
            onUpdate={onUpdateTask}
            onExpand={onExpandTask}
          />
        );
        return items;
      })
    : activeSorted.map((task) => (
        <TareaItem
          key={task.id}
          task={task}
          sortMode={sortMode}
          reorderable={reorderable}
          isReorderSelected={reorderId === task.id}
          onLongPress={() => setReorderId(task.id)}
          onMove={(dir) => onReorderTask(task.id, dir)}
          onExitReorder={() => setReorderId(null)}
          onToggle={onToggleTask}
          onUpdate={onUpdateTask}
          onExpand={onExpandTask}
        />
      ));

  return (
    <div className="w-full flex-none shrink-0 box-border px-4 snap-start snap-always h-full overflow-y-auto no-scrollbar pb-[130px]" data-lista={list.id}>
      <div className="bg-white rounded-[24px] shadow-[0_4px_16px_rgba(0,0,0,0.04)] border border-[#f2f2f2] flex flex-col relative">
        {/* Header sticky */}
        <div className="sticky top-0 z-20">
          <div className="absolute -top-1 -left-1 -right-1 h-[50px] bg-[#f7f6f9] z-10" />
          <div className="relative z-20 bg-white rounded-t-[24px] pt-5 px-5">
            <div className="flex justify-between items-center mb-4 flex-none">
              <SortMenu value={sortMode} onChange={(m) => onUpdateList(list.id, { sortMode: m })} />
              <h3 className="flex-1 text-center leading-none m-0 p-0 text-[22px] text-[#2b2b2b] font-bold tracking-tight">{list.name}</h3>
              <DesplegableMenu isProtected={isProtected} onRename={() => onRename(list.id, list.name)} onDelete={() => onDelete(list.id)} onDeleteCompleted={() => onDeleteCompleted(list.id)} />
            </div>
            <hr className="border-t border-[#f0f0f5] m-0 mx-1 flex-none" />
          </div>
        </div>

        {/* Lista de tareas activas */}
        <div className="flex flex-col px-5 pb-5 pt-3">
          <ul className="list-none m-0 p-0 flex flex-col mb-2 relative">
            <AnimatePresence mode="popLayout">
              {rendered}
            </AnimatePresence>
            {active.length === 0 && <p className="text-center text-[#a0a0a0] text-sm py-5 font-medium">Lista impecable. Sin pendientes.</p>}
          </ul>

          {/* Sección completadas */}
          <div className="pt-4">
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="w-full flex justify-between items-center bg-[#fcfcfd] border border-[#e8e8ed] rounded-[16px] px-4 py-3 text-[14px] font-medium text-[#777] transition-colors hover:bg-[#f5f5f7]"
            >
              <span>Completadas ({completed.length})</span>
              <svg className={`w-4 h-4 transition-transform duration-300 ${showCompleted ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>

            <div className={`grid transition-[grid-template-rows] duration-300 ${showCompleted ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
              <div className="overflow-hidden min-h-0">
                <ul className="list-none m-0 mt-3 px-1 flex flex-col relative">
                  <AnimatePresence mode="popLayout">
                    {completed.map((task) => (
                      <TareaItem
                        key={task.id}
                        task={task}
                        onToggle={onToggleTask}
                        onUpdate={onUpdateTask}
                        onExpand={onExpandTask}
                      />
                    ))}
                  </AnimatePresence>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

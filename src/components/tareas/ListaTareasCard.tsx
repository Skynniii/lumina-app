import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
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
  onReorderListTasks: (listId: string, orderedActive: Task[]) => void;
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

function isOverdue(dk: string | undefined): boolean {
  if (!dk) return false;
  const d = new Date(dk + 'T00:00:00');
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return d < t;
}

function groupLabel(dateKey: string | undefined, isDeadline: boolean = false): string {
  if (!dateKey) return isDeadline ? 'Sin fecha límite' : 'Sin fecha';
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
  list, tasks, onRename, onDelete, onDeleteCompleted, onToggleTask, onUpdateTask, onUpdateList, onReorderListTasks, onExpandTask, isProtected,
}: Props) {
  const [showCompleted, setShowCompleted] = useState(false);

  // --- Arrastre fluido (solo modo personalizado) ---
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOrder, setDragOrder] = useState<string[] | null>(null);
  const [overlayY, setOverlayY] = useState(0);
  const ulRef = useRef<HTMLUListElement>(null);
  const lpTimer = useRef<number | null>(null);
  const didDrag = useRef(false);
  const dragOrderRef = useRef<string[] | null>(null);
  const taskByIdRef = useRef<Record<string, Task>>({});
  const drag = useRef({ startY: 0, height: 0, startTop: 0, ulTop: 0, id: '', others: [] as string[] });
  const preDragCleanup = useRef<(() => void) | null>(null);

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

  taskByIdRef.current = Object.fromEntries(active.map((t) => [t.id, t]));

  const baseIds = activeSorted.map((t) => t.id);
  const orderedIds = dragOrder ?? baseIds;

  const setDragOrderBoth = useCallback((v: string[] | null) => {
    dragOrderRef.current = v;
    setDragOrder(v);
  }, []);

  const onItemPointerDown = useCallback((e: React.PointerEvent, id: string) => {
    if (!reorderable) return;
    if (lpTimer.current) clearTimeout(lpTimer.current);
    if (preDragCleanup.current) preDragCleanup.current();
    const li = e.currentTarget as HTMLElement;
    const r = li.getBoundingClientRect();
    const ulR = ulRef.current?.getBoundingClientRect();
    if (r && ulR) {
      drag.current = { startY: e.clientY, height: r.height, startTop: r.top, ulTop: ulR.top, id, others: baseIds.filter((x) => x !== id) };
    }

    const startX = e.clientX;
    const startY = e.clientY;

    // Bloquea el scroll nativo SOLO cuando el drag está activo (post long-press).
    // Antes del timer, el scroll nativo funciona con touchAction: 'pan-x pan-y'.
    const onTouchMoveBlock = (ev: TouchEvent) => {
      ev.preventDefault();
    };

    // Cancela el long-press si el usuario se mueve (scroll nativo en curso).
    const onMoveCheck = (ev: PointerEvent) => {
      const dx = Math.abs(ev.clientX - startX);
      const dy = Math.abs(ev.clientY - startY);
      if (dx > 8 || dy > 8) {
        cleanup();
      }
    };

    const cleanup = () => {
      if (lpTimer.current) { clearTimeout(lpTimer.current); lpTimer.current = null; }
      window.removeEventListener('pointermove', onMoveCheck);
      window.removeEventListener('touchmove', onTouchMoveBlock);
      preDragCleanup.current = null;
    };

    preDragCleanup.current = cleanup;
    window.addEventListener('pointermove', onMoveCheck);

    lpTimer.current = window.setTimeout(() => {
      window.removeEventListener('pointermove', onMoveCheck);
      didDrag.current = true;
      setDragId(id);
      setDragOrderBoth(baseIds.slice());
      setOverlayY(drag.current.startTop - drag.current.ulTop);
      // Bloquea el scroll nativo durante el drag
      window.addEventListener('touchmove', onTouchMoveBlock, { passive: false });
    }, 450);
  }, [reorderable, baseIds, setDragOrderBoth]);

  const onItemPointerEnd = useCallback(() => {
    if (preDragCleanup.current) preDragCleanup.current();
  }, []);

  const onExpandGuarded = useCallback((id: string) => {
    if (didDrag.current) { didDrag.current = false; return; }
    onExpandTask(id);
  }, [onExpandTask]);

  useEffect(() => {
    if (!dragId) return;
    const onMove = (e: PointerEvent) => {
      const d = drag.current;
      setOverlayY((d.startTop - d.ulTop) + (e.clientY - d.startY));
      const ul = ulRef.current;
      if (!ul) return;
      const els = Array.from(ul.querySelectorAll('[data-task]'));
      let above = 0;
      els.forEach((el) => {
        if (el.getAttribute('data-task') === d.id) return;
        const r = el.getBoundingClientRect();
        if (e.clientY > r.top + r.height / 2) above++;
      });
      const next = [...d.others.slice(0, above), d.id, ...d.others.slice(above)];
      setDragOrderBoth(next);
    };
    const onUp = () => {
      if (preDragCleanup.current) preDragCleanup.current();
      const cur = dragOrderRef.current;
      if (cur) {
        const ordered = cur.map((id) => taskByIdRef.current[id]).filter(Boolean) as Task[];
        if (ordered.length) onReorderListTasks(list.id, ordered);
      }
      setDragId(null);
      setDragOrderBoth(null);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [dragId, list.id, onReorderListTasks, setDragOrderBoth]);

  // Estructura para modos con agrupación por fecha (cabeceras + tareas)
  const grouped = showGroups
    ? activeSorted.flatMap((task, i) => {
        const key = task[groupKey];
        const prev = activeSorted[i - 1];
        const items: React.ReactNode[] = [];
        if (!prev || prev[groupKey] !== key) {
          const overdue = isOverdue(key);
          items.push(
            <motion.li
              key={`hdr-${key ?? 'none'}`}
              layout
              className={`list-none pt-3 first:pt-0 pb-1 text-[12px] font-bold uppercase tracking-wider ${overdue ? 'text-[#e53935]' : 'text-[#a0a0a0]'}`}
            >
              {groupLabel(key, groupKey === 'deadline')}{overdue ? ' · Atrasado' : ''}
            </motion.li>
          );
        }
        items.push(
          <TareaItem key={task.id} task={task} sortMode={sortMode} onToggle={onToggleTask} onUpdate={onUpdateTask} onExpand={onExpandTask} />
        );
        return items;
      })
    : null;

  const draggedTask = dragId ? taskByIdRef.current[dragId] : null;

  return (
    <div className="w-full flex-none shrink-0 box-border px-4 snap-start snap-always h-full overflow-y-auto no-scrollbar pb-[80px]" data-lista={list.id}>
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
          {reorderable ? (
            <ul ref={ulRef} className="list-none m-0 p-0 flex flex-col mb-2 relative">
              {orderedIds.map((id) =>
                id === dragId ? (
                  <div key={id} data-placeholder style={{ height: drag.current.height }} className="my-1 rounded-[16px]" />
                ) : (
                  <TareaItem
                    key={id}
                    task={taskByIdRef.current[id]}
                    sortMode={sortMode}
                    reorderable
                    dragId={dragId}
                    onDragPointerDown={onItemPointerDown}
                    onDragPointerEnd={onItemPointerEnd}
                    onToggle={onToggleTask}
                    onUpdate={onUpdateTask}
                    onExpand={onExpandGuarded}
                  />
                )
              )}
              {active.length === 0 && !dragId && <p className="text-center text-[#a0a0a0] text-sm py-5 font-medium">Lista impecable. Sin pendientes.</p>}
              {draggedTask && (
                <div style={{ position: 'absolute', top: overlayY, left: 0, right: 0, zIndex: 50, pointerEvents: 'none' }}>
                  <TareaItem task={draggedTask} sortMode={sortMode} dragId={dragId} overlay onToggle={onToggleTask} onUpdate={onUpdateTask} onExpand={onExpandGuarded} />
                </div>
              )}
            </ul>
          ) : (
            <ul className="list-none m-0 p-0 flex flex-col mb-2 relative">
              <AnimatePresence mode="popLayout">
                {grouped}
              </AnimatePresence>
              {active.length === 0 && <p className="text-center text-[#a0a0a0] text-sm py-5 font-medium">Lista impecable. Sin pendientes.</p>}
            </ul>
          )}

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
                      <TareaItem key={task.id} task={task} onToggle={onToggleTask} onUpdate={onUpdateTask} onExpand={onExpandTask} />
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

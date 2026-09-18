import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { TaskList, ViewType } from '../../types';
import { useTasks } from '../../hooks/useTasks';
import { NavTopHeader } from './nav-top/NavTopHeader';
import { ListaTareasCard } from './ListaTareasCard';
import { PrincipalView } from './PrincipalView';
import { TaskDetailView } from './TaskDetailView';
import { ModalNeuromorfico } from '../ui/ModalNeuromorfico';
import { NuevaTareaModal } from './NuevaTareaModal';

interface Props {
  onMenuClick: () => void;
  onOpenAccount: () => void;
  onNavigate?: (v: ViewType) => void;
}

export function TareasDashboard({ onMenuClick, onOpenAccount, onNavigate }: Props) {
  const { lists: rawLists, tasks, addList, deleteList, renameList, addTaskWithData, toggleTask, updateTask, updateList, reorderListTasks, addSeparator, deleteSeparators, deleteTask, deleteCompletedTasks, modalConfig } = useTasks();
  // Principal siempre aparece de primera
  const lists = useMemo(() => [...rawLists].sort((a, b) => {
    if (a.id === 'principal') return -1;
    if (b.id === 'principal') return 1;
    return (a.position ?? 0) - (b.position ?? 0);
  }), [rawLists]);
  const [activeListId, setActiveListId] = useState(lists[0]?.id || '');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [showNewTask, setShowNewTask] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const clicking = useRef(false);

  // Escuchar botón + de la barra de navegación
  useEffect(() => {
    const handler = () => setShowNewTask(true);
    window.addEventListener('app-add', handler);
    return () => window.removeEventListener('app-add', handler);
  }, []);

  const expandedTask = expandedTaskId ? tasks.find((t) => t.id === expandedTaskId) : null;

  const handleScroll = useCallback(() => {
    if (clicking.current || !scrollRef.current) return;
    const idx = Math.round(scrollRef.current.scrollLeft / scrollRef.current.offsetWidth);
    if (lists[idx] && lists[idx].id !== activeListId) setActiveListId(lists[idx].id);
  }, [activeListId, lists]);

  const scrollTo = useCallback((id: string) => {
    const idx = lists.findIndex((l: TaskList) => l.id === id);
    if (idx === -1 || !scrollRef.current) return;
    clicking.current = true;
    setActiveListId(id);
    scrollRef.current.scrollTo({ left: idx * scrollRef.current.offsetWidth, behavior: 'smooth' });
    setTimeout(() => { clicking.current = false; }, 400);
  }, [lists]);

  useEffect(() => {
    if (!lists.find((l) => l.id === activeListId)) setActiveListId(lists[0]?.id || '');
  }, [lists, activeListId]);

  return (
    <section className="absolute top-0 left-0 w-full h-full flex flex-col p-0 bg-[#f7f6f9]">
      <NavTopHeader lists={lists} activeListId={activeListId} onSelectList={scrollTo} onAddList={addList} onMenuClick={onMenuClick} onOpenAccount={onOpenAccount} />

      <div className="relative flex-1 overflow-hidden">
        <div
          id="visor-de-listas"
          ref={scrollRef}
          onScroll={handleScroll}
          onTouchStart={() => { clicking.current = false; }}
          className="w-full h-full overflow-y-hidden overflow-x-auto pt-2.5 pb-5 box-border snap-x snap-mandatory no-scrollbar flex flex-row"
        >
          {lists.map((list: TaskList) =>
            list.id === 'principal' ? (
              <PrincipalView
                key={list.id}
                lists={lists}
                tasks={tasks}
                principalList={list}
                onUpdateList={updateList}
                onToggleTask={toggleTask}
                onUpdateTask={updateTask}
                onExpandTask={setExpandedTaskId}
              />
            ) : (
              <ListaTareasCard
                key={list.id}
                list={list}
                tasks={tasks.filter((t) => t.listId === list.id)}
                isProtected={list.id === 'principal'}
                onRename={renameList}
                onDelete={deleteList}
                onDeleteCompleted={deleteCompletedTasks}
                onToggleTask={toggleTask}
                onUpdateTask={updateTask}
                onUpdateList={updateList}
                onReorderListTasks={reorderListTasks}
                onAddSeparator={addSeparator}
                onDeleteSeparators={deleteSeparators}
                onExpandTask={setExpandedTaskId}
              />
            )
          )}
        </div>
      </div>

      {/* TaskDetailView - cubre toda la parte superior incluyendo el título */}
      <AnimatePresence>
        {expandedTask && (
          <TaskDetailView
            key={expandedTask.id}
            task={expandedTask}
            lists={lists}
            allTasks={tasks}
            onBack={() => setExpandedTaskId(null)}
            onToggle={toggleTask}
            onUpdate={updateTask}
            onDelete={deleteTask}
            onNavigate={onNavigate}
          />
        )}
      </AnimatePresence>

      <NuevaTareaModal
        isOpen={showNewTask}
        defaultListId={activeListId === 'principal' ? (lists.find((l) => l.id !== 'principal')?.id ?? 'general') : activeListId}
        availableLists={activeListId === 'principal' ? lists.filter((l) => l.id !== 'principal') : undefined}
        allLists={lists}
        allTasks={tasks}
        listName={lists.find((l) => l.id === activeListId)?.name}
        onClose={() => setShowNewTask(false)}
        onCreate={(data, listId) => addTaskWithData(listId, data)}
      />

      <ModalNeuromorfico {...modalConfig} />
    </section>
  );
}

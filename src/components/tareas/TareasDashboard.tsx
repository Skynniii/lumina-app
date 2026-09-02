import { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { TaskList } from '../../types';
import { useTasks } from '../../hooks/useTasks';
import { NavTopHeader } from './nav-top/NavTopHeader';
import { ListaTareasCard } from './ListaTareasCard';
import { TaskDetailView } from './TaskDetailView';
import { ModalNeuromorfico } from '../ui/ModalNeuromorfico';

interface Props {
  onMenuClick: () => void;
}

export function TareasDashboard({ onMenuClick }: Props) {
  const { lists, tasks, addList, deleteList, renameList, addTask, toggleTask, updateTask, deleteTask, modalConfig } = useTasks();
  const [activeListId, setActiveListId] = useState(lists[0]?.id || '');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const clicking = useRef(false);

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
      <NavTopHeader lists={lists} activeListId={activeListId} onSelectList={scrollTo} onAddList={addList} onMenuClick={onMenuClick} />

      <div className="relative flex-1 overflow-hidden">
        <div
          id="visor-de-listas"
          ref={scrollRef}
          onScroll={handleScroll}
          onTouchStart={() => { clicking.current = false; }}
          className="w-full h-full overflow-y-hidden overflow-x-auto py-5 box-border snap-x snap-mandatory scroll-smooth no-scrollbar flex flex-row"
        >
          {lists.map((list: TaskList) => (
            <ListaTareasCard
              key={list.id}
              list={list}
              tasks={tasks.filter((t) => t.listId === list.id)}
              onRename={renameList}
              onDelete={deleteList}
              onToggleTask={toggleTask}
              onUpdateTask={updateTask}
              onExpandTask={setExpandedTaskId}
            />
          ))}
        </div>

        <AnimatePresence>
          {expandedTask && (
            <TaskDetailView
              key={expandedTask.id}
              task={expandedTask}
              lists={lists}
              onBack={() => setExpandedTaskId(null)}
              onToggle={toggleTask}
              onUpdate={updateTask}
              onDelete={deleteTask}
            />
          )}
        </AnimatePresence>
      </div>

      {!expandedTaskId && (
        <button
          onClick={() => addTask(activeListId)}
          className="fixed bottom-[85px] left-1/2 -translate-x-1/2 w-[55px] h-[55px] bg-white border-none rounded-2xl text-[28px] text-[#7f70ff] cursor-pointer flex items-center justify-center shadow-[6px_6px_12px_#e6e6e6,-6px_-6px_12px_#fff] z-10 active:shadow-[inset_2px_2px_5px_#e6e6e6]"
        >
          +
        </button>
      )}

      <ModalNeuromorfico {...modalConfig} />
    </section>
  );
}

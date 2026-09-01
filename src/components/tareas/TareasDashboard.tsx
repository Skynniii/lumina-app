import { useState, useRef, useEffect, useCallback } from 'react';
import type { TaskList, Task } from '../../types';
import { useTasks } from '../../hooks/useTasks';
import { NavTopHeader } from './nav-top/NavTopHeader';
import { ListaTareasCard } from './ListaTareasCard';
import { ModalNeuromorfico } from '../ui/ModalNeuromorfico';

export function TareasDashboard() {
  const { lists, tasks, addList, deleteList, renameList, addTask, toggleTask, updateTask, deleteTask, modalConfig } = useTasks();
  const [activeListId, setActiveListId] = useState(lists[0]?.id || '');
  const scrollRef = useRef<HTMLDivElement>(null);
  const clicking = useRef(false);

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
      <NavTopHeader lists={lists} activeListId={activeListId} onSelectList={scrollTo} onAddList={addList} />

      <div
        id="visor-de-listas"
        ref={scrollRef}
        onScroll={handleScroll}
        onTouchStart={() => { clicking.current = false; }}
        className="w-full flex-1 overflow-y-hidden overflow-x-auto py-5 box-border snap-x snap-mandatory scroll-smooth no-scrollbar flex flex-row"
      >
        {lists.map((list: TaskList) => (
          <ListaTareasCard
            key={list.id}
            list={list}
            tasks={tasks.filter((t: Task) => t.listId === list.id)}
            allLists={lists}
            onRename={renameList}
            onDelete={deleteList}
            onToggleTask={toggleTask}
            onUpdateTask={updateTask}
            onDeleteTask={deleteTask}
          />
        ))}
      </div>

      <button
        onClick={() => addTask(activeListId)}
        className="fixed bottom-[85px] left-1/2 -translate-x-1/2 w-[55px] h-[55px] bg-white border-none rounded-2xl text-[28px] text-[#7f70ff] cursor-pointer flex items-center justify-center shadow-[6px_6px_12px_#e6e6e6,-6px_-6px_12px_#fff] z-10 active:shadow-[inset_2px_2px_5px_#e6e6e6]"
      >
        +
      </button>

      <ModalNeuromorfico {...modalConfig} />
    </section>
  );
}

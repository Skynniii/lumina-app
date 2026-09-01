import { useState, useRef, useEffect } from 'react';
import type { TaskList, Task } from '../../types';
import { useTasks } from '../../hooks/useTasks';
import { NavTopHeader } from './nav-top/NavTopHeader';
import { ListaTareasCard } from './ListaTareasCard';
import { ModalNeuromorfico } from '../ui/ModalNeuromorfico';

export const TareasDashboard = () => {
  const { lists, tasks, addList, deleteList, renameList, addTask, toggleTask, updateTask, deleteTask, modalConfig } = useTasks();
  const [activeListId, setActiveListId] = useState<string>(lists[0]?.id || '');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isClickingRef = useRef<boolean>(false);

  const handleScroll = () => {
    if (isClickingRef.current || !scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const index = Math.round(container.scrollLeft / container.offsetWidth);
    if (lists[index] && lists[index].id !== activeListId) {
      setActiveListId(lists[index].id);
    }
  };

  const scrollToTarget = (id: string) => {
    const index = lists.findIndex((l: TaskList) => l.id === id);
    if (index !== -1 && scrollContainerRef.current) {
      isClickingRef.current = true;
      setActiveListId(id);
      scrollContainerRef.current.scrollTo({
        left: index * scrollContainerRef.current.offsetWidth,
        behavior: 'smooth'
      });
      setTimeout(() => { isClickingRef.current = false; }, 400);
    }
  };

  useEffect(() => {
    if (!lists.find((l: TaskList) => l.id === activeListId)) {
      setActiveListId(lists[0]?.id || '');
    }
  }, [lists, activeListId]);

  return (
    <section className="absolute top-0 left-0 w-full h-full flex flex-col p-0 bg-[#f7f6f9]">
      <NavTopHeader lists={lists} activeListId={activeListId} onSelectList={scrollToTarget} onAddList={addList} />
      
      <div 
        id="visor-de-listas" 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        onTouchStart={() => { isClickingRef.current = false; }}
        className="w-full flex-1 overflow-y-hidden overflow-x-auto py-5 box-border snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex flex-row"
      >
        {lists.map((list: TaskList) => (
          <ListaTareasCard 
            key={list.id} list={list} tasks={tasks.filter((t: Task) => t.listId === list.id)} allLists={lists}
            onRename={renameList} onDelete={deleteList} onToggleTask={toggleTask} onUpdateTask={updateTask} onDeleteTask={deleteTask} 
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
};
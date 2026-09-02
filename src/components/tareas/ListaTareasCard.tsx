import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { Task, TaskList } from '../../types';
import { TareaItem } from './TareaItem';
import { DesplegableMenu } from '../ui/DesplegableMenu';

interface Props {
  list: TaskList;
  tasks: Task[];
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onToggleTask: (id: string) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onExpandTask: (id: string) => void;
}

export function ListaTareasCard({ list, tasks, onRename, onDelete, onToggleTask, onUpdateTask, onExpandTask }: Props) {
  const [showCompleted, setShowCompleted] = useState(false);

  const active = tasks.filter((t) => !t.completed);
  const completed = tasks.filter((t) => t.completed);

  return (
    <div className="w-full flex-none shrink-0 box-border px-4 snap-start snap-always h-full overflow-y-auto no-scrollbar pb-[130px]" data-lista={list.id}>
      <div className="bg-white rounded-[24px] shadow-[0_4px_16px_rgba(0,0,0,0.04)] border border-[#f2f2f2] flex flex-col relative">
        {/* Header sticky */}
        <div className="sticky top-0 z-20">
          <div className="absolute -top-1 -left-1 -right-1 h-[50px] bg-[#f7f6f9] z-10" />
          <div className="relative z-20 bg-white rounded-t-[24px] pt-5 px-5">
            <div className="flex justify-between items-center mb-4 flex-none">
              <button className="w-[36px] h-[36px] flex items-center justify-center text-[#999] hover:bg-[#f5f5f5] rounded-full transition-colors cursor-grab active:cursor-grabbing">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 14 18 17 21 14" /><line x1="18" y1="7" x2="18" y2="17" /><polyline points="9 10 6 7 3 10" /><line x1="6" y1="17" x2="6" y2="7" /></svg>
              </button>
              <h3 className="flex-1 text-center leading-none m-0 p-0 text-[22px] text-[#2b2b2b] font-bold tracking-tight">{list.name}</h3>
              <DesplegableMenu onRename={() => onRename(list.id, list.name)} onDelete={() => onDelete(list.id)} />
            </div>
            <hr className="border-t border-[#f0f0f5] m-0 mx-1 flex-none" />
          </div>
        </div>

        {/* Lista de tareas activas */}
        <div className="flex flex-col px-5 pb-5 pt-3">
          <ul className="list-none m-0 p-0 flex flex-col mb-2 relative">
            <AnimatePresence mode="popLayout">
              {active.map((task) => (
                <TareaItem
                  key={task.id}
                  task={task}
                  onToggle={onToggleTask}
                  onUpdate={onUpdateTask}
                  onExpand={onExpandTask}
                />
              ))}
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

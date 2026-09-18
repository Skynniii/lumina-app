import { motion, AnimatePresence } from 'framer-motion';
import type { Task, TaskList } from '../../types';

interface Props {
  isOpen: boolean;
  tasks: Task[];
  lists: TaskList[];
  onClose: () => void;
  onSelect: (task: Task | null) => void;
}

export function TaskPicker({ isOpen, tasks, lists, onClose, onSelect }: Props) {
  const eligible = tasks.filter((t) => !t.completed && !t.isSeparator);
  const byList = lists
    .map((l) => ({ list: l, items: eligible.filter((t) => t.listId === l.id) }))
    .filter((g) => g.items.length > 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 z-[1003] backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] z-[1004] bg-white rounded-t-[28px] shadow-[0_-8px_30px_rgba(0,0,0,0.12)] px-5 pt-3 pb-6 max-h-[70vh] flex flex-col"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 360, damping: 36 }}
          >
            <div className="w-10 h-1.5 bg-[#e4e4ed] rounded-full mx-auto mb-3" />
            <p className="text-center text-[13px] text-[#a0a0a0] font-medium mb-3">Vincular a tarea</p>

            <button
              type="button"
              onClick={() => { onSelect(null); onClose(); }}
              className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-[#f4f4f6] transition-colors flex items-center gap-2 mb-2 border border-[#f0f0f3]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
              <span className="text-[14px] text-[#999] font-medium">Desvincular</span>
            </button>

            <div className="overflow-y-auto no-scrollbar flex-1">
              {byList.map(({ list, items }) => (
                <div key={list.id} className="mb-3">
                  <p className="text-[12px] font-bold uppercase tracking-wider text-[#a0a0a0] mb-1.5 px-1">{list.name}</p>
                  {items.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => { onSelect(task); onClose(); }}
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-[#f4f4f6] transition-colors flex items-center gap-2"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7f70ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                      </svg>
                      <span className="text-[14px] text-[#333] truncate">{task.title}</span>
                    </button>
                  ))}
                </div>
              ))}
              {byList.length === 0 && (
                <p className="text-center text-[#a0a0a0] text-sm py-8">No hay tareas disponibles para vincular.</p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

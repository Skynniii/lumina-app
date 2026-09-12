import { motion, AnimatePresence } from 'framer-motion';
import type { Task, TaskList } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  lists: TaskList[];
  tasks: Task[];
  onSelect: (task: Task) => void;
}

export function TaskPicker({ isOpen, onClose, lists, tasks, onSelect }: Props) {
  // Filtrar la lista Principal y listas vacías
  const visibleLists = (lists ?? []).filter((l) => l.id !== 'principal');

  return (
    <AnimatePresence>
      {isOpen && visibleLists.length > 0 && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-[9999] backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[28px] z-[10000] max-h-[75vh] flex flex-col shadow-[0_-4px_30px_rgba(0,0,0,0.1)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-[#e0e0e0] rounded-full mx-auto mt-3 shrink-0" />

            <div className="px-5 pt-3 pb-2 flex items-center justify-between shrink-0">
              <span className="text-[16px] font-bold text-[#333]">Desde Tasks</span>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#f7f6f9] border-none cursor-pointer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18" /><path d="M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-5">
              {visibleLists.map((list) => {
                const listTasks = (tasks ?? []).filter((t) => t.listId === list.id && !t.completed);
                if (listTasks.length === 0) return null;
                return (
                  <div key={list.id} className="mb-4">
                    <p className="text-[12px] font-bold uppercase tracking-wide text-[#999] m-0 mb-1.5">{list.name}</p>
                    <div className="flex flex-col gap-0.5">
                      {listTasks.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => { onSelect(t); onClose(); }}
                          className="flex items-center gap-3 px-2 py-2.5 rounded-xl bg-transparent border-none cursor-pointer hover:bg-[#f7f6f9] transition-colors text-left w-full"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7f70ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                          <span className="flex-1 text-[15px] text-[#333] truncate">{t.title}</span>
                          {t.isImportant && (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="#ffcc00" stroke="#ffcc00" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

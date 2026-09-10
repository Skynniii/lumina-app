import { useState } from 'react';
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
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [showListSwitcher, setShowListSwitcher] = useState(false);

  const currentListId = selectedListId ?? (lists?.length > 0 ? lists[0].id : null);
  const currentList = lists?.find((l) => l.id === currentListId);
  const currentTasks = tasks?.filter((t) => t.listId === currentListId && !t.completed) ?? [];

  return (
    <AnimatePresence>
      {isOpen && lists && lists.length > 0 && (
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
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[28px] z-[10000] max-h-[70vh] flex flex-col shadow-[0_-4px_30px_rgba(0,0,0,0.1)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-[#e0e0e0] rounded-full mx-auto mt-3 shrink-0" />

            {/* Header con nombre de lista */}
            <div className="px-5 pt-3 pb-2 flex items-center justify-between shrink-0">
              <button
                onClick={() => setShowListSwitcher(!showListSwitcher)}
                className="flex items-center gap-2 text-[16px] font-bold text-[#333] bg-transparent border-none cursor-pointer"
              >
                {currentList?.name ?? 'Seleccionar'}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${showListSwitcher ? 'rotate-180' : ''}`}>
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#f7f6f9] border-none cursor-pointer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18" /><path d="M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Switcher de listas */}
            <AnimatePresence>
              {showListSwitcher && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden shrink-0"
                >
                  <div className="px-5 pb-2 flex gap-2 flex-wrap">
                    {lists.map((l) => (
                      <button
                        key={l.id}
                        onClick={() => { setSelectedListId(l.id); setShowListSwitcher(false); }}
                        className={`px-3 py-1.5 rounded-full text-[13px] font-semibold border-none cursor-pointer transition-colors ${l.id === currentListId ? 'bg-[#7f70ff] text-white' : 'bg-[#f7f6f9] text-[#777]'}`}
                      >
                        {l.name}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Lista de tareas */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-5">
              {currentTasks.length === 0 ? (
                <p className="text-[14px] text-[#c0c0c0] text-center py-8 m-0">No hay tareas en esta lista</p>
              ) : (
                <div className="flex flex-col gap-1">
                  {currentTasks.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => { onSelect(t); onClose(); }}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl bg-transparent border-none cursor-pointer hover:bg-[#f7f6f9] transition-colors text-left"
                    >
                      <span className="w-4 h-4 rounded-full border-2 border-[#e0e0e0] shrink-0" />
                      <span className="text-[15px] text-[#333]">{t.text}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

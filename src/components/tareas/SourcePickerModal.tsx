import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Activity, Task, TaskList } from '../../types';

interface Props {
  isOpen: boolean;
  activities: Activity[];
  tasks: Task[];
  lists: TaskList[];
  selectedActivityId?: string;
  selectedTaskId?: string;
  onClose: () => void;
  onSelectActivity: (id: string | undefined) => void;
  onSelectTask: (task: Task | null) => void;
}

export function SourcePickerModal({
  isOpen, activities, tasks, lists,
  selectedActivityId, selectedTaskId,
  onClose, onSelectActivity, onSelectTask,
}: Props) {
  const [tab, setTab] = useState<'actividades' | 'vincular'>('actividades');

  // Mostrar todas las actividades del usuario (misma lista que en los demás modales)
  const visibleActivities = activities;

  // Tareas agrupadas por lista, en el orden de la lista
  const groupedTasks = useMemo(() => {
    const eligible = tasks.filter((t) => !t.completed && !t.isSeparator && !t.isActivityOnly && !t.linkedTaskId);
    return lists
      .map((l) => {
        let items = eligible.filter((t) => t.listId === l.id);
        // Ordenar por taskOrder si existe, si no por createdAt
        if (l.taskOrder) {
          items = [...items].sort((a, b) => {
            const aIdx = l.taskOrder!.indexOf(a.id);
            const bIdx = l.taskOrder!.indexOf(b.id);
            if (aIdx === -1 && bIdx === -1) return 0;
            if (aIdx === -1) return 1;
            if (bIdx === -1) return -1;
            return aIdx - bIdx;
          });
        }
        return { list: l, items };
      })
      .filter((g) => g.items.length > 0);
  }, [tasks, lists]);

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
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] z-[1004] bg-white rounded-t-[28px] shadow-[0_-8px_30px_rgba(0,0,0,0.12)] px-5 pt-3 pb-6 max-h-[75vh] flex flex-col"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 360, damping: 36 }}
          >
            <div className="w-10 h-1.5 bg-[#e4e4ed] rounded-full mx-auto mb-3" />

            {/* Toggle entre Actividades y Vincular tarea */}
            <div className="flex gap-1 bg-[#eeeaf6] rounded-full p-1 mb-3">
              <button
                onClick={() => setTab('actividades')}
                className={`flex-1 px-3 py-2 rounded-full text-[13px] font-semibold border-none cursor-pointer transition-all ${
                  tab === 'actividades' ? 'bg-white text-[#333] shadow-[2px_2px_6px_#e0e0e0,-2px_-2px_6px_#ffffff]' : 'text-[#999] bg-transparent'
                }`}
              >
                Actividades
              </button>
              <button
                onClick={() => setTab('vincular')}
                className={`flex-1 px-3 py-2 rounded-full text-[13px] font-semibold border-none cursor-pointer transition-all ${
                  tab === 'vincular' ? 'bg-white text-[#333] shadow-[2px_2px_6px_#e0e0e0,-2px_-2px_6px_#ffffff]' : 'text-[#999] bg-transparent'
                }`}
              >
                Vincular tarea
              </button>
            </div>

            {/* Botón desvincular */}
            {(selectedActivityId || selectedTaskId) && (
              <button
                type="button"
                onClick={() => { onSelectActivity(undefined); onSelectTask(null); onClose(); }}
                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-[#f4f4f6] transition-colors flex items-center gap-2 mb-2 border border-[#f0f0f3]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
                <span className="text-[14px] text-[#999] font-medium">Quitar</span>
              </button>
            )}

            <div className="overflow-y-auto no-scrollbar flex-1">
              {tab === 'actividades' && (
                <div className="flex flex-col gap-1">
                  {visibleActivities.map((act) => (
                    <button
                      key={act.id}
                      onClick={() => { onSelectActivity(act.id); onClose(); }}
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-[#f4f4f6] transition-colors flex items-center gap-3"
                    >
                      <span className="w-4 h-4 rounded-full shrink-0" style={{ background: act.color }} />
                      <span className={`text-[14px] truncate ${selectedActivityId === act.id ? 'text-[#7f70ff] font-semibold' : 'text-[#333]'}`}>{act.name}</span>
                      {selectedActivityId === act.id && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7f70ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-auto shrink-0"><polyline points="20 6 9 17 4 12" /></svg>
                      )}
                    </button>
                  ))}
                  {visibleActivities.length === 0 && (
                    <p className="text-center text-[#a0a0a0] text-sm py-8">No hay actividades creadas.</p>
                  )}
                </div>
              )}

              {tab === 'vincular' && (
                <div className="flex flex-col gap-3">
                  {groupedTasks.map(({ list, items }) => (
                    <div key={list.id}>
                      <p className="text-[12px] font-bold uppercase tracking-wider text-[#a0a0a0] mb-1.5 px-1">{list.name}</p>
                      {items.map((task) => (
                        <button
                          key={task.id}
                          onClick={() => { onSelectTask(task); onClose(); }}
                          className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-[#f4f4f6] transition-colors flex items-center gap-2"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7f70ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                          </svg>
                          <span className={`text-[14px] truncate ${selectedTaskId === task.id ? 'text-[#7f70ff] font-semibold' : 'text-[#333]'}`}>{task.title}</span>
                        </button>
                      ))}
                    </div>
                  ))}
                  {groupedTasks.length === 0 && (
                    <p className="text-center text-[#a0a0a0] text-sm py-8">No hay tareas disponibles para vincular.</p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

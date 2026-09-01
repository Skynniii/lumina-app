import { useState, useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Task, TaskList, SubTask } from '../../types';
import { SelectorFechaHora } from './SelectorFechaHora';

interface Props {
  task: Task;
  lists: TaskList[];
  onToggle: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onDeleteTask?: (id: string) => void;
  isExpanded: boolean;
  isAnyExpanded: boolean;
  onExpand: (id: string) => void;
  onClose: () => void;
}

export const TareaItem = memo(({ task, lists, onToggle, onUpdate, onDeleteTask, isExpanded, isAnyExpanded, onExpand, onClose }: Props) => {
  const [optimisticCheck, setOptimisticCheck] = useState(false);
  const [sparkleTarget, setSparkleTarget] = useState<'checkbox' | 'button' | null>(null);
  
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [newSubtask, setNewSubtask] = useState('');
  const [activeSubtaskId, setActiveSubtaskId] = useState<string | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const liRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (isExpanded) {
      setTimeout(() => {
        if (liRef.current) {
          const scrollContainer = liRef.current.closest('.overflow-y-auto');
          if (scrollContainer) {
            const containerRect = scrollContainer.getBoundingClientRect();
            const liRect = liRef.current.getBoundingClientRect();
            
            const targetTop = scrollContainer.scrollTop + (liRect.top - containerRect.top) - 155;
            
            scrollContainer.scrollTo({
              top: targetTop,
              behavior: 'smooth'
            });
          }
        }
      }, 150);
    } else {
      setIsEditingTitle(false);
    }
  }, [isExpanded]);

  useEffect(() => {
    if (!isExpanded || showDatePicker) return;

    const handlePointerDownOutside = (e: PointerEvent) => {
      if (liRef.current && !liRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('pointerdown', handlePointerDownOutside, true);
    return () => document.removeEventListener('pointerdown', handlePointerDownOutside, true);
  }, [isExpanded, showDatePicker, onClose]);

  useEffect(() => {
    const resizeTextarea = () => {
      if (titleRef.current) {
        titleRef.current.style.height = 'auto';
        titleRef.current.style.height = `${titleRef.current.scrollHeight}px`;
      }
    };
    resizeTextarea();
    const timeout = setTimeout(resizeTextarea, 300);
    return () => clearTimeout(timeout);
  }, [task.text, isExpanded, isEditingTitle]);

  const handleComplete = (target: 'checkbox' | 'button', e: React.MouseEvent | React.ChangeEvent) => {
    e.stopPropagation();
    if (!task.completed) {
      setOptimisticCheck(true);
      setSparkleTarget(target);
      setTimeout(() => {
        onToggle(task.id);
        setSparkleTarget(null);
        setOptimisticCheck(false);
        if (isExpanded) onClose();
      }, 450);
    } else {
      onToggle(task.id);
    }
  };

  const handleImportantToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate(task.id, { isImportant: !task.isImportant });
  };

  const autoResizeNotes = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate(task.id, { notes: e.target.value });
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleAddSubtask = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    if (!newSubtask.trim()) return;
    const sub: SubTask = { id: Date.now().toString(), text: newSubtask.trim(), completed: false };
    onUpdate(task.id, { subtasks: [...(task.subtasks || []), sub] });
    setNewSubtask('');
  };

  const toggleSubtask = (subId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate(task.id, { subtasks: (task.subtasks || []).map(s => s.id === subId ? { ...s, completed: !s.completed } : s) });
  };

  const deleteSubtask = (subId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate(task.id, { subtasks: (task.subtasks || []).filter(s => s.id !== subId) });
  };

  const formatDateTimeDisplay = () => {
    if (!task.dueDate) return 'Fecha';
    const timeStr = task.dueTime ? `, ${task.dueTime}` : '';
    return `${task.dueDate}${timeStr}`;
  };

  const getCompletedDateText = () => {
    if (!task.completedAt) return 'Hoy';
    const d = new Date(task.completedAt);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Hoy';
    return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
  };

  const Sparkles = () => (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
      {[...Array(6)].map((_, i) => (
        <motion.div key={i} initial={{ opacity: 1, scale: 0, x: 0, y: 0 }} animate={{ opacity: 0, scale: 1.2, x: Math.cos((i * 60 * Math.PI) / 180) * 18, y: Math.sin((i * 60 * Math.PI) / 180) * 18 }} transition={{ duration: 0.4, ease: "easeOut" }} className="absolute w-[4px] h-[4px] bg-[#7f70ff] rounded-full" />
      ))}
    </div>
  );

  const isChecked = task.completed || optimisticCheck;
  const isCompletedView = task.completed;
  const hasSubtasks = (task.subtasks?.length || 0) > 0;
  const hasNotes = task.notes && task.notes.trim().length > 0;

  return (
    <>
      <motion.li
        ref={liRef}
        layout
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -30, height: 0, marginBottom: 0, overflow: 'hidden' }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={`flex flex-col transition-colors duration-300 ${
          isExpanded ? 'bg-white rounded-[20px] my-2 shadow-[0_12px_40px_rgba(0,0,0,0.08)] border border-[#eaeaea] z-10 relative overflow-hidden' 
            : (task.isImportant && !isCompletedView) ? 'bg-[#fff9e6] rounded-[16px] my-1 px-1' 
            : 'bg-transparent px-1'
        }`}
      >
        <div onClick={() => { if (!isAnyExpanded) onExpand(task.id); }} className="flex items-center py-3.5 px-2 cursor-pointer w-full select-none group min-h-[50px]">
          
          <motion.div 
            animate={{ width: isExpanded ? 0 : 22, opacity: isExpanded ? 0 : 1, marginRight: isExpanded ? 14 : 14 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="relative flex items-center justify-center h-[22px] flex-none overflow-hidden"
            onClick={(e) => handleComplete('checkbox', e)}
          >
            {sparkleTarget === 'checkbox' && <Sparkles />}
            <input type="checkbox" readOnly checked={isChecked} className="peer appearance-none min-w-[22px] h-[22px] border-[1.5px] border-[#d1d1d6] rounded-full cursor-pointer checked:bg-[#7f70ff] checked:border-[#7f70ff] transition-all group-hover:border-[#b0a5ff]" />
            <svg className={`absolute w-3.5 h-3.5 text-white pointer-events-none transition-opacity duration-200 ${isChecked ? 'opacity-100' : 'opacity-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          </motion.div>

          <textarea
            ref={titleRef}
            value={task.text}
            onChange={(e) => onUpdate(task.id, { text: e.target.value })}
            readOnly={!isEditingTitle || isCompletedView}
            onClick={(e) => {
              if (isExpanded) {
                e.stopPropagation();
                if (!isEditingTitle && !isCompletedView) {
                  setIsEditingTitle(true);
                  setTimeout(() => titleRef.current?.focus(), 10);
                }
              }
            }}
            onBlur={() => setIsEditingTitle(false)}
            rows={1}
            className={`bg-transparent outline-none resize-none border-none flex-grow transition-all duration-300 overflow-hidden p-0 m-0 leading-snug
              ${isExpanded ? 'text-[18px] font-bold text-[#2b2b2b] pb-1' : 'text-[15px] text-[#333333] pb-0'} 
              ${(isCompletedView && !isExpanded) ? 'text-[#a0a0a0] line-through' : ''}
              ${isEditingTitle ? 'cursor-text' : 'cursor-pointer'}
            `}
            style={{ alignSelf: 'center', paddingTop: isExpanded ? '2px' : '0' }}
          />

          {!isCompletedView && (
            <button onClick={handleImportantToggle} className="flex-none p-2 ml-2 cursor-pointer rounded-full hover:bg-black/5 transition-colors">
              <svg width="22" height="22" viewBox="0 0 24 24" fill={task.isImportant ? "#ffcc00" : "none"} stroke={task.isImportant ? "#ffcc00" : "#d1d1d6"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-300">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </button>
          )}
        </div>

        <div className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
          <div className="overflow-hidden min-h-0">
            <div className="flex flex-col px-4 pb-4 pt-2">
              
              {(!isCompletedView || hasNotes) && (
                <div className="flex items-start gap-3 py-3 border-b border-[#f5f5f5]">
                  <span className={`mt-0.5 transition-colors duration-300 ${hasNotes ? 'text-[#7f70ff]' : 'text-[#a0a0a0]'}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                  </span>
                  <textarea
                    ref={textareaRef} value={task.notes || ''} onChange={autoResizeNotes} placeholder="Añadir detalles"
                    readOnly={isCompletedView}
                    className="w-full bg-transparent outline-none resize-none text-[15px] text-[#444] placeholder-[#a0a0a0] min-h-[24px] overflow-hidden" rows={1}
                  />
                </div>
              )}

              <div 
                onClick={() => !isCompletedView && setShowDatePicker(true)} 
                className={`flex items-center gap-3 py-3.5 border-b border-[#f5f5f5] transition-colors -mx-4 px-4 ${!isCompletedView ? 'cursor-pointer hover:bg-[#fafafc]' : ''}`}
              >
                {isCompletedView ? (
                  <>
                    <span className="text-[#34c759]">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                    </span>
                    <span className="text-[15px] text-[#34c759] font-medium">Completada: {getCompletedDateText()}</span>
                  </>
                ) : (
                  <>
                    <span className={`transition-colors ${task.dueDate ? 'text-[#7f70ff]' : 'text-[#a0a0a0]'}`}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                    </span>
                    <div className="flex-1 flex items-center justify-between">
                      <span className={`text-[15px] ${task.dueDate ? 'text-[#7f70ff] font-medium' : 'text-[#555]'}`}>{formatDateTimeDisplay()}</span>
                      {task.dueDate && (
                        <button onClick={(e) => { e.stopPropagation(); onUpdate(task.id, { dueDate: undefined, dueTime: undefined }); }} className="p-1.5 text-[#a0a0a0] hover:text-[#ff4d4d] hover:bg-[#fff5f5] rounded-full transition-colors">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>

              {(!isCompletedView || hasSubtasks) && (
                <div className="flex flex-col border-b border-[#f5f5f5] -mx-4 px-4">
                  <div onClick={() => setShowSubtasks(!showSubtasks)} className="flex items-center gap-3 py-3.5 cursor-pointer hover:bg-[#fafafc] transition-colors">
                    <span className={`transition-colors ${showSubtasks || hasSubtasks ? 'text-[#7f70ff]' : 'text-[#a0a0a0]'}`}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
                    </span>
                    <span className={`flex-1 text-[15px] ${showSubtasks || hasSubtasks ? 'text-[#7f70ff] font-medium' : 'text-[#555]'}`}>
                      Subtareas {hasSubtasks && `(${task.subtasks?.filter(s => s.completed).length}/${task.subtasks?.length})`}
                    </span>
                    <motion.svg animate={{ rotate: showSubtasks ? 180 : 0 }} className="text-[#a0a0a0] w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></motion.svg>
                  </div>

                  <AnimatePresence>
                    {showSubtasks && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="pb-4 pl-[32px] pr-2">
                          <ul className="list-none p-0 m-0 space-y-3 mb-3">
                            {task.subtasks?.map(sub => (
                              <li key={sub.id} onClick={() => setActiveSubtaskId(sub.id)} className="flex items-center group relative cursor-pointer">
                                <div onClick={(e) => toggleSubtask(sub.id, e)} className="relative flex items-center justify-center w-[16px] h-[16px] flex-none mr-3">
                                  <input type="checkbox" readOnly checked={sub.completed} className="peer appearance-none w-full h-full border-[1.5px] border-[#d1d1d6] rounded-full cursor-pointer checked:bg-[#7f70ff] checked:border-[#7f70ff] transition-all" />
                                  <svg className={`absolute w-2.5 h-2.5 text-white pointer-events-none transition-opacity ${sub.completed ? 'opacity-100' : 'opacity-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                </div>
                                <span className={`flex-1 text-[14px] transition-colors ${sub.completed ? 'text-[#a0a0a0] line-through' : 'text-[#444]'}`}>{sub.text}</span>
                                {!isCompletedView && (
                                  <button onClick={(e) => deleteSubtask(sub.id, e)} className={`p-1.5 ml-2 rounded-md transition-all duration-200 border-none bg-transparent cursor-pointer ${activeSubtaskId === sub.id ? 'text-[#ff4d4d] opacity-100' : 'text-[#ccc] opacity-0 md:group-hover:opacity-100'}`}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                  </button>
                                )}
                              </li>
                            ))}
                          </ul>
                          {!isCompletedView && (
                            <div className="flex items-center mt-2">
                              <span className="w-[16px] h-[16px] rounded-full border-[1.5px] border-[#e0e0e0] mr-3 flex-none" />
                              <input type="text" value={newSubtask} onChange={(e) => setNewSubtask(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask(e)} placeholder="Añadir subtarea" className="w-full bg-transparent outline-none text-[14px] text-[#444] placeholder-[#a0a0a0]" />
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              <div className="flex justify-between items-center mt-5">
                <button onClick={(e) => { e.stopPropagation(); if(onDeleteTask) onDeleteTask(task.id); }} className="text-[#ff4d4d] p-2.5 rounded-full hover:bg-[#fff5f5] transition-colors cursor-pointer border-none bg-transparent">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                </button>

                {isCompletedView ? (
                  <button onClick={(e) => handleComplete('button', e)} className="bg-[#fff0f0] text-[#ff4d4d] hover:bg-[#ff4d4d] hover:text-white px-4 py-2.5 rounded-[12px] text-[14px] font-semibold flex items-center gap-2 transition-all duration-300 border-none cursor-pointer">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10h10a5 5 0 0 1 5 5v2"/><polyline points="7 6 3 10 7 14"/></svg>
                    Desmarcar
                  </button>
                ) : (
                  <button onClick={(e) => handleComplete('button', e)} className="relative overflow-hidden bg-[#f0edff] text-[#7f70ff] hover:bg-[#7f70ff] hover:text-white px-4 py-2.5 rounded-[12px] text-[14px] font-semibold flex items-center gap-2 transition-all duration-300 border-none cursor-pointer">
                    {sparkleTarget === 'button' && <Sparkles />}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    Completada
                  </button>
                )}
              </div>

            </div>
          </div>
        </div>
      </motion.li>

      <AnimatePresence>
        {showDatePicker && (
          <SelectorFechaHora isOpen={showDatePicker} initialDate={task.dueDate} initialTime={task.dueTime} onClose={() => setShowDatePicker(false)} onSave={(date, time) => onUpdate(task.id, { dueDate: date, dueTime: time })} />
        )}
      </AnimatePresence>
    </>
  );
});
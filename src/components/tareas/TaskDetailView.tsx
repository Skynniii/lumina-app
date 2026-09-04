import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Task, TaskList, SubTask } from '../../types';
import { useSettings } from '../../context/SettingsContext';
import { playCompleteSound } from '../../utils/sound';
import { Sparkles } from './Sparkles';
import { CalendarModal } from './CalendarModal';
import { NotesToolbar } from './NotesToolbar';

interface Props {
  task: Task;
  lists: TaskList[];
  onBack: () => void;
  onToggle: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onDelete: (id: string) => void;
}

export function TaskDetailView({ task, lists, onBack, onToggle, onUpdate, onDelete }: Props) {
  const { settings } = useSettings();
  const [sparkle, setSparkle] = useState(false);
  const [showListMenu, setShowListMenu] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [notesExpanded, setNotesExpanded] = useState(() => !!task.notes?.replace(/<[^>]*>/g, '').trim());
  const [notesEditing, setNotesEditing] = useState(false);

  const titleRef = useRef<HTMLTextAreaElement>(null);
  const notesEditRef = useRef<HTMLDivElement>(null);
  const listMenuRef = useRef<HTMLDivElement>(null);
  const subInputRef = useRef<HTMLInputElement>(null);

  const currentList = lists.find((l) => l.id === task.listId) || lists[0];
  const isCompleted = task.completed;
  const hasSubtasks = (task.subtasks?.length || 0) > 0;
  const hasNotes = !!task.notes?.replace(/<[^>]*>/g, '').trim();

  // Auto-resize del título
  useEffect(() => {
    const resize = () => {
      if (titleRef.current) {
        titleRef.current.style.height = 'auto';
        titleRef.current.style.height = `${titleRef.current.scrollHeight}px`;
      }
    };
    resize();
    const t = setTimeout(resize, 100);
    return () => clearTimeout(t);
  }, [task.text, editingTitle]);

  // Inicializar contentEditable de notas al expandir
  useEffect(() => {
    if (notesExpanded && notesEditRef.current) {
      notesEditRef.current.innerHTML = task.notes || '';
      if (!isCompleted) {
        setTimeout(() => {
          const el = notesEditRef.current;
          if (!el) return;
          el.focus();
          const sel = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(el);
          range.collapse(false);
          sel?.removeAllRanges();
          sel?.addRange(range);
        }, 100);
      }
    }
  }, [notesExpanded]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cerrar menú de lista al hacer click fuera
  useEffect(() => {
    if (!showListMenu) return;
    const handler = (e: MouseEvent) => {
      if (listMenuRef.current && !listMenuRef.current.contains(e.target as Node)) setShowListMenu(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [showListMenu]);

  // Auto-focus en subtarea nueva
  useEffect(() => {
    if (editingSubId && subInputRef.current) {
      subInputRef.current.focus();
    }
  }, [editingSubId, task.subtasks]);

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!task.completed) {
      setSparkle(true);
      if (settings.sounds) playCompleteSound();
      setTimeout(() => {
        onToggle(task.id);
        setSparkle(false);
        onBack();
      }, 450);
    } else {
      onToggle(task.id);
    }
  };

  const handleImportant = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate(task.id, { isImportant: !task.isImportant });
  };

  const handleNotesInput = (e: React.FormEvent<HTMLDivElement>) => {
    onUpdate(task.id, { notes: e.currentTarget.innerHTML });
  };

  const execCommand = (cmd: string, value?: string) => {
    notesEditRef.current?.focus();
    document.execCommand(cmd, false, value);
    if (notesEditRef.current) {
      onUpdate(task.id, { notes: notesEditRef.current.innerHTML });
    }
  };

  const handleAddSubtask = () => {
    const subId = Date.now().toString();
    const sub: SubTask = { id: subId, text: '', completed: false };
    onUpdate(task.id, { subtasks: [...(task.subtasks || []), sub] });
    setEditingSubId(subId);
  };

  const saveSubtask = (subId: string, text: string) => {
    if (text.trim()) {
      onUpdate(task.id, { subtasks: (task.subtasks || []).map((s) => (s.id === subId ? { ...s, text: text.trim() } : s)) });
    } else {
      onUpdate(task.id, { subtasks: (task.subtasks || []).filter((s) => s.id !== subId) });
    }
    setEditingSubId(null);
  };

  const toggleSub = (subId: string) => {
    onUpdate(task.id, { subtasks: (task.subtasks || []).map((s) => (s.id === subId ? { ...s, completed: !s.completed } : s)) });
  };

  const deleteSub = (subId: string) => {
    onUpdate(task.id, { subtasks: (task.subtasks || []).filter((s) => s.id !== subId) });
  };

  const formatDate = () => {
    if (!task.dueDate) return 'Seleccionar fecha/hora';
    const d = new Date(task.dueDate);
    const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    let str = d.toLocaleDateString('es-CO', opts);
    if (task.dueTime) {
      const [h, min] = task.dueTime.split(':').map(Number);
      const period = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      str += ` · ${h12}:${String(min).padStart(2, '0')} ${period}`;
    }
    if (task.repeat?.enabled) str += ' · 🔁';
    return str;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 320, damping: 30 }}
      className="absolute left-0 right-0 top-0 bottom-[70px] z-[1000] bg-white flex flex-col origin-top"
    >
      {/* Header: back + star + list selector */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f0f5] shrink-0">
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors active:scale-90">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>

        <div className="flex items-center gap-2">
          {/* Estrella importante */}
          {!isCompleted && (
            <button onClick={handleImportant} className="p-2 rounded-full hover:bg-black/5 transition-colors">
              <svg width="22" height="22" viewBox="0 0 24 24" fill={task.isImportant ? '#ffcc00' : 'none'} stroke={task.isImportant ? '#ffcc00' : '#d1d1d6'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-300">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </button>
          )}

          {/* Selector de lista */}
          <div className="relative" ref={listMenuRef}>
            <button onClick={() => setShowListMenu(!showListMenu)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-[#f5f5f7] transition-colors">
              <span className="text-[14px] font-medium text-[#555]">{currentList.name}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${showListMenu ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9" /></svg>
            </button>
            <AnimatePresence>
              {showListMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1 bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-[#eaeaea] py-1.5 w-[160px] z-10 origin-top-right"
                >
                  {lists.map((list) => (
                    <button
                      key={list.id}
                      onClick={() => { onUpdate(task.id, { listId: list.id }); setShowListMenu(false); }}
                      className="w-full flex items-center justify-between px-3 py-2 text-[14px] text-[#555] hover:bg-[#f8f9fa] transition-colors"
                    >
                      <span>{list.name}</span>
                      {list.id === task.listId && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7f70ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Contenido scrolleable */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-4">
        {/* Texto de la tarea */}
        <textarea
          ref={titleRef}
          value={task.text}
          onChange={(e) => onUpdate(task.id, { text: e.target.value })}
          readOnly={isCompleted || !editingTitle}
          onClick={() => { if (!isCompleted) { setEditingTitle(true); setTimeout(() => titleRef.current?.focus(), 10); } }}
          onBlur={() => setEditingTitle(false)}
          rows={1}
          className={`w-full bg-transparent outline-none resize-none border-none text-[20px] font-bold leading-snug mb-4 ${isCompleted ? 'text-[#a0a0a0] line-through' : 'text-[#2b2b2b]'} ${editingTitle ? 'cursor-text' : 'cursor-pointer'}`}
        />

        {/* Notas expandible */}
        {(!isCompleted || hasNotes) && (
          <div className="border-b border-[#f0f0f5]">
            <div onClick={() => setNotesExpanded(!notesExpanded)} className="flex items-center gap-3 py-3 cursor-pointer">
              <span className={`transition-colors ${hasNotes ? 'text-[#7f70ff]' : 'text-[#a0a0a0]'}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
              </span>
              <span className={`flex-1 text-[15px] ${hasNotes ? 'text-[#7f70ff] font-bold' : 'text-[#555]'}`}>
                {hasNotes ? 'Notas' : 'Añadir notas'}
              </span>
              <motion.svg animate={{ rotate: notesExpanded ? 180 : 0 }} className="text-[#a0a0a0] w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></motion.svg>
            </div>
            <AnimatePresence>
              {notesExpanded && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div
                    ref={notesEditRef}
                    contentEditable={!isCompleted}
                    suppressContentEditableWarning
                    onInput={handleNotesInput}
                    onFocus={() => { if (!isCompleted) setNotesEditing(true); }}
                    onBlur={() => setNotesEditing(false)}
                    className="w-full min-h-[100px] pb-4 pt-1 outline-none text-[15px] text-[#444] leading-relaxed [&_h1]:text-[18px] [&_h1]:font-bold [&_h1]:my-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Subtareas */}
        {(!isCompleted || hasSubtasks) && (
          <div className="border-b border-[#f0f0f5]">
            <div className="flex items-center gap-3 py-3">
              <span className={`transition-colors ${hasSubtasks ? 'text-[#7f70ff]' : 'text-[#a0a0a0]'}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
              </span>
              <span className={`flex-1 text-[15px] ${hasSubtasks ? 'text-[#7f70ff] font-medium' : 'text-[#555]'}`}>
                Subtareas
              </span>
              {!isCompleted && (
                <button onClick={handleAddSubtask} className="w-7 h-7 flex items-center justify-center rounded-full text-[#7f70ff] hover:bg-[#f0edff] transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                </button>
              )}
            </div>
            {/* Lista de subtareas - sin sangría */}
            <div className={hasSubtasks ? "pb-4" : ""}>
              <ul className="list-none p-0 m-0 space-y-2">
                {task.subtasks?.map((sub) => (
                  <li key={sub.id} className="flex items-center gap-3 py-1">
                    <div onClick={() => toggleSub(sub.id)} className="relative flex items-center justify-center w-[16px] h-[16px] flex-none cursor-pointer">
                      <input type="checkbox" readOnly checked={sub.completed} className="peer appearance-none w-full h-full border-[1.5px] border-[#d1d1d6] rounded-full cursor-pointer checked:bg-[#7f70ff] checked:border-[#7f70ff] transition-all" />
                      <svg className={`absolute w-2.5 h-2.5 text-white pointer-events-none transition-opacity ${sub.completed ? 'opacity-100' : 'opacity-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    {editingSubId === sub.id ? (
                      <input
                        ref={subInputRef}
                        defaultValue={sub.text}
                        onBlur={(e) => saveSubtask(sub.id, e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                        placeholder="Escribe la subtarea..."
                        className="flex-1 bg-transparent outline-none text-[14px] text-[#444] placeholder-[#bbb]"
                      />
                    ) : (
                      <span className={`flex-1 text-[14px] transition-colors ${sub.completed ? 'text-[#a0a0a0] line-through' : 'text-[#444]'}`}>{sub.text}</span>
                    )}
                    {!isCompleted && editingSubId !== sub.id && (
                      <button onClick={() => deleteSub(sub.id)} className="p-1 rounded-md text-[#ccc] hover:text-[#ff4d4d] hover:bg-[#fff5f5] transition-all">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Fecha y Hora */}
        {!isCompleted && (
          <div className="border-b border-[#f0f0f5]">
            <div onClick={() => setShowCalendar(true)} className="flex items-center gap-3 py-3 cursor-pointer">
              <span className={`transition-colors ${task.dueDate ? 'text-[#7f70ff]' : 'text-[#a0a0a0]'}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
              </span>
              <span className={`flex-1 text-[15px] ${task.dueDate ? 'text-[#7f70ff] font-medium' : 'text-[#555]'}`}>{formatDate()}</span>
              {task.dueDate && (
                <button onClick={(e) => { e.stopPropagation(); onUpdate(task.id, { dueDate: undefined, dueTime: undefined, repeat: undefined }); }} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-[#fff5f5] transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff4d4d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              )}
            </div>
          </div>
        )}

        {isCompleted && (
          <div className="flex items-center gap-3 py-3 border-b border-[#f0f0f5]">
            <span className="text-[#34c759]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
            </span>
            <span className="text-[15px] text-[#34c759] font-medium">Completada</span>
          </div>
        )}

        {/* Espacio en blanco para futuras funciones */}
        <div className="min-h-[60px]" />
      </div>

      {/* Toolbar de formato cuando se editan notas */}
      <AnimatePresence>
        {notesEditing && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <NotesToolbar onCommand={execCommand} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Barra inferior: eliminar + completar */}
      <div className="flex justify-between items-center px-5 py-4 border-t border-[#f0f0f5] shrink-0">
        <button onClick={() => onDelete(task.id)} className="text-[#ff4d4d] p-2.5 rounded-full hover:bg-[#fff5f5] transition-colors border-none bg-transparent cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
        </button>

        {isCompleted ? (
          <button onClick={handleComplete} className="bg-[#fff0f0] text-[#ff4d4d] hover:bg-[#ff4d4d] hover:text-white px-4 py-2.5 rounded-[12px] text-[14px] font-semibold flex items-center gap-2 transition-all border-none cursor-pointer">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10h10a5 5 0 0 1 5 5v2" /><polyline points="7 6 3 10 7 14" /></svg>
            Desmarcar
          </button>
        ) : (
          <button onClick={handleComplete} className="relative overflow-hidden bg-[#f0edff] text-[#7f70ff] hover:bg-[#7f70ff] hover:text-white px-4 py-2.5 rounded-[12px] text-[14px] font-semibold flex items-center gap-2 transition-all border-none cursor-pointer">
            {sparkle && <Sparkles />}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            Completada
          </button>
        )}
      </div>

      {/* Modal flotante de calendario */}
      <AnimatePresence>
        {showCalendar && (
          <CalendarModal
            initialDate={task.dueDate}
            initialTime={task.dueTime}
            initialRepeat={task.repeat}
            onClose={() => setShowCalendar(false)}
            onSave={(date, time, repeat) => onUpdate(task.id, { dueDate: date, dueTime: time, repeat })}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

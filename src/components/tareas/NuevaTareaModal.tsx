import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarModal } from './CalendarModal';
import { NotesToolbar } from './NotesToolbar';
import { SourcePickerModal } from './SourcePickerModal';
import { ActivityPicker } from '../timer/ActivityPicker';
import { useActivities } from '../../hooks/useActivities';
import type { RepeatConfig, TaskList, Activity, Task } from '../../types';

interface Props {
  isOpen: boolean;
  defaultListId: string;
  availableLists?: TaskList[];
  allLists?: TaskList[];
  allTasks?: Task[];
  listName?: string;
  onClose: () => void;
  onCreate: (data: { title: string; notes?: string; scheduledDate?: string; scheduledTime?: string; dueDate?: string; isImportant?: boolean; repeat?: RepeatConfig; activityId?: string; linkedTaskId?: string; isActivityOnly?: boolean }, listId: string) => void;
}

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function fmtFecha(scheduledDate?: string, scheduledTime?: string, repeat?: RepeatConfig) {
  const d = scheduledDate;
  if (!d) return null;
  const [, m, day] = d.split('-').map(Number);
  let s = `${day} ${MONTHS[m - 1]}`;
  if (scheduledTime) {
    const [h, min] = scheduledTime.split(':').map(Number);
    const h12 = h % 12 || 12;
    s += ` · ${h12}:${String(min).padStart(2, '0')} ${h >= 12 ? 'pm' : 'am'}`;
  }
  if (repeat?.enabled) s += ' 🔁';
  return s;
}

export function NuevaTareaModal({ isOpen, defaultListId, availableLists, allLists, allTasks, listName, onClose, onCreate }: Props) {
  const [title, setTitle] = useState('');
  const [notesHtml, setNotesHtml] = useState('');
  const [notesOpen, setNotesOpen] = useState(false);
  const [notesEditing, setNotesEditing] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<string | undefined>(undefined);
  const [scheduledTime, setScheduledTime] = useState<string | undefined>(undefined);
  const [dueDate, setDueDate] = useState<string | undefined>(undefined);
  const [repeat, setRepeat] = useState<RepeatConfig | undefined>(undefined);
  const [important, setImportant] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [targetListId, setTargetListId] = useState(defaultListId);
  const { activities, addActivity } = useActivities();
  const [activityId, setActivityId] = useState<string | undefined>(undefined);
  const [linkedTaskId, setLinkedTaskId] = useState<string | undefined>(undefined);
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [activityPickerOpen, setActivityPickerOpen] = useState(false);
  const notesRef = useRef<HTMLDivElement>(null);

  const selectedActivity = activities.find((a) => a.id === activityId);
  const isLinked = !!linkedTaskId;

  const generateRefTitle = (task: Task): string => {
    const taskList = allLists?.find((l) => l.id === task.listId);
    if (taskList?.activityId) {
      const activity = activities.find((a) => a.id === taskList.activityId);
      return `${activity?.name ?? 'Actividad'}: ${task.title}`;
    }
    return `Avance en: ${task.title}`;
  };

  useEffect(() => {
    if (isOpen) {
      setTitle(''); setNotesHtml(''); setNotesOpen(false); setNotesEditing(false);
      setScheduledDate(undefined); setScheduledTime(undefined); setDueDate(undefined); setRepeat(undefined);
      setImportant(false); setShowPicker(false);
      setTargetListId(defaultListId);
      setActivityId(undefined);
      setLinkedTaskId(undefined); setShowSourcePicker(false);
      setActivityPickerOpen(false);
    }
  }, [isOpen, defaultListId]);

  useEffect(() => {
    if (notesOpen && notesRef.current) {
      notesRef.current.innerHTML = notesHtml;
      setTimeout(() => notesRef.current?.focus(), 60);
    }
  }, [notesOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const execCommand = (cmd: string, value?: string) => {
    notesRef.current?.focus();
    document.execCommand(cmd, false, value);
    if (notesRef.current) setNotesHtml(notesRef.current.innerHTML);
  };

  const submit = () => {
    const trimmed = title.trim();
    if (isLinked) {
      if (!trimmed) return;
      onCreate({ title: trimmed, linkedTaskId }, targetListId);
      onClose();
      return;
    }
    if (!trimmed && !activityId) return;
    const notesClean = notesHtml.replace(/<[^>]*>/g, '').trim() ? notesHtml : '';
    const isActivityOnly = !trimmed && !!activityId;
    onCreate({ title: trimmed, notes: notesClean || undefined, scheduledDate, scheduledTime, dueDate, isImportant: important, repeat, activityId, isActivityOnly }, targetListId);
    onClose();
  };

  const fechaLabel = fmtFecha(scheduledDate, scheduledTime, repeat);
  const hasNotes = !!notesHtml.replace(/<[^>]*>/g, '').trim();

  const iconBtn = (active: boolean, onClick: () => void, title: string, children: React.ReactNode) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`w-11 h-11 flex-none flex items-center justify-center rounded-full border transition-colors ${active ? 'border-[#7f70ff]/30 bg-[#f0edff] text-[#7f70ff]' : 'border-[#e8e8ed] bg-[#fcfcfd] text-[#999]'}`}
    >
      {children}
    </button>
  );

  return (
    <>
      <style>{`[data-ph]:empty::before{content:attr(data-ph);color:#bbb;pointer-events:none}`}</style>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/40 z-[1001] backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.div
              className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] z-[1002] bg-white rounded-t-[28px] shadow-[0_-8px_30px_rgba(0,0,0,0.12)] px-5 pt-3 pb-6"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 360, damping: 36 }}
            >
              <div className="w-10 h-1.5 bg-[#e4e4ed] rounded-full mx-auto mb-3" />
              <p className="text-center text-[13px] text-[#a0a0a0] font-medium mb-3">Nueva tarea{listName ? ` · ${listName}` : ''}</p>

              {availableLists && (
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-3 -mx-1 px-1">
                  {availableLists.map((l) => {
                    const sel = targetListId === l.id;
                    return (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => setTargetListId(l.id)}
                        className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors flex-none ${sel ? 'bg-[#7f70ff] text-white' : 'bg-[#f4f4f6] text-[#777]'}`}
                      >
                        {l.name}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="relative mb-3">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => { if (!isLinked) setTitle(e.target.value); }}
                  onKeyDown={(e) => e.key === 'Enter' && submit()}
                  placeholder={activityId ? (selectedActivity?.name ?? 'Actividad') : '¿Qué tarea quieres añadir?'}
                  readOnly={isLinked}
                  autoFocus={!isLinked}
                  className={`w-full border rounded-xl py-3 pl-3.5 pr-10 text-[15px] outline-none transition-colors ${isLinked ? 'border-[#7f70ff]/30 bg-[#f0edff] text-[#7f70ff] font-medium cursor-default' : 'border-[#e4e4ed] text-[#333] bg-[#fafafc] focus:border-[#7f70ff] focus:bg-white'}`}
                />
                {(!title.trim() || isLinked) && (
                <button
                  type="button"
                  onClick={() => setShowSourcePicker(true)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#f0f0f5] transition-colors text-[#999]"
                  title="Traer desde actividad o tarea"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7" /><polyline points="9 7 17 7 17 15" /></svg>
                </button>
                )}
              </div>

              {/* Fila de íconos: fecha/hora, importante, notas (oculta cuando es referencia) */}
              {!isLinked && (
              <div className="flex items-center gap-3 mb-2">
                {iconBtn(!!scheduledDate || !!repeat, () => setShowPicker(true), 'Fecha y hora',
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                )}
                {iconBtn(important, () => setImportant((v) => !v), 'Importante',
                  <svg width="20" height="20" viewBox="0 0 24 24" fill={important ? '#ffcc00' : 'none'} stroke={important ? '#ffcc00' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                )}
                {iconBtn(notesOpen || hasNotes, () => setNotesOpen((v) => !v), 'Notas',
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                )}
                <button
                  type="button"
                  onClick={() => setActivityPickerOpen(true)}
                  title="Actividad"
                  className={`w-11 h-11 flex-none flex items-center justify-center rounded-full border transition-colors ${activityId ? 'border-[#7f70ff]/30 bg-[#f0edff]' : 'border-[#e8e8ed] bg-[#fcfcfd] text-[#999]'}`}
                  style={activityId ? { color: selectedActivity?.color ?? '#7f70ff' } : undefined}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>
                </button>
                {fechaLabel && <span className="text-[12px] text-[#6b5cdb] font-medium ml-1 truncate">{fechaLabel}</span>}
              </div>
              )}

              {/* Editor de notas desplegable */}
              <AnimatePresence>
                {notesOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-2">
                    <div
                      ref={notesRef}
                      contentEditable
                      suppressContentEditableWarning
                      data-ph="Escribe una nota..."
                      onInput={(e) => setNotesHtml(e.currentTarget.innerHTML)}
                      onFocus={() => setNotesEditing(true)}
                      onBlur={() => setNotesEditing(false)}
                      className="w-full min-h-[80px] max-h-[160px] overflow-y-auto no-scrollbar p-3 text-[14px] text-[#444] leading-relaxed outline-none border border-[#e4e4ed] rounded-xl [&_h1]:text-[16px] [&_h1]:font-bold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Barra de formato al escribir */}
              <AnimatePresence>
                {notesEditing && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-2">
                    <NotesToolbar onCommand={execCommand} />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-3 mt-2">
                <button onClick={onClose} className="flex-1 border-none py-3 rounded-xl text-sm font-semibold cursor-pointer bg-[#f0f0f0] text-[#666] hover:bg-[#e4e4e4] transition-colors">Cancelar</button>
                <button onClick={submit} disabled={!title.trim() && !activityId && !isLinked} className="flex-1 border-none py-3 rounded-xl text-sm font-semibold cursor-pointer bg-[#7f70ff] text-white shadow-[2px_4px_10px_rgba(127,112,255,0.3)] hover:bg-[#6c5dd4] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">{isLinked ? 'Crear referencia' : !title.trim() && activityId ? 'Crear actividad' : 'Crear tarea'}</button>
              </div>
            </motion.div>

            {showPicker && (
              <CalendarModal
                initialDate={scheduledDate}
                initialTime={scheduledTime}
                initialRepeat={repeat}
                onClose={() => setShowPicker(false)}
                onSave={(d, t, r) => { setScheduledDate(d); setScheduledTime(t); setRepeat(r); }}
              />
            )}

            <ActivityPicker
              isOpen={activityPickerOpen}
              onClose={() => setActivityPickerOpen(false)}
              activities={activities}
              selectedId={activityId ?? ''}
              onSelect={(id) => {
                setActivityId(id);
                setLinkedTaskId(undefined);
                if (id) setTitle('');
                setActivityPickerOpen(false);
              }}
              onCreate={async (name, color) => {
                const id = await addActivity({ name: name.trim(), color });
                setActivityId(id);
                setLinkedTaskId(undefined);
                setTitle('');
                setActivityPickerOpen(false);
              }}
            />

            <SourcePickerModal
              isOpen={showSourcePicker}
              activities={activities}
              tasks={allTasks ?? []}
              lists={allLists ?? availableLists ?? []}
              targetListId={targetListId}
              selectedActivityId={activityId}
              selectedTaskId={linkedTaskId}
              onClose={() => setShowSourcePicker(false)}
              onSelectActivity={(id) => {
                setActivityId(id);
                setLinkedTaskId(undefined);
                if (id) setTitle('');
              }}
              onSelectTask={(selected) => {
                if (selected) {
                  setLinkedTaskId(selected.id);
                  setActivityId(undefined);
                  setTitle(generateRefTitle(selected));
                  setNotesHtml('');
                  setNotesOpen(false);
                  setScheduledDate(undefined);
                  setScheduledTime(undefined);
                  setDueDate(undefined);
                  setRepeat(undefined);
                } else {
                  setLinkedTaskId(undefined);
                  setTitle('');
                  setActivityId(undefined);
                  setNotesHtml('');
                  setNotesOpen(false);
                  setScheduledDate(undefined);
                  setScheduledTime(undefined);
                  setDueDate(undefined);
                  setRepeat(undefined);
                }
              }}
            />
          </>
        )}
      </AnimatePresence>
    </>
  );
}

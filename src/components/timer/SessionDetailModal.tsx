import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Activity, Task, TaskList, TimeSession } from '../../types';
import { useSettings } from '../../context/SettingsContext';
import { useActivities } from '../../hooks/useActivities';
import { formatElapsed, dayLabel, isoToDateKey } from '../../hooks/useTimeTracker';
import { DatePickerModal } from '../tareas/DatePickerModal';
import { TimePickerModal } from '../tareas/TimePickerModal';
import { ActivityPicker } from './ActivityPicker';
import { TaskPicker } from './TaskPicker';

interface Props {
  entry: TimeSession;
  onUpdate: (id: string, updates: Partial<TimeSession>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  tasks: Task[];
  taskLists: TaskList[];
  onLinkTask: (entry: TimeSession, task: Task) => void;
  onUnlinkTask: (entry: TimeSession) => void;
  onSyncToTask: (taskId: string, updates: Partial<Task>) => void;
}

export function SessionDetailModal({ entry, onUpdate, onDelete, onClose, tasks, taskLists, onLinkTask, onUnlinkTask, onSyncToTask }: Props) {
  const { settings } = useSettings();
  const { activities, addActivity } = useActivities();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [showActivityPicker, setShowActivityPicker] = useState(false);
  const [showTaskPicker, setShowTaskPicker] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const activity = activities.find((a) => a.id === entry.activityId);
  const linkedTask = entry.taskId ? tasks.find((t) => t.id === entry.taskId) : undefined;
  const entryDateKey = isoToDateKey(entry.startTime);

  const fmtFullDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const fmtClock = (iso: string) => {
    const d = new Date(iso);
    const h = d.getHours();
    const min = d.getMinutes();
    if (settings.timeFormat === '12h') {
      return `${h % 12 || 12}:${String(min).padStart(2, '0')} ${h >= 12 ? 'pm' : 'am'}`;
    }
    return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  };

  const updateStartTime = (hour24: string, minute: string) => {
    const h = parseInt(hour24);
    const m = parseInt(minute);
    const newStart = new Date(entry.startTime);
    newStart.setHours(h, m, 0, 0);
    const newStartTime = newStart.toISOString();
    const newDuration = Math.max(0, Math.floor((new Date(entry.endTime).getTime() - newStart.getTime()) / 1000));
    onUpdate(entry.id, { startTime: newStartTime, duration: newDuration });
  };

  const updateEndTime = (hour24: string, minute: string) => {
    const h = parseInt(hour24);
    const m = parseInt(minute);
    const newEnd = new Date(entry.endTime);
    newEnd.setHours(h, m, 0, 0);
    const newEndTime = newEnd.toISOString();
    const newDuration = Math.max(0, Math.floor((newEnd.getTime() - new Date(entry.startTime).getTime()) / 1000));
    onUpdate(entry.id, { endTime: newEndTime, duration: newDuration });
  };

  // Si la sesión está vinculada, los cambios a descripción/actividad/notas se sincronizan con la tarea
  const handleDescriptionChange = (value: string) => {
    onUpdate(entry.id, { description: value });
    if (entry.taskId) onSyncToTask(entry.taskId, { title: value });
  };

  const handleActivityChange = (id: string) => {
    onUpdate(entry.id, { activityId: id });
    if (entry.taskId) onSyncToTask(entry.taskId, { activityId: id });
    setShowActivityPicker(false);
  };

  const handleNotesChange = (value: string) => {
    onUpdate(entry.id, { notes: value || undefined });
    if (entry.taskId) onSyncToTask(entry.taskId, { notes: value });
  };

  // Vincular sesión a una tarea: trae title, activity, notes y taskId
  const handleSelectTask = (task: Task) => {
    if (entry.taskId && entry.taskId !== task.id) {
      onUnlinkTask(entry);
    }
    const plainNotes = task.notes ? task.notes.replace(/<[^>]*>/g, '').trim() : '';
    onLinkTask(entry, task);
    onUpdate(entry.id, {
      taskId: task.id,
      description: task.title,
      activityId: task.activityId || '',
      notes: plainNotes || undefined,
    });
  };

  // Desvincular tarea: limpia los campos
  const handleUnlink = () => {
    if (entry.taskId) {
      onUnlinkTask(entry);
      onUpdate(entry.id, {
        taskId: undefined,
        description: '',
        activityId: '',
        notes: undefined,
      });
    }
  };

  const updateDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const newStart = new Date(entry.startTime);
    newStart.setFullYear(y, m - 1, d);
    const newEnd = new Date(entry.endTime);
    newEnd.setFullYear(y, m - 1, d);
    const newDuration = Math.max(0, Math.floor((newEnd.getTime() - newStart.getTime()) / 1000));
    onUpdate(entry.id, { startTime: newStart.toISOString(), endTime: newEnd.toISOString(), duration: newDuration });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 320, damping: 30 }}
      className="absolute left-0 right-0 top-0 bottom-0 z-[1000] bg-white flex flex-col origin-top"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f0f5] shrink-0">
        <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors active:scale-90">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
        </button>
        <button onClick={() => setConfirmDelete(true)} className="text-[#ff4d4d] p-2.5 rounded-full hover:bg-[#fff5f5] transition-colors border-none bg-transparent cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-4">
        <div className="text-center mb-6">
          <p className="text-[40px] font-bold text-[#333] tabular-nums m-0 leading-none">{formatElapsed(entry.duration)}</p>
          <p className="text-[13px] text-[#999] uppercase tracking-wide mt-2 m-0 capitalize">{dayLabel(entryDateKey)}</p>
        </div>

        <div className="border-b border-[#f0f0f5]">
          <div onClick={() => setShowDatePicker(true)} className="flex items-center gap-3 py-3 cursor-pointer">
            <span className="text-[#a0a0a0]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
            </span>
            <div className="flex-1">
              <p className="text-[15px] font-medium text-[#333] m-0 capitalize">{dayLabel(entryDateKey)}</p>
              <p className="text-[12px] text-[#999] m-0 capitalize">{fmtFullDate(entry.startTime)}</p>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
          </div>
        </div>

        <div className="border-b border-[#f0f0f5]">
          <button onClick={() => setShowStartTimePicker(true)} className="flex items-center gap-3 py-3 w-full bg-transparent border-none cursor-pointer">
            <span className="text-[#a0a0a0]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2" /><path d="M9 2h6" /><path d="M12 5V2" /></svg>
            </span>
            <span className="flex-1 text-left text-[15px] text-[#555]">Hora de inicio</span>
            <span className="text-[15px] font-medium text-[#333] tabular-nums">{fmtClock(entry.startTime)}</span>
          </button>
        </div>

        <div className="border-b border-[#f0f0f5]">
          <button onClick={() => setShowEndTimePicker(true)} className="flex items-center gap-3 py-3 w-full bg-transparent border-none cursor-pointer">
            <span className="text-[#a0a0a0]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2" /><path d="M9 2h6" /><path d="M12 5V2" /></svg>
            </span>
            <span className="flex-1 text-left text-[15px] text-[#555]">Hora de fin</span>
            <span className="text-[15px] font-medium text-[#333] tabular-nums">{fmtClock(entry.endTime)}</span>
          </button>
        </div>

        {/* Descripción — con flecha (vincular) o X (desvincular) en el borde derecho */}
        <div className="border-b border-[#f0f0f5]">
          <div className="flex items-center gap-3 py-3">
            {linkedTask ? (
              <span className="text-[#7f70ff] shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
              </span>
            ) : (
              <span className="text-[#a0a0a0] shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
              </span>
            )}
            <input
              type="text"
              value={entry.description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              placeholder="Sin descripción"
              className={`flex-1 text-[15px] bg-transparent border-none outline-none placeholder-[#bbb] ${linkedTask ? 'text-[#7f70ff] font-medium' : 'text-[#333]'}`}
            />
            {linkedTask ? (
              <button onClick={handleUnlink} className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-[#fff5f5] transition-colors border-none bg-transparent cursor-pointer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff4d4d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            ) : (
              <button onClick={() => setShowTaskPicker(true)} className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-[#f0edff] transition-colors border-none bg-transparent cursor-pointer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7f70ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" /></svg>
              </button>
            )}
          </div>
        </div>

        {/* Actividad */}
        <div className="border-b border-[#f0f0f5]">
          <button onClick={() => setShowActivityPicker(true)} className="flex items-center gap-3 py-3 w-full bg-transparent border-none cursor-pointer">
            {activity ? <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: activity.color }} /> : (
              <span className="text-[#a0a0a0]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>
              </span>
            )}
            <span className={`flex-1 text-left text-[15px] ${activity ? 'text-[#333]' : 'text-[#555]'}`}>{activity?.name ?? 'Seleccionar actividad'}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
          </button>
        </div>

        <div className="border-b border-[#f0f0f5]">
          <div className="flex items-start gap-3 py-3">
            <span className="text-[#a0a0a0] mt-1">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
            </span>
            <textarea
              value={entry.notes || ''}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="Añadir notas..."
              rows={2}
              className="flex-1 text-[15px] text-[#333] bg-transparent border-none outline-none resize-none placeholder-[#bbb]"
            />
          </div>
        </div>

        <div className="min-h-[60px]" />
      </div>

      {showDatePicker && (
        <DatePickerModal
          initialDate={entryDateKey}
          onClose={() => setShowDatePicker(false)}
          onSave={(d) => { updateDate(d); setShowDatePicker(false); }}
        />
      )}

      {showStartTimePicker && (
        <TimePickerModal
          initialHour={new Date(entry.startTime).getHours()}
          initialMinute={new Date(entry.startTime).getMinutes()}
          onClose={() => setShowStartTimePicker(false)}
          onSave={(h, m) => { updateStartTime(h, m); setShowStartTimePicker(false); }}
          onClear={() => setShowStartTimePicker(false)}
        />
      )}

      {showEndTimePicker && (
        <TimePickerModal
          initialHour={new Date(entry.endTime).getHours()}
          initialMinute={new Date(entry.endTime).getMinutes()}
          onClose={() => setShowEndTimePicker(false)}
          onSave={(h, m) => { updateEndTime(h, m); setShowEndTimePicker(false); }}
          onClear={() => setShowEndTimePicker(false)}
        />
      )}

      <ActivityPicker
        isOpen={showActivityPicker}
        onClose={() => setShowActivityPicker(false)}
        activities={activities}
        selectedId={entry.activityId}
        onSelect={(id) => handleActivityChange(id)}
        onCreate={async (name, color) => {
          const id = await addActivity({ name: name.trim(), color });
          onUpdate(entry.id, { activityId: id });
          setShowActivityPicker(false);
        }}
      />

      <TaskPicker
        isOpen={showTaskPicker}
        onClose={() => setShowTaskPicker(false)}
        lists={taskLists}
        tasks={tasks}
        onSelect={handleSelectTask}
      />

      {confirmDelete && (
        <div className="absolute inset-0 z-[1001] bg-black/40 flex items-center justify-center px-8" onClick={() => setConfirmDelete(false)}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl p-5 w-full max-[300px] shadow-xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-[16px] font-semibold text-[#333] m-0 mb-1">¿Eliminar registro?</p>
            <p className="text-[14px] text-[#999] m-0 mb-4">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2.5 rounded-xl text-[14px] font-semibold bg-[#f0f0f0] text-[#666] border-none cursor-pointer">Cancelar</button>
              <button onClick={() => { onDelete(entry.id); onClose(); }} className="flex-1 py-2.5 rounded-xl text-[14px] font-semibold bg-[#ff4d4d] text-white border-none cursor-pointer">Eliminar</button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

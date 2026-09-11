import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Activity, TimeEntry } from '../../types';
import { useSettings } from '../../context/SettingsContext';
import { useUserStorage } from '../../hooks/useUserStorage';
import { formatElapsed, dayLabel, todayKey } from '../../hooks/useTimeTracker';
import { DatePickerModal } from '../tareas/DatePickerModal';
import { ActivityPicker } from './ActivityPicker';

interface Props {
  entry: TimeEntry;
  onUpdate: (id: string, updates: Partial<TimeEntry>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function SessionDetailModal({ entry, onUpdate, onDelete, onClose }: Props) {
  const { settings } = useSettings();
  const [activities, setActivities] = useUserStorage<Activity[]>('tracker-activities', []);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showActivityPicker, setShowActivityPicker] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const activity = activities.find((a) => a.id === entry.activityId);

  const fmtFullDate = (epoch: number) => {
    return new Date(epoch).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const epochToTimeStr = (epoch: number) => {
    const d = new Date(epoch);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const updateStartTime = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    const newStart = new Date(entry.startedAt);
    newStart.setHours(h, m, 0, 0);
    const newStartedAt = newStart.getTime();
    const newSeconds = Math.max(0, Math.floor((entry.endedAt - newStartedAt) / 1000));
    onUpdate(entry.id, { startedAt: newStartedAt, seconds: newSeconds });
  };

  const updateEndTime = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    const newEnd = new Date(entry.endedAt);
    newEnd.setHours(h, m, 0, 0);
    const newEndedAt = newEnd.getTime();
    const newSeconds = Math.max(0, Math.floor((newEndedAt - entry.startedAt) / 1000));
    onUpdate(entry.id, { endedAt: newEndedAt, seconds: newSeconds });
  };

  const updateDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const newStart = new Date(entry.startedAt);
    newStart.setFullYear(y, m - 1, d);
    const newEnd = new Date(entry.endedAt);
    newEnd.setFullYear(y, m - 1, d);
    const newSeconds = Math.max(0, Math.floor((newEnd.getTime() - newStart.getTime()) / 1000));
    onUpdate(entry.id, { startedAt: newStart.getTime(), endedAt: newEnd.getTime(), date: dateStr, seconds: newSeconds });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 320, damping: 30 }}
      className="absolute left-0 right-0 top-0 bottom-0 z-[1000] bg-white flex flex-col origin-top"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f0f5] shrink-0">
        <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors active:scale-90">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
        </button>
        <button onClick={() => setConfirmDelete(true)} className="text-[#ff4d4d] p-2.5 rounded-full hover:bg-[#fff5f5] transition-colors border-none bg-transparent cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
        </button>
      </div>

      {/* Contenido scrolleable */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-4">
        {/* Duración total */}
        <div className="text-center mb-6">
          <p className="text-[40px] font-bold text-[#333] tabular-nums m-0 leading-none">{formatElapsed(entry.seconds)}</p>
          <p className="text-[13px] text-[#999] uppercase tracking-wide mt-2 m-0 capitalize">{dayLabel(entry.date)}</p>
        </div>

        {/* Día y fecha */}
        <div className="border-b border-[#f0f0f5]">
          <div onClick={() => setShowDatePicker(true)} className="flex items-center gap-3 py-3 cursor-pointer">
            <span className="text-[#a0a0a0]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
            </span>
            <div className="flex-1">
              <p className="text-[15px] font-medium text-[#333] m-0 capitalize">{dayLabel(entry.date)}</p>
              <p className="text-[12px] text-[#999] m-0 capitalize">{fmtFullDate(entry.startedAt)}</p>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
          </div>
        </div>

        {/* Hora de inicio */}
        <div className="border-b border-[#f0f0f5]">
          <div className="flex items-center gap-3 py-3">
            <span className="text-[#a0a0a0]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2" /><path d="M9 2h6" /><path d="M12 5V2" /></svg>
            </span>
            <span className="flex-1 text-[15px] text-[#555]">Hora de inicio</span>
            <input
              type="time"
              value={epochToTimeStr(entry.startedAt)}
              onChange={(e) => updateStartTime(e.target.value)}
              className="text-[15px] font-medium text-[#333] tabular-nums bg-transparent border-none outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* Hora de fin */}
        <div className="border-b border-[#f0f0f5]">
          <div className="flex items-center gap-3 py-3">
            <span className="text-[#a0a0a0]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2" /><path d="M9 2h6" /><path d="M12 5V2" /></svg>
            </span>
            <span className="flex-1 text-[15px] text-[#555]">Hora de fin</span>
            <input
              type="time"
              value={epochToTimeStr(entry.endedAt)}
              onChange={(e) => updateEndTime(e.target.value)}
              className="text-[15px] font-medium text-[#333] tabular-nums bg-transparent border-none outline-none cursor-pointer"
            />
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

        {/* Descripción */}
        <div className="border-b border-[#f0f0f5]">
          <div className="flex items-center gap-3 py-3">
            <span className="text-[#a0a0a0]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
            </span>
            <input
              type="text"
              value={entry.description}
              onChange={(e) => onUpdate(entry.id, { description: e.target.value })}
              placeholder="Sin descripción"
              className="flex-1 text-[15px] text-[#333] bg-transparent border-none outline-none placeholder-[#bbb]"
            />
          </div>
        </div>

        {/* Notas */}
        <div className="border-b border-[#f0f0f5]">
          <div className="flex items-start gap-3 py-3">
            <span className="text-[#a0a0a0] mt-1">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
            </span>
            <textarea
              value={entry.notes}
              onChange={(e) => onUpdate(entry.id, { notes: e.target.value })}
              placeholder="Añadir notas..."
              rows={2}
              className="flex-1 text-[15px] text-[#333] bg-transparent border-none outline-none resize-none placeholder-[#bbb]"
            />
          </div>
        </div>

        <div className="min-h-[60px]" />
      </div>

      {/* DatePickerModal */}
      {showDatePicker && (
        <DatePickerModal
          initialDate={entry.date}
          onClose={() => setShowDatePicker(false)}
          onSave={(d) => { updateDate(d); setShowDatePicker(false); }}
        />
      )}

      {/* ActivityPicker */}
      <ActivityPicker
        isOpen={showActivityPicker}
        onClose={() => setShowActivityPicker(false)}
        activities={activities}
        selectedId={entry.activityId}
        onSelect={(id) => { onUpdate(entry.id, { activityId: id }); setShowActivityPicker(false); }}
        onCreate={(name, color) => {
          const id = `act-${Date.now()}`;
          setActivities((prev) => [...prev, { id, name: name.trim(), color }]);
          onUpdate(entry.id, { activityId: id });
          setShowActivityPicker(false);
        }}
      />

      {/* Confirmar eliminación */}
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

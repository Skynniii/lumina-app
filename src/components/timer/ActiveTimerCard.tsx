import { useState } from 'react';
import { motion } from 'framer-motion';
import { formatElapsed, type RunningTimer, type TrackerDraft } from '../../hooks/useTimeTracker';
import { ActivityPicker } from './ActivityPicker';
import type { Activity } from '../../types';

interface Props {
  running: RunningTimer | null;
  elapsed: number;
  draft: TrackerDraft;
  activities: Activity[];
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onDescriptionChange: (v: string) => void;
  onActivityChange: (id: string) => void;
  onCreateActivity: (name: string, color: string) => string;
}

export function ActiveTimerCard({
  running,
  elapsed,
  draft,
  activities,
  onStart,
  onPause,
  onResume,
  onStop,
  onDescriptionChange,
  onActivityChange,
  onCreateActivity,
}: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const activity = activities.find((a) => a.id === draft.activityId);
  const isPaused = running !== null && running.startedAt === null;
  const isTicking = running !== null && running.startedAt !== null;

  const handleCreate = (name: string, color: string) => {
    const id = onCreateActivity(name, color);
    onActivityChange(id);
    setPickerOpen(false);
  };

  return (
    <div className="bg-white p-5 rounded-[24px] shadow-[6px_6px_12px_#e6e6e6,-6px_-6px_12px_#ffffff] flex flex-col gap-4">
      {/* Selector de actividad */}
      <button
        onClick={() => setPickerOpen(true)}
        className="self-start flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#f7f6f9] shadow-[inset_2px_2px_5px_#e6e6e6,inset_-2px_-2px_5px_#ffffff] border-none cursor-pointer active:scale-95 transition-transform"
      >
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: activity?.color ?? '#bbb' }} />
        <span className="text-[13px] font-semibold text-[#555]">{activity?.name ?? 'Seleccionar'}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* Descripción */}
      <input
        type="text"
        value={draft.description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        placeholder="¿En qué estás trabajando?"
        className="w-full bg-[#f7f6f9] rounded-2xl px-4 py-3 text-[15px] text-[#333] placeholder:text-[#aaa] outline-none shadow-[inset_2px_2px_5px_#e6e6e6,inset_-2px_-2px_5px_#ffffff] focus:shadow-[inset_1px_1px_3px_#d9d9ff,inset_-1px_-1px_3px_#ffffff] transition-shadow"
      />

      {/* Tiempo transcurrido */}
      <div className="flex items-center justify-center gap-2 py-1">
        {isTicking && (
          <motion.span
            className="w-2 h-2 rounded-full bg-[#34c77b] mt-2"
            animate={{ opacity: [1, 0.25, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          />
        )}
        <motion.span
          key={running ? 'live' : 'idle'}
          className="text-[40px] font-bold text-[#333] tabular-nums tracking-tight leading-none"
          animate={isTicking ? { scale: [1, 1.015, 1] } : {}}
          transition={isTicking ? { repeat: Infinity, duration: 2, ease: 'easeInOut' } : {}}
        >
          {formatElapsed(elapsed)}
        </motion.span>
      </div>

      {/* Controles */}
      <div className="flex items-center justify-center gap-6 pt-1">
        {!running && (
          <motion.button
            onClick={onStart}
            whileTap={{ scale: 0.88 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            aria-label="Iniciar"
            className="w-[64px] h-[64px] rounded-full bg-gradient-to-br from-[#7f70ff] to-[#9d8aff] border-none cursor-pointer flex items-center justify-center shadow-[0_6px_16px_rgba(127,112,255,0.35)]"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="white" className="ml-1">
              <path d="M8 5v14l11-7z" />
            </svg>
          </motion.button>
        )}

        {running && (
          <>
            <motion.button
              onClick={isPaused ? onResume : onPause}
              whileTap={{ scale: 0.88 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              aria-label={isPaused ? 'Reanudar' : 'Pausar'}
              className="w-[64px] h-[64px] rounded-full bg-white border-none cursor-pointer flex items-center justify-center shadow-[4px_4px_10px_#e6e6e6,-4px_-4px_10px_#ffffff] active:shadow-[inset_2px_2px_6px_#e6e6e6,inset_-2px_-2px_6px_#ffffff] transition-shadow"
            >
              {isPaused ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#7f70ff" className="ml-1">
                  <path d="M8 5v14l11-7z" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#7f70ff">
                  <rect x="6" y="5" width="4" height="14" rx="1.5" />
                  <rect x="14" y="5" width="4" height="14" rx="1.5" />
                </svg>
              )}
            </motion.button>

            <motion.button
              onClick={onStop}
              whileTap={{ scale: 0.88 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              aria-label="Detener y guardar"
              className="w-[64px] h-[64px] rounded-full bg-white border-none cursor-pointer flex items-center justify-center shadow-[4px_4px_10px_#e6e6e6,-4px_-4px_10px_#ffffff] active:shadow-[inset_2px_2px_6px_#e6e6e6,inset_-2px_-2px_6px_#ffffff] transition-shadow"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#ff6b81">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </motion.button>
          </>
        )}
      </div>

      <ActivityPicker
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        activities={activities}
        selectedId={draft.activityId}
        onSelect={(id) => {
          onActivityChange(id);
          setPickerOpen(false);
        }}
        onCreate={handleCreate}
      />
    </div>
  );
}

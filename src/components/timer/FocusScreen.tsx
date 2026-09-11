import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatElapsed } from '../../hooks/useTimeTracker';
import type { TimerMode } from '../../hooks/useCountdownTimer';
import type { ActiveTimerCardProps } from './ActiveTimerCard';
import { ActivityPicker } from './ActivityPicker';
import { FocusRing } from './FocusRing';
import { TaskPicker } from './TaskPicker';
import { CustomDurationModal } from './CustomDurationModal';
import { DatePickerModal } from '../tareas/DatePickerModal';
import { TimePickerModal } from '../tareas/TimePickerModal';
import { useSettings } from '../../context/SettingsContext';
import { useUserStorage } from '../../hooks/useUserStorage';
import type { Task, TaskList } from '../../types';

interface Props extends ActiveTimerCardProps {
  onBack: () => void;
  taskLists: TaskList[];
  tasks: Task[];
  onNotesChange: (v: string) => void;
  onDiscard: () => void;
  onSaveSession: (completeTask: boolean, taskId?: string) => void;
}

const MODE_LABELS: Record<TimerMode, string> = {
  rastreador: 'Rastreador',
  temporizador: 'Temporizador',
  pomodoro: 'Pomodoro',
};

export function FocusScreen({ onBack, taskLists, tasks, onNotesChange, onDiscard, onSaveSession, ...props }: Props) {
  const { mode, onModeChange, countdown, pomodoroPhase, pomodoroCycle, onPomodoroSkip } = props;
  const { settings, update } = useSettings();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [taskPickerOpen, setTaskPickerOpen] = useState(false);
  const [modeDropdownOpen, setModeDropdownOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdIntervalRef = useRef<number | null>(null);
  const isHoldingRef = useRef(false);
  const [customDurations, setCustomDurations] = useUserStorage<number[]>('timer-custom-durations', [25, 45, 60]);
  const [showCustomDuration, setShowCustomDuration] = useState(false);

  const formatDurationLabel = (min: number) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    if (h > 0 && m > 0) return `${h}hr ${m}min`;
    if (h > 0) return `${h}hr`;
    return `${m} min`;
  };

  const activity = props.activities.find((a) => a.id === props.draft.activityId);
  const isPaused = props.running !== null && props.running.startedAt === null;
  const isTicking = props.running !== null && props.running.startedAt !== null;

  const hasStarted = mode === 'rastreador' ? props.running !== null : countdown.remaining < countdown.targetSeconds;
  const isRunning = mode === 'rastreador' ? isTicking : countdown.running;
  const isActive = isRunning;

  const progress = mode === 'rastreador' ? 0 : (countdown.targetSeconds > 0 ? countdown.remaining / countdown.targetSeconds : 0);
  const ringColor = mode === 'pomodoro' ? (pomodoroPhase === 'work' ? '#7f70ff' : '#34c77b') : '#7f70ff';
  const elapsedCount = mode === 'rastreador' ? props.elapsed : (countdown.targetSeconds - countdown.remaining);
  const timeDisplay = mode === 'temporizador' ? formatElapsed(countdown.remaining) : formatElapsed(elapsedCount);
  const statusLabel = !hasStarted ? 'Listo' : (isRunning ? 'En curso' : 'Pausado');

  const handleCenterButton = () => {
    if (mode === 'rastreador') {
      if (!hasStarted) props.onStart();
      else if (isTicking) props.onPause();
      else props.onResume();
    } else {
      if (!hasStarted) countdown.start();
      else if (countdown.running) countdown.pause();
      else countdown.start();
    }
  };

  const handleXClick = () => {
    if (hasStarted) setShowConfirm(true);
    else onBack();
  };

  const handleSelectTask = (task: Task) => {
    setSelectedTask(task);
    props.onDescriptionChange(task.text);
    if (task.activityId) props.onActivityChange(task.activityId);
    const plainNotes = task.notes ? task.notes.replace(/<[^>]*>/g, '').trim() : '';
    onNotesChange(plainNotes);
  };

  const handleCustomDuration = (hours: number, minutes: number) => {
    const totalMin = hours * 60 + minutes;
    if (totalMin > 0) {
      setCustomDurations((prev) => [totalMin, ...prev.filter((m) => m !== totalMin)].slice(0, 3));
      countdown.setTarget(totalMin);
    }
  };

  // --- Long press checkmark ---
  const handleCheckPointerDown = () => {
    if (!hasStarted) { onSaveSession(false); return; }
    isHoldingRef.current = false;
    let p = 0;
    holdIntervalRef.current = window.setInterval(() => {
      p = Math.min(1, p + 0.022);
      setHoldProgress(p);
      if (p >= 0.12) isHoldingRef.current = true;
      if (p >= 1) {
        if (holdIntervalRef.current) { clearInterval(holdIntervalRef.current); holdIntervalRef.current = null; }
        onSaveSession(true, selectedTask?.id ?? props.draft.taskId);
        setHoldProgress(0);
      }
    }, 50);
  };

  const handleCheckPointerEnd = () => {
    if (holdIntervalRef.current) { clearInterval(holdIntervalRef.current); holdIntervalRef.current = null; }
    if (!isHoldingRef.current && holdProgress < 0.12) onSaveSession(false);
    setHoldProgress(0);
  };

  const checkSize = 56;
  const checkRadius = (checkSize - 6) / 2;
  const checkCircumference = 2 * Math.PI * checkRadius;

  return (
    <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="fixed inset-0 z-[9999] flex flex-col bg-white">
      {/* === Barra superior === */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3 shrink-0">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors active:scale-90">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
        </button>
        <div className="relative">
          {!hasStarted ? (
            <button onClick={() => setModeDropdownOpen(!modeDropdownOpen)} className="flex items-center gap-1.5 px-4 py-2 rounded-full hover:bg-black/5 transition-colors">
              <span className="text-[16px] font-bold text-[#333]">{MODE_LABELS[mode]}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${modeDropdownOpen ? 'rotate-180' : ''}`}><path d="M6 9l6 6 6-6" /></svg>
            </button>
          ) : (
            <div className="w-[80px]" />
          )}
          <AnimatePresence>
            {modeDropdownOpen && (
              <>
                <div className="fixed inset-0 z-[100]" onClick={() => setModeDropdownOpen(false)} />
                <motion.div initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.95 }} transition={{ duration: 0.15 }} className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.15)] border border-[#f0f0f0] py-1 w-[180px] z-[101]">
                  {(['rastreador', 'temporizador', 'pomodoro'] as TimerMode[]).map((m) => (
                    <button key={m} onClick={() => { onModeChange(m); setModeDropdownOpen(false); }} className={`w-full flex items-center justify-between px-4 py-2.5 text-[15px] border-none cursor-pointer transition-colors ${m === mode ? 'text-[#7f70ff] font-bold bg-[#f0edff]' : 'text-[#555] hover:bg-[#f8f9fa]'}`}>
                      {MODE_LABELS[m]}
                      {m === mode && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7f70ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
        <div className="relative">
          <button onClick={() => setSettingsOpen(!settingsOpen)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors active:scale-90">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
          </button>
          <AnimatePresence>
            {settingsOpen && (
              <>
                <div className="fixed inset-0 z-[100]" onClick={() => setSettingsOpen(false)} />
                <motion.div initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.95 }} transition={{ duration: 0.15 }} className="absolute top-full right-0 mt-1 bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.15)] border border-[#f0f0f0] py-2 w-[220px] z-[101]">
                  {mode === 'pomodoro' && (
                    <>
                      <button onClick={() => { onPomodoroSkip(); setSettingsOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-[14px] text-[#555] hover:bg-[#f8f9fa] transition-colors border-none bg-transparent cursor-pointer">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 4 15 12 5 20 5 4" /><line x1="19" y1="5" x2="19" y2="19" /></svg>
                        Saltar fase
                      </button>
                      <div className="h-px bg-[#f0f0f0] mx-4 my-1" />
                    </>
                  )}
                  <p className="px-4 py-1 text-[11px] font-bold uppercase tracking-wide text-[#999] m-0">Configuración</p>
                  {[{ key: 'sounds' as const, label: 'Sonidos' }, { key: 'notifications' as const, label: 'Notificaciones' }].map((item) => (
                    <button key={item.key} onClick={() => update(item.key, !settings[item.key])} className="w-full flex items-center justify-between px-4 py-2.5 text-[14px] text-[#555] hover:bg-[#f8f9fa] transition-colors border-none bg-transparent cursor-pointer">
                      <span>{item.label}</span>
                      <span className={`w-9 h-5 rounded-full transition-colors ${settings[item.key] ? 'bg-[#7f70ff]' : 'bg-[#e0e0e0]'}`}>
                        <span className={`block w-4 h-4 bg-white rounded-full shadow-sm transition-transform mt-0.5 ${settings[item.key] ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </span>
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* === Contenido scrolleable === */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-5">
        {/* Anillo */}
        <div className="flex flex-col items-center py-4">
          <div className="relative flex items-center justify-center">
            <motion.div className="absolute w-[260px] h-[260px] rounded-full bg-[#7f70ff]/5 blur-[50px]" animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }} />
            <motion.div animate={isActive ? { scale: [1, 1.01, 1] } : {}} transition={isActive ? { repeat: Infinity, duration: 3, ease: 'easeInOut' } : {}}>
              <FocusRing progress={progress} color={ringColor} size={200} stroke={7} trackColor="#e8e6f0" isStatic={mode === 'rastreador'}>
                <div className="flex flex-col items-center gap-1">
                  {isActive && <motion.span className="w-2 h-2 rounded-full bg-[#34c77b] mb-1" animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }} />}
                  <motion.span key={timeDisplay} className="text-[36px] font-bold text-[#333] tabular-nums tracking-tight leading-none" animate={isActive ? { scale: [1, 1.02, 1] } : {}} transition={isActive ? { repeat: Infinity, duration: 2, ease: 'easeInOut' } : {}}>{timeDisplay}</motion.span>
                  <span className="text-[11px] text-[#999] uppercase tracking-wide mt-0.5">{statusLabel}</span>
                </div>
              </FocusRing>
            </motion.div>
          </div>

          {mode === 'pomodoro' && (
            <div className="flex items-center gap-2 mt-3">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: pomodoroPhase === 'work' ? '#7f70ff' : '#34c77b' }} />
              <span className="text-[13px] font-bold uppercase tracking-wide" style={{ color: pomodoroPhase === 'work' ? '#7f70ff' : '#34c77b' }}>{pomodoroPhase === 'work' ? 'Trabajo' : 'Descanso'}</span>
              <span className="text-[11px] text-[#b0b0b0]">· Ciclo {pomodoroCycle}</span>
            </div>
          )}

          {/* Presets de temporizador */}
          {mode === 'temporizador' && (
            <div className="flex gap-2 mt-4 flex-wrap justify-center max-w-[320px]">
              {customDurations
                .filter((min) => !hasStarted || countdown.targetSeconds === min * 60)
                .map((min) => (
                  <button key={min} onClick={() => countdown.setTarget(min)} className={`px-3.5 py-1.5 rounded-full text-[13px] font-semibold border-none cursor-pointer transition-colors ${countdown.targetSeconds === min * 60 ? 'bg-[#7f70ff] text-white shadow-[2px_4px_10px_rgba(127,112,255,0.2)]' : 'bg-[#f7f6f9] text-[#777] shadow-[inset_2px_2px_5px_#e6e6e6,inset_-2px_-2px_5px_#ffffff]'}`}>{formatDurationLabel(min)}</button>
                ))}
              {!hasStarted && (
                <button onClick={() => setShowCustomDuration(true)} className="px-3.5 py-1.5 rounded-full text-[13px] font-semibold bg-[#f7f6f9] text-[#777] shadow-[inset_2px_2px_5px_#e6e6e6,inset_-2px_-2px_5px_#ffffff] border-none cursor-pointer transition-colors">Personalizado</button>
              )}
            </div>
          )}
        </div>

        {/* Información de la sesión */}
        <div className="max-w-[340px] mx-auto pb-28">
          {/* Header con "Tasks" a la derecha */}
          <div className="flex items-center justify-between mb-1">
            <p className="text-[12px] font-bold uppercase tracking-wide text-[#999] m-0">Información de la sesión</p>
            <button onClick={() => setTaskPickerOpen(true)} className="flex items-center gap-1 text-[#7f70ff] bg-transparent border-none cursor-pointer">
              <span className="text-[13px] font-semibold">Tasks</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" /></svg>
            </button>
          </div>

          {/* Fecha y hora */}
          <div className="border-b border-[#f0f0f5]">
            <div className="flex items-center gap-3 py-3">
              <span className="text-[#a0a0a0]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
              </span>
              <button onClick={() => setShowDatePicker(true)} className="text-[15px] font-medium text-[#333] capitalize bg-transparent border-none cursor-pointer">
                {(() => {
                  const ms = mode === 'rastreador' && props.running ? props.running.sessionStart : Date.now() - elapsedCount * 1000;
                  return new Date(ms).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' });
                })()}
              </button>
              <div className="flex-1" />
              <button onClick={() => setShowStartTimePicker(true)} className="text-[15px] font-medium text-[#333] tabular-nums bg-transparent border-none cursor-pointer">
                {(() => {
                  const is12h = settings.timeFormat !== '24h';
                  if (mode === 'rastreador') {
                    if (!props.running) return '--:--';
                    const startMs = props.running.sessionStart;
                    const startStr = new Date(startMs).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: is12h });
                    return startStr;
                  }
                  const now = Date.now();
                  const startMs = now - elapsedCount * 1000;
                  const endMs = now + countdown.remaining * 1000;
                  const startStr = new Date(startMs).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: is12h });
                  const endStr = new Date(endMs).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: is12h });
                  return `${startStr} – ${endStr}`;
                })()}
              </button>
            </div>
          </div>

          {/* Descripción */}
          <div className="border-b border-[#f0f0f5]">
            <div className="flex items-center gap-3 py-3">
              <span className="text-[#a0a0a0]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
              </span>
              <input type="text" value={props.draft.description} onChange={(e) => props.onDescriptionChange(e.target.value)} placeholder="¿Qué estás haciendo?" className="flex-1 bg-transparent outline-none border-none text-[15px] text-[#333] placeholder:text-[#aaa]" />
            </div>
          </div>

          {/* Actividad */}
          <div className="border-b border-[#f0f0f5]">
            <button onClick={() => setPickerOpen(true)} className="flex items-center gap-3 py-3 w-full bg-transparent border-none cursor-pointer">
              {!activity && (
                <span className="text-[#a0a0a0]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>
                </span>
              )}
              {activity && <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: activity.color }} />}
              <span className={`flex-1 text-left text-[15px] ${activity ? 'text-[#333]' : 'text-[#aaa]'}`}>{activity?.name ?? 'Seleccionar actividad'}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
            </button>
          </div>

          {/* Notas */}
          <div className="border-b border-[#f0f0f5]">
            <div className="flex items-start gap-3 py-3">
              <span className="text-[#a0a0a0] mt-0.5">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
              </span>
              <textarea value={props.draft.notes} onChange={(e) => onNotesChange(e.target.value)} placeholder="Notas" rows={1} className="flex-1 bg-transparent outline-none border-none resize-none text-[15px] text-[#333] placeholder:text-[#aaa] min-h-[24px]" />
            </div>
          </div>
        </div>
      </div>

      {/* === Botones flotantes inferiores === */}
      <div className="flex items-center justify-center gap-10 pb-8 pt-2 shrink-0">
        {hasStarted ? (
          <motion.button onClick={handleXClick} whileTap={{ scale: 0.88 }} transition={{ type: 'spring', stiffness: 500, damping: 25 }} className="w-[52px] h-[52px] rounded-full bg-white border-none cursor-pointer flex items-center justify-center shadow-[4px_4px_10px_#e6e6e6,-4px_-4px_10px_#ffffff] active:shadow-[inset_2px_2px_5px_#e6e6e6,inset_-2px_-2px_5px_#ffffff] transition-shadow">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ff6b81" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </motion.button>
        ) : <div className="w-[52px]" />}

        <motion.button onClick={handleCenterButton} whileTap={{ scale: 0.88 }} transition={{ type: 'spring', stiffness: 500, damping: 25 }} className="w-[68px] h-[68px] rounded-full bg-gradient-to-br from-[#7f70ff] to-[#9d8aff] border-none cursor-pointer flex items-center justify-center shadow-[0_6px_16px_rgba(127,112,255,0.35)]">
          {!hasStarted || (!isRunning && hasStarted) ? (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white" className="ml-1"><path d="M8 5v14l11-7z" /></svg>
          ) : (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="white"><rect x="6" y="5" width="4" height="14" rx="1.5" /><rect x="14" y="5" width="4" height="14" rx="1.5" /></svg>
          )}
        </motion.button>

        {hasStarted ? (
          <div className="relative" style={{ width: checkSize, height: checkSize }}>
            <svg className="absolute inset-0 -rotate-90 pointer-events-none" width={checkSize} height={checkSize}>
              <circle cx={checkSize / 2} cy={checkSize / 2} r={checkRadius} fill="none" stroke="#34c77b" strokeWidth="3" strokeDasharray={checkCircumference} strokeDashoffset={checkCircumference * (1 - holdProgress)} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.05s linear' }} />
            </svg>
            <motion.button onPointerDown={handleCheckPointerDown} onPointerUp={handleCheckPointerEnd} onPointerLeave={handleCheckPointerEnd} whileTap={{ scale: 0.92 }} transition={{ type: 'spring', stiffness: 500, damping: 25 }} className="absolute inset-[3px] rounded-full bg-white border-none cursor-pointer flex items-center justify-center shadow-[4px_4px_10px_#e6e6e6,-4px_-4px_10px_#ffffff] active:shadow-[inset_2px_2px_5px_#e6e6e6,inset_-2px_-2px_5px_#ffffff] transition-shadow touch-none">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#34c77b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </motion.button>
          </div>
        ) : <div className="w-[56px]" />}
      </div>

      {/* Confirmación de descarte */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-[10002] flex items-center justify-center" onClick={() => setShowConfirm(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-2xl p-5 max-w-[280px] mx-5" onClick={(e) => e.stopPropagation()}>
              <p className="text-[16px] font-semibold text-[#333] m-0 mb-1">¿Descartar sesión?</p>
              <p className="text-[14px] text-[#999] m-0 mb-4">Se perderá el tiempo registrado.</p>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowConfirm(false)} className="px-4 py-2 rounded-xl text-[14px] font-semibold text-[#777] bg-[#f7f6f9] border-none cursor-pointer">Cancelar</button>
                <button onClick={() => { setShowConfirm(false); onDiscard(); }} className="px-4 py-2 rounded-xl text-[14px] font-semibold text-white bg-[#ff6b81] border-none cursor-pointer">Descartar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Date picker */}
      {showDatePicker && mode === 'rastreador' && props.running && (
        <DatePickerModal
          initialDate={new Date(props.running.sessionStart).toISOString().slice(0, 10)}
          onClose={() => setShowDatePicker(false)}
          onSave={(d) => {
            const [y, m, day] = d.split('-').map(Number);
            const newDate = new Date(props.running!.sessionStart);
            newDate.setFullYear(y, m - 1, day);
            props.onSetStartTime?.(newDate.getTime());
            setShowDatePicker(false);
          }}
        />
      )}

      {/* Start time picker */}
      {showStartTimePicker && (
        <TimePickerModal
          initialHour={(() => {
            if (mode === 'rastreador' && props.running) return new Date(props.running.sessionStart).getHours();
            return new Date(Date.now() - elapsedCount * 1000).getHours();
          })()}
          initialMinute={(() => {
            if (mode === 'rastreador' && props.running) return new Date(props.running.sessionStart).getMinutes();
            return new Date(Date.now() - elapsedCount * 1000).getMinutes();
          })()}
          onClose={() => setShowStartTimePicker(false)}
          onSave={(h, m) => {
            if (mode === 'rastreador' && props.running) {
              const newStart = new Date(props.running.sessionStart);
              newStart.setHours(parseInt(h), parseInt(m), 0, 0);
              props.onSetStartTime?.(newStart.getTime());
            }
            setShowStartTimePicker(false);
          }}
          onClear={() => setShowStartTimePicker(false)}
        />
      )}

      <ActivityPicker isOpen={pickerOpen} onClose={() => setPickerOpen(false)} activities={props.activities} selectedId={props.draft.activityId} onSelect={(id) => { props.onActivityChange(id); setPickerOpen(false); }} onCreate={(name, color) => { const id = props.onCreateActivity(name, color); props.onActivityChange(id); setPickerOpen(false); }} />
      <TaskPicker isOpen={taskPickerOpen} onClose={() => setTaskPickerOpen(false)} lists={taskLists} tasks={tasks} onSelect={handleSelectTask} />
      <CustomDurationModal isOpen={showCustomDuration} onClose={() => setShowCustomDuration(false)} onSave={handleCustomDuration} />
    </motion.div>
  );
}

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatElapsed } from '../../hooks/useTimeTracker';
import type { TimerMode } from '../../hooks/useCountdownTimer';
import type { ActiveTimerCardProps } from './ActiveTimerCard';
import { ActivityPicker } from './ActivityPicker';
import { TimerModeSelector } from './TimerModeSelector';
import { FocusRing } from './FocusRing';
import { TaskPicker } from './TaskPicker';
import { useSettings } from '../../context/SettingsContext';
import type { Task, TaskList } from '../../types';

interface Props extends ActiveTimerCardProps {
  onBack: () => void;
  taskLists: TaskList[];
  tasks: Task[];
}

const PRESETS = [5, 10, 15, 25, 30];

export function FocusScreen({ onBack, taskLists, tasks, ...props }: Props) {
  const { mode, onModeChange, countdown, pomodoroPhase, pomodoroCycle, onPomodoroSkip } = props;
  const { settings, update } = useSettings();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [taskPickerOpen, setTaskPickerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const activity = props.activities.find((a) => a.id === props.draft.activityId);
  const isPaused = props.running !== null && props.running.startedAt === null;
  const isTicking = props.running !== null && props.running.startedAt !== null;

  // Ring progress (solo countdown modes)
  const progress = mode === 'rastreador' ? 0 : (countdown.targetSeconds > 0 ? countdown.remaining / countdown.targetSeconds : 0);
  const ringColor = mode === 'pomodoro' ? (pomodoroPhase === 'work' ? '#7f70ff' : '#34c77b') : '#7f70ff';

  // Tiempo transcurcido (conteo ascendente para todos los modos)
  const elapsedCount = mode === 'rastreador' ? props.elapsed : (countdown.targetSeconds - countdown.remaining);
  const timeDisplay = formatElapsed(elapsedCount);

  const isCdRunning = countdown.running;
  const isCdPaused = !countdown.running && countdown.remaining > 0 && countdown.remaining < countdown.targetSeconds;
  const isActive = isTicking || isCdRunning;
  const statusLabel = mode === 'rastreador'
    ? (props.running ? (isPaused ? 'Pausado' : 'En curso') : 'Listo')
    : (isCdRunning ? 'En curso' : (isCdPaused ? 'Pausado' : 'Listo'));

  const handleSelectTask = (task: Task) => {
    setSelectedTask(task);
    props.onDescriptionChange(task.text);
  };

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed inset-0 z-[9999] flex flex-col bg-white"
    >
      {/* Barra superior */}
      <div className="flex items-center justify-between px-5 pt-5 pb-2 shrink-0 relative">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors active:scale-90">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
        </button>
        <div className="relative">
          <button onClick={() => setMenuOpen(!menuOpen)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors active:scale-90">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#555"><circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" /></svg>
          </button>
          <AnimatePresence>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-[100]" onClick={() => setMenuOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-12 right-0 bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.15)] py-2 w-[200px] z-[101] overflow-hidden border border-[#f0f0f0]"
                >
                  <p className="px-4 py-1.5 text-[11px] font-bold uppercase tracking-wide text-[#999] m-0">Configuración</p>
                  {([
                    { key: 'sounds' as const, label: 'Sonidos' },
                    { key: 'notifications' as const, label: 'Notificaciones' },
                  ]).map((item) => (
                    <button
                      key={item.key}
                      onClick={() => update(item.key, !settings[item.key])}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-[14px] text-[#555] hover:bg-[#f8f9fa] transition-colors border-none bg-transparent cursor-pointer"
                    >
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

      {/* Selector de modo fijo */}
      <div className="px-5 pb-2 shrink-0">
        <TimerModeSelector mode={mode} onChange={onModeChange} />
      </div>

      {/* Contenido scrolleable */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-10">
        <div className="flex flex-col items-center gap-5 min-h-full justify-center py-4">
          {/* Actividad + texto + tarea (TODOS los modos) */}
          <div className="w-full max-w-[340px] flex flex-col gap-3">
            <button
              onClick={() => setPickerOpen(true)}
              className="self-start flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#f7f6f9] shadow-[inset_2px_2px_5px_#e6e6e6,inset_-2px_-2px_5px_#ffffff] border-none cursor-pointer active:scale-95 transition-transform"
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: activity?.color ?? '#bbb' }} />
              <span className="text-[13px] font-semibold text-[#555]">{activity?.name ?? 'Actividad'}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
            </button>

            <input
              type="text"
              value={props.draft.description}
              onChange={(e) => props.onDescriptionChange(e.target.value)}
              placeholder="¿En qué estás trabajando?"
              className="w-full bg-[#f7f6f9] rounded-2xl px-4 py-3 text-[15px] text-[#333] placeholder:text-[#aaa] outline-none shadow-[inset_2px_2px_5px_#e6e6e6,inset_-2px_-2px_5px_#ffffff] focus:shadow-[inset_1px_1px_3px_#d9d9ff,inset_-1px_-1px_3px_#ffffff] transition-shadow"
            />

            <button
              onClick={() => setTaskPickerOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#f7f6f9] shadow-[inset_2px_2px_5px_#e6e6e6,inset_-2px_-2px_5px_#ffffff] border-none cursor-pointer active:scale-95 transition-transform self-start"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7f70ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
              <span className="text-[13px] font-semibold text-[#555] truncate max-w-[180px]">{selectedTask ? selectedTask.text : 'Tarea'}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
            </button>
          </div>

          {/* Indicador de fase pomodoro */}
          {mode === 'pomodoro' && (
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: pomodoroPhase === 'work' ? '#7f70ff' : '#34c77b' }} />
              <span className="text-[14px] font-bold uppercase tracking-wide" style={{ color: pomodoroPhase === 'work' ? '#7f70ff' : '#34c77b' }}>{pomodoroPhase === 'work' ? 'Trabajo' : 'Descanso'}</span>
              <span className="text-[12px] text-[#b0b0b0]">· Ciclo {pomodoroCycle}</span>
            </div>
          )}

          {/* Glow + Anillo */}
          <div className="relative flex items-center justify-center">
            <motion.div
              className="absolute w-[280px] h-[280px] rounded-full bg-[#7f70ff]/5 blur-[50px]"
              animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            />
            <motion.div
              animate={isActive ? { scale: [1, 1.01, 1] } : {}}
              transition={isActive ? { repeat: Infinity, duration: 3, ease: 'easeInOut' } : {}}
            >
              <FocusRing
                progress={progress}
                color={ringColor}
                size={220}
                stroke={8}
                trackColor="#e8e6f0"
                isStatic={mode === 'rastreador'}
              >
                <div className="flex flex-col items-center gap-1">
                  {isActive && (
                    <motion.span
                      className="w-2 h-2 rounded-full bg-[#34c77b] mb-1"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                    />
                  )}
                  <motion.span
                    key={timeDisplay}
                    className="text-[40px] font-bold text-[#333] tabular-nums tracking-tight leading-none"
                    animate={isActive ? { scale: [1, 1.02, 1] } : {}}
                    transition={isActive ? { repeat: Infinity, duration: 2, ease: 'easeInOut' } : {}}
                  >
                    {timeDisplay}
                  </motion.span>
                  <span className="text-[12px] text-[#999] uppercase tracking-wide mt-1">{statusLabel}</span>
                </div>
              </FocusRing>
            </motion.div>
          </div>

          {/* Presets temporizador */}
          {mode === 'temporizador' && (
            <div className="flex gap-2 flex-wrap justify-center max-w-[340px]">
              {PRESETS.map((min) => (
                <button
                  key={min}
                  onClick={() => countdown.setTarget(min)}
                  className={`px-3.5 py-1.5 rounded-full text-[13px] font-semibold border-none cursor-pointer transition-colors ${
                    countdown.targetSeconds === min * 60
                      ? 'bg-[#7f70ff] text-white shadow-[2px_4px_10px_rgba(127,112,255,0.2)]'
                      : 'bg-[#f7f6f9] text-[#777] shadow-[inset_2px_2px_5px_#e6e6e6,inset_-2px_-2px_5px_#ffffff]'
                  }`}
                >
                  {min} min
                </button>
              ))}
            </div>
          )}

          {/* Controles */}
          <div className="flex items-center justify-center gap-6">
            {mode === 'rastreador' && (
              <>
                {!props.running && (
                  <motion.button onClick={props.onStart} whileTap={{ scale: 0.88 }} transition={{ type: 'spring', stiffness: 500, damping: 25 }} className="w-[64px] h-[64px] rounded-full bg-gradient-to-br from-[#7f70ff] to-[#9d8aff] border-none cursor-pointer flex items-center justify-center shadow-[0_6px_16px_rgba(127,112,255,0.35)]">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="white" className="ml-1"><path d="M8 5v14l11-7z" /></svg>
                  </motion.button>
                )}
                {props.running && (
                  <>
                    <motion.button onClick={isPaused ? props.onResume : props.onPause} whileTap={{ scale: 0.88 }} transition={{ type: 'spring', stiffness: 500, damping: 25 }} className="w-[60px] h-[60px] rounded-full bg-white border-none cursor-pointer flex items-center justify-center shadow-[4px_4px_10px_#e6e6e6,-4px_-4px_10px_#ffffff] active:shadow-[inset_2px_2px_6px_#e6e6e6,inset_-2px_-2px_6px_#ffffff] transition-shadow">
                      {isPaused ? <svg width="24" height="24" viewBox="0 0 24 24" fill="#7f70ff" className="ml-1"><path d="M8 5v14l11-7z" /></svg> : <svg width="24" height="24" viewBox="0 0 24 24" fill="#7f70ff"><rect x="6" y="5" width="4" height="14" rx="1.5" /><rect x="14" y="5" width="4" height="14" rx="1.5" /></svg>}
                    </motion.button>
                    <motion.button onClick={props.onStop} whileTap={{ scale: 0.88 }} transition={{ type: 'spring', stiffness: 500, damping: 25 }} className="w-[60px] h-[60px] rounded-full bg-white border-none cursor-pointer flex items-center justify-center shadow-[4px_4px_10px_#e6e6e6,-4px_-4px_10px_#ffffff] active:shadow-[inset_2px_2px_6px_#e6e6e6,inset_-2px_-2px_6px_#ffffff] transition-shadow">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="#ff6b81"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
                    </motion.button>
                  </>
                )}
              </>
            )}

            {mode === 'temporizador' && (
              <>
                {countdown.running ? (
                  <motion.button onClick={countdown.pause} whileTap={{ scale: 0.88 }} transition={{ type: 'spring', stiffness: 500, damping: 25 }} className="w-[60px] h-[60px] rounded-full bg-white border-none cursor-pointer flex items-center justify-center shadow-[4px_4px_10px_#e6e6e6,-4px_-4px_10px_#ffffff] active:shadow-[inset_2px_2px_6px_#e6e6e6,inset_-2px_-2px_6px_#ffffff] transition-shadow">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="#7f70ff"><rect x="6" y="5" width="4" height="14" rx="1.5" /><rect x="14" y="5" width="4" height="14" rx="1.5" /></svg>
                  </motion.button>
                ) : countdown.remaining > 0 ? (
                  <motion.button onClick={() => countdown.start()} whileTap={{ scale: 0.88 }} transition={{ type: 'spring', stiffness: 500, damping: 25 }} className="w-[64px] h-[64px] rounded-full bg-gradient-to-br from-[#7f70ff] to-[#9d8aff] border-none cursor-pointer flex items-center justify-center shadow-[0_6px_16px_rgba(127,112,255,0.35)]">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="white" className="ml-1"><path d="M8 5v14l11-7z" /></svg>
                  </motion.button>
                ) : null}
                <motion.button onClick={countdown.reset} whileTap={{ scale: 0.88 }} transition={{ type: 'spring', stiffness: 500, damping: 25 }} className="w-[60px] h-[60px] rounded-full bg-white border-none cursor-pointer flex items-center justify-center shadow-[4px_4px_10px_#e6e6e6,-4px_-4px_10px_#ffffff] active:shadow-[inset_2px_2px_6px_#e6e6e6,inset_-2px_-2px_6px_#ffffff] transition-shadow">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>
                </motion.button>
              </>
            )}

            {mode === 'pomodoro' && (
              <>
                {countdown.running ? (
                  <motion.button onClick={countdown.pause} whileTap={{ scale: 0.88 }} transition={{ type: 'spring', stiffness: 500, damping: 25 }} className="w-[60px] h-[60px] rounded-full bg-white border-none cursor-pointer flex items-center justify-center shadow-[4px_4px_10px_#e6e6e6,-4px_-4px_10px_#ffffff] active:shadow-[inset_2px_2px_6px_#e6e6e6,inset_-2px_-2px_6px_#ffffff] transition-shadow">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="#7f70ff"><rect x="6" y="5" width="4" height="14" rx="1.5" /><rect x="14" y="5" width="4" height="14" rx="1.5" /></svg>
                  </motion.button>
                ) : (
                  <motion.button onClick={() => countdown.start()} whileTap={{ scale: 0.88 }} transition={{ type: 'spring', stiffness: 500, damping: 25 }} className="w-[64px] h-[64px] rounded-full bg-gradient-to-br from-[#7f70ff] to-[#9d8aff] border-none cursor-pointer flex items-center justify-center shadow-[0_6px_16px_rgba(127,112,255,0.35)]">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="white" className="ml-1"><path d="M8 5v14l11-7z" /></svg>
                  </motion.button>
                )}
                <motion.button onClick={onPomodoroSkip} whileTap={{ scale: 0.88 }} transition={{ type: 'spring', stiffness: 500, damping: 25 }} className="w-[60px] h-[60px] rounded-full bg-white border-none cursor-pointer flex items-center justify-center shadow-[4px_4px_10px_#e6e6e6,-4px_-4px_10px_#ffffff] active:shadow-[inset_2px_2px_6px_#e6e6e6,inset_-2px_-2px_6px_#ffffff] transition-shadow">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 4 15 12 5 20 5 4" /><line x1="19" y1="5" x2="19" y2="19" /></svg>
                </motion.button>
              </>
            )}
          </div>
        </div>
      </div>

      <ActivityPicker
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        activities={props.activities}
        selectedId={props.draft.activityId}
        onSelect={(id) => { props.onActivityChange(id); setPickerOpen(false); }}
        onCreate={(name, color) => { const id = props.onCreateActivity(name, color); props.onActivityChange(id); setPickerOpen(false); }}
      />

      <TaskPicker
        isOpen={taskPickerOpen}
        onClose={() => setTaskPickerOpen(false)}
        lists={taskLists}
        tasks={tasks}
        onSelect={handleSelectTask}
      />
    </motion.div>
  );
}

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatElapsed } from '../../hooks/useTimeTracker';
import type { TimerMode } from '../../hooks/useCountdownTimer';
import type { ActiveTimerCardProps } from './ActiveTimerCard';
import { ActivityPicker } from './ActivityPicker';
import { FocusRing } from './FocusRing';
import { useSettings } from '../../context/SettingsContext';

interface Props extends ActiveTimerCardProps {
  onBack: () => void;
}

const MODE_LABELS: Record<TimerMode, string> = {
  rastreador: 'Rastreador',
  temporizador: 'Temporizador',
  pomodoro: 'Pomodoro',
};

const PRESETS = [5, 10, 15, 25, 30];

export function FocusScreen({ onBack, ...props }: Props) {
  const { mode, onModeChange, countdown, pomodoroPhase, pomodoroCycle, onPomodoroSkip } = props;
  const { settings, update } = useSettings();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const activity = props.activities.find((a) => a.id === props.draft.activityId);
  const isPaused = props.running !== null && props.running.startedAt === null;
  const isTicking = props.running !== null && props.running.startedAt !== null;

  const bgGradient = mode === 'pomodoro'
    ? (pomodoroPhase === 'work' ? 'linear-gradient(160deg,#4c3fb0,#7f70ff)' : 'linear-gradient(160deg,#1a8855,#34c77b)')
    : mode === 'temporizador' ? 'linear-gradient(160deg,#2d5bbf,#4d7cfe)' : 'linear-gradient(160deg,#4c3fb0,#7f70ff)';

  const progress = mode === 'rastreador'
    ? (props.running ? (props.elapsed % 3600) / 3600 : 0)
    : countdown.targetSeconds > 0 ? countdown.remaining / countdown.targetSeconds : 0;

  const timeDisplay = mode === 'rastreador'
    ? formatElapsed(props.elapsed)
    : `${String(Math.floor(countdown.remaining / 60)).padStart(2, '0')}:${String(countdown.remaining % 60).padStart(2, '0')}`;

  const statusLabel = mode === 'rastreador'
    ? (props.running ? (isPaused ? 'Pausado' : 'En curso') : 'Listo')
    : countdown.running ? 'En curso' : (countdown.remaining < countdown.targetSeconds && countdown.remaining > 0 ? 'Pausado' : 'Listo');

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed inset-0 z-[9999] flex flex-col"
      style={{ background: bgGradient }}
    >
      {/* Barra superior */}
      <div className="flex items-center justify-between px-5 pt-5 pb-2 shrink-0 relative">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors active:scale-90">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
        </button>

        <div className="relative">
          <button onClick={() => setMenuOpen(!menuOpen)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors active:scale-90">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" /></svg>
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
                  className="absolute top-12 right-0 bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.25)] py-2 w-[200px] z-[101] overflow-hidden"
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

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-10">
        <div className="flex flex-col items-center gap-6 min-h-full justify-center py-4">
          {/* Selector de modo */}
          <div className="flex gap-1 p-1 bg-white/10 rounded-2xl w-full max-w-[320px] backdrop-blur-sm">
            {(['rastreador', 'temporizador', 'pomodoro'] as TimerMode[]).map((m) => {
              const active = mode === m;
              return (
                <button key={m} onClick={() => onModeChange(m)} className="relative flex-1 py-2 rounded-xl text-[12px] font-semibold border-none cursor-pointer transition-colors" style={{ color: active ? '#fff' : 'rgba(255,255,255,0.5)' }}>
                  {active && <motion.div layoutId="focus-mode-bubble" className="absolute inset-0 bg-white/20 rounded-xl" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />}
                  <span className="relative z-10">{MODE_LABELS[m]}</span>
                </button>
              );
            })}
          </div>

          {/* Rastreador: actividad + descripción */}
          {mode === 'rastreador' && (
            <div className="w-full max-w-[320px] flex flex-col gap-3">
              <button onClick={() => setPickerOpen(true)} className="self-start flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 cursor-pointer active:scale-95 transition-transform">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: activity?.color ?? '#bbb' }} />
                <span className="text-[13px] font-semibold text-white/90">{activity?.name ?? 'Seleccionar'}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
              </button>
              <input
                type="text"
                value={props.draft.description}
                onChange={(e) => props.onDescriptionChange(e.target.value)}
                placeholder="¿En qué estás trabajando?"
                className="w-full bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl px-4 py-3 text-[15px] text-white placeholder:text-white/40 outline-none focus:bg-white/15 transition-colors"
              />
            </div>
          )}

          {/* Temporizador: presets */}
          {mode === 'temporizador' && (
            <div className="flex gap-2 flex-wrap justify-center max-w-[320px]">
              {PRESETS.map((min) => (
                <button
                  key={min}
                  onClick={() => countdown.setTarget(min)}
                  className={`px-3.5 py-1.5 rounded-full text-[13px] font-semibold border cursor-pointer transition-colors ${countdown.targetSeconds === min * 60 ? 'bg-white text-[#7f70ff] shadow-[0_2px_8px_rgba(0,0,0,0.15)] border-white' : 'bg-white/10 text-white/70 border-white/15'}`}
                >
                  {min} min
                </button>
              ))}
            </div>
          )}

          {/* Pomodoro: indicador de fase */}
          {mode === 'pomodoro' && (
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-white" />
              <span className="text-[14px] font-bold uppercase tracking-wide text-white">{pomodoroPhase === 'work' ? 'Trabajo' : 'Descanso'}</span>
              <span className="text-[12px] text-white/50">· Ciclo {pomodoroCycle}</span>
            </div>
          )}

          {/* Glow + Anillo */}
          <div className="relative flex items-center justify-center">
            <motion.div className="absolute w-[280px] h-[280px] rounded-full bg-white/5 blur-[50px]" animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }} />
            <FocusRing progress={progress} color="#ffffff" size={220} stroke={8}>
              <div className="flex flex-col items-center gap-1">
                {isTicking && (
                  <motion.span className="w-2 h-2 rounded-full bg-white/80 mb-1" animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }} />
                )}
                <motion.span
                  key={timeDisplay}
                  className="text-[40px] font-bold text-white tabular-nums tracking-tight leading-none"
                  animate={isTicking ? { scale: [1, 1.02, 1] } : {}}
                  transition={isTicking ? { repeat: Infinity, duration: 2, ease: 'easeInOut' } : {}}
                >
                  {timeDisplay}
                </motion.span>
                <span className="text-[12px] text-white/50 uppercase tracking-wide mt-1">{statusLabel}</span>
              </div>
            </FocusRing>
          </div>

          {/* Controles */}
          <div className="flex items-center justify-center gap-6">
            {mode === 'rastreador' && (
              <>
                {!props.running && (
                  <motion.button onClick={props.onStart} whileTap={{ scale: 0.88 }} transition={{ type: 'spring', stiffness: 500, damping: 25 }} className="w-[68px] h-[68px] rounded-full bg-white border-none cursor-pointer flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="#7f70ff" className="ml-1"><path d="M8 5v14l11-7z" /></svg>
                  </motion.button>
                )}
                {props.running && (
                  <>
                    <motion.button onClick={isPaused ? props.onResume : props.onPause} whileTap={{ scale: 0.88 }} transition={{ type: 'spring', stiffness: 500, damping: 25 }} className="w-[64px] h-[64px] rounded-full bg-white/15 backdrop-blur-sm border border-white/20 cursor-pointer flex items-center justify-center">
                      {isPaused ? <svg width="24" height="24" viewBox="0 0 24 24" fill="white" className="ml-1"><path d="M8 5v14l11-7z" /></svg> : <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><rect x="6" y="5" width="4" height="14" rx="1.5" /><rect x="14" y="5" width="4" height="14" rx="1.5" /></svg>}
                    </motion.button>
                    <motion.button onClick={props.onStop} whileTap={{ scale: 0.88 }} transition={{ type: 'spring', stiffness: 500, damping: 25 }} className="w-[64px] h-[64px] rounded-full bg-white/15 backdrop-blur-sm border border-white/20 cursor-pointer flex items-center justify-center">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
                    </motion.button>
                  </>
                )}
              </>
            )}

            {mode === 'temporizador' && (
              <>
                {countdown.running ? (
                  <motion.button onClick={countdown.pause} whileTap={{ scale: 0.88 }} transition={{ type: 'spring', stiffness: 500, damping: 25 }} className="w-[64px] h-[64px] rounded-full bg-white/15 backdrop-blur-sm border border-white/20 cursor-pointer flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><rect x="6" y="5" width="4" height="14" rx="1.5" /><rect x="14" y="5" width="4" height="14" rx="1.5" /></svg>
                  </motion.button>
                ) : countdown.remaining > 0 ? (
                  <motion.button onClick={() => countdown.start()} whileTap={{ scale: 0.88 }} transition={{ type: 'spring', stiffness: 500, damping: 25 }} className="w-[68px] h-[68px] rounded-full bg-white border-none cursor-pointer flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="#7f70ff" className="ml-1"><path d="M8 5v14l11-7z" /></svg>
                  </motion.button>
                ) : null}
                <motion.button onClick={countdown.reset} whileTap={{ scale: 0.88 }} transition={{ type: 'spring', stiffness: 500, damping: 25 }} className="w-[64px] h-[64px] rounded-full bg-white/15 backdrop-blur-sm border border-white/20 cursor-pointer flex items-center justify-center">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>
                </motion.button>
              </>
            )}

            {mode === 'pomodoro' && (
              <>
                {countdown.running ? (
                  <motion.button onClick={countdown.pause} whileTap={{ scale: 0.88 }} transition={{ type: 'spring', stiffness: 500, damping: 25 }} className="w-[64px] h-[64px] rounded-full bg-white/15 backdrop-blur-sm border border-white/20 cursor-pointer flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><rect x="6" y="5" width="4" height="14" rx="1.5" /><rect x="14" y="5" width="4" height="14" rx="1.5" /></svg>
                  </motion.button>
                ) : (
                  <motion.button onClick={() => countdown.start()} whileTap={{ scale: 0.88 }} transition={{ type: 'spring', stiffness: 500, damping: 25 }} className="w-[68px] h-[68px] rounded-full bg-white border-none cursor-pointer flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="#7f70ff" className="ml-1"><path d="M8 5v14l11-7z" /></svg>
                  </motion.button>
                )}
                <motion.button onClick={onPomodoroSkip} whileTap={{ scale: 0.88 }} transition={{ type: 'spring', stiffness: 500, damping: 25 }} className="w-[64px] h-[64px] rounded-full bg-white/15 backdrop-blur-sm border border-white/20 cursor-pointer flex items-center justify-center">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 4 15 12 5 20 5 4" /><line x1="19" y1="5" x2="19" y2="19" /></svg>
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
    </motion.div>
  );
}

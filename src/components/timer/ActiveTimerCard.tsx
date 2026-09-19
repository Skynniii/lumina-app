import { useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { formatElapsed, type RunningTimer, type TrackerDraft } from '../../hooks/useTimeTracker';
import type { TimerMode } from '../../hooks/useCountdownTimer';
import { ActivityPicker } from './ActivityPicker';
import { TimerModeSelector } from './TimerModeSelector';
import type { Activity } from '../../types';

export interface CountdownApi {
  targetSeconds: number;
  remaining: number;
  running: boolean;
  start: (seconds?: number) => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  setTarget: (minutes: number) => void;
  setOnComplete: (fn: () => void) => void;
}

export interface ActiveTimerCardProps {
  mode: TimerMode;
  onModeChange: (mode: TimerMode) => void;
  // Rastreador
  running: RunningTimer | null;
  elapsed: number;
  draft: TrackerDraft;
  activities: Activity[];
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onSetStartTime?: (epochMs: number) => void;
  onDescriptionChange: (v: string) => void;
  onActivityChange: (id: string) => void;
  onCreateActivity: (name: string, color: string) => string;
  // Countdown / Pomodoro
  countdown: CountdownApi;
  pomodoroPhase: 'work' | 'break';
  pomodoroCycle: number;
  onPomodoroSkip: () => void;
}

/* ---------- sub-componentes ---------- */

function TimerRing({ progressDeg, color, children }: { progressDeg: number; color: string; children: ReactNode }) {
  return (
    <div
      className="w-[180px] h-[180px] rounded-full flex items-center justify-center"
      style={{ background: `conic-gradient(${color} ${progressDeg}deg, #eceaf3 0deg)` }}
    >
      <div className="w-[155px] h-[155px] bg-white rounded-full flex items-center justify-center shadow-[inset_4px_4px_8px_#e6e6e6,inset_-4px_-4px_8px_#ffffff]">
        {children}
      </div>
    </div>
  );
}

function PlayButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Iniciar"
      className="w-[64px] h-[64px] rounded-full bg-gradient-to-br from-[#7f70ff] to-[#9d8aff] border-none cursor-pointer flex items-center justify-center shadow-[0_6px_16px_rgba(127,112,255,0.35)] active:scale-[0.88] transition-transform"
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="white" className="ml-1">
        <path d="M8 5v14l11-7z" />
      </svg>
    </button>
  );
}

function CtrlButton({ onClick, label, children }: { onClick: () => void; label: string; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="w-[60px] h-[60px] rounded-full bg-white border-none cursor-pointer flex items-center justify-center shadow-[4px_4px_10px_#e6e6e6,-4px_-4px_10px_#ffffff] active:shadow-[inset_2px_2px_6px_#e6e6e6,inset_-2px_-2px_6px_#ffffff] transition-shadow active:scale-[0.88] transition-transform"
    >
      {children}
    </button>
  );
}

const PauseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="#7f70ff">
    <rect x="6" y="5" width="4" height="14" rx="1.5" />
    <rect x="14" y="5" width="4" height="14" rx="1.5" />
  </svg>
);
const StopIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="#ff6b81">
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
);
const ResetIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);
const SkipIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 4 15 12 5 20 5 4" />
    <line x1="19" y1="5" x2="19" y2="19" />
  </svg>
);

const PRESETS = [5, 10, 15, 25, 30];

/* ---------- componente ---------- */

export function ActiveTimerCard(props: ActiveTimerCardProps) {
  const { mode, onModeChange, countdown, pomodoroPhase, pomodoroCycle, onPomodoroSkip } = props;
  const [pickerOpen, setPickerOpen] = useState(false);

  const activity = props.activities.find((a) => a.id === props.draft.activityId);
  const isPaused = props.running !== null && props.running.startedAt === null;
  const isTicking = props.running !== null && props.running.startedAt !== null;

  // Anillo rastreador: se llena en ciclos de 60 min
  const trackerDeg = props.running ? ((props.elapsed % 3600) / 3600) * 360 : 0;

  // Anillo countdown: se vacía
  const cdDeg = countdown.targetSeconds > 0 ? (countdown.remaining / countdown.targetSeconds) * 360 : 0;
  const cdColor = mode === 'pomodoro' ? (pomodoroPhase === 'work' ? '#7f70ff' : '#34c77b') : '#7f70ff';

  const cdMin = Math.floor(countdown.remaining / 60);
  const cdSec = countdown.remaining % 60;
  const cdDisplay = `${String(cdMin).padStart(2, '0')}:${String(cdSec).padStart(2, '0')}`;

  return (
    <div className="bg-white p-5 rounded-[24px] shadow-[6px_6px_12px_#e6e6e6,-6px_-6px_12px_#ffffff] flex flex-col items-center gap-4">
      <TimerModeSelector mode={mode} onChange={onModeChange} />

      {/* ===== RASTREADOR ===== */}
      {mode === 'rastreador' && (
        <>
          <button
            onClick={() => setPickerOpen(true)}
            className="self-start flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#f7f6f9] shadow-[inset_2px_2px_5px_#e6e6e6,inset_-2px_-2px_5px_#ffffff] border-none cursor-pointer active:scale-95 transition-transform"
          >
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: activity?.color ?? '#bbb' }} />
            <span className="text-[13px] font-semibold text-[#555]">{activity?.name ?? 'Seleccionar'}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
          </button>

          <input
            type="text"
            value={props.draft.description}
            onChange={(e) => props.onDescriptionChange(e.target.value)}
            placeholder="¿En qué estás trabajando?"
            className="w-full bg-[#f7f6f9] rounded-2xl px-4 py-3 text-[15px] text-[#333] placeholder:text-[#aaa] outline-none shadow-[inset_2px_2px_5px_#e6e6e6,inset_-2px_-2px_5px_#ffffff] focus:shadow-[inset_1px_1px_3px_#d9d9ff,inset_-1px_-1px_3px_#ffffff] transition-shadow"
          />

          <TimerRing progressDeg={trackerDeg} color="#7f70ff">
            <div className="flex items-center justify-center gap-2">
              {isTicking && (
                <motion.span className="w-2 h-2 rounded-full bg-[#34c77b]" animate={{ opacity: [1, 0.25, 1] }} transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }} />
              )}
              <motion.span
                key={props.running ? 'live' : 'idle'}
                className="text-[32px] font-bold text-[#333] tabular-nums tracking-tight leading-none"
                animate={isTicking ? { scale: [1, 1.015, 1] } : {}}
                transition={isTicking ? { repeat: Infinity, duration: 2, ease: 'easeInOut' } : {}}
              >
                {formatElapsed(props.elapsed)}
              </motion.span>
            </div>
          </TimerRing>

          <div className="flex items-center justify-center gap-6">
            {!props.running && <PlayButton onClick={props.onStart} />}
            {props.running && (
              <>
                <CtrlButton onClick={isPaused ? props.onResume : props.onPause} label={isPaused ? 'Reanudar' : 'Pausar'}>
                  {isPaused ? <svg width="24" height="24" viewBox="0 0 24 24" fill="#7f70ff" className="ml-1"><path d="M8 5v14l11-7z" /></svg> : <PauseIcon />}
                </CtrlButton>
                <CtrlButton onClick={props.onStop} label="Detener y guardar"><StopIcon /></CtrlButton>
              </>
            )}
          </div>

          <ActivityPicker
            isOpen={pickerOpen}
            onClose={() => setPickerOpen(false)}
            activities={props.activities}
            selectedId={props.draft.activityId}
            onSelect={(id) => { props.onActivityChange(id); setPickerOpen(false); }}
            onCreate={(name, color) => {
              const id = props.onCreateActivity(name, color);
              props.onActivityChange(id);
              setPickerOpen(false);
            }}
          />
        </>
      )}

      {/* ===== TEMPORIZADOR ===== */}
      {mode === 'temporizador' && (
        <>
          <div className="flex gap-2 flex-wrap justify-center">
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

          <TimerRing progressDeg={cdDeg} color="#7f70ff">
            <span className="text-[36px] font-bold text-[#333] tabular-nums tracking-tight leading-none">{cdDisplay}</span>
          </TimerRing>

          <div className="flex items-center justify-center gap-6">
            {countdown.running ? (
              <CtrlButton onClick={countdown.pause} label="Pausar"><PauseIcon /></CtrlButton>
            ) : countdown.remaining > 0 ? (
              <PlayButton onClick={() => countdown.start()} />
            ) : null}
            <CtrlButton onClick={countdown.reset} label="Reiniciar"><ResetIcon /></CtrlButton>
          </div>
        </>
      )}

      {/* ===== POMODORO ===== */}
      {mode === 'pomodoro' && (
        <>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: pomodoroPhase === 'work' ? '#7f70ff' : '#34c77b' }} />
            <span className="text-[14px] font-bold uppercase tracking-wide" style={{ color: pomodoroPhase === 'work' ? '#7f70ff' : '#34c77b' }}>
              {pomodoroPhase === 'work' ? 'Trabajo' : 'Descanso'}
            </span>
            <span className="text-[12px] text-[#b0b0b0]">· Ciclo {pomodoroCycle}</span>
          </div>

          <TimerRing progressDeg={cdDeg} color={cdColor}>
            <span className="text-[36px] font-bold text-[#333] tabular-nums tracking-tight leading-none">{cdDisplay}</span>
          </TimerRing>

          <div className="flex items-center justify-center gap-6">
            {countdown.running ? (
              <CtrlButton onClick={countdown.pause} label="Pausar"><PauseIcon /></CtrlButton>
            ) : (
              <PlayButton onClick={() => countdown.start()} />
            )}
            <CtrlButton onClick={onPomodoroSkip} label="Saltar fase"><SkipIcon /></CtrlButton>
          </div>
        </>
      )}
    </div>
  );
}

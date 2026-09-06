import { useState, memo, useRef } from 'react';
import { motion } from 'framer-motion';
import type { Task, SortMode } from '../../types';
import { useSettings } from '../../context/SettingsContext';
import { playCompleteSound } from '../../utils/sound';
import { Sparkles } from './Sparkles';

interface Props {
  task: Task;
  onToggle: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onExpand: (id: string) => void;
  sortMode?: SortMode;
  reorderable?: boolean;
  isReorderSelected?: boolean;
  onLongPress?: () => void;
  onMove?: (dir: 'up' | 'down') => void;
  onExitReorder?: () => void;
}

const GOLD = '#eab308'; // amarillo fuerte que resalta sobre el fondo #fff9e6 de la tarjeta

export const TareaItem = memo(({ task, onToggle, onUpdate, onExpand, sortMode, reorderable, isReorderSelected, onLongPress, onMove, onExitReorder }: Props) => {
  const { settings } = useSettings();
  const [optimistic, setOptimistic] = useState(false);
  const [sparkle, setSparkle] = useState(false);
  const [completingImportant, setCompletingImportant] = useState(false);
  const [showCompletedText, setShowCompletedText] = useState(false);
  const [rectSize, setRectSize] = useState<{ w: number; h: number } | null>(null);
  const liRef = useRef<HTMLLIElement>(null);
  const longPressTimer = useRef<number | null>(null);
  const longPressFired = useRef(false);

  const isCompleted = task.completed;
  const isChecked = task.completed || optimistic;

  // Chip de fecha según el orden activo (detallito en la tarjeta)
  const chipDate = sortMode === 'date' ? task.dueDate : sortMode === 'deadline' ? task.deadline : undefined;
  const showChip = !!chipDate;
  const chipLabel = chipDate ? new Date(chipDate + 'T00:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) : '';

  const startLongPress = () => {
    if (!reorderable || isCompleted) return;
    longPressFired.current = false;
    longPressTimer.current = window.setTimeout(() => {
      longPressFired.current = true;
      onLongPress?.();
    }, 450);
  };
  const cancelLongPress = () => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
  };

  const handleComplete = (e: React.MouseEvent | React.ChangeEvent) => {
    e.stopPropagation();
    if (!task.completed) {
      if (task.isImportant) {
        const el = liRef.current;
        if (el) setRectSize({ w: el.offsetWidth, h: el.offsetHeight });
        setCompletingImportant(true);
        if (settings.sounds) playCompleteSound();
        setTimeout(() => setShowCompletedText(true), 550);
        setTimeout(() => onToggle(task.id), 1300);
      } else {
        setOptimistic(true);
        setSparkle(true);
        if (settings.sounds) playCompleteSound();
        setTimeout(() => {
          onToggle(task.id);
          setSparkle(false);
          setOptimistic(false);
        }, 450);
      }
    } else {
      onToggle(task.id);
    }
  };

  const handleImportant = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate(task.id, { isImportant: !task.isImportant });
  };

  return (
    <motion.li
      ref={liRef}
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0, scale: isReorderSelected ? 1.04 : 1 }}
      exit={{ opacity: 0, x: -30, height: 0, marginBottom: 0, overflow: 'hidden' }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={`relative flex items-center py-3.5 px-2 w-full select-none group min-h-[50px] rounded-[16px] my-1 transition-colors ${
        task.isImportant && !isCompleted ? 'bg-[#fff9e6]' : ''
      } ${isReorderSelected ? 'bg-[#f0edff] ring-2 ring-[#7f70ff] cursor-grabbing' : 'cursor-pointer'}`}
      onPointerDown={startLongPress}
      onPointerUp={cancelLongPress}
      onPointerLeave={cancelLongPress}
      onClick={() => {
        if (longPressFired.current) { longPressFired.current = false; return; }
        if (isReorderSelected) { onExitReorder?.(); return; }
        onExpand(task.id);
      }}
    >
      {/* Líneas que rellenan el borde: nacen en el centro del lado izquierdo, suben/bajan,
          rodean las esquinas redondeadas y se encuentran en el centro del lado derecho */}
      {completingImportant && rectSize && (() => {
        const { w, h } = rectSize;
        const r = Math.min(16, w / 2, h / 2);
        const half = h / 2;
        const pathUp = `M 0,${half} L 0,${r} A ${r},${r} 0 0 1 ${r},0 L ${w - r},0 A ${r},${r} 0 0 1 ${w},${r} L ${w},${half}`;
        const pathDown = `M 0,${half} L 0,${h - r} A ${r},${r} 0 0 0 ${r},${h} L ${w - r},${h} A ${r},${r} 0 0 0 ${w},${h - r} L ${w},${half}`;
        return (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox={`0 0 ${w} ${h}`} fill="none">
            <motion.path d={pathUp} stroke={GOLD} strokeWidth={2.5} strokeLinecap="round"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
              transition={{ duration: 0.75, ease: 'easeInOut' }} />
            <motion.path d={pathDown} stroke={GOLD} strokeWidth={2.5} strokeLinecap="round"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
              transition={{ duration: 0.75, ease: 'easeInOut' }} />
          </svg>
        );
      })()}

      {/* Checkbox */}
      <motion.div
        className="relative flex items-center justify-center w-[22px] h-[22px] flex-none mr-3.5"
        onClick={handleComplete}
        animate={{ opacity: completingImportant ? 0 : 1, scale: completingImportant ? 0.6 : 1 }}
        transition={{ duration: 0.45, ease: 'easeInOut' }}
      >
        {sparkle && <Sparkles />}
        <input type="checkbox" readOnly checked={isChecked} className="peer appearance-none min-w-[22px] h-[22px] border-[1.5px] border-[#d1d1d6] rounded-full cursor-pointer checked:bg-[#7f70ff] checked:border-[#7f70ff] transition-all group-hover:border-[#b0a5ff]" />
        <svg className={`absolute w-3.5 h-3.5 text-white pointer-events-none transition-opacity duration-200 ${isChecked ? 'opacity-100' : 'opacity-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
      </motion.div>

      {/* Title or ¡Completado! */}
      {completingImportant ? (
        <div className="flex-grow flex items-center justify-center relative">
          <motion.span
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: 'easeInOut' }}
            className="text-[15px] leading-snug text-[#333333]"
          >
            {task.text}
          </motion.span>
          {showCompletedText && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Sparkles />
              <motion.span
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="text-[16px] font-bold"
                style={{ color: GOLD }}
              >
                ¡Buen trabajo!
              </motion.span>
            </div>
          )}
        </div>
      ) : (
        <span className={`flex-grow text-[15px] leading-snug ${isCompleted ? 'text-[#a0a0a0] line-through' : 'text-[#333333]'}`}>
          {task.text}
          {showChip && (
            <span className="ml-2 inline-block align-middle text-[10px] text-[#999] bg-[#f0f0f5] px-2 py-0.5 rounded-full whitespace-nowrap">
              {chipLabel}
            </span>
          )}
        </span>
      )}

      {/* Reorden (modo personalizado) o estrella importante */}
      {isReorderSelected ? (
        <div className="flex-none ml-2 flex items-center gap-0.5">
          <button onClick={(e) => { e.stopPropagation(); onMove?.('up'); }} className="p-1.5 rounded-full hover:bg-black/5 transition-colors text-[#7f70ff]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15" /></svg>
          </button>
          <button onClick={(e) => { e.stopPropagation(); onMove?.('down'); }} className="p-1.5 rounded-full hover:bg-black/5 transition-colors text-[#7f70ff]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
          </button>
          <button onClick={(e) => { e.stopPropagation(); onExitReorder?.(); }} className="p-1.5 rounded-full hover:bg-black/5 transition-colors text-[#34c759]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          </button>
        </div>
      ) : !isCompleted && (
        <motion.button
          onClick={handleImportant}
          animate={{ opacity: completingImportant ? 0 : 1, scale: completingImportant ? 0.6 : 1 }}
          transition={{ duration: 0.45, ease: 'easeInOut' }}
          style={{ pointerEvents: completingImportant ? 'none' : undefined }}
          className="flex-none p-2 ml-2 cursor-pointer rounded-full hover:bg-black/5 transition-colors"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill={task.isImportant ? '#ffcc00' : 'none'} stroke={task.isImportant ? '#ffcc00' : '#d1d1d6'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-300">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </motion.button>
      )}
    </motion.li>
  );
});

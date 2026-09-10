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
  dragId?: string | null;
  overlay?: boolean;
  listTag?: string;
  compact?: boolean;
  hideListTag?: boolean;
  hideDueDate?: boolean;
  onDragPointerDown?: (e: React.PointerEvent, id: string) => void;
  onDragPointerEnd?: () => void;
}

const GOLD = '#eab308';

const IconNotes = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>);
const IconSub = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>);
const IconFlag = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg>);
const IconCal = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>);

export const TareaItem = memo(({ task, onToggle, onUpdate, onExpand, sortMode, reorderable, dragId, overlay, listTag, compact, hideListTag, hideDueDate, onDragPointerDown, onDragPointerEnd }: Props) => {
  const { settings } = useSettings();
  const [optimistic, setOptimistic] = useState(false);
  const [sparkle, setSparkle] = useState(false);
  const [completingImportant, setCompletingImportant] = useState(false);
  const [showCompletedText, setShowCompletedText] = useState(false);
  const [rectSize, setRectSize] = useState<{ w: number; h: number } | null>(null);
  const liRef = useRef<HTMLLIElement>(null);

  const isCompleted = task.completed;
  const isChecked = task.completed || optimistic;
  const isDragged = dragId === task.id;

  // Información adicional para mostrar en la tarjeta
  const hasNotes = !!task.notes?.replace(/<[^>]*>/g, '').trim();
  const subTotal = task.subtasks?.length || 0;
  const hasSub = subTotal > 0;
  // En la vista Principal (listTag definido) solo se muestran la lista y la fecha;
  // el resto de iconos (notas, subtareas, fecha límite) aparecen en su lista propia.
  const inPrincipal = !!listTag || !!compact;
  const showListTag = !!listTag && !hideListTag;
  const showDeadline = !!task.deadline && sortMode !== 'deadline' && !inPrincipal;
  const showDue = !!task.dueDate && sortMode !== 'date' && !hideDueDate;
  const showNotes = hasNotes && !inPrincipal;
  const showSub = hasSub && !inPrincipal;
  const hasInfo = showNotes || showSub || showDeadline || showDue || showListTag;

  const dueLabel = () => {
    if (!task.dueDate) return '';
    const d = new Date(task.dueDate + 'T00:00:00');
    let s = d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
    if (task.dueTime) {
      const [h, min] = task.dueTime.split(':').map(Number);
      const h12 = h % 12 || 12;
      s += ` · ${h12}:${String(min).padStart(2, '0')} ${h >= 12 ? 'pm' : 'am'}`;
    }
    if (task.repeat?.enabled) s += ' 🔁';
    return s;
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
        setTimeout(() => { onToggle(task.id); setSparkle(false); setOptimistic(false); }, 450);
      }
    } else {
      onToggle(task.id);
    }
  };

  const handleImportant = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate(task.id, { isImportant: !task.isImportant });
  };

  const inner = (
    <>
      {completingImportant && rectSize && (() => {
        const { w, h } = rectSize;
        const r = Math.min(16, w / 2, h / 2);
        const half = h / 2;
        const pathUp = `M 0,${half} L 0,${r} A ${r},${r} 0 0 1 ${r},0 L ${w - r},0 A ${r},${r} 0 0 1 ${w},${r} L ${w},${half}`;
        const pathDown = `M 0,${half} L 0,${h - r} A ${r},${r} 0 0 0 ${r},${h} L ${w - r},${h} A ${r},${r} 0 0 0 ${w},${h - r} L ${w},${half}`;
        return (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible" style={{ overflow: 'visible' }} viewBox={`0 0 ${w} ${h}`} fill="none">
            <motion.path d={pathUp} stroke={GOLD} strokeWidth={2.5} strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.75, ease: 'easeInOut' }} />
            <motion.path d={pathDown} stroke={GOLD} strokeWidth={2.5} strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.75, ease: 'easeInOut' }} />
          </svg>
        );
      })()}

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

      <div className="flex-grow min-w-0 flex flex-col relative">
        <motion.span
          animate={{ opacity: completingImportant ? 0 : 1 }}
          transition={{ duration: 0.45, ease: 'easeInOut' }}
          className={`text-[15px] leading-snug ${isCompleted ? 'text-[#a0a0a0] line-through' : 'text-[#333333]'}`}
        >{task.text}</motion.span>
        {hasInfo && (
          <motion.div
            animate={{ opacity: completingImportant ? 0 : 1 }}
            transition={{ duration: 0.45, ease: 'easeInOut' }}
            className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 mt-2 text-[#8a8a8a]"
          >
            {showListTag && (
              <span className="inline-flex items-center text-[11px] font-medium text-[#999] bg-[#f4f4f6] px-2 py-0.5 rounded-full">{listTag}</span>
            )}
            {showDue && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#efeaff] text-[#6b5cdb] text-[12px] font-semibold">
                <IconCal /> {dueLabel()}
              </span>
            )}
            {showDeadline && (
              <span className="flex items-center text-[#d97706]"><IconFlag /></span>
            )}
            {showNotes && <span className="flex items-center"><IconNotes /></span>}
            {showSub && <span className="flex items-center"><IconSub /></span>}
          </motion.div>
        )}
        {showCompletedText && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Sparkles />
            <motion.span initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3, ease: 'easeOut' }} className="text-[16px] font-bold" style={{ color: GOLD }}>¡Buen trabajo!</motion.span>
          </div>
        )}
      </div>

      {!isCompleted && (
        <motion.button
          onClick={handleImportant}
          animate={{ opacity: completingImportant ? 0 : 1, scale: completingImportant ? 0.6 : 1 }}
          transition={{ duration: 0.45, ease: 'easeInOut' }}
          style={{ pointerEvents: completingImportant ? 'none' : undefined }}
          className="flex-none p-2 ml-2 cursor-pointer rounded-full hover:bg-black/5 transition-colors self-center"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill={task.isImportant ? '#ffcc00' : 'none'} stroke={task.isImportant ? '#ffcc00' : '#d1d1d6'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-300">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </motion.button>
      )}
    </>
  );

  const baseClass = `relative flex items-center py-3.5 px-2 w-full select-none group min-h-[50px] rounded-[16px] ${overlay ? '' : 'my-1'} transition-colors ${task.isImportant && !isCompleted ? 'bg-[#fff9e6]' : ''}`;

  return (
    <motion.li
      ref={liRef}
      layout={!isDragged}
      data-task={task.id}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0, scale: isDragged ? 1.03 : 1 }}
      exit={{ opacity: 0, x: -30, height: 0, marginBottom: 0, overflow: 'hidden' }}
      transition={{ duration: 0.3, ease: 'easeInOut', layout: { type: 'spring', stiffness: 700, damping: 45 } }}
      onPointerDown={reorderable && !isCompleted ? (e) => onDragPointerDown?.(e, task.id) : undefined}
      onPointerUp={reorderable ? () => onDragPointerEnd?.() : undefined}
      onPointerLeave={reorderable ? () => onDragPointerEnd?.() : undefined}
      onClick={() => onExpand(task.id)}
      className={`${baseClass} ${isDragged ? 'cursor-grabbing bg-white shadow-[0_8px_24px_rgba(0,0,0,0.18)] z-50' : reorderable ? 'cursor-grab' : 'cursor-pointer'}`}
      style={{ zIndex: isDragged ? 50 : 'auto', touchAction: reorderable ? 'none' : 'auto' }}
    >
      {inner}
    </motion.li>
  );
});

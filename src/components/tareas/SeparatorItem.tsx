import { memo } from 'react';
import { motion } from 'framer-motion';
import type { Task } from '../../types';
import { useDeviceCapability } from '../../context/DeviceCapabilityContext';

interface Props {
  task: Task;
  reorderable?: boolean;
  dragId?: string | null;
  overlay?: boolean;
  onDragPointerDown?: (e: React.PointerEvent, id: string) => void;
  onDragPointerEnd?: () => void;
}

export const SeparatorItem = memo(({ task, reorderable, dragId, overlay, onDragPointerDown, onDragPointerEnd }: Props) => {
  const isDragged = dragId === task.id;
  const cap = useDeviceCapability();

  return (
    <motion.li
      layout={cap.enableLayout && !isDragged}
      data-task={task.id}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0, scale: isDragged ? 1.03 : 1 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' }}
      transition={{ duration: 0.3 * cap.durationScale, ease: 'easeInOut', layout: cap.spring }}
      className={`flex items-center gap-3 py-2.5 px-2 w-full select-none ${overlay ? '' : 'my-0.5'} ${isDragged ? 'cursor-grabbing bg-white shadow-[0_8px_24px_rgba(0,0,0,0.18)] z-50' : ''}`}
      style={{ zIndex: isDragged ? 50 : 'auto', touchAction: reorderable ? 'pan-y' : 'auto' }}
    >
      <div className="flex-1 h-px bg-[#eceaf3]" />
      <span className="text-[12px] font-bold uppercase tracking-wider whitespace-nowrap text-[#a0a0a0]">{task.title}</span>
      {reorderable ? (
        <div
          onPointerDown={onDragPointerDown ? (e) => { e.stopPropagation(); onDragPointerDown(e, task.id); } : undefined}
          onPointerUp={onDragPointerEnd}
          className="flex-none p-1 ml-1 self-center text-[#c0c0c0] touch-none"
          style={{ cursor: isDragged ? 'grabbing' : 'grab' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="4" y1="9" x2="20" y2="9" />
            <line x1="4" y1="15" x2="20" y2="15" />
          </svg>
        </div>
      ) : (
        <div className="flex-1 h-px bg-[#eceaf3]" />
      )}
    </motion.li>
  );
});

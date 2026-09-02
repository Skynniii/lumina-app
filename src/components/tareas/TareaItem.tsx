import { useState, memo } from 'react';
import { motion } from 'framer-motion';
import type { Task } from '../../types';
import { useSettings } from '../../context/SettingsContext';
import { playCompleteSound } from '../../utils/sound';
import { Sparkles } from './Sparkles';

interface Props {
  task: Task;
  onToggle: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onExpand: (id: string) => void;
}

export const TareaItem = memo(({ task, onToggle, onUpdate, onExpand }: Props) => {
  const { settings } = useSettings();
  const [optimistic, setOptimistic] = useState(false);
  const [sparkle, setSparkle] = useState(false);

  const isCompleted = task.completed;
  const isChecked = task.completed || optimistic;

  const handleComplete = (e: React.MouseEvent | React.ChangeEvent) => {
    e.stopPropagation();
    if (!task.completed) {
      setOptimistic(true);
      setSparkle(true);
      if (settings.sounds) playCompleteSound();
      setTimeout(() => {
        onToggle(task.id);
        setSparkle(false);
        setOptimistic(false);
      }, 450);
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
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -30, height: 0, marginBottom: 0, overflow: 'hidden' }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={`flex items-center py-3.5 px-2 cursor-pointer w-full select-none group min-h-[50px] rounded-[16px] my-1 transition-colors ${
        task.isImportant && !isCompleted ? 'bg-[#fff9e6]' : ''
      }`}
      onClick={() => onExpand(task.id)}
    >
      {/* Checkbox */}
      <div className="relative flex items-center justify-center w-[22px] h-[22px] flex-none mr-3.5" onClick={handleComplete}>
        {sparkle && <Sparkles />}
        <input type="checkbox" readOnly checked={isChecked} className="peer appearance-none min-w-[22px] h-[22px] border-[1.5px] border-[#d1d1d6] rounded-full cursor-pointer checked:bg-[#7f70ff] checked:border-[#7f70ff] transition-all group-hover:border-[#b0a5ff]" />
        <svg className={`absolute w-3.5 h-3.5 text-white pointer-events-none transition-opacity duration-200 ${isChecked ? 'opacity-100' : 'opacity-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
      </div>

      {/* Título */}
      <span className={`flex-grow text-[15px] leading-snug ${isCompleted ? 'text-[#a0a0a0] line-through' : 'text-[#333333]'}`}>
        {task.text}
      </span>

      {/* Estrella importante */}
      {!isCompleted && (
        <button onClick={handleImportant} className="flex-none p-2 ml-2 cursor-pointer rounded-full hover:bg-black/5 transition-colors">
          <svg width="22" height="22" viewBox="0 0 24 24" fill={task.isImportant ? '#ffcc00' : 'none'} stroke={task.isImportant ? '#ffcc00' : '#d1d1d6'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-300">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </button>
      )}
    </motion.li>
  );
});

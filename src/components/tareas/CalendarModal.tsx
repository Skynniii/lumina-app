import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RepeatConfig } from '../../types';
import { useSettings } from '../../context/SettingsContext';
import { TimePickerModal } from './TimePickerModal';
import { RepeatModal } from './RepeatModal';

interface Props {
  initialDate?: string;
  initialTime?: string;
  initialRepeat?: RepeatConfig;
  onClose: () => void;
  onSave: (date?: string, time?: string, repeat?: RepeatConfig) => void;
}

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DOW = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export function CalendarModal({ initialDate, initialTime, initialRepeat, onClose, onSave }: Props) {
  const { settings } = useSettings();
  const [month, setMonth] = useState(() => (initialDate ? new Date(initialDate) : new Date()));
  const [date, setDate] = useState<string | undefined>(initialDate);
  const [time, setTime] = useState<string | undefined>(initialTime);
  const [repeat, setRepeat] = useState<RepeatConfig | undefined>(initialRepeat);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showRepeat, setShowRepeat] = useState(false);
  const [direction, setDirection] = useState(0);
  const touchStart = useRef(0);

  const y = month.getFullYear();
  const m = month.getMonth();
  const days = new Date(y, m + 1, 0).getDate();
  let firstDow = new Date(y, m, 1).getDay();
  firstDow = firstDow === 0 ? 6 : firstDow - 1;

  const prevMonth = () => { setDirection(-1); setMonth(new Date(y, m - 1, 1)); };
  const nextMonth = () => { setDirection(1); setMonth(new Date(y, m + 1, 1)); };

  const formatTimeDisplay = () => {
    if (!time) return null;
    const [h, min] = time.split(':').map(Number);
    if (settings.timeFormat === '12h') {
      const period = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${h12}:${String(min).padStart(2, '0')} ${period}`;
    }
    return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  };

  const formatRepeatDisplay = () => {
    if (!repeat?.enabled) return null;
    const freqLabel = { daily: 'día', weekly: 'semana', monthly: 'mes', yearly: 'año' }[repeat.frequency];
    const plural = repeat.interval > 1 ? 's' : '';
    return `Cada ${repeat.interval} ${freqLabel}${plural}`;
  };

  const handleSave = () => { onSave(date, time, repeat); onClose(); };
  const timeDisplay = formatTimeDisplay();
  const repeatDisplay = formatRepeatDisplay();

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="bg-white rounded-[24px] w-full max-w-[340px] shadow-2xl relative overflow-hidden"
      >
        {/* Header con navegación de mes */}
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f5f5f7] transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <span className="font-semibold text-[15px] text-[#333]">{MONTHS[m]} {y}</span>
          <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f5f5f7] transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>

        {/* Calendario con swipe animado */}
        <div
          className="px-5 pb-3"
          onTouchStart={(e) => { touchStart.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            const diff = touchStart.current - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 50) { if (diff > 0) nextMonth(); else prevMonth(); }
          }}
        >
          <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
            {DOW.map((d) => <span key={d} className="text-[11px] font-bold text-[#aaa] py-1">{d}</span>)}
          </div>
          <div className="relative overflow-hidden">
            <AnimatePresence custom={direction} mode="popLayout">
              <motion.div
                key={`${y}-${m}`}
                custom={direction}
                variants={{
                  enter: (d: number) => ({ x: d > 0 ? '100%' : d < 0 ? '-100%' : 0, opacity: 0.5 }),
                  center: { x: 0, opacity: 1 },
                  exit: (d: number) => ({ x: d > 0 ? '-100%' : '100%', opacity: 0.5 }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'tween', ease: 'easeInOut', duration: 0.25 }}
              >
                <div className="grid grid-cols-7 gap-0.5 text-center">
                  {Array.from({ length: firstDow }).map((_, i) => <div key={`b${i}`} />)}
                  {Array.from({ length: days }, (_, i) => i + 1).map((day) => {
                    const ds = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const isSelected = date === ds;
                    const isToday = ds === new Date().toISOString().slice(0, 10);
                    return (
                      <button key={day} onClick={() => setDate(ds)} className={`w-9 h-9 mx-auto rounded-full text-[14px] flex items-center justify-center transition-colors ${isSelected ? 'bg-[#7f70ff] text-white font-bold' : isToday ? 'bg-[#f0edff] text-[#7f70ff] font-bold' : 'text-[#444] hover:bg-[#f0f0f0]'}`}>{day}</button>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Set time + Repeat */}
        <div className="border-t border-[#f0f0f5] px-5 py-3 space-y-1">
          <div className="flex items-center gap-3 py-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={timeDisplay ? '#7f70ff' : '#aaa'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            <button onClick={() => setShowTimePicker(true)} className="flex-1 text-left text-[15px] font-medium" style={{ color: timeDisplay ? '#7f70ff' : '#555' }}>{timeDisplay || 'Establecer hora'}</button>
            {timeDisplay && (
              <button onClick={() => setTime(undefined)} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-[#fff5f5] transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff4d4d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            )}
          </div>
          <div className="flex items-center gap-3 py-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={repeatDisplay ? '#7f70ff' : '#aaa'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>
            <button onClick={() => setShowRepeat(true)} className="flex-1 text-left text-[15px] font-medium" style={{ color: repeatDisplay ? '#7f70ff' : '#555' }}>{repeatDisplay || 'Repetir'}</button>
            {repeatDisplay && (
              <button onClick={() => setRepeat(undefined)} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-[#fff5f5] transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff4d4d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 px-5 py-4 border-t border-[#f0f0f5]">
          <button onClick={onClose} className="text-[14px] font-medium text-[#888] hover:bg-[#f5f5f7] px-4 py-2 rounded-lg transition-colors">Cancelar</button>
          <button onClick={handleSave} className="text-[14px] font-medium text-white bg-[#7f70ff] hover:bg-[#6c5dd4] px-4 py-2 rounded-lg transition-colors">Listo</button>
        </div>

        {/* Sub-modals */}
        <AnimatePresence>
          {showTimePicker && (() => {
            const now = new Date();
            const h = time ? parseInt(time.split(':')[0]) : now.getHours();
            const min = time ? parseInt(time.split(':')[1]) : now.getMinutes();
            return (
              <TimePickerModal
                initialHour={h}
                initialMinute={min}
                onClose={() => setShowTimePicker(false)}
                onSave={(h24, m) => setTime(`${h24}:${m}`)}
                onClear={() => setTime(undefined)}
              />
            );
          })()}
        </AnimatePresence>

        <AnimatePresence>
          {showRepeat && (
            <RepeatModal
              initialRepeat={repeat}
              startDate={date}
              onClose={() => setShowRepeat(false)}
              onSave={(r) => setRepeat(r)}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

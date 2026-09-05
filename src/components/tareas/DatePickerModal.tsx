import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  initialDate?: string;
  onClose: () => void;
  onSave: (date: string) => void;
}

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DOW = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export function DatePickerModal({ initialDate, onClose, onSave }: Props) {
  const [month, setMonth] = useState(() => (initialDate ? new Date(initialDate) : new Date()));
  const [date, setDate] = useState<string | undefined>(initialDate);
  const [direction, setDirection] = useState(0);
  const touchStart = useRef(0);

  const y = month.getFullYear();
  const m = month.getMonth();
  const days = new Date(y, m + 1, 0).getDate();
  let firstDow = new Date(y, m, 1).getDay();
  firstDow = firstDow === 0 ? 6 : firstDow - 1;

  const prevMonth = () => { setDirection(-1); setMonth(new Date(y, m - 1, 1)); };
  const nextMonth = () => { setDirection(1); setMonth(new Date(y, m + 1, 1)); };

  const handleSave = () => {
    if (date) { onSave(date); onClose(); }
  };

  return (
    <div className="fixed inset-0 z-[2200] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/5" />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="bg-white rounded-[24px] w-full max-w-[340px] shadow-2xl relative overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f5f5f7] transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <span className="font-semibold text-[15px] text-[#333]">{MONTHS[m]} {y}</span>
          <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f5f5f7] transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>

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

        <div className="flex justify-end gap-3 px-5 py-4 border-t border-[#f0f0f5]">
          <button onClick={onClose} className="text-[14px] font-medium text-[#888] hover:bg-[#f5f5f7] px-4 py-2 rounded-lg transition-colors">Cancelar</button>
          <button onClick={handleSave} className="text-[14px] font-medium text-white bg-[#7f70ff] hover:bg-[#6c5dd4] px-4 py-2 rounded-lg transition-colors">Listo</button>
        </div>
      </motion.div>
    </div>
  );
}

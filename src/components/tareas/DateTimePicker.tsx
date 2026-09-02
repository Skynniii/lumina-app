import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  initialDate?: string;
  initialTime?: string;
  onSave: (date?: string, time?: string) => void;
  onClear: () => void;
}

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DOW = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function Wheel({ items, selected, onSelect, width = 50 }: { items: string[]; selected: string; onSelect: (v: string) => void; width?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const H = 36;

  useEffect(() => {
    if (!ref.current) return;
    const idx = items.indexOf(selected);
    if (idx !== -1) ref.current.scrollTop = idx * H;
  }, [items, selected]);

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const idx = Math.round(e.currentTarget.scrollTop / H);
    if (items[idx] && items[idx] !== selected) onSelect(items[idx]);
  };

  return (
    <div className="relative h-[108px] overflow-hidden bg-[#fcfcfc] rounded-xl border border-[#f0f0f0]" style={{ width }}>
      <div className="absolute top-1/2 left-0 w-full h-[36px] -translate-y-1/2 bg-[#f0edff] border-y border-[#7f70ff]/20 pointer-events-none" />
      <div ref={ref} onScroll={onScroll} className="h-full overflow-y-auto snap-y snap-mandatory no-scrollbar scroll-smooth relative z-10">
        <div style={{ height: H }} />
        {items.map((item) => (
          <div key={item} className="h-[36px] snap-center flex items-center justify-center text-[16px] font-medium text-[#333]">{item}</div>
        ))}
        <div style={{ height: H }} />
      </div>
    </div>
  );
}

export function DateTimePicker({ initialDate, initialTime, onSave, onClear }: Props) {
  const [month, setMonth] = useState(() => (initialDate ? new Date(initialDate) : new Date()));
  const [date, setDate] = useState<string | undefined>(initialDate);

  // Parse initial time to 12h format
  const initialHour24 = initialTime ? parseInt(initialTime.split(':')[0]) : 12;
  const initialPeriod: 'AM' | 'PM' = initialHour24 >= 12 ? 'PM' : 'AM';
  const initialHour12 = initialHour24 % 12 || 12;

  const [hour, setHour] = useState(String(initialHour12));
  const [minute, setMinute] = useState(initialTime?.split(':')[1] || '00');
  const [period, setPeriod] = useState<'AM' | 'PM'>(initialPeriod);
  const [hasTime, setHasTime] = useState(!!initialTime);

  const y = month.getFullYear();
  const m = month.getMonth();
  const days = new Date(y, m + 1, 0).getDate();
  let firstDow = new Date(y, m, 1).getDay();
  firstDow = firstDow === 0 ? 6 : firstDow - 1;

  const hours12 = Array.from({ length: 12 }, (_, i) => String(i + 1));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  const handleSave = () => {
    let timeStr: string | undefined;
    if (hasTime) {
      const h = parseInt(hour);
      const h24 = period === 'PM' ? (h === 12 ? 12 : h + 12) : (h === 12 ? 0 : h);
      timeStr = `${String(h24).padStart(2, '0')}:${minute}`;
    }
    onSave(date, timeStr);
  };

  return (
    <div className="bg-[#f8f8fa] rounded-2xl p-4 mt-2">
      {/* Calendario */}
      <div className="flex justify-between items-center mb-3">
        <button onClick={() => setMonth(new Date(y, m - 1, 1))} className="p-1.5 text-[#888] hover:bg-[#eee] rounded-full transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <span className="font-semibold text-[14px] text-[#333]">{MONTHS[m]} {y}</span>
        <button onClick={() => setMonth(new Date(y, m + 1, 1))} className="p-1.5 text-[#888] hover:bg-[#eee] rounded-full transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
        {DOW.map((d) => <span key={d} className="text-[11px] font-bold text-[#aaa]">{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {Array.from({ length: firstDow }).map((_, i) => <div key={`b${i}`} />)}
        {Array.from({ length: days }, (_, i) => i + 1).map((day) => {
          const ds = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          return (
            <button key={day} onClick={() => setDate(ds)} className={`w-8 h-8 mx-auto rounded-full text-[13px] flex items-center justify-center transition-colors ${date === ds ? 'bg-[#7f70ff] text-white font-bold' : 'text-[#444] hover:bg-[#eee]'}`}>{day}</button>
          );
        })}
      </div>

      {/* Selector de hora */}
      <div className="mt-4 pt-4 border-t border-[#eaeaea]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[13px] font-medium text-[#555]">Hora</span>
          <button onClick={() => setHasTime(!hasTime)} className={`relative w-[40px] h-[24px] rounded-full transition-colors ${hasTime ? 'bg-[#7f70ff]' : 'bg-[#d1d1d6]'}`}>
            <span className={`absolute top-[2px] w-[20px] h-[20px] bg-white rounded-full shadow-sm transition-transform ${hasTime ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
          </button>
        </div>
        <AnimatePresence>
          {hasTime && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="flex items-center justify-center gap-2 py-2">
                <Wheel items={hours12} selected={hour} onSelect={setHour} width={50} />
                <span className="text-xl font-bold text-[#888]">:</span>
                <Wheel items={minutes} selected={minute} onSelect={setMinute} width={60} />
                <div className="flex flex-col gap-1 ml-1">
                  <button onClick={() => setPeriod('AM')} className={`px-3 py-1.5 rounded-lg text-[13px] font-bold transition-colors ${period === 'AM' ? 'bg-[#7f70ff] text-white' : 'bg-[#eee] text-[#888]'}`}>AM</button>
                  <button onClick={() => setPeriod('PM')} className={`px-3 py-1.5 rounded-lg text-[13px] font-bold transition-colors ${period === 'PM' ? 'bg-[#7f70ff] text-white' : 'bg-[#eee] text-[#888]'}`}>PM</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Acciones */}
      <div className="flex justify-between mt-4 pt-3 border-t border-[#eaeaea]">
        <button onClick={onClear} className="px-3 py-1.5 text-[13px] font-medium text-[#ff4d4d] hover:bg-[#fff5f5] rounded-lg transition-colors">Limpiar</button>
        <button onClick={handleSave} className="px-4 py-1.5 bg-[#7f70ff] text-white text-[13px] font-medium rounded-lg shadow-sm hover:bg-[#6c5dd4] transition-colors">Guardar</button>
      </div>
    </div>
  );
}

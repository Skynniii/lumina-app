import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props { isOpen: boolean; initialDate?: string; initialTime?: string; onClose: () => void; onSave: (date?: string, time?: string) => void; }

const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const diasSemana = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

const RuedaScroll = ({ items, selected, onSelect }: { items: string[], selected: string, onSelect: (val: string) => void }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemHeight = 40;
  useEffect(() => { if (containerRef.current) { const index = items.indexOf(selected); if (index !== -1) containerRef.current.scrollTop = index * itemHeight; } }, []);
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => { const index = Math.round(e.currentTarget.scrollTop / itemHeight); if (items[index] && items[index] !== selected) onSelect(items[index]); };
  return (
    <div className="relative h-[120px] w-[60px] overflow-hidden bg-[#fcfcfc] rounded-xl border border-[#f0f0f0]">
      <div className="absolute top-1/2 left-0 w-full h-[40px] -translate-y-1/2 bg-[#f0edff] border-y border-[#7f70ff]/20 pointer-events-none" />
      <div ref={containerRef} onScroll={handleScroll} className="h-full overflow-y-auto snap-y snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth relative z-10">
        <div style={{ height: itemHeight }} />
        {items.map((item) => <div key={item} className="h-[40px] snap-center flex items-center justify-center text-[18px] font-medium text-[#333]">{item}</div>)}
        <div style={{ height: itemHeight }} />
      </div>
    </div>
  );
};

export const SelectorFechaHora = ({ isOpen, initialDate, initialTime, onClose, onSave }: Props) => {
  const [view, setView] = useState<'calendar' | 'time'>('calendar');
  const [currentMonth, setCurrentMonth] = useState(initialDate ? new Date(initialDate) : new Date());
  const [selectedDate, setSelectedDate] = useState<string | undefined>(initialDate);
  const [selectedHour, setSelectedHour] = useState<string>(initialTime ? initialTime.split(':')[0] : '12');
  const [selectedMinute, setSelectedMinute] = useState<string>(initialTime ? initialTime.split(':')[1] : '00');
  
  const [hasSetTime, setHasSetTime] = useState(!!initialTime); // NUEVO: Rastrea si se tocó la hora

  const year = currentMonth.getFullYear(); const month = currentMonth.getMonth(); const daysInMonth = new Date(year, month + 1, 0).getDate();
  let firstDayIndex = new Date(year, month, 1).getDay(); firstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
  const handlePrevMonth = () => setCurrentMonth(new Date(year, month - 1, 1)); const handleNextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));
  const horas = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')); const minutos = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} className="bg-white rounded-[24px] w-full max-w-[320px] shadow-2xl relative overflow-hidden">
        <AnimatePresence mode="wait">
          {view === 'calendar' && (
            <motion.div key="calendar" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="p-5">
              <div className="flex justify-between items-center mb-4">
                <button onClick={handlePrevMonth} className="p-2 text-[#888] hover:bg-[#f0f0f0] rounded-full">&lt;</button>
                <span className="font-semibold text-[#333]">{meses[month]} {year}</span>
                <button onClick={handleNextMonth} className="p-2 text-[#888] hover:bg-[#f0f0f0] rounded-full">&gt;</button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center mb-2">{diasSemana.map(d => <span key={d} className="text-[12px] font-bold text-[#aaa]">{d}</span>)}</div>
              <div className="grid grid-cols-7 gap-1 text-center">
                {Array.from({ length: firstDayIndex }).map((_, i) => <div key={`blank-${i}`} />)}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                  const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  return (
                    <button key={day} onClick={() => setSelectedDate(dateString)} className={`w-8 h-8 mx-auto rounded-full text-[14px] flex items-center justify-center transition-colors ${selectedDate === dateString ? 'bg-[#7f70ff] text-white font-bold shadow-md' : 'text-[#444] hover:bg-[#f0f0f0]'}`}>{day}</button>
                  );
                })}
              </div>
              <div className="mt-5 border-t border-[#f0f0f0] pt-4">
                <button onClick={() => { setView('time'); setHasSetTime(true); }} className="w-full py-2.5 bg-[#fcfcfd] border border-[#e8e8ed] rounded-xl text-[14px] font-medium text-[#555] hover:bg-[#f0edff] hover:text-[#7f70ff] transition-colors">
                  ⏱️ Establecer hora {hasSetTime && `(${selectedHour}:${selectedMinute})`}
                </button>
              </div>
            </motion.div>
          )}
          {view === 'time' && (
            <motion.div key="time" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }} className="p-5 flex flex-col items-center">
              <h3 className="font-semibold text-[#333] mb-5">Establecer Hora</h3>
              <div className="flex gap-4 items-center mb-6">
                <RuedaScroll items={horas} selected={selectedHour} onSelect={setSelectedHour} />
                <span className="text-2xl font-bold text-[#888] pb-1">:</span>
                <RuedaScroll items={minutos} selected={selectedMinute} onSelect={setSelectedMinute} />
              </div>
              <button onClick={() => setView('calendar')} className="text-[13px] text-[#888] underline mb-4">Volver al calendario</button>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="p-4 bg-[#f8f9fa] border-t border-[#eaeaea] flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-[14px] font-medium text-[#666] hover:bg-[#e0e0e0] rounded-xl transition-colors">Cancelar</button>
          {/* Se guarda la hora SOLO si se activó */}
          <button onClick={() => { onSave(selectedDate, hasSetTime ? `${selectedHour}:${selectedMinute}` : undefined); onClose(); }} className="px-4 py-2 bg-[#7f70ff] text-white text-[14px] font-medium rounded-xl shadow-md hover:bg-[#6c5dd4] transition-colors">Guardar</button>
        </div>
      </motion.div>
    </div>
  );
};
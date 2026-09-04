import { useState } from 'react';
import { motion } from 'framer-motion';

interface Props {
  initialHour12: number;
  initialMinute: number;
  initialPeriod: 'AM' | 'PM';
  onClose: () => void;
  onSave: (hour24: string, minute: string) => void;
  onClear: () => void;
}

function AnalogClock({ selected, onSelect }: { selected: number; onSelect: (n: number) => void }) {
  const size = 260;
  const center = size / 2;
  const radius = size / 2 - 15;
  const numbers = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <svg width={size} height={size} className="touch-none select-none">
      <circle cx={center} cy={center} r={radius} fill="#f0f0f5" />
      {numbers.map((n) => {
        const angle = ((n * 30 - 90) * Math.PI) / 180;
        const x = center + Math.cos(angle) * (radius - 28);
        const y = center + Math.sin(angle) * (radius - 28);
        const isSelected = selected === n;
        return (
          <g key={n} onClick={() => onSelect(n)} style={{ cursor: 'pointer' }}>
            {isSelected && <circle cx={x} cy={y} r={20} fill="#7f70ff" />}
            <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fill={isSelected ? 'white' : '#555'} fontSize="16" fontWeight="600" style={{ pointerEvents: 'none' }}>{n}</text>
          </g>
        );
      })}
      {selected > 0 && (() => {
        const angle = ((selected * 30 - 90) * Math.PI) / 180;
        const x = center + Math.cos(angle) * (radius - 28);
        const y = center + Math.sin(angle) * (radius - 28);
        return <line x1={center} y1={center} x2={x} y2={y} stroke="#7f70ff" strokeWidth="2.5" strokeLinecap="round" />;
      })()}
    </svg>
  );
}

const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

export function TimePickerModal({ initialHour12, initialMinute, initialPeriod, onClose, onSave, onClear }: Props) {
  const [hour, setHour] = useState(initialHour12);
  const [minute, setMinute] = useState(initialMinute);
  const [period, setPeriod] = useState<'AM' | 'PM'>(initialPeriod);

  const handleSave = () => {
    const h24 = period === 'PM' ? (hour === 12 ? 12 : hour + 12) : (hour === 12 ? 0 : hour);
    onSave(String(h24).padStart(2, '0'), String(minute).padStart(2, '0'));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[2100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="bg-white rounded-[24px] w-full max-w-[320px] shadow-2xl relative overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <span className="text-[16px] font-semibold text-[#333]">Seleccionar hora</span>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        {/* Digital display */}
        <div className="flex items-center justify-center gap-2 py-3">
          <div className="bg-[#f0edff] rounded-xl px-4 py-2">
            <span className="text-[28px] font-bold text-[#7f70ff] tabular-nums">{String(hour).padStart(2, '0')}</span>
          </div>
          <span className="text-[24px] font-bold text-[#aaa]">:</span>
          <div className="bg-[#f5f5f7] rounded-xl px-4 py-2">
            <span className="text-[28px] font-bold text-[#555] tabular-nums">{String(minute).padStart(2, '0')}</span>
          </div>
          <div className="flex flex-col gap-1 ml-1">
            <button onClick={() => setPeriod('AM')} className={`px-3 py-1.5 rounded-lg text-[13px] font-bold transition-colors ${period === 'AM' ? 'bg-[#7f70ff] text-white' : 'bg-[#f0f0f0] text-[#888]'}`}>AM</button>
            <button onClick={() => setPeriod('PM')} className={`px-3 py-1.5 rounded-lg text-[13px] font-bold transition-colors ${period === 'PM' ? 'bg-[#7f70ff] text-white' : 'bg-[#f0f0f0] text-[#888]'}`}>PM</button>
          </div>
        </div>

        {/* Analog clock */}
        <div className="flex justify-center pb-3">
          <AnalogClock selected={hour} onSelect={setHour} />
        </div>

        {/* Minutes */}
        <div className="px-5 pb-3">
          <span className="text-[12px] font-medium text-[#999] mb-2 block">Minutos</span>
          <div className="flex flex-wrap gap-1.5">
            {MINUTES.map((m) => (
              <button key={m} onClick={() => setMinute(m)} className={`px-2.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${minute === m ? 'bg-[#7f70ff] text-white' : 'bg-[#f5f5f7] text-[#666] hover:bg-[#eee]'}`}>
                {String(m).padStart(2, '0')}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center px-5 py-4 border-t border-[#f0f0f5]">
          <button onClick={() => { onClear(); onClose(); }} className="text-[14px] font-medium text-[#ff4d4d] hover:bg-[#fff5f5] px-3 py-1.5 rounded-lg transition-colors">Borrar hora</button>
          <div className="flex gap-3">
            <button onClick={onClose} className="text-[14px] font-medium text-[#888] hover:bg-[#f5f5f7] px-3 py-1.5 rounded-lg transition-colors">Cancelar</button>
            <button onClick={handleSave} className="text-[14px] font-medium text-[#7f70ff] hover:bg-[#f0edff] px-3 py-1.5 rounded-lg transition-colors">OK</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

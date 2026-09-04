import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../../context/SettingsContext';

interface Props {
  initialHour: number;
  initialMinute: number;
  onClose: () => void;
  onSave: (hour24: string, minute: string) => void;
  onClear: () => void;
}

type Mode = 'hour' | 'minute';

const SIZE = 280;
const CENTER = SIZE / 2;
const OUTER_R = 112;
const INNER_R = 76;
const MINUTE_R = 112;

function getPos(value: number, total: number, radius: number) {
  const angle = ((value * (360 / total) - 90) * Math.PI) / 180;
  return { x: CENTER + Math.cos(angle) * radius, y: CENTER + Math.sin(angle) * radius };
}

export function TimePickerModal({ initialHour, initialMinute, onClose, onSave, onClear }: Props) {
  const { settings } = useSettings();
  const is12h = settings.timeFormat === '12h';

  const [mode, setMode] = useState<Mode>('hour');
  const [hour24, setHour24] = useState(initialHour);
  const [minute, setMinute] = useState(initialMinute);
  const [period, setPeriod] = useState<'AM' | 'PM'>(initialHour >= 12 ? 'PM' : 'AM');
  const [keyboardMode, setKeyboardMode] = useState(false);
  const [dragging, setDragging] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const displayHour12 = hour24 % 12 || 12;

  const handlePeriodChange = (p: 'AM' | 'PM') => {
    setPeriod(p);
    setHour24(prev => {
      const h12 = prev % 12 || 12;
      return p === 'PM' ? (h12 === 12 ? 12 : h12 + 12) : (h12 === 12 ? 0 : h12);
    });
  };

  const handleHourSelect = (h: number) => {
    if (is12h) {
      setHour24(period === 'PM' ? (h === 12 ? 12 : h + 12) : (h === 12 ? 0 : h));
    } else {
      setHour24(h);
    }
  };

  const getPointerValue = (clientX: number, clientY: number): number | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const x = clientX - rect.left - CENTER;
    const y = clientY - rect.top - CENTER;
    const dist = Math.sqrt(x * x + y * y);
    let angle = Math.atan2(y, x) + Math.PI / 2;
    if (angle < 0) angle += 2 * Math.PI;
    if (mode === 'hour') {
      const h12 = Math.round(angle / (Math.PI / 6)) % 12;
      if (is12h) return h12 === 0 ? 12 : h12;
      return dist < (OUTER_R + INNER_R) / 2 ? h12 + 12 : h12;
    }
    return Math.round(angle / (Math.PI / 30)) % 60;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    const val = getPointerValue(e.clientX, e.clientY);
    if (val !== null) { mode === 'hour' ? handleHourSelect(val) : setMinute(val); }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const val = getPointerValue(e.clientX, e.clientY);
    if (val !== null) { mode === 'hour' ? handleHourSelect(val) : setMinute(val); }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
    if (mode === 'hour') setTimeout(() => setMode('minute'), 200);
  };

  const handleSave = () => {
    onSave(String(hour24).padStart(2, '0'), String(minute).padStart(2, '0'));
    onClose();
  };

  const renderHourClock = () => {
    if (is12h) {
      return (
        <svg ref={svgRef} width={SIZE} height={SIZE} className="touch-none select-none"
          onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
          <circle cx={CENTER} cy={CENTER} r={OUTER_R + 12} fill="#f0f0f5" />
          {Array.from({ length: 12 }, (_, i) => {
            const h = i === 0 ? 12 : i;
            const pos = getPos(i, 12, OUTER_R);
            const sel = displayHour12 === h;
            return (
              <g key={h}>
                {sel && <circle cx={pos.x} cy={pos.y} r={22} fill="#7f70ff" />}
                <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central" fill={sel ? 'white' : '#555'} fontSize="18" fontWeight="600" style={{ pointerEvents: 'none' }}>{h}</text>
              </g>
            );
          })}
          {(() => { const p = getPos(displayHour12 % 12, 12, OUTER_R); return <line x1={CENTER} y1={CENTER} x2={p.x} y2={p.y} stroke="#7f70ff" strokeWidth="2" strokeLinecap="round" />; })()}
        </svg>
      );
    }
    return (
      <svg ref={svgRef} width={SIZE} height={SIZE} className="touch-none select-none"
        onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
        <circle cx={CENTER} cy={CENTER} r={OUTER_R + 12} fill="#f0f0f5" />
        {Array.from({ length: 12 }, (_, i) => {
          const pos = getPos(i, 12, OUTER_R);
          const sel = hour24 === i;
          return (
            <g key={`o${i}`}>
              {sel && <circle cx={pos.x} cy={pos.y} r={20} fill="#7f70ff" />}
              <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central" fill={sel ? 'white' : '#555'} fontSize="16" fontWeight="600" style={{ pointerEvents: 'none' }}>{i}</text>
            </g>
          );
        })}
        {Array.from({ length: 12 }, (_, i) => {
          const h = i + 12;
          const pos = getPos(i, 12, INNER_R);
          const sel = hour24 === h;
          return (
            <g key={`i${h}`}>
              {sel && <circle cx={pos.x} cy={pos.y} r={18} fill="#7f70ff" />}
              <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central" fill={sel ? 'white' : '#888'} fontSize="14" fontWeight="600" style={{ pointerEvents: 'none' }}>{h}</text>
            </g>
          );
        })}
        {(() => { const inner = hour24 >= 12; const p = getPos(hour24 % 12, 12, inner ? INNER_R : OUTER_R); return <line x1={CENTER} y1={CENTER} x2={p.x} y2={p.y} stroke="#7f70ff" strokeWidth="2" strokeLinecap="round" />; })()}
      </svg>
    );
  };

  const renderMinuteClock = () => (
    <svg ref={svgRef} width={SIZE} height={SIZE} className="touch-none select-none"
      onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
      <circle cx={CENTER} cy={CENTER} r={MINUTE_R + 12} fill="#f0f0f5" />
      {Array.from({ length: 60 }, (_, i) => {
        const pos = getPos(i, 60, MINUTE_R);
        return <circle key={`d${i}`} cx={pos.x} cy={pos.y} r={i % 5 === 0 ? 3 : 1.5} fill="#c0c0c0" />;
      })}
      {Array.from({ length: 12 }, (_, i) => {
        const m = i * 5;
        const pos = getPos(i, 12, MINUTE_R);
        return <text key={`n${m}`} x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central" fill="#555" fontSize="16" fontWeight="600" style={{ pointerEvents: 'none' }}>{m}</text>;
      })}
      {(() => { const p = getPos(minute, 60, MINUTE_R); return (
        <>
          <line x1={CENTER} y1={CENTER} x2={p.x} y2={p.y} stroke="#7f70ff" strokeWidth="2" strokeLinecap="round" />
          <circle cx={p.x} cy={p.y} r={20} fill="#7f70ff" />
          <text x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fill="white" fontSize="14" fontWeight="600" style={{ pointerEvents: 'none' }}>{minute}</text>
        </>
      ); })()}
    </svg>
  );

  return (
    <div className="fixed inset-0 z-[2100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/10" />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="bg-white rounded-[24px] w-full max-w-[320px] shadow-2xl relative overflow-hidden"
      >
        <div className="px-5 pt-5 pb-2">
          <span className="text-[16px] font-semibold text-[#333]">Seleccionar hora</span>
        </div>

        {/* Digital display */}
        <div className="flex items-center justify-center gap-2 py-3">
          <button onClick={() => { setMode('hour'); setKeyboardMode(true); }}
            className={`rounded-xl px-4 py-2 transition-colors ${mode === 'hour' && !keyboardMode ? 'bg-[#f0edff]' : 'bg-[#f5f5f7]'}`}>
            <span className={`text-[28px] font-bold tabular-nums ${mode === 'hour' && !keyboardMode ? 'text-[#7f70ff]' : 'text-[#555]'}`}>
              {is12h ? String(displayHour12).padStart(2, '0') : String(hour24).padStart(2, '0')}
            </span>
          </button>
          <span className="text-[24px] font-bold text-[#aaa]">:</span>
          <button onClick={() => { setMode('minute'); setKeyboardMode(true); }}
            className={`rounded-xl px-4 py-2 transition-colors ${mode === 'minute' && !keyboardMode ? 'bg-[#f0edff]' : 'bg-[#f5f5f7]'}`}>
            <span className={`text-[28px] font-bold tabular-nums ${mode === 'minute' && !keyboardMode ? 'text-[#7f70ff]' : 'text-[#555]'}`}>
              {String(minute).padStart(2, '0')}
            </span>
          </button>
          {is12h && (
            <div className="flex flex-col gap-1 ml-1">
              <button onClick={() => handlePeriodChange('AM')} className={`px-3 py-1.5 rounded-lg text-[13px] font-bold transition-colors ${period === 'AM' ? 'bg-[#7f70ff] text-white' : 'bg-[#f0f0f0] text-[#888]'}`}>AM</button>
              <button onClick={() => handlePeriodChange('PM')} className={`px-3 py-1.5 rounded-lg text-[13px] font-bold transition-colors ${period === 'PM' ? 'bg-[#7f70ff] text-white' : 'bg-[#f0f0f0] text-[#888]'}`}>PM</button>
            </div>
          )}
        </div>

        {/* Clock or Keyboard */}
        <div className="flex justify-center items-center pb-3 min-h-[280px]">
          <AnimatePresence mode="wait">
            {keyboardMode ? (
              <motion.div key="kb" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center gap-3 px-5 w-full">
                <input
                  key={`${mode}-kb`}
                  type="number"
                  defaultValue={mode === 'hour' ? (is12h ? displayHour12 : hour24) : minute}
                  onChange={(e) => {
                    const num = parseInt(e.target.value);
                    if (!isNaN(num)) {
                      if (mode === 'hour') {
                        if (is12h) { if (num >= 1 && num <= 12) handleHourSelect(num); }
                        else { if (num >= 0 && num <= 23) setHour24(num); }
                      } else { if (num >= 0 && num <= 59) setMinute(num); }
                    }
                  }}
                  className="w-[120px] text-center text-[24px] font-bold bg-[#f5f5f7] rounded-xl border-2 border-[#7f70ff] px-3 py-2 text-[#333] outline-none"
                  autoFocus
                />
                <span className="text-[13px] text-[#999]">{mode === 'hour' ? (is12h ? 'Horas (1-12)' : 'Horas (0-23)') : 'Minutos (0-59)'}</span>
                <button onClick={() => setKeyboardMode(false)} className="text-[14px] font-medium text-[#7f70ff] hover:bg-[#f0edff] px-4 py-2 rounded-lg transition-colors">Volver al reloj</button>
              </motion.div>
            ) : (
              <motion.div key={mode} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                {mode === 'hour' ? renderHourClock() : renderMinuteClock()}
              </motion.div>
            )}
          </AnimatePresence>
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

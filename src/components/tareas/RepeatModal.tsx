import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RepeatConfig } from '../../types';
import { DatePickerModal } from './DatePickerModal';

interface Props {
  initialRepeat?: RepeatConfig;
  startDate?: string;
  onClose: () => void;
  onSave: (repeat: RepeatConfig) => void;
}

const FREQUENCIES = [
  { value: 'daily', label: 'Día' },
  { value: 'weekly', label: 'Semana' },
  { value: 'monthly', label: 'Mes' },
  { value: 'yearly', label: 'Año' },
] as const;

const DAYS = [
  { idx: 0, label: 'D' },
  { idx: 1, label: 'L' },
  { idx: 2, label: 'M' },
  { idx: 3, label: 'X' },
  { idx: 4, label: 'J' },
  { idx: 5, label: 'V' },
  { idx: 6, label: 'S' },
];

function formatDateDisplay(ds: string) {
  if (!ds) return 'Seleccionar fecha';
  const d = new Date(ds + 'T00:00:00');
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function RepeatModal({ initialRepeat, startDate, onClose, onSave }: Props) {
  const [frequency, setFrequency] = useState<RepeatConfig['frequency']>(initialRepeat?.frequency || 'weekly');
  const [interval, setInterval] = useState(initialRepeat?.interval || 1);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(initialRepeat?.daysOfWeek || [new Date().getDay()]);
  const [start, setStart] = useState(initialRepeat?.startDate || startDate || new Date().toISOString().slice(0, 10));
  const [endType, setEndType] = useState<RepeatConfig['endType']>(initialRepeat?.endType || 'never');
  const [endDate, setEndDate] = useState(initialRepeat?.endDate || '');
  const [occurrences, setOccurrences] = useState(initialRepeat?.occurrences || 10);
  const [hideUntilNextRepeat, setHideUntilNextRepeat] = useState(initialRepeat?.hideUntilNextRepeat || false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [dropdownOpen]);

  const toggleDay = (idx: number) => {
    setDaysOfWeek((prev) => prev.includes(idx) ? prev.filter((d) => d !== idx) : [...prev, idx]);
  };

  const handleSave = () => {
    onSave({
      enabled: true,
      frequency,
      interval,
      daysOfWeek: frequency === 'weekly' ? daysOfWeek : undefined,
      startDate: start,
      endType,
      endDate: endType === 'on' ? endDate : undefined,
      occurrences: endType === 'after' ? occurrences : undefined,
      hideUntilNextRepeat,
    });
    onClose();
  };

  const freqLabel = FREQUENCIES.find(f => f.value === frequency)?.label || '';
  const freqPlural = interval > 1 ? 's' : '';

  return (
    <div className="fixed inset-0 z-[2100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/10" />
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="bg-white rounded-[24px] w-full max-w-[340px] max-h-[85vh] shadow-2xl relative overflow-y-auto no-scrollbar"
      >
        <div className="px-5 pt-5 pb-3 sticky top-0 bg-white z-10">
          <span className="text-[18px] font-bold text-[#333]">Repetir</span>
        </div>

        <div className="px-5 pb-5 space-y-5">
          {/* Cada cuanto */}
          <div>
            <label className="text-[13px] font-semibold text-[#555] mb-2 block">Cada</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={interval}
                onChange={(e) => setInterval(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-[60px] text-center bg-[#f5f5f7] rounded-xl border border-[#e8e8ed] px-3 py-2.5 text-[15px] font-medium text-[#333] outline-none focus:border-[#7f70ff]"
              />
              {/* Custom dropdown */}
              <div className="relative flex-1" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-full flex items-center justify-between bg-[#f5f5f7] rounded-xl border border-[#e8e8ed] px-3 py-2.5 text-[15px] font-medium text-[#333] outline-none focus:border-[#7f70ff] transition-colors"
                >
                  <span>{freqLabel}{freqPlural}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9" /></svg>
                </button>
                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full mt-1 left-0 right-0 bg-white rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-[#eaeaea] py-1 z-20 overflow-hidden"
                    >
                      {FREQUENCIES.map((f) => (
                        <button
                          key={f.value}
                          onClick={() => { setFrequency(f.value); setDropdownOpen(false); }}
                          className="w-full flex items-center justify-between px-3 py-2.5 text-[14px] text-[#555] hover:bg-[#f8f9fa] transition-colors"
                        >
                          <span>{f.label}{interval > 1 ? 's' : ''}</span>
                          {frequency === f.value && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7f70ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {frequency === 'weekly' && (
              <div className="mt-3">
                <label className="text-[13px] font-medium text-[#999] mb-2 block">Repetir los días</label>
                <div className="flex gap-1.5">
                  {DAYS.map((d) => {
                    const selected = daysOfWeek.includes(d.idx);
                    return (
                      <button
                        key={d.idx}
                        onClick={() => toggleDay(d.idx)}
                        className={`w-8 h-8 rounded-full text-[13px] font-bold transition-all ${selected ? 'bg-[#7f70ff] text-white' : 'bg-[#f0f0f0] text-[#999] hover:bg-[#e8e8ed]'}`}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Empieza */}
          <div>
            <label className="text-[13px] font-semibold text-[#555] mb-2 block">Empieza</label>
            <button
              onClick={() => setShowStartPicker(true)}
              className="w-full flex items-center justify-between bg-[#f5f5f7] rounded-xl border border-[#e8e8ed] px-3 py-2.5 text-[15px] font-medium text-[#333] outline-none focus:border-[#7f70ff] transition-colors"
            >
              <span>{formatDateDisplay(start)}</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
            </button>
          </div>

          {/* Termina */}
          <div>
            <label className="text-[13px] font-semibold text-[#555] mb-2 block">Termina</label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="radio" checked={endType === 'never'} onChange={() => setEndType('never')} className="accent-[#7f70ff] w-4 h-4" />
                <span className="text-[15px] text-[#444]">Nunca</span>
              </label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-3 cursor-pointer flex-1">
                  <input type="radio" checked={endType === 'on'} onChange={() => setEndType('on')} className="accent-[#7f70ff] w-4 h-4" />
                  <span className="text-[15px] text-[#444]">El</span>
                </label>
                <button
                  onClick={() => endType === 'on' && setShowEndPicker(true)}
                  disabled={endType !== 'on'}
                  className="flex-1 flex items-center justify-between bg-[#f5f5f7] rounded-xl border border-[#e8e8ed] px-3 py-2 text-[14px] text-[#333] outline-none focus:border-[#7f70ff] transition-colors disabled:opacity-40 text-left"
                >
                  <span>{endDate ? formatDateDisplay(endDate) : 'Seleccionar fecha'}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                </button>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="radio" checked={endType === 'after'} onChange={() => setEndType('after')} className="accent-[#7f70ff] w-4 h-4" />
                <span className="text-[15px] text-[#444]">Después de</span>
                <input
                  type="number"
                  min={1}
                  value={occurrences}
                  onChange={(e) => setOccurrences(Math.max(1, parseInt(e.target.value) || 1))}
                  disabled={endType !== 'after'}
                  className="w-[60px] text-center bg-[#f5f5f7] rounded-xl border border-[#e8e8ed] px-2 py-2 text-[14px] text-[#333] outline-none focus:border-[#7f70ff] disabled:opacity-40"
                />
                <span className="text-[15px] text-[#444]">veces</span>
              </label>
            </div>
          </div>
        </div>

        {/* Ocultar hasta la próxima repetición */}
        <div className="px-5 pb-5">
          <label className="flex items-center gap-3 cursor-pointer">
            <button
              type="button"
              onClick={() => setHideUntilNextRepeat(!hideUntilNextRepeat)}
              className={`relative w-[44px] h-[26px] rounded-full transition-colors ${hideUntilNextRepeat ? 'bg-[#7f70ff]' : 'bg-[#e0e0e0]'}`}
            >
              <span className={`absolute top-[3px] w-[20px] h-[20px] bg-white rounded-full shadow-sm transition-transform ${hideUntilNextRepeat ? 'left-[21px]' : 'left-[3px]'}`} />
            </button>
            <span className="text-[15px] text-[#444]">Ocultar hasta la próxima repetición</span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 px-5 py-4 border-t border-[#f0f0f5] sticky bottom-0 bg-white">
          <button onClick={onClose} className="text-[14px] font-medium text-[#888] hover:bg-[#f5f5f7] px-4 py-2 rounded-lg transition-colors">Cancelar</button>
          <button onClick={handleSave} className="text-[14px] font-medium text-white bg-[#7f70ff] hover:bg-[#6c5dd4] px-4 py-2 rounded-lg transition-colors">Guardar</button>
        </div>

        {/* Date picker sub-modals */}
        <AnimatePresence>
          {showStartPicker && (
            <DatePickerModal
              initialDate={start}
              onClose={() => setShowStartPicker(false)}
              onSave={(d) => setStart(d)}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showEndPicker && (
            <DatePickerModal
              initialDate={endDate}
              onClose={() => setShowEndPicker(false)}
              onSave={(d) => setEndDate(d)}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

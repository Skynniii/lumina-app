import { useState } from 'react';
import { motion } from 'framer-motion';
import type { RepeatConfig } from '../../types';

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

export function RepeatModal({ initialRepeat, startDate, onClose, onSave }: Props) {
  const [frequency, setFrequency] = useState<RepeatConfig['frequency']>(initialRepeat?.frequency || 'weekly');
  const [interval, setInterval] = useState(initialRepeat?.interval || 1);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(initialRepeat?.daysOfWeek || [new Date().getDay()]);
  const [start, setStart] = useState(initialRepeat?.startDate || startDate || new Date().toISOString().slice(0, 10));
  const [endType, setEndType] = useState<RepeatConfig['endType']>(initialRepeat?.endType || 'never');
  const [endDate, setEndDate] = useState(initialRepeat?.endDate || '');
  const [occurrences, setOccurrences] = useState(initialRepeat?.occurrences || 10);

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
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[2100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="bg-white rounded-[24px] w-full max-w-[340px] max-h-[85vh] shadow-2xl relative overflow-y-auto no-scrollbar"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 sticky top-0 bg-white z-10">
          <span className="text-[18px] font-bold text-[#333]">Repetir</span>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
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
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as RepeatConfig['frequency'])}
                className="flex-1 bg-[#f5f5f7] rounded-xl border border-[#e8e8ed] px-3 py-2.5 text-[15px] font-medium text-[#333] outline-none focus:border-[#7f70ff] cursor-pointer"
              >
                {FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}{interval > 1 ? 's' : ''}</option>)}
              </select>
            </div>

            {/* Días de la semana (solo para weekly) */}
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
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="w-full bg-[#f5f5f7] rounded-xl border border-[#e8e8ed] px-3 py-2.5 text-[15px] font-medium text-[#333] outline-none focus:border-[#7f70ff]"
            />
          </div>

          {/* Termina */}
          <div>
            <label className="text-[13px] font-semibold text-[#555] mb-2 block">Termina</label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="radio" checked={endType === 'never'} onChange={() => setEndType('never')} className="accent-[#7f70ff] w-4 h-4" />
                <span className="text-[15px] text-[#444]">Nunca</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="radio" checked={endType === 'on'} onChange={() => setEndType('on')} className="accent-[#7f70ff] w-4 h-4" />
                <span className="text-[15px] text-[#444]">El</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={endType !== 'on'}
                  className="flex-1 bg-[#f5f5f7] rounded-xl border border-[#e8e8ed] px-3 py-2 text-[14px] text-[#333] outline-none focus:border-[#7f70ff] disabled:opacity-40"
                />
              </label>
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

        {/* Actions */}
        <div className="flex justify-end gap-3 px-5 py-4 border-t border-[#f0f0f5] sticky bottom-0 bg-white">
          <button onClick={onClose} className="text-[14px] font-medium text-[#888] hover:bg-[#f5f5f7] px-4 py-2 rounded-lg transition-colors">Cancelar</button>
          <button onClick={handleSave} className="text-[14px] font-medium text-white bg-[#7f70ff] hover:bg-[#6c5dd4] px-4 py-2 rounded-lg transition-colors">Guardar</button>
        </div>
      </motion.div>
    </div>
  );
}

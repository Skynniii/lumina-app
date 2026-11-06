import { useState } from 'react';
import { motion } from 'framer-motion';
import { ACTIVITY_COLORS } from '../../hooks/useTimeTracker';
import { useBackHandler } from '../../hooks/useBackHandler';
import type { Activity } from '../../types';

interface Props {
  activity: Activity;
  onClose: () => void;
  onSave: (updates: { name: string; color: string }) => void;
  onRequestDelete: () => void;
}

/** Edición de nombre y color de una actividad, en ventana modal centrada. */
export function ActivityEditModal({ activity, onClose, onSave, onRequestDelete }: Props) {
  useBackHandler(true, onClose);
  const [name, setName] = useState(activity.name);
  const [color, setColor] = useState(activity.color);

  const submit = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), color });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1600] flex items-center justify-center p-5">
      <motion.div
        className="absolute inset-0 bg-black/40"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="relative w-full max-w-[340px] bg-white rounded-[24px] p-5 shadow-[0_10px_40px_rgba(0,0,0,0.18)] flex flex-col gap-4"
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 12 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full shrink-0" style={{ background: color }} />
          <h2 className="text-[17px] font-bold text-[#333] m-0">Editar actividad</h2>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[12px] font-bold uppercase tracking-wider text-[#a0a0a0]">Nombre</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
            placeholder="Nombre de la actividad"
            autoFocus
            className="w-full border border-[#e4e4ed] rounded-xl py-3 px-3.5 text-[15px] text-[#333] bg-[#fafafc] outline-none focus:border-[#7f70ff] focus:bg-white transition-colors"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[12px] font-bold uppercase tracking-wider text-[#a0a0a0]">Color</label>
          <div className="flex flex-wrap gap-2.5">
            {ACTIVITY_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={`Color ${c}`}
                className="w-8 h-8 rounded-full border-none cursor-pointer transition-transform active:scale-90"
                style={{
                  background: c,
                  transform: color === c ? 'scale(1.1)' : undefined,
                  boxShadow: color === c ? `0 0 0 2.5px #fff, 0 0 0 4.5px ${c}` : undefined,
                }}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-[14px] font-semibold text-[#777] bg-[#f0f0f0] border-none cursor-pointer hover:bg-[#e4e4e4] transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={!name.trim()}
            className="flex-1 py-2.5 rounded-xl text-[14px] font-semibold text-white bg-[#7f70ff] border-none cursor-pointer hover:bg-[#6c5dd4] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Guardar
          </button>
        </div>

        <button
          onClick={onRequestDelete}
          className="-mt-1 self-center px-3 py-1.5 rounded-xl text-[13px] font-semibold text-[#ff5252] bg-[#ff5252]/10 border-none cursor-pointer flex items-center gap-1.5"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
          Eliminar actividad
        </button>
      </motion.div>
    </div>
  );
}

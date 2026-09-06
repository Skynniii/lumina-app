import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SelectorFechaHora } from './SelectorFechaHora';

interface Props {
  isOpen: boolean;
  listName?: string;
  onClose: () => void;
  onCreate: (data: { text: string; notes?: string; dueDate?: string; dueTime?: string; isImportant?: boolean }) => void;
}

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function fmtFecha(d?: string, t?: string) {
  if (!d) return null;
  const [, m, day] = d.split('-').map(Number);
  let s = `${day} ${MONTHS[m - 1]}`;
  if (t) {
    const [h, min] = t.split(':').map(Number);
    const h12 = h % 12 || 12;
    s += ` · ${h12}:${String(min).padStart(2, '0')} ${h >= 12 ? 'pm' : 'am'}`;
  }
  return s;
}

export function NuevaTareaModal({ isOpen, listName, onClose, onCreate }: Props) {
  const [text, setText] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState<string | undefined>(undefined);
  const [dueTime, setDueTime] = useState<string | undefined>(undefined);
  const [important, setImportant] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setText(''); setNotes(''); setDueDate(undefined); setDueTime(undefined); setImportant(false); setShowPicker(false);
    }
  }, [isOpen]);

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onCreate({ text: trimmed, notes: notes.trim() || undefined, dueDate, dueTime, isImportant: important });
    onClose();
  };

  const fechaLabel = fmtFecha(dueDate, dueTime);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 z-[998] backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] z-[999] bg-white rounded-t-[28px] shadow-[0_-8px_30px_rgba(0,0,0,0.12)] px-5 pt-3 pb-6"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 360, damping: 36 }}
          >
            <div className="w-10 h-1.5 bg-[#e4e4ed] rounded-full mx-auto mb-3" />
            <p className="text-center text-[13px] text-[#a0a0a0] font-medium mb-3">Nueva tarea{listName ? ` · ${listName}` : ''}</p>

            {/* Nombre */}
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="¿Qué tarea quieres añadir?"
              autoFocus
              className="w-full border border-[#e4e4ed] rounded-xl py-3 px-3.5 mb-3 text-[15px] text-[#333] bg-[#fafafc] outline-none focus:border-[#7f70ff] focus:bg-white transition-colors"
            />

            {/* Notas */}
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas (opcional)"
              rows={2}
              className="w-full border border-[#e4e4ed] rounded-xl py-2.5 px-3.5 mb-3 text-[14px] text-[#444] bg-[#fafafc] outline-none focus:border-[#7f70ff] focus:bg-white transition-colors resize-none"
            />

            {/* Configuración rápida */}
            <div className="flex gap-2.5 mb-4">
              <button
                onClick={() => setShowPicker(true)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[13px] font-medium border transition-colors ${fechaLabel ? 'border-[#7f70ff]/30 bg-[#f0edff] text-[#6b5cdb]' : 'border-[#e8e8ed] bg-[#fcfcfd] text-[#777]'}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                {fechaLabel || 'Fecha/hora'}
              </button>

              <button
                onClick={() => setImportant((v) => !v)}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-[13px] font-medium border transition-colors ${important ? 'border-[#ffcc00]/40 bg-[#fff9e6] text-[#b8860b]' : 'border-[#e8e8ed] bg-[#fcfcfd] text-[#777]'}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill={important ? '#ffcc00' : 'none'} stroke={important ? '#ffcc00' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                Importante
              </button>
            </div>

            {/* Acciones */}
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 border-none py-3 rounded-xl text-sm font-semibold cursor-pointer bg-[#f0f0f0] text-[#666] hover:bg-[#e4e4e4] transition-colors">
                Cancelar
              </button>
              <button
                onClick={submit}
                disabled={!text.trim()}
                className="flex-1 border-none py-3 rounded-xl text-sm font-semibold cursor-pointer bg-[#7f70ff] text-white shadow-[2px_4px_10px_rgba(127,112,255,0.3)] hover:bg-[#6c5dd4] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Crear tarea
              </button>
            </div>
          </motion.div>

          <SelectorFechaHora
            isOpen={showPicker}
            initialDate={dueDate}
            initialTime={dueTime}
            onClose={() => setShowPicker(false)}
            onSave={(d, t) => { setDueDate(d); setDueTime(t); }}
          />
        </>
      )}
    </AnimatePresence>
  );
}

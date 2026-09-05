import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  isOpen: boolean;
  type: 'alert' | 'confirm' | 'prompt';
  title: string;
  placeholder?: string;
  defaultValue?: string;
  onConfirm: (val: string) => void;
  onCancel: () => void;
}

export function ModalNeuromorfico({ isOpen, type, title, placeholder, defaultValue, onConfirm, onCancel }: Props) {
  const [val, setVal] = useState('');

  useEffect(() => {
    if (isOpen) setVal(defaultValue || '');
  }, [isOpen, defaultValue]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-[9999] backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="bg-white rounded-2xl p-6 w-[85%] max-w-[320px] shadow-[0_10px_25px_rgba(0,0,0,0.15)] text-center"
          >
            <p className="text-[16px] text-[#333] mb-5 font-semibold">{title}</p>

            {type === 'prompt' && (
              <input
                type="text"
                value={val}
                onChange={(e) => setVal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onConfirm(val)}
                placeholder={placeholder}
                className="w-full border border-[#e4e4ed] rounded-lg py-3 px-3.5 mb-5 text-[15px] text-[#444] bg-[#fafafc] outline-none focus:border-[#7f70ff] focus:bg-white transition-colors shadow-inner"
                autoFocus
              />
            )}

            <div className="flex justify-center gap-3">
              {type !== 'alert' && (
                <button onClick={onCancel} className="flex-1 border-none py-3 rounded-xl text-sm font-semibold cursor-pointer transition-colors bg-[#f0f0f0] text-[#666] hover:bg-[#e4e4e4]">
                  Cancelar
                </button>
              )}
              <button onClick={() => onConfirm(val)} className="flex-1 border-none py-3 rounded-xl text-sm font-semibold cursor-pointer transition-colors bg-[#7f70ff] text-white shadow-[2px_4px_10px_rgba(127,112,255,0.3)] hover:bg-[#6c5dd4]">
                Aceptar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTimeTracker, ACTIVITY_COLORS } from '../../hooks/useTimeTracker';
import { ModalNeuromorfico } from '../ui/ModalNeuromorfico';
import { useDeviceCapability } from '../../context/DeviceCapabilityContext';

interface Props {
  onBack: () => void;
}

export function ActivitiesPage({ onBack }: Props) {
  const { activities, addActivity, updateActivity, deleteActivity } = useTimeTracker();
  const cap = useDeviceCapability();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(ACTIVITY_COLORS[0]);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const startEdit = (id: string, name: string, color: string) => {
    setEditingId(id);
    setEditName(name);
    setEditColor(color);
  };

  const saveEdit = () => {
    if (editName.trim() && editingId) {
      updateActivity(editingId, { name: editName.trim(), color: editColor });
    }
    setEditingId(null);
  };

  const handleAdd = () => {
    if (newName.trim()) {
      addActivity(newName, newColor);
      setNewName('');
      setNewColor(ACTIVITY_COLORS[0]);
      setShowAdd(false);
    }
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed inset-0 z-[1500] bg-[#f7f6f9] flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-3 shrink-0">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors active:scale-90">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-[20px] font-bold text-[#333] m-0">Actividades</h1>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-5">
        <div className="flex flex-col gap-2.5">
          <AnimatePresence>
            {activities.map((a) => (
              <motion.div
                key={a.id}
                layout={cap.enableLayout}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-2xl shadow-[4px_4px_10px_#e6e6e6,-4px_-4px_10px_#ffffff] p-4"
              >
                {editingId === a.id ? (
                  <div className="flex flex-col gap-3">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      autoFocus
                      className="w-full bg-[#f7f6f9] rounded-xl px-3 py-2.5 text-[15px] text-[#333] outline-none border-none"
                    />
                    <div className="flex gap-2 flex-wrap">
                      {ACTIVITY_COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => setEditColor(c)}
                          className="w-8 h-8 rounded-full border-2 cursor-pointer transition-transform"
                          style={{ background: c, borderColor: editColor === c ? '#333' : 'transparent', transform: editColor === c ? 'scale(1.15)' : 'scale(1)' }}
                        />
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setEditingId(null)} className="flex-1 py-2.5 rounded-xl text-[14px] font-semibold text-[#777] bg-[#f0f0f0] border-none cursor-pointer">Cancelar</button>
                      <button onClick={saveEdit} className="flex-1 py-2.5 rounded-xl text-[14px] font-semibold text-white bg-[#7f70ff] border-none cursor-pointer">Guardar</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="w-4 h-4 rounded-full shrink-0" style={{ background: a.color }} />
                    <span className="flex-1 text-[16px] font-medium text-[#333]">{a.name}</span>
                    <button onClick={() => startEdit(a.id, a.name, a.color)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#f0edff] transition-colors border-none bg-transparent cursor-pointer">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                    </button>
                    <button onClick={() => setPendingDelete(a.id)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#fff5f5] transition-colors border-none bg-transparent cursor-pointer">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff6b81" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Botón agregar */}
          {showAdd ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-[4px_4px_10px_#e6e6e6,-4px_-4px_10px_#ffffff] p-4">
              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                  placeholder="Nombre de la actividad"
                  autoFocus
                  className="w-full bg-[#f7f6f9] rounded-xl px-3 py-2.5 text-[15px] text-[#333] outline-none border-none placeholder:text-[#aaa]"
                />
                <div className="flex gap-2 flex-wrap">
                  {ACTIVITY_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setNewColor(c)}
                      className="w-8 h-8 rounded-full border-2 cursor-pointer transition-transform"
                      style={{ background: c, borderColor: newColor === c ? '#333' : 'transparent', transform: newColor === c ? 'scale(1.15)' : 'scale(1)' }}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setShowAdd(false); setNewName(''); }} className="flex-1 py-2.5 rounded-xl text-[14px] font-semibold text-[#777] bg-[#f0f0f0] border-none cursor-pointer">Cancelar</button>
                  <button onClick={handleAdd} disabled={!newName.trim()} className="flex-1 py-2.5 rounded-xl text-[14px] font-semibold text-white bg-[#7f70ff] border-none cursor-pointer disabled:opacity-40">Crear</button>
                </div>
              </div>
            </motion.div>
          ) : (
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-dashed border-[#d9d9ff] text-[#7f70ff] bg-transparent cursor-pointer transition-colors hover:bg-[#f0edff]"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              <span className="text-[15px] font-semibold">Nueva actividad</span>
            </button>
          )}
        </div>
      </div>

      <ModalNeuromorfico
        isOpen={pendingDelete !== null}
        type="confirm"
        title="¿Eliminar esta actividad?"
        onConfirm={() => { if (pendingDelete) deleteActivity(pendingDelete); setPendingDelete(null); }}
        onCancel={() => setPendingDelete(null)}
      />
    </motion.div>
  );
}

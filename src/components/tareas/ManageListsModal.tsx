import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TaskList, Activity, Task } from '../../types';
import { useActivities } from '../../hooks/useActivities';

interface DragState {
  startY: number;
  startTop: number;
  ulTop: number;
  height: number;
  index: number;
  cleanup?: () => void;
}

interface Props {
  isOpen: boolean;
  lists: TaskList[];
  tasks: Task[];
  onClose: () => void;
  onReorderLists: (orderedIds: string[]) => void;
  onSetListActivity: (listId: string, activityId: string | null) => void;
  onCreateList: () => void;
  onDeleteList: (id: string) => void;
  onCreateActivityList: (activity: Activity) => void;
}

export function ManageListsModal({
  isOpen, lists, tasks, onClose,
  onReorderLists, onSetListActivity, onCreateList, onDeleteList, onCreateActivityList,
}: Props) {
  const { activities } = useActivities();
  const [expandedListId, setExpandedListId] = useState<string | null>(null);
  const [showActivityLists, setShowActivityLists] = useState(false);

  // --- Drag reorder de listas ---
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOrder, setDragOrder] = useState<string[] | null>(null);
  const [overlayY, setOverlayY] = useState(0);
  const ulRef = useRef<HTMLUListElement>(null);
  const dragData = useRef<DragState>({ startY: 0, startTop: 0, ulTop: 0, height: 0, index: -1 });
  const dragOrderRef = useRef<string[] | null>(null);

  // Listas ordenadas por posición (Principal siempre primera)
  const sortedLists = useMemo(() => [...lists].sort((a, b) => {
    if (a.id === 'principal') return -1;
    if (b.id === 'principal') return 1;
    return (a.position ?? 0) - (b.position ?? 0);
  }), [lists]);

  const baseIds = sortedLists.map((l) => l.id);
  const orderedIds = dragOrder ?? baseIds;
  const listById = useMemo(() => Object.fromEntries(lists.map((l) => [l.id, l])), [lists]);

  // Actividades que ya tienen una lista vinculada
  const linkedActivityIds = useMemo(() => {
    const ids = new Set<string>();
    for (const l of lists) {
      if (l.activityId) ids.add(l.activityId);
    }
    return ids;
  }, [lists]);

  // Actividades disponibles para crear listas (no vinculadas y que tengan tareas)
  const availableActivities = useMemo(() => {
    return activities.filter((a) => !linkedActivityIds.has(a.id) && tasks.some((t) => t.activityId === a.id && !t.isSeparator));
  }, [activities, linkedActivityIds, tasks]);

  const setDragOrderBoth = useCallback((v: string[] | null) => {
    dragOrderRef.current = v;
    setDragOrder(v);
  }, []);

  const onHandlePointerDown = useCallback((e: React.PointerEvent, index: number) => {
    const li = e.currentTarget.parentElement as HTMLElement;
    const r = li.getBoundingClientRect();
    const ulR = ulRef.current?.getBoundingClientRect();
    if (!r || !ulR) return;
    dragData.current = { startY: e.clientY, startTop: r.top, ulTop: ulR.top, height: r.height, index };
    setDragIndex(index);
    setDragOrderBoth(baseIds.slice());
    setOverlayY(r.top - ulR.top);

    const blockTouch = (ev: TouchEvent) => ev.preventDefault();
    window.addEventListener('touchmove', blockTouch, { passive: false });
    dragData.current.cleanup = () => window.removeEventListener('touchmove', blockTouch);
  }, [baseIds, setDragOrderBoth]);

  useEffect(() => {
    if (dragIndex === null) return;
    const onMove = (e: PointerEvent) => {
      const d = dragData.current;
      setOverlayY((d.startTop - d.ulTop) + (e.clientY - d.startY));
      const ul = ulRef.current;
      if (!ul) return;
      const els = Array.from(ul.querySelectorAll('[data-list-item]'));
      let above = 0;
      els.forEach((el, i) => {
        if (i === d.index) return;
        const r = el.getBoundingClientRect();
        if (e.clientY > r.top + r.height / 2) above++;
      });
      const id = baseIds[d.index];
      const others = baseIds.filter((_, i) => i !== d.index);
      const next = [...others.slice(0, above), id, ...others.slice(above)];
      setDragOrderBoth(next);
    };
    const onUp = () => {
      if (dragData.current.cleanup) dragData.current.cleanup();
      const cur = dragOrderRef.current;
      if (cur) onReorderLists(cur);
      setDragIndex(null);
      setDragOrderBoth(null);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [dragIndex, baseIds, onReorderLists, setDragOrderBoth]);

  const draggedId = dragIndex !== null ? baseIds[dragIndex] : null;
  const draggedList = draggedId ? listById[draggedId] : null;

  if (!isOpen) return null;

  const handleDragDown = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    onHandlePointerDown(e, baseIds.indexOf(id));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 bg-black/40 z-[2000] flex flex-col justify-end backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="bg-[#f7f6f9] rounded-t-[28px] max-h-[85vh] overflow-y-auto no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#f7f6f9] z-10 px-5 pt-4 pb-3">
          <div className="w-10 h-1 rounded-full bg-[#d0d0d8] mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] font-bold text-[#333] m-0">Gestionar listas</h2>
            <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 border-none bg-transparent cursor-pointer">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        <div className="px-5 pb-8 flex flex-col gap-4">
          {/* Listas con drag handles */}
          <ul ref={ulRef} className="list-none m-0 p-0 flex flex-col relative">
            {orderedIds.map((id) => {
              const list = listById[id];
              if (!list) return null;
              const isDragged = draggedId === id;
              const isExpanded = expandedListId === id;
              const listActivity = list.activityId ? activities.find((a) => a.id === list.activityId) : null;
              const isProtected = list.id === 'principal';

              if (isDragged) {
                return <div key={id} data-list-item style={{ height: dragData.current.height }} className="my-1 rounded-[16px] bg-[#eee]" />;
              }

              return (
                <li key={id} data-list-item className="bg-white rounded-[16px] my-1 overflow-hidden">
                  <div className="flex items-center gap-1 px-2 py-3">
                    {/* Drag handle (oculto para Principal) */}
                    {!isProtected && (
                      <div onPointerDown={(e) => handleDragDown(e, id)} className="p-2 text-[#c0c0c0] touch-none cursor-grab active:cursor-grabbing">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <line x1="4" y1="9" x2="20" y2="9" />
                          <line x1="4" y1="15" x2="20" y2="15" />
                        </svg>
                      </div>
                    )}

                    {/* Nombre + actividad */}
                    <div className={`flex-1 min-w-0 ${isProtected ? 'pl-2' : ''}`}>
                      {isProtected ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[15px] font-semibold text-[#333] truncate">{list.name}</span>
                          {listActivity && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: listActivity.color + '1A', color: listActivity.color }}>
                              <span className="w-2 h-2 rounded-full" style={{ background: listActivity.color }} />
                              {listActivity.name}
                            </span>
                          )}
                        </div>
                      ) : (
                        <button onClick={() => setExpandedListId(isExpanded ? null : id)} className="flex items-center gap-2 text-left bg-transparent border-none cursor-pointer p-0">
                          <span className="text-[15px] font-semibold text-[#333] truncate">{list.name}</span>
                          {listActivity && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: listActivity.color + '1A', color: listActivity.color }}>
                              <span className="w-2 h-2 rounded-full" style={{ background: listActivity.color }} />
                              {listActivity.name}
                            </span>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Expandir (oculto para Principal) */}
                    {!isProtected && (
                      <button onClick={() => setExpandedListId(isExpanded ? null : id)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 border-none bg-transparent cursor-pointer shrink-0">
                        <svg className={isExpanded ? 'rotate-180 transition-transform duration-200' : 'transition-transform duration-200'} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                      </button>
                    )}
                  </div>

                  {/* Panel expandible: asignar actividad + eliminar */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-3 flex flex-col gap-3">
                          {/* Selector de actividad */}
                          <div>
                            <p className="text-[12px] font-semibold text-[#999] uppercase tracking-wide m-0 mb-2">Actividad vinculada</p>
                            <div className="flex flex-wrap gap-2">
                              {list.activityId && (
                                <button onClick={() => onSetListActivity(id, null)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium border border-[#e0e0e0] bg-white text-[#666] cursor-pointer hover:bg-[#f5f5f5]">
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                                  Quitar
                                </button>
                              )}
                              {activities.filter((a) => a.id !== list.activityId).map((a) => (
                                <button key={a.id} onClick={() => onSetListActivity(id, a.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium border cursor-pointer transition-transform hover:scale-105" style={{ background: a.color + '12', borderColor: a.color + '40', color: a.color }}>
                                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: a.color }} />
                                  {a.name}
                                </button>
                              ))}
                              {activities.length === 0 && (
                                <p className="text-[13px] text-[#aaa] m-0">No hay actividades creadas.</p>
                              )}
                            </div>
                          </div>

                          {/* Eliminar lista */}
                          {!isProtected && (
                            <button onClick={() => onDeleteList(id)} className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-[14px] font-semibold text-[#e53935] bg-[#ffeaea] border-none cursor-pointer hover:bg-[#ffd5d5] transition-colors">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                              Eliminar lista
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
            {/* Dragged overlay (dentro del ul para posicionar relativo a él) */}
            {draggedList && (
              <div style={{ position: 'absolute', top: overlayY, left: 0, right: 0, zIndex: 50, pointerEvents: 'none' }}>
                <div className="bg-white rounded-[16px] mx-1 px-2 py-3 flex items-center gap-1 shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c0c0c0" strokeWidth="2.5" strokeLinecap="round"><line x1="4" y1="9" x2="20" y2="9" /><line x1="4" y1="15" x2="20" y2="15" /></svg>
                  <span className="text-[15px] font-semibold text-[#333]">{draggedList.name}</span>
                </div>
              </div>
            )}
          </ul>

          {/* Crear nueva lista */}
          <button onClick={onCreateList} className="flex items-center justify-center gap-2 py-3 rounded-[16px] text-[14px] font-semibold text-[#7f70ff] bg-[rgba(127,112,255,0.06)] border border-dashed border-[#7f70ff] cursor-pointer hover:bg-[rgba(127,112,255,0.1)] transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
            Nueva lista
          </button>

          {/* Mostrar listas de actividades */}
          <div>
            <button onClick={() => setShowActivityLists(!showActivityLists)} className="w-full flex items-center justify-between py-2 px-1 border-none bg-transparent cursor-pointer">
              <span className="text-[14px] font-semibold text-[#333]">Mostrar lista de tareas de actividades</span>
              <svg className={showActivityLists ? 'rotate-180 transition-transform duration-200' : 'transition-transform duration-200'} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
            </button>
            <AnimatePresence>
              {showActivityLists && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-col gap-2 pt-2">
                    {availableActivities.length > 0 ? (
                      availableActivities.map((a) => (
                          <button key={a.id} onClick={() => onCreateActivityList(a)} className="flex items-center justify-between p-3 rounded-[14px] bg-white border cursor-pointer hover:scale-[1.01] transition-transform" style={{ borderColor: a.color + '30' }}>
                            <div className="flex items-center gap-2.5">
                              <span className="w-3 h-3 rounded-full" style={{ background: a.color }} />
                              <span className="text-[14px] font-medium text-[#333]">{a.name}</span>
                            </div>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7f70ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                          </button>
                        ))
                    ) : (
                      <p className="text-[13px] text-[#aaa] py-3 text-center m-0">
                        {activities.length === 0 ? 'No hay actividades creadas aún.' : 'Todas las actividades ya tienen una lista vinculada.'}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

import { useState, useRef, useEffect } from 'react';

interface Props {
  onRename: () => void;
  onDelete: () => void;
}

export const DesplegableMenu = ({ onRename, onDelete }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative w-[36px] flex-none flex justify-center items-center" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-transparent border-none text-[26px] pb-1 text-[#888] cursor-pointer w-[36px] h-[36px] flex items-center justify-center rounded-full transition-colors hover:bg-[#f5f5f5]"
      >
        ⋮
      </button>
      {isOpen && (
        <div className="absolute top-[40px] right-0 bg-white shadow-[0_4px_12px_rgba(0,0,0,0.12)] rounded-lg py-1.5 flex flex-col z-[100] border border-[#eaeaea] min-w-[140px]">
          <button
            onClick={() => { setIsOpen(false); onRename(); }}
            className="bg-transparent border-none px-3.5 py-2.5 text-left text-[13px] cursor-pointer text-[#555] hover:bg-[#f8f9fa] transition-colors"
          >
            Renombrar lista
          </button>
          <button
            onClick={() => { setIsOpen(false); onDelete(); }}
            className="bg-transparent border-none px-3.5 py-2.5 text-left text-[13px] cursor-pointer text-[#ff4d4d] font-medium hover:bg-[#fff5f5] transition-colors"
          >
            Eliminar lista
          </button>
        </div>
      )}
    </div>
  );
};
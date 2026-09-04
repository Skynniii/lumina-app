import { useState, useEffect } from 'react';

interface Props {
  onCommand: (cmd: string, value?: string) => void;
}

export function NotesToolbar({ onCommand }: Props) {
  const [active, setActive] = useState({
    h1: false,
    normal: true,
    bold: false,
    italic: false,
    underline: false,
    bulletList: false,
    numberList: false,
  });

  useEffect(() => {
    const update = () => {
      try {
        const block = (document.queryCommandValue('formatBlock') || '').toLowerCase().replace(/[<>]/g, '');
        const next = {
          h1: block === 'h1',
          normal: block !== 'h1',
          bold: document.queryCommandState('bold'),
          italic: document.queryCommandState('italic'),
          underline: document.queryCommandState('underline'),
          bulletList: document.queryCommandState('insertUnorderedList'),
          numberList: document.queryCommandState('insertOrderedList'),
        };
        setActive(prev => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
      } catch { /* ignore */ }
    };
    document.addEventListener('selectionchange', update);
    return () => document.removeEventListener('selectionchange', update);
  }, []);

  const handle = (e: React.MouseEvent, cmd: string, value?: string) => {
    e.preventDefault();
    onCommand(cmd, value);
  };

  const Btn = ({ cmd, value, active: isActive, children }: { cmd: string; value?: string; active?: boolean; children: React.ReactNode }) => (
    <button
      onMouseDown={(e) => handle(e, cmd, value)}
      className={`px-2.5 py-1.5 rounded-lg text-[13px] font-bold transition-colors whitespace-nowrap shrink-0 ${
        isActive ? 'bg-[#f0edff] text-[#7f70ff]' : 'text-[#555] hover:bg-[#f0edff] hover:text-[#7f70ff]'
      }`}
    >
      {children}
    </button>
  );

  const Divider = () => <div className="w-px h-5 bg-[#e0e0e0] mx-1 shrink-0" />;

  return (
    <div className="flex items-center bg-[#fafafa] border-t border-[#e8e8ed] px-3 py-2 overflow-x-auto no-scrollbar">
      {/* Sección 1: Tamaño de letra */}
      <Btn cmd="formatBlock" value="H1" active={active.h1}>H1</Btn>
      <Btn cmd="formatBlock" value="P" active={active.normal}>Aa</Btn>

      <Divider />

      {/* Sección 2: Negrita, Cursiva, Subrayado */}
      <Btn cmd="bold" active={active.bold}>B</Btn>
      <Btn cmd="italic" active={active.italic}>I</Btn>
      <Btn cmd="underline" active={active.underline}>U</Btn>

      <Divider />

      {/* Sección 3: Listas y Sangría */}
      <Btn cmd="insertUnorderedList" active={active.bulletList}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="9" y1="6" x2="21" y2="6" />
          <line x1="9" y1="12" x2="21" y2="12" />
          <line x1="9" y1="18" x2="21" y2="18" />
          <circle cx="4" cy="6" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="4" cy="12" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="4" cy="18" r="1.2" fill="currentColor" stroke="none" />
        </svg>
      </Btn>
      <Btn cmd="insertOrderedList" active={active.numberList}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="10" y1="6" x2="21" y2="6" />
          <line x1="10" y1="12" x2="21" y2="12" />
          <line x1="10" y1="18" x2="21" y2="18" />
          <text x="3" y="8" fill="currentColor" stroke="none" fontSize="7" fontWeight="700">1.</text>
          <text x="3" y="14" fill="currentColor" stroke="none" fontSize="7" fontWeight="700">2.</text>
          <text x="3" y="20" fill="currentColor" stroke="none" fontSize="7" fontWeight="700">3.</text>
        </svg>
      </Btn>
      <Btn cmd="outdent">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="21" y1="6" x2="11" y2="6" />
          <line x1="21" y1="12" x2="6" y2="12" />
          <polyline points="9 9 6 12 9 15" />
          <line x1="21" y1="18" x2="11" y2="18" />
        </svg>
      </Btn>
      <Btn cmd="indent">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="13" y2="6" />
          <line x1="3" y1="12" x2="18" y2="12" />
          <polyline points="15 9 18 12 15 15" />
          <line x1="3" y1="18" x2="13" y2="18" />
        </svg>
      </Btn>

      <Divider />

      {/* Sección 4: Deshacer y Rehacer */}
      <Btn cmd="undo">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="1 4 1 10 7 10" />
          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
        </svg>
      </Btn>
      <Btn cmd="redo">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 4 23 10 17 10" />
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
      </Btn>
    </div>
  );
}

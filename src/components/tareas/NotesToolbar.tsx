interface Props {
  onCommand: (cmd: string, value?: string) => void;
}

export function NotesToolbar({ onCommand }: Props) {
  const handle = (e: React.MouseEvent, cmd: string, value?: string) => {
    e.preventDefault();
    onCommand(cmd, value);
  };

  const Btn = ({ cmd, value, children }: { cmd: string; value?: string; children: React.ReactNode }) => (
    <button
      onMouseDown={(e) => handle(e, cmd, value)}
      className="px-2.5 py-1.5 rounded-lg text-[13px] font-bold text-[#555] hover:bg-[#f0edff] hover:text-[#7f70ff] active:bg-[#f0edff] active:text-[#7f70ff] transition-colors whitespace-nowrap shrink-0"
    >
      {children}
    </button>
  );

  const Divider = () => <div className="w-px h-5 bg-[#e0e0e0] mx-1 shrink-0" />;

  return (
    <div className="flex items-center bg-[#fafafa] border-t border-[#e8e8ed] px-3 py-2 overflow-x-auto no-scrollbar">
      <Btn cmd="formatBlock" value="H1">H1</Btn>
      <Btn cmd="formatBlock" value="H2">H2</Btn>
      <Divider />
      <Btn cmd="strikeThrough">Aa</Btn>
      <Btn cmd="bold">B</Btn>
      <Btn cmd="italic">I</Btn>
      <Btn cmd="underline">U</Btn>
      <Divider />
      <Btn cmd="insertUnorderedList">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <circle cx="3.5" cy="6" r="1" fill="currentColor" stroke="none" />
          <circle cx="3.5" cy="12" r="1" fill="currentColor" stroke="none" />
          <circle cx="3.5" cy="18" r="1" fill="currentColor" stroke="none" />
        </svg>
      </Btn>
      <Btn cmd="insertOrderedList">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="10" y1="6" x2="21" y2="6" />
          <line x1="10" y1="12" x2="21" y2="12" />
          <line x1="10" y1="18" x2="21" y2="18" />
          <path d="M4 6h1v4" />
          <path d="M4 10h2" />
          <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
        </svg>
      </Btn>
      <Btn cmd="outdent">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="7 8 3 12 7 16" />
          <line x1="21" y1="6" x2="11" y2="6" />
          <line x1="21" y1="18" x2="11" y2="18" />
        </svg>
      </Btn>
      <Btn cmd="indent">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="13 8 17 12 13 16" />
          <line x1="3" y1="6" x2="13" y2="6" />
          <line x1="3" y1="18" x2="13" y2="18" />
        </svg>
      </Btn>
    </div>
  );
}

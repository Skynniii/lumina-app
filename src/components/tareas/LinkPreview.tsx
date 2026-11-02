import { useState, useEffect } from 'react';

interface LinkPreviewProps {
  url: string;
  onDelete?: () => void;
  readOnly?: boolean;
}

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function getFaviconUrl(url: string): string {
  const domain = getDomain(url);
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

/**
 * Tarjeta de preview de un link: muestra el favicon, el dominio y la URL
 * completa. Obtiene el título de la página vía un proxy CORS público para
 * mostrar un preview más rico; si falla, muestra solo el dominio.
 */
export function LinkPreview({ url, onDelete, readOnly }: LinkPreviewProps) {
  const normalized = normalizeUrl(url);
  const domain = getDomain(normalized);
  const [title, setTitle] = useState<string | null>(null);
  const [faviconError, setFaviconError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setTitle(null);
    // Intenta obtener el título de la página vía un proxy CORS
    fetch(`https://corsproxy.io/?url=${encodeURIComponent(normalized)}`)
      .then((r) => r.text())
      .then((html) => {
        if (cancelled) return;
        const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
        if (match && match[1].trim()) {
          setTitle(match[1].trim().slice(0, 80));
        }
      })
      .catch(() => { /* si falla, se muestra solo el dominio */ });
    return () => { cancelled = true; };
  }, [normalized]);

  return (
    <a
      href={normalized}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 py-2.5 px-3 rounded-xl bg-[#f8f8fa] hover:bg-[#f4f4f7] transition-colors group no-underline"
    >
      <div className="w-8 h-8 rounded-lg bg-white border border-[#e8e8ed] flex items-center justify-center overflow-hidden shrink-0">
        {faviconError ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        ) : (
          <img src={getFaviconUrl(normalized)} alt="" className="w-4 h-4" onError={() => setFaviconError(true)} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium text-[#333] truncate m-0">
          {title ?? domain}
        </p>
        <p className="text-[12px] text-[#999] truncate m-0 mt-0.5">{domain}</p>
      </div>
      {!readOnly && onDelete && (
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
          className="w-7 h-7 flex items-center justify-center rounded-full text-[#ccc] hover:text-[#ff4d4d] hover:bg-[#fff5f5] transition-colors shrink-0"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </a>
  );
}

export { normalizeUrl };

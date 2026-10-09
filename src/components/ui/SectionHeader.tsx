import { TopBar } from './TopBar';

interface Props {
  title: string;
  onMenuClick: () => void;
  onOpenAccount: () => void;
  /** Color de fondo de la cabecera. Cada sección conserva el suyo. */
  background?: string;
  /** Clases extra (z-index, sombra, etc.). */
  className?: string;
}

/**
 * Cabecera estándar de sección: botón de menú, título centrado y foto de perfil.
 * Usa exactamente la misma posición y márgenes que la cabecera de Tasks para que
 * todas las secciones de la app se vean idénticas.
 */
export function SectionHeader({ title, onMenuClick, onOpenAccount, background = 'transparent', className = '' }: Props) {
  return (
    <div
      className={`shrink-0 w-full box-border ${className}`}
      style={{ paddingTop: 'max(env(safe-area-inset-top), 20px)', background }}
    >
      <div className="px-5 pt-3">
        <TopBar title={title} onMenuClick={onMenuClick} onOpenAccount={onOpenAccount} />
      </div>
    </div>
  );
}

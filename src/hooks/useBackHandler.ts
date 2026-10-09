import { useEffect, useRef } from 'react';
import { pushBackHandler } from '../utils/backButton';

/**
 * Hace que el botón atrás de Android cierre la pantalla o modal actual en lugar
 * de salir de la app. Solo se registra mientras `active` sea true.
 */
export function useBackHandler(active: boolean, onBack: () => void) {
  const cb = useRef(onBack);

  useEffect(() => {
    cb.current = onBack;
  }, [onBack]);

  useEffect(() => {
    if (!active) return;
    return pushBackHandler(() => cb.current());
  }, [active]);
}

import { useState, useEffect, useRef, useCallback } from 'react';

export function useTimer(duracionObjetivoSegundos = 720) {
  const [segundos, setSegundos] = useState(0);
  const [activo, setActivo] = useState(false);
  const ref = useRef<number | null>(null);

  useEffect(() => {
    if (!activo) return;
    ref.current = window.setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => {
      if (ref.current) window.clearInterval(ref.current);
    };
  }, [activo]);

  const toggle = useCallback(() => setActivo((a) => !a), []);
  const reset = useCallback(() => {
    setActivo(false);
    setSegundos(0);
  }, []);

  const minutos = Math.floor(segundos / 60);
  const restantes = segundos % 60;
  const tiempoFormateado = `${String(minutos).padStart(2, '0')}:${String(restantes).padStart(2, '0')}`;
  const progresoGrados = Math.min(360, (segundos / duracionObjetivoSegundos) * 360);

  return { tiempoFormateado, progresoGrados, isActivo: activo, toggleTimer: toggle, resetTimer: reset };
}

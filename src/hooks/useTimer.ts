import { useState, useEffect, useRef } from 'react';

export const useTimer = (duracionObjetivoSegundos: number = 720) => {
  const [segundosAcumulados, setSegundosAcumulados] = useState(0);
  const [isActivo, setIsActivo] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isActivo) {
      timerRef.current = window.setInterval(() => {
        setSegundosAcumulados((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
    };
  }, [isActivo]);

  const toggleTimer = () => setIsActivo(!isActivo);

  const resetTimer = () => {
    setIsActivo(false);
    setSegundosAcumulados(0);
  };

  const minutos = Math.floor(segundosAcumulados / 60);
  const segundos = segundosAcumulados % 60;
  const tiempoFormateado = `${minutos < 10 ? '0' + minutos : minutos}:${segundos < 10 ? '0' + segundos : segundos}`;
  const progresoGrados = Math.min(360, (segundosAcumulados / duracionObjetivoSegundos) * 360);

  return { tiempoFormateado, progresoGrados, isActivo, toggleTimer, resetTimer };
};
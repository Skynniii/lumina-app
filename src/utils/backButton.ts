import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

type BackHandler = () => void;

// Pila de manejadores: el último registrado es el que está más arriba en
// pantalla, así que es el que responde al botón atrás.
const stack: BackHandler[] = [];

let initialized = false;

/** Registra un manejador del botón atrás. Devuelve la función para quitarlo. */
export function pushBackHandler(handler: BackHandler): () => void {
  stack.push(handler);
  return () => {
    const i = stack.lastIndexOf(handler);
    if (i !== -1) stack.splice(i, 1);
  };
}

/** Ejecuta el manejador más reciente. Devuelve true si algo lo atendió. */
export function handleBackPress(): boolean {
  const handler = stack[stack.length - 1];
  if (!handler) return false;
  handler();
  return true;
}

/**
 * Escucha el botón atrás de Android. Si hay una pantalla o modal abiertos, los
 * cierra; si no queda nada abierto, sale de la app como es habitual.
 */
export function initBackButton(): void {
  if (initialized || !Capacitor.isNativePlatform()) return;
  initialized = true;
  App.addListener('backButton', () => {
    if (!handleBackPress()) App.exitApp();
  });
}

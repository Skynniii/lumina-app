import type { FormEvent } from 'react';

/** Límite de caracteres (texto plano) de los editores de notas. */
export const NOTES_MAX_LENGTH = 2000;

/**
 * Recorta el contenido ya escrito para que su texto no pase del límite.
 * Devuelve true si hubo que recortar.
 */
export function clampNotes(el: HTMLElement, max = NOTES_MAX_LENGTH): boolean {
  if ((el.textContent ?? '').length <= max) return false;
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  let left = max;
  for (const node of nodes) {
    if (left <= 0) { node.remove(); continue; }
    if (node.data.length > left) { node.data = node.data.slice(0, left); left = 0; continue; }
    left -= node.data.length;
  }
  return true;
}

/** Bloquea teclear o pegar cuando el editor ya llegó al límite. */
export function limitBeforeInput(e: FormEvent<HTMLElement>, max = NOTES_MAX_LENGTH) {
  const native = e.nativeEvent as InputEvent;
  if (native.inputType && native.inputType.startsWith('delete')) return;
  const el = e.currentTarget as HTMLElement;
  if ((el.textContent ?? '').length >= max) e.preventDefault();
}

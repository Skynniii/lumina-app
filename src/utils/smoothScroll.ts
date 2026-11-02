/** Animación en curso por contenedor (para cancelarla si se vuelve a pulsar). */
const running = new WeakMap<HTMLElement, number>();

/** Easing suave (entra y sale) para el desplazamiento. */
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * Desplaza suavemente un contenedor hasta `top` (px) en lugar de saltar de golpe.
 * Si ya hay una animación en ese contenedor, la cancela y empieza desde ahí.
 */
export function smoothScrollTo(el: HTMLElement | null, top: number, duration = 650) {
  if (!el) return;

  const prev = running.get(el);
  if (prev !== undefined) cancelAnimationFrame(prev);

  const start = el.scrollTop;
  const max = el.scrollHeight - el.clientHeight;
  const target = Math.max(0, Math.min(max, top));
  const delta = target - start;
  if (Math.abs(delta) < 2) return;

  const t0 = performance.now();
  const step = (now: number) => {
    const p = Math.min(1, (now - t0) / duration);
    el.scrollTop = start + delta * easeInOutCubic(p);
    if (p < 1) running.set(el, requestAnimationFrame(step));
    else running.delete(el);
  };
  running.set(el, requestAnimationFrame(step));
}

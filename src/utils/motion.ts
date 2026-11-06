/**
 * Transiciones compartidas por hojas, modales y pantallas. Son cortas y usan
 * solo transform/opacity: los muelles (spring) de framer-motion recalculan en
 * cada frame y en móviles de gama baja se ven a tirones.
 */
export const sheetTransition = { duration: 0.2, ease: 'easeOut' } as const;

/** Pantallas completas (detalle de tarea, focus…): entrada aún más corta. */
export const screenTransition = { duration: 0.16, ease: 'easeOut' } as const;

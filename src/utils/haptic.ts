/**
 * Haptic feedback para feedback táctil instantáneo en interacciones clave.
 * Usa navigator.vibrate (funciona en Android WebView y navegadores móviles).
 * Silencioso en desktop (no soporta vibración).
 */

/** Vibración ligera para taps de navegación y selección (10ms). */
export function hapticLight(): void {
  try { navigator.vibrate?.(10); } catch { /* non-critical */ }
}

/** Vibración media para toggles y acciones confirmadas (20ms). */
export function hapticMedium(): void {
  try { navigator.vibrate?.(20); } catch { /* non-critical */ }
}

/** Vibración fuerte para acciones importantes como completar tarea o iniciar timer (40ms). */
export function hapticHeavy(): void {
  try { navigator.vibrate?.(40); } catch { /* non-critical */ }
}

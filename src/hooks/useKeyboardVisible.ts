import { useEffect, useState } from 'react';

/**
 * Detecta si el teclado en pantalla está visible comparando la altura actual del
 * viewport con la mayor altura observada (la de "sin teclado"). Funciona tanto
 * si el teclado redimensiona el viewport (`interactive-widget=resizes-content`)
 * como si solo lo superpone (`overlays-content`).
 */
export function useKeyboardVisible(threshold = 120) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const vv = window.visualViewport;
    const readHeight = () => (vv ? vv.height : window.innerHeight);
    let baseline = readHeight();

    const update = () => {
      const h = readHeight();
      if (h > baseline) baseline = h;
      setVisible(baseline - h > threshold);
    };

    update();
    vv?.addEventListener('resize', update);
    vv?.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    return () => {
      vv?.removeEventListener('resize', update);
      vv?.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [threshold]);

  return visible;
}

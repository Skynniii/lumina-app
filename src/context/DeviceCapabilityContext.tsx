import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type DeviceLevel = 'low' | 'medium' | 'high';

interface DeviceCapability {
  level: DeviceLevel;
  /** Whether layout animations (framer-motion `layout` prop) should be enabled */
  enableLayout: boolean;
  /** Spring transition config */
  spring: { type: 'spring'; stiffness: number; damping: number };
  /** Duration multiplier for tween transitions */
  durationScale: number;
  /** Whether to use complex particle/sparkle effects */
  enableParticles: boolean;
}

/**
 * All device levels keep every feature enabled — no animations, particles,
 * or layout transitions are ever removed. Optimization is done at the
 * animation implementation level (CSS keyframes, GPU-accelerated properties),
 * not by stripping visual richness from lower-end devices.
 */
const FULL: DeviceCapability = {
  level: 'high',
  enableLayout: true,
  spring: { type: 'spring', stiffness: 700, damping: 45 },
  durationScale: 1,
  enableParticles: true,
};

const DeviceCapabilityContext = createContext<DeviceCapability>(FULL);

/** Measures real FPS over ~1.5s using requestAnimationFrame. */
function measureFPS(): Promise<number> {
  return new Promise((resolve) => {
    let frames = 0;
    let start = 0;
    let raf = 0;
    const tick = (t: number) => {
      if (!start) start = t;
      frames++;
      if (t - start < 1500) {
        raf = requestAnimationFrame(tick);
      } else {
        cancelAnimationFrame(raf);
        resolve(Math.round((frames * 1000) / (t - start)));
      }
    };
    raf = requestAnimationFrame(tick);
  });
}

function classify(cores: number, memGB: number, fps: number): DeviceLevel {
  if (cores <= 4 || memGB <= 2 || fps < 45) return 'low';
  if (cores <= 8 || memGB <= 4) return 'medium';
  return 'high';
}

export function DeviceCapabilityProvider({ children }: { children: ReactNode }) {
  const [cap, setCap] = useState<DeviceCapability>(FULL);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cores = navigator.hardwareConcurrency || 8;
      const memGB = (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 8;
      const fps = await measureFPS();
      if (!cancelled) {
        const level = classify(cores, memGB, fps);
        // Keep all features enabled regardless of level; only record the level for diagnostics.
        setCap({ ...FULL, level });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <DeviceCapabilityContext.Provider value={cap}>
      {children}
    </DeviceCapabilityContext.Provider>
  );
}

export function useDeviceCapability() {
  return useContext(DeviceCapabilityContext);
}

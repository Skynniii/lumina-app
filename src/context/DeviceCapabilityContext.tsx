import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type DeviceLevel = 'low' | 'medium' | 'high';

interface DeviceCapability {
  level: DeviceLevel;
  /** Whether layout animations (framer-motion `layout` prop) should be enabled */
  enableLayout: boolean;
  /** Spring transition config adjusted for device capability */
  spring: { type: 'spring'; stiffness: number; damping: number };
  /** Duration multiplier for tween transitions */
  durationScale: number;
  /** Whether to use complex particle/sparkle effects */
  enableParticles: boolean;
}

const HIGH: DeviceCapability = {
  level: 'high',
  enableLayout: true,
  spring: { type: 'spring', stiffness: 700, damping: 45 },
  durationScale: 1,
  enableParticles: true,
};

const MEDIUM: DeviceCapability = {
  level: 'medium',
  enableLayout: true,
  spring: { type: 'spring', stiffness: 500, damping: 40 },
  durationScale: 0.85,
  enableParticles: true,
};

const LOW: DeviceCapability = {
  level: 'low',
  enableLayout: false,
  spring: { type: 'spring', stiffness: 400, damping: 35 },
  durationScale: 0.6,
  enableParticles: false,
};

const DeviceCapabilityContext = createContext<DeviceCapability>(HIGH);

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

function classify(cores: number, memGB: number, fps: number): DeviceCapability {
  if (cores <= 4 || memGB <= 2 || fps < 45) return LOW;
  if (cores <= 8 || memGB <= 4) return MEDIUM;
  return HIGH;
}

export function DeviceCapabilityProvider({ children }: { children: ReactNode }) {
  const [cap, setCap] = useState<DeviceCapability>(HIGH);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cores = navigator.hardwareConcurrency || 8;
      const memGB = (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 8;
      const fps = await measureFPS();
      if (!cancelled) setCap(classify(cores, memGB, fps));
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

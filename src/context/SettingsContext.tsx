import { createContext, useContext, type ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

export interface Settings {
  theme: 'light' | 'dark';
  timeFormat: '12h' | '24h';
  language: 'es' | 'en';
  sounds: boolean;
  notifications: boolean;
}

const DEFAULTS: Settings = {
  theme: 'light',
  timeFormat: '24h',
  language: 'es',
  sounds: true,
  notifications: true,
};

interface Ctx {
  settings: Settings;
  update: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
}

const SettingsContext = createContext<Ctx>({ settings: DEFAULTS, update: () => {} });

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useLocalStorage<Settings>('lumina_settings', DEFAULTS);
  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };
  return <SettingsContext.Provider value={{ settings, update }}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  return useContext(SettingsContext);
}

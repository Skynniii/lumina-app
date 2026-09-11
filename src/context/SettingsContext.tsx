import { createContext, useContext, useEffect, type ReactNode } from 'react';
import type { ViewType } from '../types';
import { useUserStorage } from '../hooks/useUserStorage';

export interface Settings {
  theme: 'light' | 'dark';
  accentColor: string;
  timeFormat: '12h' | '24h';
  language: 'es' | 'en';
  sounds: boolean;
  notifications: boolean;
  notifyOnStart: boolean;
  notifyOnEnd: boolean;
  newTaskPosition: 'first' | 'last';
  defaultView: ViewType;
  hideNoDateInPrincipal: boolean;
}

const DEFAULTS: Settings = {
  theme: 'light',
  accentColor: '#7f70ff',
  timeFormat: '24h',
  language: 'es',
  sounds: true,
  notifications: true,
  notifyOnStart: true,
  notifyOnEnd: true,
  newTaskPosition: 'first',
  defaultView: 'cronometro',
  hideNoDateInPrincipal: false,
};

interface Ctx {
  settings: Settings;
  update: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
}

const SettingsContext = createContext<Ctx>({ settings: DEFAULTS, update: () => {} });

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useUserStorage<Settings>('lumina_settings', DEFAULTS);

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', settings.accentColor);
    document.documentElement.classList.toggle('dark-mode', settings.theme === 'dark');
  }, [settings.accentColor, settings.theme]);

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };
  return <SettingsContext.Provider value={{ settings, update }}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  return useContext(SettingsContext);
}

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { ViewType } from './types';
import { SettingsProvider } from './context/SettingsContext';
import { NavegacionBar } from './components/navegacion/NavegacionBar';
import { Cronometro } from './components/cronometro/Cronometro';
import { TareasDashboard } from './components/tareas/TareasDashboard';
import { Sidebar } from './components/ui/Sidebar';
import { SettingsPage } from './components/ui/SettingsPage';

export default function App() {
  const [view, setView] = useState<ViewType>('cronometro');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  return (
    <SettingsProvider>
      <main className="w-full h-screen max-h-screen overflow-hidden relative">
        <AnimatePresence mode="wait">
          {view === 'cronometro' ? (
            <motion.div key="cronometro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="w-full h-full">
              <Cronometro onMenuClick={() => setSidebarOpen(true)} />
            </motion.div>
          ) : (
            <motion.div key="habitos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="w-full h-full">
              <TareasDashboard onMenuClick={() => setSidebarOpen(true)} />
            </motion.div>
          )}
        </AnimatePresence>

        <NavegacionBar activeView={view} onViewChange={setView} />

        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          activeView={view}
          onNavigate={(v) => { setView(v); setSidebarOpen(false); }}
          onOpenSettings={() => { setSidebarOpen(false); setShowSettings(true); }}
        />

        <AnimatePresence>
          {showSettings && <SettingsPage onBack={() => setShowSettings(false)} />}
        </AnimatePresence>
      </main>
    </SettingsProvider>
  );
}

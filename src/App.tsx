import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { ViewType } from './types';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { migrateToSubcollections } from './hooks/useFirestoreCollection';
import { NavegacionBar } from './components/navegacion/NavegacionBar';
import { TimeTracker } from './components/timer/TimeTracker';
import { TareasDashboard } from './components/tareas/TareasDashboard';
import { Tracker } from './components/tracker/Tracker';
import { CalendarView } from './components/calendar/CalendarView';
import { Sidebar } from './components/ui/Sidebar';
import { SettingsPage } from './components/ui/SettingsPage';
import { AccountPage } from './components/ui/AccountPage';
import { LoginScreen } from './components/ui/LoginScreen';


function AppContent() {
  const { user, authLoading } = useAuth();
  const { settings } = useSettings();
  const [view, setView] = useState<ViewType>('cronometro');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAccount, setShowAccount] = useState(false);

  const userNavigated = useRef(false);

  // Migración one-time: mueve datos del documento único a subcolecciones.
  useEffect(() => {
    if (user?.uid) migrateToSubcollections(user.uid).catch(console.error);
  }, [user?.uid]);

  // Aplica la sección inicial definida en configuración mientras el usuario
  // no haya navegado manualmente. Se reevalúa cuando los ajustes se cargan.
  useEffect(() => {
    if (!userNavigated.current) setView(settings.defaultView);
  }, [settings.defaultView]);

  const handleViewChange = (v: ViewType) => {
    userNavigated.current = true;
    setView(v);
  };

  if (authLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-[#f5f3ff]">
        <span className="w-7 h-7 border-2 border-[#7f70ff] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <main className="w-full h-screen max-h-screen overflow-hidden relative">
      <AnimatePresence mode="wait">
        <motion.div key={view} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="w-full h-full">
          {view === 'cronometro' && <TimeTracker onMenuClick={() => setSidebarOpen(true)} onOpenAccount={() => setShowAccount(true)} />}
          {view === 'habitos' && <TareasDashboard onMenuClick={() => setSidebarOpen(true)} onOpenAccount={() => setShowAccount(true)} onNavigate={handleViewChange} />}
          {view === 'tracker' && <Tracker onMenuClick={() => setSidebarOpen(true)} onOpenAccount={() => setShowAccount(true)} />}
          {view === 'calendar' && <CalendarView onMenuClick={() => setSidebarOpen(true)} onOpenAccount={() => setShowAccount(true)} />}
        </motion.div>
      </AnimatePresence>

      <NavegacionBar activeView={view} onViewChange={handleViewChange} onAdd={() => window.dispatchEvent(new CustomEvent('app-add'))} />

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeView={view}
        onNavigate={(v) => { handleViewChange(v); setSidebarOpen(false); }}
        onOpenSettings={() => { setSidebarOpen(false); setShowSettings(true); }}
      />

      <AnimatePresence>
        {showSettings && <SettingsPage onBack={() => setShowSettings(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {showAccount && (
          <AccountPage
            onBack={() => setShowAccount(false)}
            onOpenSettings={() => { setShowAccount(false); setShowSettings(true); }}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <AppContent />
      </SettingsProvider>
    </AuthProvider>
  );
}

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { ViewType } from './types';
import { NavegacionBar } from './components/navegacion/NavegacionBar';
import { Cronometro } from './components/cronometro/Cronometro';
import { TareasDashboard } from './components/tareas/TareasDashboard';

export default function App() {
  const [view, setView] = useState<ViewType>('cronometro');

  return (
    <main className="w-full h-screen max-h-screen overflow-hidden relative">
      <AnimatePresence mode="wait">
        {view === 'cronometro' ? (
          <motion.div
            key="cronometro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full"
          >
            <Cronometro />
          </motion.div>
        ) : (
          <motion.div
            key="habitos"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full"
          >
            <TareasDashboard />
          </motion.div>
        )}
      </AnimatePresence>

      <NavegacionBar activeView={view} onViewChange={setView} />
    </main>
  );
}

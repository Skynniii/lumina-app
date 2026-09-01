import { useState } from 'react';
import type { ViewType } from './types';
import { NavegacionBar } from './components/navegacion/NavegacionBar';
import { Cronometro } from './components/cronometro/Cronometro';
import { TareasDashboard } from './components/tareas/TareasDashboard';

export default function App() {
  const [activeView, setActiveView] = useState<ViewType>('cronometro');

  return (
    <main className="w-full h-screen max-h-screen overflow-hidden relative">
      {activeView === 'cronometro' && <Cronometro />}

      {activeView === 'habitos' && <TareasDashboard />}

      <NavegacionBar activeView={activeView} onViewChange={setActiveView} />
    </main>
  );
}
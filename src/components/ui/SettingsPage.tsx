import { motion } from 'framer-motion';
import { useSettings, type Settings } from '../../context/SettingsContext';

interface Props {
  onBack: () => void;
}

const ACCENT_COLORS = [
  { name: 'Pizarra', value: '#2B2B2B' },
  { name: 'Rosa', value: '#FF6B9D' },
  { name: 'Ámbar', value: '#FFB84D' },
  { name: 'Esmeralda', value: '#34C759' },
  { name: 'Cielo', value: '#5AC8FA' },
  { name: 'Violeta', value: '#7f70ff' },
];

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="w-[48px] h-[28px] rounded-full transition-colors duration-200 flex items-center shrink-0"
      style={{ background: on ? 'var(--accent, #7f70ff)' : '#e0e0e0' }}
    >
      <span className={`block w-[24px] h-[24px] bg-white rounded-full shadow-sm transition-transform duration-200 ${on ? 'translate-x-[22px]' : 'translate-x-[2px]'}`} />
    </button>
  );
}

function PillSelector<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex gap-1 bg-[#eee] rounded-xl p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all ${value === opt.value ? 'bg-white shadow-sm' : 'text-[#888]'}`}
          style={value === opt.value ? { color: 'var(--accent, #7f70ff)' } : {}}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function ToggleRow({ title, subtitle, on, onChange }: { title: string; subtitle: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between p-4 bg-[#f8f8fa] rounded-2xl border border-[#eee]">
      <div className="min-w-0">
        <p className="text-[15px] font-semibold text-[#333]">{title}</p>
        <p className="text-[13px] text-[#999] mt-0.5">{subtitle}</p>
      </div>
      <Toggle on={on} onChange={onChange} />
    </div>
  );
}

function PillRow({ title, subtitle, options, value, onChange }: { title: string; subtitle: string; options: { value: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between p-4 bg-[#f8f8fa] rounded-2xl border border-[#eee]">
      <div className="min-w-0">
        <p className="text-[15px] font-semibold text-[#333]">{title}</p>
        <p className="text-[13px] text-[#999] mt-0.5">{subtitle}</p>
      </div>
      <PillSelector options={options} value={value} onChange={onChange} />
    </div>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3 mt-6">
      <span className="text-[#888]">{icon}</span>
      <h3 className="text-[12px] font-bold text-[#555] uppercase tracking-wider whitespace-nowrap">{title}</h3>
      <div className="flex-1 h-[1px] bg-[#e8e8e8] ml-1" />
    </div>
  );
}

export function SettingsPage({ onBack }: Props) {
  const { settings, update } = useSettings();

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute top-0 left-0 w-full h-full bg-white z-[1100] flex flex-col overflow-y-auto no-scrollbar"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white pb-2">
        <div className="flex items-center gap-3 px-5 pt-5">
          <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors active:scale-90 shrink-0">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <div>
            <h1 className="text-[#2b2b2b] font-bold text-2xl m-0">Configuración</h1>
            <p className="text-[13px] text-[#999] m-0 mt-0.5">Personaliza tu experiencia</p>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 px-5 pb-[100px]">
        {/* TEMA DE COLOR */}
        <SectionHeader
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor" /><circle cx="17.5" cy="10.5" r=".5" fill="currentColor" /><circle cx="8.5" cy="7.5" r=".5" fill="currentColor" /><circle cx="6.5" cy="12.5" r=".5" fill="currentColor" /><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" /></svg>}
          title="Tema de color"
        />
        <div className="grid grid-cols-3 gap-3">
          {ACCENT_COLORS.map((color) => {
            const selected = settings.accentColor === color.value;
            return (
              <button
                key={color.value}
                onClick={() => update('accentColor', color.value)}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-colors"
                style={{ borderColor: selected ? color.value : '#f0f0f0', background: selected ? `${color.value}08` : 'transparent' }}
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-full" style={{ background: color.value }} />
                  {selected && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: color.value }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
                  )}
                </div>
                <span className="text-[12px] font-medium" style={{ color: selected ? color.value : '#777' }}>{color.name}</span>
              </button>
            );
          })}
        </div>

        {/* APARIENCIA */}
        <SectionHeader
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 2a14.1 14.1 0 0 0 0 20 14.1 14.1 0 0 0 0-20" /><line x1="2" y1="12" x2="22" y2="12" /></svg>}
          title="Apariencia"
        />
        <div className="space-y-3">
          <ToggleRow
            title="Modo oscuro"
            subtitle="Cambia entre claro y oscuro"
            on={settings.theme === 'dark'}
            onChange={(v) => update('theme', (v ? 'dark' : 'light') as Settings['theme'])}
          />
          <PillRow
            title="Formato de horas"
            subtitle="Cómo mostrar el reloj"
            options={[{ value: '24h', label: '24h' }, { value: '12h', label: '12h' }]}
            value={settings.timeFormat}
            onChange={(v) => update('timeFormat', v as Settings['timeFormat'])}
          />
          <PillRow
            title="Idioma"
            subtitle="Idioma de la interfaz"
            options={[{ value: 'es', label: 'Español' }, { value: 'en', label: 'English' }]}
            value={settings.language}
            onChange={(v) => update('language', v as Settings['language'])}
          />
        </div>

        {/* NOTIFICACIONES */}
        <SectionHeader
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>}
          title="Notificaciones"
        />
        <div className="space-y-3">
          <ToggleRow
            title="Sonidos"
            subtitle="Reproducir sonidos al completar"
            on={settings.sounds}
            onChange={(v) => update('sounds', v)}
          />
          <ToggleRow
            title="Notificaciones push"
            subtitle="Recibir alertas del sistema"
            on={settings.notifications}
            onChange={(v) => update('notifications', v)}
          />
          <ToggleRow
            title="Al iniciar sesión"
            subtitle="Notificar cuando empiezas a cronometrar"
            on={settings.notifyOnStart}
            onChange={(v) => update('notifyOnStart', v)}
          />
          <ToggleRow
            title="Al finalizar temporizador"
            subtitle="Notificar cuando el temporizador termina"
            on={settings.notifyOnEnd}
            onChange={(v) => update('notifyOnEnd', v)}
          />
        </div>
      </div>
    </motion.div>
  );
}

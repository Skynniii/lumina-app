import { motion } from 'framer-motion';
import { useSettings, type Settings } from '../../context/SettingsContext';

interface Props {
  onBack: () => void;
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`w-[44px] h-[26px] rounded-full transition-colors duration-200 flex items-center ${on ? 'bg-[#7f70ff]' : 'bg-[#d1d1d6]'}`}
    >
      <span className={`block w-[22px] h-[22px] bg-white rounded-full shadow-sm transition-transform duration-200 ${on ? 'translate-x-[20px]' : 'translate-x-[2px]'}`} />
    </button>
  );
}

function PillSelector<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex gap-1 bg-[#f0f0f0] rounded-lg p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1 rounded-md text-[13px] font-medium transition-all ${value === opt.value ? 'bg-white shadow-sm text-[#7f70ff]' : 'text-[#888]'}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3.5 px-4">
      <span className="text-[15px] text-[#444]">{label}</span>
      {children}
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <h3 className="text-xs font-bold text-[#999] uppercase tracking-wider mt-6 mb-1 px-4">{title}</h3>;
}

export function SettingsPage({ onBack }: Props) {
  const { settings, update } = useSettings();

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute top-0 left-0 w-full h-full bg-[#f7f6f9] z-[150] flex flex-col overflow-y-auto no-scrollbar"
    >
      {/* Header con botón de retroceso */}
      <div className="bg-white shadow-[0_4px_12px_rgba(0,0,0,0.04)] sticky top-0 z-10">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors active:scale-90">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <h1 className="text-[#2b2b2b] font-bold text-2xl m-0">Configuración</h1>
        </div>
      </div>

      {/* Opciones */}
      <div className="flex-1 pt-2 pb-[100px]">
        <div className="bg-white rounded-[16px] mx-4 mt-4 shadow-sm divide-y divide-[#f0f0f5]">
          <SectionHeader title="Apariencia" />
          <SettingRow label="Temas">
            <PillSelector
              options={[{ value: 'light', label: 'Claro' }, { value: 'dark', label: 'Oscuro' }]}
              value={settings.theme}
              onChange={(v) => update('theme', v as Settings['theme'])}
            />
          </SettingRow>
        </div>

        <div className="bg-white rounded-[16px] mx-4 mt-4 shadow-sm divide-y divide-[#f0f0f5]">
          <SectionHeader title="Preferencias" />
          <SettingRow label="Formato de horas">
            <PillSelector
              options={[{ value: '24h', label: '24h' }, { value: '12h', label: '12h' }]}
              value={settings.timeFormat}
              onChange={(v) => update('timeFormat', v as Settings['timeFormat'])}
            />
          </SettingRow>
          <SettingRow label="Idioma">
            <PillSelector
              options={[{ value: 'es', label: 'Español' }, { value: 'en', label: 'English' }]}
              value={settings.language}
              onChange={(v) => update('language', v as Settings['language'])}
            />
          </SettingRow>
          <SettingRow label="Sonidos">
            <Toggle on={settings.sounds} onChange={(v) => update('sounds', v)} />
          </SettingRow>
          <SettingRow label="Notificaciones">
            <Toggle on={settings.notifications} onChange={(v) => update('notifications', v)} />
          </SettingRow>
        </div>
      </div>
    </motion.div>
  );
}

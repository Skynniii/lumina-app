import { motion, AnimatePresence } from 'framer-motion';
import type { ViewType } from '../../types';
import { useSettings, type Settings } from '../../context/SettingsContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  activeView: ViewType;
  onNavigate: (v: ViewType) => void;
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
    <div className="flex items-center justify-between py-2">
      <span className="text-[15px] text-[#444]">{label}</span>
      {children}
    </div>
  );
}

const SECTIONS: { id: ViewType; label: string; icon: React.ReactNode }[] = [
  {
    id: 'cronometro',
    label: 'Reloj',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
  },
  {
    id: 'habitos',
    label: 'Tasks',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 2h6a1 1 0 0 1 1 1v1H8V3a1 1 0 0 1 1-1z" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M9 14l2 2 4-4" /></svg>,
  },
];

export function Sidebar({ isOpen, onClose, activeView, onNavigate }: Props) {
  const { settings, update } = useSettings();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[200]"
          />
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 h-full w-[280px] bg-white z-[201] overflow-y-auto no-scrollbar shadow-2xl"
          >
            <div className="p-5 pt-[60px]">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7f70ff] to-[#9d8aff] flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8 5.8 21.3l2.4-7.4L2 9.4h7.6z" /></svg>
                </div>
                <h2 className="text-xl font-bold text-[#2b2b2b]">Lumina</h2>
              </div>

              <div className="space-y-1 mb-6">
                {SECTIONS.map((s) => {
                  const active = activeView === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => onNavigate(s.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${active ? 'bg-[#f0edff] text-[#7f70ff]' : 'text-[#555] hover:bg-[#f8f9fa]'}`}
                    >
                      {s.icon}
                      <span className="text-[15px] font-medium">{s.label}</span>
                    </button>
                  );
                })}
              </div>

              <hr className="border-[#f0f0f0] mb-5" />

              <h3 className="text-xs font-bold text-[#999] uppercase tracking-wider mb-2 px-1">Configuración</h3>
              <div className="px-1">
                <SettingRow label="Temas">
                  <PillSelector
                    options={[{ value: 'light', label: 'Claro' }, { value: 'dark', label: 'Oscuro' }]}
                    value={settings.theme}
                    onChange={(v) => update('theme', v as Settings['theme'])}
                  />
                </SettingRow>
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

              <hr className="border-[#f0f0f0] my-5" />

              <div className="space-y-1">
                <button className="w-full text-left px-3 py-2.5 rounded-xl text-[15px] text-[#555] hover:bg-[#f8f9fa] transition-colors">Ayuda</button>
                <button className="w-full text-left px-3 py-2.5 rounded-xl text-[15px] text-[#555] hover:bg-[#f8f9fa] transition-colors">Acerca de</button>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

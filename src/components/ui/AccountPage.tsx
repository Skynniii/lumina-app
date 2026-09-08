import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

interface Props {
  onBack: () => void;
  onOpenSettings: () => void;
}

export function AccountPage({ onBack, onOpenSettings }: Props) {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  const photoURL = user?.photoURL || undefined;
  const name = user?.displayName || (user?.email ? user.email.split('@')[0] : 'Usuario');
  const email = user?.email || '';

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
            <h1 className="text-[#2b2b2b] font-bold text-2xl m-0">Mi cuenta</h1>
            <p className="text-[13px] text-[#999] m-0 mt-0.5">Gestiona tu perfil y preferencias</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-5 pb-[100px]">
        {/* Perfil */}
        <div className="flex flex-col items-center mt-4 mb-6">
          {photoURL ? (
            <img src={photoURL} alt={name} className="w-24 h-24 rounded-full object-cover shadow-sm" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#7f70ff] to-[#9d8aff] flex items-center justify-center shadow-sm">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          )}
          <p className="text-[18px] font-bold text-[#2b2b2b] mt-3 m-0 capitalize">{name}</p>
          {email && <p className="text-[14px] text-[#999] mt-0.5 m-0">{email}</p>}
        </div>

        {/* Opciones */}
        <div className="space-y-3">
          <button
            onClick={onOpenSettings}
            className="w-full flex items-center gap-3 p-4 bg-[#f8f8fa] rounded-2xl border border-[#eee] hover:bg-[#f4f4f7] transition-colors"
          >
            <span className="text-[#7f70ff]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </span>
            <div className="text-left flex-1">
              <p className="text-[15px] font-semibold text-[#333] m-0">Preferencias</p>
              <p className="text-[13px] text-[#999] mt-0.5 m-0">Tema, idioma y más</p>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
          </button>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 p-4 bg-[#fff5f5] rounded-2xl border border-[#ffe0e0] hover:bg-[#ffefef] transition-colors"
          >
            <span className="text-[#ff4d4d]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </span>
            <div className="text-left flex-1">
              <p className="text-[15px] font-semibold text-[#ff4d4d] m-0">Cerrar sesión</p>
              <p className="text-[13px] text-[#e89090] mt-0.5 m-0">Salir de tu cuenta</p>
            </div>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

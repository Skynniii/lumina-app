import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

export function LoginScreen() {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code;
      if (code === 'auth/unauthorized-domain') {
        setError('Este dominio no está autorizado en Firebase. Añádelo en Authentication → Settings → Authorized domains.');
      } else if (code === 'auth/popup-blocked') {
        setError('El navegador bloqueó la ventana emergente. Permite pop-ups para este sitio.');
      } else {
        setError((e as Error)?.message ?? 'No se pudo iniciar sesión.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#f5f3ff] to-white px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-[#7f70ff] flex items-center justify-center mb-5 shadow-[0_8px_24px_rgba(127,112,255,0.35)]">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 11 12 14 22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
        </div>
        <h1 className="text-[26px] font-bold text-[#1a1a2e] mb-1.5">Lumina</h1>
        <p className="text-[14px] text-[#7a7a8c] mb-8 max-w-[260px]">Tus tareas, tiempo y calendario sincronizados en la nube.</p>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="flex items-center gap-3 bg-white border border-[#e4e4ed] rounded-full pl-5 pr-6 py-3.5 shadow-sm hover:bg-[#fafafc] transition-colors disabled:opacity-60"
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-[#7f70ff] border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
            </svg>
          )}
          <span className="text-[15px] font-medium text-[#3a3a4e]">{loading ? 'Conectando…' : 'Iniciar sesión con Google'}</span>
        </button>

        {error && <p className="text-[13px] text-[#ff4d4d] mt-4 max-w-[280px]">{error}</p>}
      </motion.div>
    </div>
  );
}

import React, { useState } from 'react';
import { VenequipLogo } from './VenequipLogo';
import { useAuth } from './AuthContext';
import { 
  Lock, 
  Mail, 
  KeyRound, 
  ShieldCheck, 
  AlertCircle, 
  LogIn
} from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { signInWithPassword, signInWithGoogle, loading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Por favor introduce tu correo electrónico y contraseña.');
      return;
    }

    setIsSubmitting(true);
    try {
      await signInWithPassword(email.trim(), password.trim());
    } catch (err: any) {
      setErrorMsg(err.message || 'Credenciales incorrectas o usuario no registrado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al iniciar sesión con Google.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-amber-400 selection:text-black font-sans relative overflow-hidden">
      
      {/* Background Subtle Technical Grid Accent */}
      <div className="absolute inset-0 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Brand Banner */}
      <header className="py-6 px-4 max-w-7xl mx-auto w-full flex items-center justify-between relative z-10">
        <div className="bg-white px-4 py-2 rounded-xl shadow-lg border border-slate-200">
          <VenequipLogo className="w-36 xs:w-44 h-auto" />
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-300 bg-slate-900/90 px-3.5 py-2 rounded-xl border border-slate-800">
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <span>Sistema Integral de Informes Técnicos CAT</span>
        </div>
      </header>

      {/* Main Login Card Section */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10">
        <div className="max-w-md w-full bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
          
          {/* Card Top Header */}
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 p-6 sm:p-7 text-center text-white relative">
            <div className="inline-flex p-3 rounded-2xl bg-amber-500 text-slate-950 shadow-md mb-2.5">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Acceso al Sistema
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 font-medium">
              Consorcio de Cogestión Venequip S.A.
            </p>
          </div>

          {/* Card Body & Form */}
          <div className="p-6 sm:p-7 space-y-4">
            
            {/* Error Message Box */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handlePasswordLogin} autoComplete="off" className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="input-login-email"
                    type="email"
                    required
                    autoComplete="off"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="correo@venequip.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-xs font-medium focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    id="input-login-password"
                    type="password"
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-xs font-medium focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition"
                  />
                </div>
              </div>

              {/* Login Button with Lock Icon */}
              <button
                id="btn-submit-login"
                type="submit"
                disabled={isSubmitting || loading}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition active:scale-[0.99] disabled:opacity-50 mt-2 cursor-pointer"
              >
                <Lock className="w-4 h-4 text-slate-950" />
                <span>{isSubmitting ? 'Verificando...' : 'Login'}</span>
              </button>
            </form>

          </div>

          {/* Card Footer */}
          <div className="bg-slate-50 border-t border-slate-100 p-3.5 text-[11px] text-slate-500 text-center space-y-0.5">
            <p className="text-[10px] text-slate-400">
              RIF: J404644865 • Consorcio de Cogestión Venequip S.A.
            </p>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-500 relative z-10">
        <p>© {new Date().getFullYear()} Venequip S.A. Plataforma Corporativa de Informes Técnicos de Servicio Caterpillar.</p>
      </footer>

    </div>
  );
};

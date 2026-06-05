import React, { useState } from 'react';
import { ActiveView, UserProfile } from '../types';
import { loginUserEmail, loginWithGoogle, sendPasswordRecoveryEmail } from '../services/store';
import { translateFirebaseError } from '../services/errorHandler';
import { motion } from 'motion/react';
import { Key, Mail, Brain, AlertCircle, LogIn } from 'lucide-react';

interface LoginViewProps {
  setView: (view: ActiveView) => void;
  setUser: (user: UserProfile) => void;
}

export default function LoginView({ setView, setUser }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [forgotMode, setForgotMode] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!email) {
      setError('Por favor ingresa tu correo electrónico.');
      return;
    }

    if (!forgotMode && !password) {
      setError('Por favor completa todos los campos.');
      return;
    }

    setLoading(true);

    try {
      if (forgotMode) {
        await sendPasswordRecoveryEmail(email);
        setInfo('Revisa tu correo: se ha enviado un enlace para recuperar tu contraseña.');
        setForgotMode(false);
      } else {
        const userProfile = await loginUserEmail(email, password);
        setUser(userProfile);
        setView('dashboard');
      }
    } catch (err: any) {
      const friendlyError = translateFirebaseError(err);
      setError(friendlyError);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      const profile = await loginWithGoogle();
      setUser(profile);
      setView('dashboard');
    } catch (err: any) {
      const friendlyError = translateFirebaseError(err);
      setError(friendlyError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12" id="login-view">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border-2 border-gray-200 bg-white p-8 shadow-sm"
      >
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Brain className="h-6 w-6" id="login-header-icon" />
          </div>

          <h2 className="mt-4 text-2xl font-black text-gray-850">
            Bienvenido de Vuelta
          </h2>

          <p className="mt-1.5 text-xs text-gray-400 font-bold uppercase tracking-wider">
            Ingresa para continuar tu entrenamiento
          </p>
        </div>

        {error && (
          <div className="mt-6 flex items-start gap-2.5 rounded-xl bg-red-50 p-3.5 text-xs font-bold text-red-800 border border-red-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {info && (
          <div className="mt-6 flex items-start gap-2.5 rounded-xl bg-emerald-50 p-3.5 text-xs font-bold text-emerald-800 border border-emerald-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <span>{info}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-1">
              Correo Electrónico
            </label>

            <div className="relative rounded-2xl">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Mail className="h-4 w-4" />
              </div>

              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colaborador@empresa.com"
                className="block w-full rounded-2xl border-2 border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm text-gray-800 placeholder-gray-400 focus:border-indigo-500 focus:bg-white focus:outline-none transition-all font-bold"
                required
              />
            </div>
          </div>

          {!forgotMode && (
            <div>
              <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-1">
                Contraseña
              </label>

              <div className="relative rounded-2xl">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Key className="h-4 w-4" />
                </div>

                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full rounded-2xl border-2 border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm text-gray-800 placeholder-gray-400 focus:border-indigo-500 focus:bg-white focus:outline-none transition-all font-bold"
                  required={!forgotMode}
                />
              </div>
            </div>
          )}

          <button
            id="login-submit-btn"
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3 text-sm font-black text-white hover:bg-indigo-500 border-b-4 border-indigo-800 disabled:opacity-50 active:translate-y-0.5 transition-all cursor-pointer uppercase tracking-wider"
          >
            {loading
              ? forgotMode
                ? 'Enviando correo...'
                : 'Cargando sesión...'
              : forgotMode
              ? 'Enviar enlace de recuperación'
              : 'Iniciar Sesión'}

            <LogIn className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-3 text-center text-xs font-bold uppercase tracking-wide text-indigo-600">
          {forgotMode ? (
            <button
              type="button"
              onClick={() => {
                setForgotMode(false);
                setError(null);
                setInfo(null);
              }}
              className="underline"
            >
              Volver al inicio de sesión
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setForgotMode(true);
                setError(null);
                setInfo(null);
              }}
              className="underline"
            >
              ¿Olvidaste tu contraseña?
            </button>
          )}
        </div>

        <div className="relative mt-6 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>

          <span className="relative bg-white px-3 text-[10px] font-black uppercase tracking-widest text-gray-400">
            o iniciar con
          </span>
        </div>

        <button
          id="google-signin-btn"
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="mt-4 flex w-full items-center justify-center gap-2.5 rounded-2xl border-2 border-gray-200 bg-white py-2.5 text-xs font-black text-gray-700 hover:bg-gray-50 active:translate-y-0.5 transition-all cursor-pointer uppercase tracking-wider disabled:opacity-50"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.516 5.516 0 0 1 8.5 13a5.516 5.516 0 0 1 5.491-5.514c1.47 0 2.805.577 3.82 1.506l3.117-3.117A9.873 9.873 0 0 0 13.991 3C8.473 3 4 7.473 4 13s4.473 10 9.991 10c5.765 0 9.85-4.054 9.85-10 0-.618-.054-1.218-.163-1.715H12.24Z"
            />
          </svg>

          Google Workspace
        </button>

        <p className="mt-8 text-center text-xs text-gray-400 font-bold uppercase tracking-wide">
          ¿No tienes una cuenta aún?{' '}
          <button
            id="register-redirect-btn"
            type="button"
            onClick={() => setView('register')}
            className="font-black text-indigo-600 hover:underline cursor-pointer"
          >
            Regístrate aquí
          </button>
        </p>
      </motion.div>
    </div>
  );
}

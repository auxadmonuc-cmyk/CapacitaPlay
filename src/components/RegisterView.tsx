import React, { useState } from 'react';
import { ActiveView, UserProfile } from '../types';
import { registerUserEmail } from '../services/store';
import { translateFirebaseError } from '../services/errorHandler';
import { motion } from 'motion/react';
import { User, Mail, Key, Clipboard, AlertCircle, CheckCircle2, UserPlus } from 'lucide-react';

interface RegisterViewProps {
  setView: (view: ActiveView) => void;
  setUser: (user: UserProfile) => void;
}

export default function RegisterView({ setView, setUser }: RegisterViewProps) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [puesto, setPuesto] = useState('');
  const [cedula, setCedula] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !email || !password || !puesto || !cedula) {
      setError('Por favor complete todos los campos obligatorios.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Ingrese un correo electrónico válido.');
      return;
    }

    const cedulaRegex = /^[0-9]{6,12}$/;
    if (!cedulaRegex.test(cedula)) {
      setError('Ingrese una cédula válida con solo números (6 a 12 dígitos).');
      return;
    }

    if (!termsAccepted) {
      setError('Debe aceptar el tratamiento de datos para continuar.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await registerUserEmail(email, password, nombre, puesto, cedula);
      setSuccess(true);
      setTimeout(() => {
        setView('login');
      }, 2200);
    } catch (err: any) {
      const friendlyError = translateFirebaseError(err);
      setError(friendlyError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-8" id="register-view">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-3xl border-2 border-gray-200 bg-white p-8 shadow-sm"
      >
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <UserPlus className="h-6 w-6" id="register-header-icon" />
          </div>
          <h2 className="mt-4 text-2xl font-black text-gray-850">Crear Cuenta</h2>
          <p className="mt-1.5 text-xs text-gray-400 font-bold uppercase tracking-wider">
            Regístrate para competir y mejorar tu desempeño corporativo
          </p>
        </div>

        {/* State Banners */}
        {error && (
          <div className="mt-6 flex items-start gap-2.5 rounded-xl bg-red-50 p-3.5 text-xs font-bold text-red-800 border border-red-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-6 flex items-center gap-2.5 rounded-xl bg-emerald-50 p-3.5 text-xs font-bold text-emerald-800 border border-emerald-250 animate-pulse">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span>¡Registro exitoso! Se envió un enlace de verificación a tu correo. Puedes iniciar sesión aunque aún no hayas confirmado el email.</span>
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-1">
              Nombre Completo
            </label>
            <div className="relative rounded-2xl">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <User className="h-4 w-4" />
              </div>
              <input
                id="register-name"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Juan Pérez"
                className="block w-full rounded-2xl border-2 border-gray-200 bg-gray-55/35 py-2.5 pl-10 pr-4 text-sm text-gray-800 placeholder-gray-400 focus:border-indigo-500 focus:bg-white focus:outline-hidden transition-all font-bold"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-1">
              Puesto / Cargo de Trabajo
            </label>
            <div className="relative rounded-2xl">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Clipboard className="h-4 w-4" />
              </div>
              <input
                id="register-position"
                type="text"
                value={puesto}
                onChange={(e) => setPuesto(e.target.value)}
                placeholder="Ej. Operario de Torno / Analista"
                className="block w-full rounded-2xl border-2 border-gray-200 bg-gray-55/35 py-2.5 pl-10 pr-4 text-sm text-gray-800 placeholder-gray-400 focus:border-indigo-500 focus:bg-white focus:outline-hidden transition-all font-bold"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-1">
              Correo Institucional / Personal
            </label>
            <div className="relative rounded-2xl">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Mail className="h-4 w-4" />
              </div>
              <input
                id="register-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@empresa.com"
                className="block w-full rounded-2xl border-2 border-gray-200 bg-gray-55/35 py-2.5 pl-10 pr-4 text-sm text-gray-800 placeholder-gray-400 focus:border-indigo-500 focus:bg-white focus:outline-hidden transition-all font-bold"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-1">
              Número de cédula
            </label>
            <div className="relative rounded-2xl">
              <input
                id="register-cedula"
                type="text"
                inputMode="numeric"
                value={cedula}
                onChange={(e) => setCedula(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Ej. 123456789"
                className="block w-full rounded-2xl border-2 border-gray-200 bg-gray-55/35 py-2.5 px-4 text-sm text-gray-800 placeholder-gray-400 focus:border-indigo-500 focus:bg-white focus:outline-hidden transition-all font-bold"
                required
              />
            </div>
          </div>

          <div className="flex items-start gap-3">
            <input
              id="register-terms"
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="register-terms" className="text-xs text-gray-600 leading-relaxed">
              Acepto el tratamiento de datos personales para fines de capacitación interna de la empresa. Los datos sólo serán usados para gestión de usuarios y entrenamiento.
            </label>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-1">
              Registrarte como Trabajador
            </label>
            <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
              Todas las cuentas registradas desde aquí son de tipo <span className="font-black uppercase">trabajador</span>. Los administradores se crean directamente en el código o en la base de datos.
            </p>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-1">
              Contraseña de Acceso
            </label>
            <div className="relative rounded-2xl">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Key className="h-4 w-4" />
              </div>
              <input
                id="register-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="block w-full rounded-2xl border-2 border-gray-200 bg-gray-55/35 py-2.5 pl-10 pr-4 text-sm text-gray-800 placeholder-gray-400 focus:border-indigo-500 focus:bg-white focus:outline-hidden transition-all font-bold"
                required
              />
            </div>
          </div>

          <button
            id="register-submit-btn"
            type="submit"
            disabled={loading || success}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3 text-sm font-black text-white hover:bg-indigo-500 border-b-4 border-indigo-800 disabled:opacity-50 active:transform active:translate-y-0.5 transition-all cursor-pointer uppercase tracking-wider"
          >
            {loading ? 'Creando perfil...' : 'Registrar Cuenta'}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-gray-400 font-bold uppercase tracking-wide">
          ¿Ya tienes cuenta?{' '}
          <button
            id="login-redirect-btn"
            onClick={() => setView('login')}
            className="font-black text-indigo-600 hover:underline cursor-pointer"
          >
            Inicia sesión aquí
          </button>
        </p>
      </motion.div>
    </div>
  );
}

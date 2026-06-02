import React from 'react';
import { UserProfile, ActiveView } from '../types';
import { LogOut, Award, ShieldAlert, Trophy, LayoutDashboard, Brain, Star } from 'lucide-react';

interface HeaderProps {
  user: UserProfile | null;
  currentView: ActiveView;
  setView: (view: ActiveView) => void;
  onLogout: () => void;
}

export default function Header({ user, currentView, setView, onLogout }: HeaderProps) {
  // Simple calculation of Level based on cumulative XP (e.g. 500 XP per level)
  const getLevel = (xp: number) => {
    return Math.floor(xp / 500) + 1;
  };

  const getLevelProgress = (xp: number) => {
    const currentLevelXP = xp % 500;
    return (currentLevelXP / 500) * 100;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo and App Title */}
        <div 
          onClick={() => setView(user ? 'dashboard' : 'welcome')} 
          className="flex cursor-pointer items-center gap-2.5 transition-transform hover:scale-102"
          id="hdr-logo-container"
        >
          <div className="bg-indigo-600 p-2 rounded-xl text-white">
            <Brain className="h-5.5 w-5.5" />
          </div>
          <div>
            <span className="text-xl font-black text-gray-800 tracking-tight block leading-none">
              CapacitaPlay
            </span>
            <span className="hidden sm:block text-[9px] font-black uppercase tracking-widest text-gray-400 mt-1">
              ENTRENAMIENTO CORPORATIVO
            </span>
          </div>
        </div>

        {/* Navigation & User Stats */}
        <div className="flex items-center gap-4" id="hdr-nav-items">
          {user ? (
            <>
              {/* Desktop View Buttons */}
              <nav className="hidden md:flex items-center gap-2 mr-2">
                <button
                  id="nav-btn-dash"
                  onClick={() => setView('dashboard')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] transition-all font-bold ${
                    currentView === 'dashboard' || currentView === 'games-hub' || currentView === 'quiz' || currentView === 'results'
                      ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-200'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Inicio
                </button>
                <button
                  id="nav-btn-rank"
                  onClick={() => setView('leaderboard')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] transition-all font-bold ${
                    currentView === 'leaderboard'
                      ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-200'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <Trophy className="h-4 w-4" />
                  Ranking
                </button>
                {user.rol === 'administrador' && (
                  <button
                    id="nav-btn-admin"
                    onClick={() => setView('admin')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] transition-all font-bold ${
                      currentView === 'admin'
                        ? 'bg-purple-50 text-purple-600 border-b-2 border-purple-200'
                        : 'text-purple-500 hover:bg-purple-50'
                    }`}
                  >
                    <ShieldAlert className="h-4 w-4" />
                    Panel Admin
                  </button>
                )}
              </nav>

              {/* Gamified Profile Box */}
              <div className="flex items-center gap-4">
                {/* Level Badge Pill */}
                <div className="flex items-center bg-orange-100 px-3 py-1.5 rounded-full border border-orange-200">
                  <span className="text-orange-600 font-bold mr-2 text-[10px] uppercase tracking-wider">
                    Nivel {getLevel(user.totalXP)}
                  </span>
                  <div className="w-16 h-1.5 bg-orange-200 rounded-full overflow-hidden shrink-0">
                    <div 
                      className="h-full bg-orange-500 transition-all duration-500" 
                      style={{ width: `${getLevelProgress(user.totalXP)}%` }}
                    />
                  </div>
                </div>

                {/* Profile Avatar / Initials */}
                <div className="flex items-center gap-2.5">
                  <div className="hidden xs:flex flex-col text-right">
                    <p className="text-xs font-black text-gray-800 leading-none">{user.nombre}</p>
                    <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest mt-1">
                      {user.puesto || 'Trabajador'}
                    </p>
                  </div>
                  <div className="w-9 h-9 bg-indigo-100 rounded-full border-2 border-white flex items-center justify-center text-indigo-600 font-black text-xs shadow-xs">
                    {user.nombre.slice(0, 2).toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <button
                id="header-logout-btn"
                onClick={onLogout}
                className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-gray-100 text-gray-400 transition-all hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200"
                title="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2.5">
              <button
                id="header-login-btn"
                onClick={() => setView('login')}
                className="text-xs font-black text-gray-600 hover:text-indigo-600 transition-colors px-3 py-2"
              >
                Iniciar Sesión
              </button>
              <button
                id="header-register-btn"
                onClick={() => setView('register')}
                className="rounded-xl bg-indigo-600 text-white font-black py-2.5 px-5 text-xs border-b-2 border-indigo-800 active:transform active:translate-y-0.5 hover:bg-indigo-500 transition-all uppercase tracking-wide"
              >
                Registrarme
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}

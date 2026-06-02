import React, { useEffect, useState } from 'react';
import { ActiveView, UserProfile, RankingEntry, TrainingGame } from '../types';
import { getGeneralLeaderboard, getTrainingGames, getUserGameAttemptsThisWeek } from '../services/store';
import { motion } from 'motion/react';
import { 
  Award, Star, Play, Trophy, Users, ShieldAlert, BadgeCheck, 
  Sparkles, Calendar, ArrowRight, Brain, Zap, Target, Flame
} from 'lucide-react';

interface DashboardViewProps {
  user: UserProfile;
  setView: (view: ActiveView) => void;
  onStartGame: (game: TrainingGame) => void;
}

export default function DashboardView({ user, setView, onStartGame }: DashboardViewProps) {
  const [topRankings, setTopRankings] = useState<RankingEntry[]>([]);
  const [loadingRank, setLoadingRank] = useState(true);
  const [trainingGames, setTrainingGames] = useState<TrainingGame[]>([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [gameAttempts, setGameAttempts] = useState<Record<string, number>>({});

  useEffect(() => {
    async function loadQuickRank() {
      try {
        const rankings = await getGeneralLeaderboard();
        setTopRankings(rankings.slice(0, 3));
      } catch (err) {
        console.error('Error loading quick ranking:', err);
      } finally {
        setLoadingRank(false);
      }
    }
    loadQuickRank();
  }, [user]);

  useEffect(() => {
    async function loadGames() {
      try {
        const games = await getTrainingGames();
        const activeGames = games.filter((game) => game.activo);
        setTrainingGames(activeGames);

        // Load weekly attempts for each game
        const attempts: Record<string, number> = {};
        for (const game of activeGames) {
          const count = await getUserGameAttemptsThisWeek(user.uid, game.id);
          attempts[game.id] = count;
        }
        setGameAttempts(attempts);
      } catch (err) {
        console.error('Error loading training games:', err);
      } finally {
        setLoadingGames(false);
      }
    }
    loadGames();
  }, [user.uid]);

  // Level algorithms
  const level = Math.floor(user.totalXP / 500) + 1;
  const currentLevelXP = user.totalXP % 500;
  const xpNeededForNext = 500 - currentLevelXP;
  const progressPercent = (currentLevelXP / 500) * 100;

    const gameModules = trainingGames.map((game) => {
    const maxAttempts = game.maxAttemptsPerWeek || 3;
    const attemptsUsed = gameAttempts[game.id] || 0;
    const attemptsRemaining = maxAttempts - attemptsUsed;
    const canPlay = attemptsRemaining > 0;

    return {
      id: game.id,
      title: game.titulo,
      desc: game.descripcion,
        typeLabel: game.tipo === 'quiz' ? 'Quiz' : 'Sopa de Letras',
      tag: canPlay ? 'Disponible' : 'Límite Alcanzado',
      buttonText: canPlay ? '¡Jugar Ahora!' : 'Sin Intentos',
      xpGained: '+100 XP máx',
      action: () => onStartGame(game),
      active: canPlay,
      badgeColor: canPlay ? 'bg-indigo-100 text-indigo-600' : 'bg-red-100 text-red-600',
      attemptsUsed,
      attemptsRemaining,
      maxAttempts
    };
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" id="dashboard-view">
      
      {/* Welcome Banner */}
      <div className="md:flex md:items-center md:justify-between border-b-2 border-gray-200 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-800">
            ¡Hola, <span className="text-indigo-600">{user.nombre}</span>!
          </h1>
          <p className="mt-1 text-sm text-gray-400 font-bold uppercase tracking-wide">
            {user.puesto || 'Trabajador'} • Listo para el aprendizaje gamificado de hoy.
          </p>
        </div>

        {/* Admin button */}
        {user.rol === 'administrador' && (
          <div className="mt-4 md:mt-0">
            <button
              id="dash-adm-panel-cta"
              onClick={() => setView('admin')}
              className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-black text-white hover:bg-purple-700 transition-colors cursor-pointer border-b-2 border-purple-800"
            >
              <ShieldAlert className="h-4 w-4" />
              Consola Admin
            </button>
          </div>
        )}
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-10">
        
        {/* Card 1: Level & XP progression slider */}
        <div className="col-span-1 sm:col-span-2 rounded-3xl border-2 border-gray-200 bg-white p-6 shadow-sm border-b-4 border-indigo-300">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-indigo-600">Tu Progreso de Nivel</span>
              <h2 className="text-2xl font-black text-gray-800 mt-1">Nivel {level}</h2>
            </div>
            <Award className="h-10 w-10 text-indigo-600" />
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 font-bold mb-1.5">
              <span>{user.totalXP} XP totales</span>
              <span>Siguiente nivel: {xpNeededForNext} XP</span>
            </div>
            {/* Progress Slider */}
            <div className="relative h-2.5 w-full rounded-full bg-gray-100 overflow-hidden border border-gray-200">
              <motion.div 
                id="lvl-progress-bar"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-indigo-600"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Total Games */}
        <div className="rounded-3xl border-2 border-gray-200 bg-white p-6 shadow-sm border-b-4 border-emerald-250 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-gray-400">Entrenamientos</span>
            <div className="rounded-lg bg-emerald-50 p-2"><BadgeCheck className="h-5 w-5 text-emerald-600" /></div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-gray-800">{user.gamesPlayed || 0}</span>
            <p className="text-[10px] text-gray-400 uppercase font-black tracking-wide mt-1">Micro-juegos jugados</p>
          </div>
        </div>

        {/* Card 3: Highest Score */}
        <div className="rounded-3xl border-2 border-gray-200 bg-white p-6 shadow-sm border-b-4 border-purple-250 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-gray-400">Récord de Puntos</span>
            <div className="rounded-lg bg-purple-50 p-2"><Star className="h-5 w-5 text-purple-600 fill-purple-300" /></div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-gray-800">{user.quizHighScore || 0} XP</span>
            <p className="text-[10px] text-gray-400 uppercase font-black tracking-wide mt-1">Mejor sesión Quiz</p>
          </div>
        </div>

      </div>

      {/* Main Content Sections: Left: Games path, Right: Rankings preview snippet */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        
        {/* Core Games Path (Left 8 cols equivalent) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <h2 className="text-xl font-black text-gray-800">Continuar Entrenamiento</h2>
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wide">Selecciona un juego de capacitación</span>
          </div>

          <div className="space-y-6">
            {loadingGames ? (
              <div className="rounded-3xl border-2 border-gray-200 bg-white p-12 text-center text-gray-500 font-bold">
                Cargando los juegos disponibles...
              </div>
            ) : trainingGames.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-white p-12 text-center text-gray-500 font-bold">
                No hay juegos creados todavía. Pide a un administrador que ingrese a la consola y cree un juego.
              </div>
            ) : (
              gameModules.map((modulo) => (
                <motion.div
                  key={modulo.id}
                  whileHover={modulo.active ? { y: -2, transition: { duration: 0.15 } } : {}}
                  className={`relative rounded-3xl border-2 border-gray-200 bg-white p-6 sm:p-8 flex flex-col md:flex-row gap-6 items-center shadow-sm transition-all ${
                    modulo.active ? 'border-b-4 border-indigo-600' : 'opacity-70'
                  }`}
                >
                  <div className={`w-28 h-28 shrink-0 rounded-2xl flex items-center justify-center text-4xl border ${
                    modulo.active ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'
                  }`}>
                    🎯
                  </div>

                  <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-col sm:flex-row items-center gap-2 justify-center md:justify-start">
                      <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${modulo.badgeColor}`}>
                        {modulo.tag}
                      </span>
                      <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">{modulo.xpGained}</span>
                    </div>
                    <h3 className="text-2xl font-black text-gray-800 mt-2">{modulo.title}</h3>
                    <p className="text-gray-500 text-xs sm:text-sm mt-1.5 leading-relaxed">
                      {modulo.desc}
                    </p>
                    <span className="inline-block mt-2 text-[10px] font-black uppercase tracking-wider text-slate-500">
                      {modulo.typeLabel}
                    </span>
                    <span className="inline-block mt-3 text-xs font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-lg">
                      ⏱️ {modulo.attemptsRemaining}/{modulo.maxAttempts} intentos disponibles esta semana
                    </span>

                    {modulo.active ? (
                      <button
                        id={`start-modulo-${modulo.id}`}
                        onClick={modulo.action}
                        className="mt-5 bg-indigo-600 text-white font-black py-3 px-8 rounded-2xl border-b-4 border-indigo-800 hover:bg-indigo-500 transition-all uppercase tracking-wide text-xs cursor-pointer flex items-center gap-2"
                      >
                        {modulo.buttonText}
                        <Play className="h-3.5 w-3.5 fill-current text-white" />
                      </button>
                    ) : (
                      <button
                        disabled
                        className="mt-5 bg-gray-300 text-gray-600 font-black py-3 px-8 rounded-2xl border-b-4 border-gray-400 opacity-60 cursor-not-allowed uppercase tracking-wide text-xs flex items-center gap-2"
                      >
                        {modulo.buttonText}
                        <Play className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Quick Leaderboard Panel (Right 4 cols equivalent) */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-3xl border-2 border-gray-200 p-6 flex flex-col shadow-sm h-full">
            
            <div className="flex items-center justify-between mb-5 border-b border-gray-100 pb-4">
              <h2 className="text-lg font-black text-gray-800">Top Ranking</h2>
              <span 
                onClick={() => setView('leaderboard')}
                className="text-indigo-600 font-bold text-xs cursor-pointer hover:underline uppercase tracking-wider"
              >
                Ver todo
              </span>
            </div>

            {loadingRank ? (
              <div className="space-y-3 py-4">
                <div className="h-10 w-full animate-pulse rounded-lg bg-gray-50" />
                <div className="h-10 w-full animate-pulse rounded-lg bg-gray-50" />
                <div className="h-10 w-full animate-pulse rounded-lg bg-gray-50" />
              </div>
            ) : (
              <div className="space-y-3">
                {topRankings.map((rk, idx) => {
                  const isCurrent = rk.userId === user.uid;
                  
                  // Level indicators based on index
                  let cardStyle = "bg-white border border-gray-200";
                  let placeColor = "text-gray-500";
                  if (idx === 0) {
                    cardStyle = "bg-yellow-50 border border-yellow-200";
                    placeColor = "text-yellow-600";
                  } else if (idx === 1) {
                    cardStyle = "bg-gray-50 border border-gray-200";
                    placeColor = "text-gray-400";
                  } else if (idx === 2) {
                    cardStyle = "bg-orange-50 border border-orange-200";
                    placeColor = "text-orange-400";
                  }

                  if (isCurrent) {
                    cardStyle = "bg-indigo-50 border-2 border-indigo-200";
                  }

                  return (
                    <div 
                      key={rk.userId}
                      className={`flex items-center p-3 rounded-2xl transition-all ${cardStyle}`}
                    >
                      <span className={`font-black w-6 text-center ${placeColor}`}>{idx + 1}</span>
                      
                      <div className="w-8 h-8 rounded-full bg-indigo-100 font-black text-[10px] text-indigo-600 flex items-center justify-center mx-3 uppercase shrink-0">
                        {rk.userName.slice(0, 2)}
                      </div>

                      <div className="flex-1 overflow-hidden">
                        <span className={`block font-bold text-gray-800 text-xs sm:text-sm truncate ${isCurrent ? 'italic text-indigo-950 font-black' : ''}`}>
                          {isCurrent ? `Tú (${rk.userName.split(' ')[0]})` : rk.userName}
                        </span>
                        <span className="text-[9px] text-gray-400 block truncate">{rk.puesto || 'Trabajador'}</span>
                      </div>

                      <span className="font-black text-gray-700 text-xs shrink-0 whitespace-nowrap ml-1.5 flex items-center">
                        <Star className="h-3 w-3 text-amber-500 fill-amber-400 mr-0.5" />
                        {rk.totalXP}
                      </span>
                    </div>
                  );
                })}

                {topRankings.length === 0 && (
                  <p className="py-6 text-center text-xs text-gray-400 font-bold italic">
                    Sin jugadores registrados. ¡Sé el primero!
                  </p>
                )}
              </div>
            )}

            {/* Current user persistent placement at bottom if present */}
            <div className="mt-auto pt-4 border-t border-dashed border-gray-200">
              <div 
                onClick={() => setView('leaderboard')}
                className="flex items-center p-3 bg-indigo-50 rounded-2xl border-2 border-indigo-200 hover:bg-indigo-100/55 cursor-pointer transition-all"
              >
                <span className="font-black text-indigo-600 text-xs w-6 text-center">AR</span>
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-black text-[10px] flex items-center justify-center mx-3">
                  {user.nombre.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 overflow-hidden">
                  <span className="font-bold text-indigo-900 text-xs sm:text-sm block italic truncate">Tú ({user.nombre})</span>
                  <span className="text-[9px] text-indigo-700 block tracking-wide uppercase font-black font-mono">Ranking general</span>
                </div>
                <span className="font-black text-indigo-600 text-xs">{user.totalXP} XP</span>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}

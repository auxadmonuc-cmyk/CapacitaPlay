import React from 'react';
import { ActiveView } from '../types';
import { motion } from 'motion/react';
import { Brain, Star, Trophy, Target, ShieldCheck, Gamepad2, Award, ArrowRight } from 'lucide-react';

interface WelcomeViewProps {
  setView: (view: ActiveView) => void;
}

export default function WelcomeView({ setView }: WelcomeViewProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
  };

  const gamifiedGames = [
    {
      title: "Quiz People",
      desc: "Preguntas de opción múltiple con respuestas rápidas y temporizador interactivo. ¡Nuestro juego estrella!",
      icon: <Brain className="h-6 w-6 text-indigo-600" />,
      color: "border-2 border-gray-200 bg-white hover:border-indigo-300",
      status: "Disponible"
    },
    {
      title: "Memoria Corporativa",
      desc: "Forma parejas de conceptos clave, símbolos de seguridad o políticas de la empresa para entrenar el cerebro.",
      icon: <Target className="h-6 w-6 text-gray-400" />,
      color: "border-2 border-gray-200 bg-white/50 opacity-90",
      status: "Próximamente"
    },
    {
      title: "Ruleta de la Fortuna",
      desc: "Gira la ruleta diaria respondiendo sorpresas para multiplicar tus puntos de experiencia (XP).",
      icon: <Gamepad2 className="h-6 w-6 text-gray-400" />,
      color: "border-2 border-gray-200 bg-white/50 opacity-90",
      status: "Próximamente"
    },
    {
      title: "Sopa de Letras",
      desc: "Busca y organiza vocabulario técnico, valores organizacionales y herramientas operativas.",
      icon: <Star className="h-6 w-6 text-indigo-600" />,
      color: "border-2 border-gray-200 bg-white hover:border-indigo-300",
      status: "Disponible"
    }
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-16 lg:px-8" id="welcome-view">
      
      {/* Hero Header Section */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="text-center"
      >
        <motion.div variants={itemVariants} className="inline-flex gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-1.5 text-xs font-black text-indigo-850 tracking-wide">
          <Award className="h-4 w-4 text-indigo-600" />
          <span>¡GAMIFICA EL APRENDIZAJE EN TU EMPRESA HOY!</span>
        </motion.div>
 
        <motion.h1 
          variants={itemVariants}
          className="mt-6 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-6xl"
        >
          Entrenamiento que se siente como{' '}
          <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 bg-clip-text text-transparent font-black leading-tight">
            un Juego
          </span>
        </motion.h1>
 
        <motion.p 
          variants={itemVariants}
          className="mx-auto mt-4 max-w-2xl text-base text-gray-500 sm:text-lg leading-relaxed"
        >
          CapacitaPlay revoluciona la inducción y el refuerzo de políticas de seguridad, valores y ciberseguridad corporativos utilizando mecánicas divertidas inspiradas en Duolingo y Kahoot.
        </motion.p>
 
        {/* Hero CTAs */}
        <motion.div 
          variants={itemVariants}
          className="mt-8 flex flex-col items-center justify-center gap-4 xs:flex-row"
        >
          <button
            id="start-training-btn"
            onClick={() => setView('register')}
            className="group flex items-center gap-2 rounded-2xl bg-indigo-600 px-8 py-4 text-sm font-black text-white hover:bg-indigo-500 border-b-4 border-indigo-800 active:transform active:translate-y-0.5 transition-all uppercase tracking-wider"
          >
            Comenzar Entrenamiento
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
          
          <button
            id="auth-go-login"
            onClick={() => setView('login')}
            className="rounded-2xl border-2 border-gray-200 bg-white px-8 py-4 text-sm font-black text-gray-700 hover:bg-gray-50 transition-all uppercase tracking-wide"
          >
            Tengo una Cuenta
          </button>
        </motion.div>
      </motion.div>
 
      {/* Highlights Bento Section: styled custom card-pulse like top cards with border bottoms */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        <div className="flex flex-col gap-3 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm border-b-4 border-emerald-250">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Trophy className="h-5 w-5" />
          </div>
          <h3 className="text-base font-black text-gray-800 uppercase tracking-tight">Score & Tablas de Ranking</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Acumula experiencia (XP) en cada juego para sobresalir en la tabla general de posiciones de la empresa. ¡Que empiece la sana competencia!
          </p>
        </div>
 
        <div className="flex flex-col gap-3 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm border-b-4 border-blue-250">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Star className="h-5 w-5" />
          </div>
          <h3 className="text-base font-black text-gray-800 uppercase tracking-tight">Medallas & Niveles</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Sube de nivel cada 500 puntos de experiencia ganados. Desbloquea rangos que demuestran tu pericia en diferentes ámbitos operacionales.
          </p>
        </div>
 
        <div className="flex flex-col gap-3 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm border-b-4 border-purple-250 sm:col-span-2 lg:col-span-1">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h3 className="text-base font-black text-gray-800 uppercase tracking-tight">Panel de Administración</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Los líderes pueden configurar nuevas preguntas para el Quiz corporativo, verificar la lista de trabajadores registrados y analizar los resultados detallados.
          </p>
        </div>
      </motion.div>
 
      {/* Training Mini-Games Catalog */}
      <div className="mt-20">
        <div className="text-center">
          <h2 className="text-2xl font-black tracking-tight text-gray-800 sm:text-3xl">
            Módulos de Entrenamiento Disponibles
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-xs sm:text-sm text-gray-400">
            Completa estas dinámicas interactivas para simular casos reales y ganar medallas.
          </p>
        </div>
 
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {gamifiedGames.map((game, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -5, scale: 1.02 }}
              className={`flex flex-col justify-between rounded-3xl p-6 transition-all shadow-sm ${game.color}`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="rounded-xl bg-gray-50 p-3 border border-gray-150">{game.icon}</div>
                  <span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${
                    game.status === 'Disponible' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {game.status}
                  </span>
                </div>
                <h3 className="mt-4 text-base font-black text-gray-800">{game.title}</h3>
                <p className="mt-1.5 text-xs text-gray-500 leading-relaxed">{game.desc}</p>
              </div>
              
              {game.status === 'Disponible' ? (
                <button
                  onClick={() => setView('register')}
                  className="mt-6 flex items-center justify-center gap-1.5 text-xs font-black text-indigo-600 hover:text-indigo-700 transition-colors uppercase tracking-wider"
                >
                  Jugar Ahora <ArrowRight className="h-3 w-3" />
                </button>
              ) : (
                <span className="mt-6 text-[10px] text-gray-400 font-bold italic tracking-wide block">PROXIMAMENTE</span>
              )}
            </motion.div>
          ))}
        </div>
      </div>

    </div>
  );
}

import React from 'react';
import { GameResult } from '../types';
import { motion } from 'motion/react';
import { Award, Trophy, Star, ArrowRight, RefreshCw, LayoutDashboard } from 'lucide-react';

interface ResultsViewProps {
  result: GameResult;
  onPlayAgain: () => void;
  onGoHome: () => void;
}

export default function ResultsView({ result, onPlayAgain, onGoHome }: ResultsViewProps) {
  const percentage = Math.round((result.correctAnswers / result.totalQuestions) * 100) || 0;

  // Custom praise messages based on correct answers
  const getPraiseDetails = (pct: number) => {
    if (pct === 100) {
      return {
        title: '¡Desempeño Perfecto!',
        desc: 'Has respondido todas las preguntas correctamente. Eres un experto certificado de primer nivel.',
        textColor: 'text-indigo-600',
        borderColor: 'border-indigo-200'
      };
    }
    if (pct >= 80) {
      return {
        title: '¡Excelente Trabajo!',
        desc: 'Tienes un gran dominio de los protocolos y políticas de la empresa. ¡Sigue escalando en el ranking!',
        textColor: 'text-purple-650',
        borderColor: 'border-purple-200'
      };
    }
    if (pct >= 50) {
      return {
        title: '¡Buen Intento!',
        desc: 'Demuestras buenas bases sobre la capacitación corporativa, pero hay aspectos que puedes repasar para lograr la medalla perfecta.',
        textColor: 'text-indigo-500',
        borderColor: 'border-indigo-200'
      };
    }
    return {
      title: '¡Ánimo, puedes mejorar!',
      desc: 'Te recomendamos revisar detalladamente el manual corporativo y volver a entrenar este módulo para asegurar tus conocimientos.',
      textColor: 'text-rose-600',
      borderColor: 'border-rose-200'
    };
  };

  const praise = getPraiseDetails(percentage);

  return (
    <div className="mx-auto max-w-md px-4 py-12" id="results-gameover-view">
      
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="rounded-3xl border-2 border-gray-200 bg-white p-8 text-center shadow-sm"
      >
        
        {/* Animated Trophy badge */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-indigo-50 blur-xl animate-pulse" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm border-b-4 border-indigo-800">
              <Trophy className="h-10 w-10 animate-bounce" />
            </div>
            {percentage >= 80 && (
              <span className="absolute bottom-0 right-0 rounded-full bg-indigo-600 border-2 border-white p-1 text-white shadow-xs">
                <Star className="h-4 w-4 fill-current text-white" />
              </span>
            )}
          </div>
        </div>

        {/* Motivational Praise */}
        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">CAPACITACIÓN COMPLETA</span>
        <h2 className={`text-2xl font-black mt-2 leading-tight ${praise.textColor}`}>
          {praise.title}
        </h2>
        <p className="mt-2.5 text-xs text-gray-400 font-bold leading-relaxed px-2">
          {praise.desc}
        </p>

        {/* Stats Grid */}
        <div className="mt-8 grid grid-cols-2 gap-3">
          
          <div className="rounded-2xl border-2 border-gray-200 bg-white p-4">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">PROMEDIO</span>
            <span className="text-2xl font-black text-gray-850 mt-1">{percentage}%</span>
            <span className="text-[9px] text-gray-400 block mt-1 font-bold uppercase tracking-wider">
              {result.correctAnswers} / {result.totalQuestions} correctas
            </span>
          </div>

          <div className="rounded-2xl border-2 border-indigo-200 bg-indigo-50/50 p-4">
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block">XP GANADO</span>
            <span className="text-2xl font-black text-indigo-700 mt-1 flex items-center justify-center">
              <Star className="mr-1 h-5 w-5 fill-indigo-405 text-indigo-600" />
              +{result.xpGained}
            </span>
            <span className="text-[9px] text-indigo-500 block mt-1 font-black uppercase tracking-widest">Experiencia</span>
          </div>

        </div>

        {/* CTAs */}
        <div className="mt-8 space-y-3">
          
          <button
            id="results-playagain-btn"
            onClick={onPlayAgain}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3 text-sm font-black text-white hover:bg-indigo-500 border-b-4 border-indigo-800 transition-all uppercase tracking-wider cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            Entrenar de Nuevo
          </button>

          <button
            id="results-gohome-btn"
            onClick={onGoHome}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-gray-200 bg-white py-3 text-sm font-black text-gray-700 hover:bg-gray-50 transition-all uppercase tracking-wider cursor-pointer"
          >
            <LayoutDashboard className="h-4 w-4" />
            Volver a Módulos
          </button>

        </div>

      </motion.div>
      
    </div>
  );
}

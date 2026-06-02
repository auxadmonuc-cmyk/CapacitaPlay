import React, { useState, useEffect, useRef } from 'react';
import { QuizQuestion, UserProfile, GameResult } from '../types';
import { getQuizQuestions, submitGameResult } from '../services/store';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { 
  Sparkles, Award, Timer, CheckCircle, XCircle, ArrowRight, 
  HelpCircle, AlertCircle, RefreshCw, LogOut, ChevronRight, Star, Flame
} from 'lucide-react';

interface QuizGameProps {
  user: UserProfile;
  setUser: (user: UserProfile) => void;
  gameId: string;
  gameTitle: string;
  onClose: () => void;
  onViewResults: (res: GameResult) => void;
}

export default function QuizGame({ user, setUser, gameId, gameTitle, onClose, onViewResults }: QuizGameProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasChecked, setHasChecked] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(20); // 20s limit per question
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load questions
  useEffect(() => {
    async function fetchQuestions() {
      if (!gameId) {
        setError('No se pudo determinar el juego seleccionado para cargar preguntas.');
        setLoading(false);
        return;
      }

      try {
        const data = await getQuizQuestions(gameId);
        const shuffled = [...data].sort(() => 0.5 - Math.random()).slice(0, 5);
        setQuestions(shuffled);
      } catch (err) {
        setError('Error al cargar preguntas de capacitación.');
      } finally {
        setLoading(false);
      }
    }
    fetchQuestions();
  }, [gameId]);

  // Timer logic
  useEffect(() => {
    if (loading || questions.length === 0 || hasChecked || submitting) return;

    setTimeRemaining(20);
    setIsTimeUp(false);

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, loading, questions, hasChecked]);

  const handleTimeUp = () => {
    setIsTimeUp(true);
    setHasChecked(true);
    // Auto-select nothing
    setSelectedOption(null);
  };

  const handleOptionSelect = (optionIndex: number) => {
    if (hasChecked) return; // Prevent selecting after evaluation
    setSelectedOption(optionIndex);
  };

  const handleCheckAnswer = () => {
    if (selectedOption === null && !isTimeUp) return;
    
    if (timerRef.current) clearInterval(timerRef.current);
    setHasChecked(true);

    const question = questions[currentIndex];
    if (selectedOption === question.respuestaCorrecta) {
      setScore((prev) => prev + question.puntos);
      setCorrectCount((prev) => prev + 1);
    }
  };

  const handleNextQuestion = async () => {
    const isLast = currentIndex === questions.length - 1;

    if (isLast) {
      // Quiz Game Over! Let's submit scores
      setSubmitting(true);
      const xpGained = score; // 1 XP per point scored
      try {
        // Submit scoreboard progress dynamically for the selected game
        const result = await submitGameResult(
          score,
          xpGained,
          correctCount,
          questions.length,
          gameId,
          user
        );

        // Update local state copy of user achievements
        const updatedUser: UserProfile = {
          ...user,
          gamesPlayed: (user.gamesPlayed || 0) + 1,
          totalXP: (user.totalXP || 0) + xpGained,
          quizHighScore: Math.max(user.quizHighScore || 0, score)
        };
        setUser(updatedUser);

        // Explode beautiful canvas stars celebration!
        triggerSparklyConfetti();

        // Redirect to results visual page
        onViewResults(result);
      } catch (err) {
        console.error('Failure saving game score:', err);
        setError('No se pudo sincronizar el puntaje con el servidor Firebase. El reintento guardará puntuación localmente.');
      } finally {
        setSubmitting(false);
      }
    } else {
      setSelectedOption(null);
      setHasChecked(false);
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const triggerSparklyConfetti = () => {
    const duration = 2.5 * 1000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#6366f1', '#a855f7', '#10b981']
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#6366f1', '#a855f7', '#10b981']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  };

  // Motivational message based on evaluation answers
  const getRandomMotivation = (isCorrect: boolean) => {
    const praises = [
      '¡Increíble!',
      '¡Muy bien pensado!',
      '¡Excelente razonamiento!',
      '¡Brillante, sigues así!',
      '¡Dominas las reglas corporativas!'
    ];
    const corrections = [
      '¡Buen intento! Sigue practicando.',
      '¡Estuvo cerca!',
      'Aprender es equivocarse.',
      'Siguiente chance para corregir.',
      '¡Mantén el foco en seguridad!'
    ];
    if (isCorrect) {
      return praises[Math.floor(Math.random() * praises.length)];
    }
    return corrections[Math.floor(Math.random() * corrections.length)];
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center flex flex-col items-center justify-center animate-pulse">
        <RefreshCw className="h-10 w-10 animate-spin text-indigo-600 mb-4" />
        <p className="text-sm font-black text-gray-500 uppercase tracking-wider">Iniciando simuladores de Quiz People...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center border-2 border-dashed border-gray-200 rounded-3xl bg-white mt-12">
        <HelpCircle className="mx-auto h-12 w-12 text-gray-300 animate-bounce" />
        <h3 className="mt-4 font-black text-gray-850 text-base uppercase tracking-wider">No hay preguntas cargadas</h3>
        <p className="mt-2 text-xs text-gray-400 font-bold leading-relaxed max-w-xs mx-auto">
          Pide a un administrador que registre preguntas en el Panel de Administración para activar CapacitaPlay.
        </p>
        <button
          onClick={onClose}
          className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-black text-white hover:bg-indigo-500 border-b-4 border-indigo-800 transition-all uppercase tracking-wide cursor-pointer"
        >
          Regresar
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progressPercent = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8" id="quiz-p-container">
      {error && (
        <div className="mb-6 rounded-3xl border-2 border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-800">
          <p className="uppercase tracking-wider">Error:</p>
          <p>{error}</p>
        </div>
      )}
      <div className="mb-6 text-center sm:text-left">
        <h2 className="text-xl font-black text-gray-850">{gameTitle}</h2>
        <p className="text-xs uppercase tracking-widest text-gray-400 font-black mt-1">Módulo de capacitación seleccionado</p>
      </div>

      {/* Quiz Progress & Timer Header */}
      <div className="flex items-center justify-between gap-6 mb-8">
        {/* Exit Button */}
        <button
          id="quiz-exit-icon-btn"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-gray-200 text-gray-400 hover:bg-gray-100/50 hover:text-gray-700 transition cursor-pointer"
          title="Abandonar entrenamiento"
        >
          <LogOut className="h-4 w-4" />
        </button>

        {/* Linear progress metric */}
        <div className="flex-1">
          <div className="flex justify-between text-[10px] text-gray-400 font-extrabold mb-1.5 uppercase tracking-wider">
            <span>Pregunta {currentIndex + 1} de {questions.length}</span>
            <span className="font-extrabold text-indigo-600">{score} XP acumulados</span>
          </div>
          <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden border-2 border-gray-200">
            <div 
              className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
              id="quiz-game-progress-bar"
            />
          </div>
        </div>

        {/* Circular Timing Countdown Widget */}
        <div className="shrink-0 flex items-center justify-center">
          <div className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border-2 text-xs font-black transition ${
            timeRemaining <= 5 
              ? 'border-rose-450 bg-rose-50 text-rose-700 animate-pulse font-bold'
              : 'border-indigo-100 bg-indigo-50 text-indigo-700'
          }`}>
            <Timer className={`h-4 w-4 ${timeRemaining <= 5 ? 'text-rose-650' : 'text-indigo-600'}`} />
            <span className="font-mono">{timeRemaining}s</span>
          </div>
        </div>
      </div>

      {/* Main Question Display */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="rounded-3xl border-2 border-gray-200 bg-white p-6 sm:p-8 shadow-sm"
        >
          {/* Category Tag */}
          <span className="inline-block rounded-lg bg-indigo-50 border border-indigo-200 px-3 py-1 text-[9px] font-black text-indigo-700 uppercase tracking-widest leading-relaxed">
            {currentQuestion.categoria}
          </span>

          <h2 className="mt-4 text-lg sm:text-xl font-black tracking-tight text-gray-850 leading-relaxed">
            {currentQuestion.pregunta}
          </h2>

          {/* Options List Grid */}
          <div className="mt-8 space-y-3">
            {currentQuestion.opciones.map((op, idx) => {
              // Styling conditions based on evaluation logic
              let btnStyle = 'border-2 border-gray-200 bg-white text-gray-700 hover:bg-gray-50';
              let circleColor = 'border-2 border-gray-200 text-gray-400 bg-gray-50';

              if (!hasChecked) {
                if (selectedOption === idx) {
                  btnStyle = 'border-indigo-600 bg-indigo-50 text-indigo-900 border-b-4 border-indigo-200';
                  circleColor = 'border-2 border-indigo-600 bg-indigo-650 text-white font-black';
                }
              } else {
                // Correct indices Highlighted in strong emerald green
                if (idx === currentQuestion.respuestaCorrecta) {
                  btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-950 border-b-4 border-emerald-250';
                  circleColor = 'border-2 border-emerald-500 bg-emerald-600 text-white font-black';
                }
                // Selected incorrect option highlighted in rose-red
                else if (selectedOption === idx) {
                  btnStyle = 'border-rose-450 bg-rose-50 text-rose-950 border-b-4 border-rose-250';
                  circleColor = 'border-2 border-rose-450 bg-rose-600 text-white font-black';
                } else {
                  btnStyle = 'border-2 border-gray-150 bg-white/50 text-gray-400 cursor-not-allowed';
                  circleColor = 'border-2 border-gray-150 text-gray-300 bg-gray-50/20';
                }
              }

              return (
                <button
                  id={`q-option-btn-${idx}`}
                  key={idx}
                  onClick={() => handleOptionSelect(idx)}
                  disabled={hasChecked}
                  className={`flex w-full items-center gap-4.5 rounded-2xl p-4 text-xs sm:text-sm font-bold transition-all cursor-pointer text-left ${btnStyle}`}
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black border transition ${circleColor}`}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="flex-1 font-bold">{op}</span>
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Verification & Action Bar */}
      <div className="mt-6">
        {hasChecked && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl border-2 p-4.5 mb-4 flex items-start gap-3 ${
              selectedOption === currentQuestion.respuestaCorrecta
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'border-rose-200 bg-rose-50 text-rose-900'
            }`}
          >
            {selectedOption === currentQuestion.respuestaCorrecta ? (
              <CheckCircle className="h-6 w-6 shrink-0 text-emerald-600" />
            ) : (
              <XCircle className="h-6 w-6 shrink-0 text-rose-600" />
            )}
            <div>
              <p className="text-xs font-black uppercase tracking-widest mb-0.5">
                {getRandomMotivation(selectedOption === currentQuestion.respuestaCorrecta)}
              </p>
              <p className="text-xs text-gray-600 font-bold leading-normal">
                {selectedOption === currentQuestion.respuestaCorrecta 
                  ? `Has ganado +${currentQuestion.puntos} puntos de experiencia (XP).` 
                  : isTimeUp 
                    ? `Se agotó el tiempo. La respuesta correcta era: ${currentQuestion.opciones[currentQuestion.respuestaCorrecta]}`
                    : `La respuesta correcta era: ${currentQuestion.opciones[currentQuestion.respuestaCorrecta]}`
                }
              </p>
            </div>
          </motion.div>
        )}

        {/* Action Toggle Switch */}
        {!hasChecked ? (
          <button
            id="quiz-verify-btn"
            onClick={handleCheckAnswer}
            disabled={selectedOption === null}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3.5 text-sm font-black text-white hover:bg-indigo-500 border-b-4 border-indigo-800 disabled:opacity-50 transition uppercase tracking-wider cursor-pointer"
          >
            Verificar Respuesta
          </button>
        ) : (
          <button
            id="quiz-next-btn"
            onClick={handleNextQuestion}
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3.5 text-sm font-black text-white hover:bg-indigo-500 border-b-4 border-indigo-800 disabled:opacity-50 transition uppercase tracking-wider cursor-pointer"
          >
            {currentIndex === questions.length - 1 
              ? loggingTextForFinish() 
              : 'Siguiente Pregunta'
            }
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>

    </div>
  );

  function loggingTextForFinish() {
    return submitting ? 'Guardando puntaje en Firebase...' : 'Finalizar Entrenamiento';
  }
}

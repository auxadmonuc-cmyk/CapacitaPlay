import React, { useCallback, useEffect, useRef, useState } from 'react';
import { QuizQuestion, UserProfile, GameResult } from '../types';
import { getQuizQuestions, submitGameResult } from '../services/store';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  Timer,
  CheckCircle,
  XCircle,
  ArrowRight,
  HelpCircle,
  RefreshCw,
  LogOut
} from 'lucide-react';

interface QuizGameProps {
  user: UserProfile;
  setUser: (user: UserProfile) => void;
  gameId: string;
  gameTitle: string;
  onClose: () => void;
  onViewResults: (res: GameResult) => void;
}

const QUESTION_TIME_LIMIT = 20;
const MAX_QUESTIONS = 5;

export default function QuizGame({
  user,
  setUser,
  gameId,
  gameTitle,
  onClose,
  onViewResults
}: QuizGameProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasChecked, setHasChecked] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(QUESTION_TIME_LIMIT);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function fetchQuestions() {
      if (!gameId) {
        setError('No se pudo determinar el juego seleccionado para cargar preguntas.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await getQuizQuestions(gameId);

        const validQuestions = data.filter((question) => {
          return (
            question &&
            typeof question.pregunta === 'string' &&
            Array.isArray(question.opciones) &&
            question.opciones.length > 0 &&
            typeof question.respuestaCorrecta === 'number' &&
            question.respuestaCorrecta >= 0 &&
            question.respuestaCorrecta < question.opciones.length
          );
        });

        const shuffled = [...validQuestions]
          .sort(() => Math.random() - 0.5)
          .slice(0, MAX_QUESTIONS);

        if (mounted) {
          setQuestions(shuffled);
          setCurrentIndex(0);
          setSelectedOption(null);
          setHasChecked(false);
          setIsTimeUp(false);
          setScore(0);
          setCorrectCount(0);
        }
      } catch (err) {
        console.error('Error loading quiz questions:', err);
        if (mounted) {
          setError('Error al cargar las preguntas del quiz.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchQuestions();

    return () => {
      mounted = false;
      clearTimer();
    };
  }, [gameId, clearTimer]);

  const handleTimeUp = useCallback(() => {
    clearTimer();
    setIsTimeUp(true);
    setHasChecked(true);
    setSelectedOption(null);
  }, [clearTimer]);

  useEffect(() => {
    if (loading || questions.length === 0 || hasChecked || submitting) {
      return;
    }

    clearTimer();
    setTimeRemaining(QUESTION_TIME_LIMIT);
    setIsTimeUp(false);

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleTimeUp();
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return clearTimer;
  }, [currentIndex, loading, questions.length, hasChecked, submitting, clearTimer, handleTimeUp]);

  const handleOptionSelect = (optionIndex: number) => {
    if (hasChecked) return;
    setSelectedOption(optionIndex);
  };

  const handleCheckAnswer = () => {
    if (selectedOption === null && !isTimeUp) return;

    clearTimer();
    setHasChecked(true);

    const question = questions[currentIndex];

    if (!question) return;

    const points = Number(question.puntos || 0);

    if (selectedOption === question.respuestaCorrecta) {
      setScore((prev) => prev + points);
      setCorrectCount((prev) => prev + 1);
    }
  };

  const triggerSparklyConfetti = () => {
    const duration = 2500;
    const end = Date.now() + duration;

    const frame = () => {
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
    };

    frame();
  };

  const handleNextQuestion = async () => {
    const isLast = currentIndex === questions.length - 1;

    if (!isLast) {
      setSelectedOption(null);
      setHasChecked(false);
      setIsTimeUp(false);
      setCurrentIndex((prev) => prev + 1);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const xpGained = score;

      const result = await submitGameResult(
        score,
        xpGained,
        correctCount,
        questions.length,
        gameId,
        user
      );

      const updatedUser: UserProfile = {
        ...user,
        gamesPlayed: (user.gamesPlayed || 0) + 1,
        totalXP: (user.totalXP || 0) + xpGained,
        quizHighScore: Math.max(user.quizHighScore || 0, score)
      };

      setUser(updatedUser);
      triggerSparklyConfetti();
      onViewResults(result);
    } catch (err) {
      console.error('Error saving quiz result:', err);
      setError('No se pudo sincronizar el puntaje con Firebase. Revisa permisos, conexión o datos enviados.');
    } finally {
      setSubmitting(false);
    }
  };

  const getRandomMotivation = (isCorrect: boolean) => {
    const praises = [
      '¡Increíble!',
      '¡Muy bien pensado!',
      '¡Excelente razonamiento!',
      '¡Brillante, sigue así!',
      '¡Dominas las reglas corporativas!'
    ];

    const corrections = [
      '¡Buen intento! Sigue practicando.',
      '¡Estuvo cerca!',
      'Aprender también es equivocarse.',
      'Tendrás otra oportunidad para corregir.',
      '¡Mantén el foco en seguridad!'
    ];

    const options = isCorrect ? praises : corrections;
    return options[Math.floor(Math.random() * options.length)];
  };

  const finishButtonText = submitting
    ? 'Guardando puntaje en Firebase...'
    : 'Finalizar Entrenamiento';

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center flex flex-col items-center justify-center animate-pulse">
        <RefreshCw className="h-10 w-10 animate-spin text-indigo-600 mb-4" />
        <p className="text-sm font-black text-gray-500 uppercase tracking-wider">
          Iniciando simulador de Quiz People...
        </p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center border-2 border-dashed border-gray-200 rounded-3xl bg-white mt-12">
        <HelpCircle className="mx-auto h-12 w-12 text-gray-300 animate-bounce" />

        <h3 className="mt-4 font-black text-gray-850 text-base uppercase tracking-wider">
          No hay preguntas cargadas
        </h3>

        <p className="mt-2 text-xs text-gray-400 font-bold leading-relaxed max-w-xs mx-auto">
          Pide a un administrador que registre preguntas en el Panel de Administración para activar el quiz.
        </p>

        <button
          type="button"
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
  const selectedIsCorrect = selectedOption === currentQuestion.respuestaCorrecta;

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
        <p className="text-xs uppercase tracking-widest text-gray-400 font-black mt-1">
          Módulo de capacitación seleccionado
        </p>
      </div>

      <div className="flex items-center justify-between gap-6 mb-8">
        <button
          id="quiz-exit-icon-btn"
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-gray-200 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition cursor-pointer"
          title="Abandonar entrenamiento"
        >
          <LogOut className="h-4 w-4" />
        </button>

        <div className="flex-1">
          <div className="flex justify-between text-[10px] text-gray-400 font-extrabold mb-1.5 uppercase tracking-wider">
            <span>
              Pregunta {currentIndex + 1} de {questions.length}
            </span>
            <span className="font-extrabold text-indigo-600">
              {score} XP acumulados
            </span>
          </div>

          <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden border-2 border-gray-200">
            <div
              className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
              id="quiz-game-progress-bar"
            />
          </div>
        </div>

        <div className="shrink-0 flex items-center justify-center">
          <div
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border-2 text-xs font-black transition ${
              timeRemaining <= 5
                ? 'border-rose-400 bg-rose-50 text-rose-700 animate-pulse'
                : 'border-indigo-100 bg-indigo-50 text-indigo-700'
            }`}
          >
            <Timer className={`h-4 w-4 ${timeRemaining <= 5 ? 'text-rose-600' : 'text-indigo-600'}`} />
            <span className="font-mono">{timeRemaining}s</span>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="rounded-3xl border-2 border-gray-200 bg-white p-6 sm:p-8 shadow-sm"
        >
          <span className="inline-block rounded-lg bg-indigo-50 border border-indigo-200 px-3 py-1 text-[9px] font-black text-indigo-700 uppercase tracking-widest leading-relaxed">
            {currentQuestion.categoria || 'Quiz'}
          </span>

          <h2 className="mt-4 text-lg sm:text-xl font-black tracking-tight text-gray-850 leading-relaxed">
            {currentQuestion.pregunta}
          </h2>

          <div className="mt-8 space-y-3">
            {currentQuestion.opciones.map((option, index) => {
              let buttonStyle = 'border-2 border-gray-200 bg-white text-gray-700 hover:bg-gray-50';
              let circleStyle = 'border-2 border-gray-200 text-gray-400 bg-gray-50';

              if (!hasChecked && selectedOption === index) {
                buttonStyle = 'border-indigo-600 bg-indigo-50 text-indigo-900 border-b-4 border-indigo-200';
                circleStyle = 'border-2 border-indigo-600 bg-indigo-600 text-white font-black';
              }

              if (hasChecked) {
                if (index === currentQuestion.respuestaCorrecta) {
                  buttonStyle = 'border-emerald-500 bg-emerald-50 text-emerald-950 border-b-4 border-emerald-200';
                  circleStyle = 'border-2 border-emerald-500 bg-emerald-600 text-white font-black';
                } else if (selectedOption === index) {
                  buttonStyle = 'border-rose-400 bg-rose-50 text-rose-950 border-b-4 border-rose-200';
                  circleStyle = 'border-2 border-rose-400 bg-rose-600 text-white font-black';
                } else {
                  buttonStyle = 'border-2 border-gray-200 bg-white/50 text-gray-400 cursor-not-allowed';
                  circleStyle = 'border-2 border-gray-200 text-gray-300 bg-gray-50';
                }
              }

              return (
                <button
                  id={`q-option-btn-${index}`}
                  key={`${currentQuestion.pregunta}-${index}`}
                  type="button"
                  onClick={() => handleOptionSelect(index)}
                  disabled={hasChecked}
                  className={`flex w-full items-center gap-4 rounded-2xl p-4 text-xs sm:text-sm font-bold transition-all text-left ${buttonStyle}`}
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black transition ${circleStyle}`}>
                    {String.fromCharCode(65 + index)}
                  </span>

                  <span className="flex-1 font-bold">{option}</span>
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="mt-6">
        {hasChecked && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl border-2 p-4 mb-4 flex items-start gap-3 ${
              selectedIsCorrect
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'border-rose-200 bg-rose-50 text-rose-900'
            }`}
          >
            {selectedIsCorrect ? (
              <CheckCircle className="h-6 w-6 shrink-0 text-emerald-600" />
            ) : (
              <XCircle className="h-6 w-6 shrink-0 text-rose-600" />
            )}

            <div>
              <p className="text-xs font-black uppercase tracking-widest mb-0.5">
                {getRandomMotivation(selectedIsCorrect)}
              </p>

              <p className="text-xs text-gray-600 font-bold leading-normal">
                {selectedIsCorrect
                  ? `Has ganado +${Number(currentQuestion.puntos || 0)} puntos de experiencia (XP).`
                  : isTimeUp
                    ? `Se agotó el tiempo. La respuesta correcta era: ${currentQuestion.opciones[currentQuestion.respuestaCorrecta]}`
                    : `La respuesta correcta era: ${currentQuestion.opciones[currentQuestion.respuestaCorrecta]}`
                }
              </p>
            </div>
          </motion.div>
        )}

        {!hasChecked ? (
          <button
            id="quiz-verify-btn"
            type="button"
            onClick={handleCheckAnswer}
            disabled={selectedOption === null}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3.5 text-sm font-black text-white hover:bg-indigo-500 border-b-4 border-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition uppercase tracking-wider cursor-pointer"
          >
            Verificar Respuesta
          </button>
        ) : (
          <button
            id="quiz-next-btn"
            type="button"
            onClick={handleNextQuestion}
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3.5 text-sm font-black text-white hover:bg-indigo-500 border-b-4 border-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition uppercase tracking-wider cursor-pointer"
          >
            {currentIndex === questions.length - 1 ? finishButtonText : 'Siguiente Pregunta'}
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

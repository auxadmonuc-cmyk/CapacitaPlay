import React, { useEffect, useMemo, useState } from 'react';
import { TrainingGame, UserProfile, GameResult } from '../types';
import { submitGameResult } from '../services/store';
import { motion } from 'motion/react';
import { ArrowRight, CheckCircle, XCircle, LogOut, RefreshCw, Trophy, Star } from 'lucide-react';

interface WordSearchGameProps {
  user: UserProfile;
  setUser: (user: UserProfile) => void;
  game: TrainingGame;
  onClose: () => void;
  onViewResults: (res: GameResult) => void;
}

type WordCell = {
  letter: string;
  word?: string;
  row: number;
  col: number;
};

type WordPosition = {
  word: string;
  row: number;
  start: number;
  end: number;
};

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function randomLetter() {
  return ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
}

function buildWordSearch(words: string[]): { grid: WordCell[][]; positions: WordPosition[] } {
  const sanitizedWords = words.map((word) => word.toUpperCase().trim()).filter(Boolean);
  const longestWord = sanitizedWords.reduce((max, word) => Math.max(max, word.length), 0);
  const size = Math.max(10, longestWord + 4, sanitizedWords.length * 2 + 4);

  const grid: WordCell[][] = Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, col) => ({ letter: randomLetter(), row, col }))
  );

  const positions: WordPosition[] = [];

  sanitizedWords.forEach((word, index) => {
    const row = index * 2;
    const start = 1;
    if (row >= size) {
      return;
    }
    for (let i = 0; i < word.length; i += 1) {
      const col = start + i;
      if (col < size) {
        grid[row][col] = { ...grid[row][col], letter: word[i], word };
      }
    }
    positions.push({ word, row, start, end: start + word.length - 1 });
  });

  return { grid, positions };
}

export default function WordSearchGame({ user, setUser, game, onClose, onViewResults }: WordSearchGameProps) {
  const wordList = useMemo(() => {
    return (game.palabrasClave || []).map((word) => word.trim().toUpperCase()).filter(Boolean);
  }, [game.palabrasClave]);

  const { grid, positions } = useMemo(() => buildWordSearch(wordList), [wordList.join(',')]);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [selectionStart, setSelectionStart] = useState<WordCell | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<WordCell | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [candidateWord, setCandidateWord] = useState<string | null>(null);

  useEffect(() => {
    setFoundWords([]);
    setError(null);
  }, [game.id]);

  const isWordFound = (word: string) => foundWords.includes(word);

  const toggleWord = (word: string) => {
    setFoundWords((prev) =>
      prev.includes(word) ? prev.filter((item) => item !== word) : [...prev, word]
    );
    // clear any candidate when toggling
    setCandidateWord(null);
  };

  const handleListSelect = (word: string) => {
    // don't auto-mark; set as candidate to highlight on grid
    setCandidateWord((prev) => (prev === word ? null : word));
    setError(null);
  };

  // Handle clicking cells: first click sets start, second click sets end and attempts to match
  const handleCellClick = (cell: WordCell) => {
    if (!selectionStart) {
      setSelectionStart(cell);
      setSelectionEnd(null);
      return;
    }

    // second click -> set end
    setSelectionEnd(cell);

    // Only support horizontal selections for now (same row)
    if (selectionStart.row !== cell.row) {
      // reset selection and show hint
      setSelectionStart(null);
      setSelectionEnd(null);
      setError('Selecciona la primera y última letra en la misma fila (solo horizontal por ahora).');
      setTimeout(() => setError(null), 2500);
      return;
    }

    const row = selectionStart.row;
    const startCol = Math.min(selectionStart.col, cell.col);
    const endCol = Math.max(selectionStart.col, cell.col);
    const letters: string[] = [];
    for (let c = startCol; c <= endCol; c++) {
      letters.push(grid[row][c].letter);
    }
    const candidate = letters.join('').toUpperCase();

    // Check against word list
    const matched = wordList.find((w) => w === candidate);
    if (matched) {
      // set as candidate but do not auto-mark; user must confirm
      setCandidateWord(matched);
    } else {
      setError('La selección no coincide con ninguna palabra válida.');
      setTimeout(() => setError(null), 2000);
    }

    // clear selection
    setSelectionStart(null);
    setSelectionEnd(null);
  };

  const handleFinish = async () => {
    if (foundWords.length === 0) {
      setError('Marca al menos una palabra antes de enviar tu resultado.');
      return;
    }
    setSubmitting(true);
    setError(null);

    const score = foundWords.length * 100;
    const xpGained = score;
    try {
      const result = await submitGameResult(
        score,
        xpGained,
        foundWords.length,
        wordList.length,
        game.id,
        user
      );

      const updatedUser: UserProfile = {
        ...user,
        gamesPlayed: (user.gamesPlayed || 0) + 1,
        totalXP: (user.totalXP || 0) + xpGained,
        quizHighScore: Math.max(user.quizHighScore || 0, score)
      };
      setUser(updatedUser);
      onViewResults(result);
    } catch (err) {
      setError('No se pudo sincronizar el resultado. Por favor inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const foundCount = foundWords.length;
  const totalWords = wordList.length;
  const completion = totalWords > 0 ? Math.round((foundCount / totalWords) * 100) : 0;

  if (wordList.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center border-2 border-dashed border-gray-200 rounded-3xl bg-white mt-12">
        <h3 className="text-lg font-black text-gray-850">Sopa de Letras sin palabras configuradas</h3>
        <p className="mt-3 text-sm text-gray-500 leading-relaxed">
          Este juego aún no tiene palabras clave. Pide a un administrador que agregue palabras en la consola de administración.
        </p>
        <button
          onClick={onClose}
          className="mt-8 inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-xs font-black text-white hover:bg-indigo-500 border-b-4 border-indigo-800 transition-all uppercase tracking-wider"
        >
          Volver al tablero
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8" id="wordsearch-game-view">
      <div className="mb-8 text-center sm:text-left">
        <h2 className="text-3xl font-black text-gray-850">{game.titulo}</h2>
        <p className="mt-2 text-sm text-gray-500 max-w-2xl">
          Busca las palabras clave dentro de la cuadrícula. Haz clic en una palabra para marcarla como encontrada y envía tu resultado.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-3xl border-2 border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-800">
          {error}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-3xl border-2 border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Sopa de Letras</span>
              <h3 className="text-xl font-black text-gray-850 mt-2">Cuadrícula de palabras</h3>
            </div>
            <div className="text-right text-xs text-gray-500">
              <p>{foundCount} / {totalWords} palabras encontradas</p>
              <p className="mt-1 font-black">{completion}% completado</p>
            </div>
          </div>

          <div className="grid gap-0.5 bg-slate-100 rounded-3xl overflow-hidden">
            {grid.map((row, rowIndex) => (
              <div
                key={rowIndex}
                className="gap-0.5"
                style={{ display: 'grid', gridTemplateColumns: `repeat(${row.length}, 1fr)` }}
              >
                {row.map((cell) => {
                  const highlighted = cell.word ? isWordFound(cell.word) : false;
                  // selected cells between start and end
                  let selected = false;
                  if (selectionStart && selectionEnd) {
                    if (cell.row === selectionStart.row && selectionStart.row === selectionEnd.row) {
                      const s = Math.min(selectionStart.col, selectionEnd.col);
                      const e = Math.max(selectionStart.col, selectionEnd.col);
                      if (cell.col >= s && cell.col <= e) selected = true;
                    }
                  } else if (selectionStart && !selectionEnd) {
                    // highlight potential start cell
                    if (cell.row === selectionStart.row && cell.col === selectionStart.col) selected = true;
                  }

                  return (
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => handleCellClick(cell)}
                      onKeyDown={() => {}}
                      key={`${cell.row}-${cell.col}`}
                      className={`aspect-square flex items-center justify-center text-sm font-black uppercase transition-all cursor-pointer select-none ${
                        highlighted ? 'bg-emerald-600 text-white' : selected ? 'bg-indigo-300 text-white' : 'bg-white text-slate-900'
                      }`}
                    >
                      {cell.letter}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border-2 border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-black text-gray-850">Palabras</h3>
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-600">
              {totalWords} palabras
            </span>
          </div>

          <div className="space-y-3">
            {wordList.map((word) => (
              <div key={word} className="relative">
                <button
                  onClick={() => handleListSelect(word)}
                  className={`flex w-full items-center justify-between rounded-2xl border-2 px-4 py-3 text-sm font-black uppercase transition ${
                    isWordFound(word)
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : candidateWord === word
                      ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>{word}</span>
                  <span>{isWordFound(word) ? 'Encontrada' : candidateWord === word ? 'Seleccionada' : 'Marcar'}</span>
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex gap-2">
              <button
                onClick={() => candidateWord && toggleWord(candidateWord)}
                disabled={!candidateWord}
                className={`flex-1 flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-black uppercase tracking-wider transition ${
                  candidateWord ? 'bg-indigo-600 text-white hover:bg-indigo-500 border-b-4 border-indigo-800' : 'bg-gray-300 text-gray-500 border-b-4 border-gray-400 cursor-not-allowed'
                }`}
              >
                <CheckCircle className="h-4 w-4" />
                Marcar palabra
              </button>

              <button
                onClick={() => setCandidateWord(null)}
                disabled={!candidateWord}
                className={`flex-1 flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-black uppercase tracking-wider transition ${
                  candidateWord ? 'bg-white text-gray-700 border-2 border-gray-200 hover:bg-gray-50' : 'bg-gray-100 text-gray-400 border-2 border-gray-100 cursor-not-allowed'
                }`}
              >
                Limpiar selección
              </button>
            </div>
            <button
              id="wordsearch-submit-btn"
              disabled={submitting || foundWords.length === 0}
              onClick={handleFinish}
              className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-black uppercase tracking-wider transition ${
                foundWords.length > 0
                  ? 'bg-indigo-600 text-white hover:bg-indigo-500 border-b-4 border-indigo-800'
                  : 'bg-gray-300 text-gray-500 border-b-4 border-gray-400 cursor-not-allowed'
              }`}
            >
              {submitting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Enviar resultado
            </button>

            <button
              onClick={onClose}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-gray-200 bg-white py-3 text-sm font-black text-gray-700 hover:bg-gray-50 transition uppercase tracking-wider"
            >
              <LogOut className="h-4 w-4" />
              Regresar al tablero
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

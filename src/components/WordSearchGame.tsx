import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle, LogOut, RefreshCw } from 'lucide-react';
import { TrainingGame, UserProfile, GameResult } from '../types';
import { submitGameResult } from '../services/store';

interface WordSearchGameProps {
  user: UserProfile;
  setUser: (user: UserProfile) => void;
  game: TrainingGame;
  onClose: () => void;
  onViewResults: (res: GameResult) => void;
}

type WordCell = {
  letter: string;
  words: string[];
  row: number;
  col: number;
};

type Direction = {
  rowStep: number;
  colStep: number;
};

type WordPosition = {
  word: string;
  cells: Array<{ row: number; col: number }>;
};

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const DIRECTIONS: Direction[] = [
  { rowStep: 0, colStep: 1 }, // horizontal derecha
  { rowStep: 0, colStep: -1 }, // horizontal izquierda
  { rowStep: 1, colStep: 0 }, // vertical abajo
  { rowStep: -1, colStep: 0 }, // vertical arriba
  { rowStep: 1, colStep: 1 }, // diagonal abajo derecha
  { rowStep: 1, colStep: -1 }, // diagonal abajo izquierda
  { rowStep: -1, colStep: 1 }, // diagonal arriba derecha
  { rowStep: -1, colStep: -1 } // diagonal arriba izquierda
];

function randomLetter() {
  return ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
}

function normalizeWord(word: string) {
  return word
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')
    .toUpperCase()
    .trim();
}

function createEmptyGrid(size: number): WordCell[][] {
  return Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, col) => ({
      letter: '',
      words: [],
      row,
      col
    }))
  );
}

function canPlaceWord(grid: WordCell[][], word: string, row: number, col: number, direction: Direction) {
  const size = grid.length;

  for (let i = 0; i < word.length; i += 1) {
    const nextRow = row + direction.rowStep * i;
    const nextCol = col + direction.colStep * i;

    if (nextRow < 0 || nextRow >= size || nextCol < 0 || nextCol >= size) {
      return false;
    }

    const currentLetter = grid[nextRow][nextCol].letter;
    if (currentLetter && currentLetter !== word[i]) {
      return false;
    }
  }

  return true;
}

function placeWord(grid: WordCell[][], word: string, row: number, col: number, direction: Direction): WordPosition {
  const cells: WordPosition['cells'] = [];

  for (let i = 0; i < word.length; i += 1) {
    const nextRow = row + direction.rowStep * i;
    const nextCol = col + direction.colStep * i;

    grid[nextRow][nextCol] = {
      ...grid[nextRow][nextCol],
      letter: word[i],
      words: [...grid[nextRow][nextCol].words, word]
    };

    cells.push({ row: nextRow, col: nextCol });
  }

  return { word, cells };
}

function buildWordSearch(words: string[]): { grid: WordCell[][]; positions: WordPosition[] } {
  const sanitizedWords = Array.from(new Set(words.map(normalizeWord).filter(Boolean)));
  const longestWord = sanitizedWords.reduce((max, word) => Math.max(max, word.length), 0);
  const size = Math.max(10, longestWord + 4, sanitizedWords.length * 2 + 4);
  const grid = createEmptyGrid(size);
  const positions: WordPosition[] = [];

  sanitizedWords.forEach((word) => {
    let placed = false;

    for (let attempt = 0; attempt < 200 && !placed; attempt += 1) {
      const direction = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
      const row = Math.floor(Math.random() * size);
      const col = Math.floor(Math.random() * size);

      if (canPlaceWord(grid, word, row, col, direction)) {
        positions.push(placeWord(grid, word, row, col, direction));
        placed = true;
      }
    }

    // Respaldo: si no se pudo ubicar aleatoriamente, se intenta horizontalmente.
    if (!placed) {
      for (let row = 0; row < size && !placed; row += 1) {
        for (let col = 0; col <= size - word.length && !placed; col += 1) {
          const direction = { rowStep: 0, colStep: 1 };
          if (canPlaceWord(grid, word, row, col, direction)) {
            positions.push(placeWord(grid, word, row, col, direction));
            placed = true;
          }
        }
      }
    }
  });

  return {
    grid: grid.map((row) =>
      row.map((cell) => ({
        ...cell,
        letter: cell.letter || randomLetter()
      }))
    ),
    positions
  };
}

function getSelectedCells(start: WordCell, end: WordCell): Array<{ row: number; col: number }> | null {
  const dRow = end.row - start.row;
  const dCol = end.col - start.col;

  const isHorizontal = dRow === 0;
  const isVertical = dCol === 0;
  const isDiagonal = Math.abs(dRow) === Math.abs(dCol);

  if (!isHorizontal && !isVertical && !isDiagonal) {
    return null;
  }

  const rowStep = dRow === 0 ? 0 : dRow > 0 ? 1 : -1;
  const colStep = dCol === 0 ? 0 : dCol > 0 ? 1 : -1;
  const steps = Math.max(Math.abs(dRow), Math.abs(dCol));

  return Array.from({ length: steps + 1 }, (_, index) => ({
    row: start.row + rowStep * index,
    col: start.col + colStep * index
  }));
}

export default function WordSearchGame({ user, setUser, game, onClose, onViewResults }: WordSearchGameProps) {
  const wordList = useMemo(() => {
    return Array.from(new Set((game.palabrasClave || []).map(normalizeWord).filter(Boolean)));
  }, [game.palabrasClave]);

  const { grid, positions } = useMemo(() => buildWordSearch(wordList), [wordList]);

  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [selectionStart, setSelectionStart] = useState<WordCell | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<WordCell | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [candidateWord, setCandidateWord] = useState<string | null>(null);

  useEffect(() => {
    setFoundWords([]);
    setSelectionStart(null);
    setSelectionEnd(null);
    setIsSelecting(false);
    setCandidateWord(null);
    setError(null);
  }, [game.id]);

  const selectedCells = useMemo(() => {
    if (!selectionStart) return [];
    if (!selectionEnd) return [{ row: selectionStart.row, col: selectionStart.col }];
    return getSelectedCells(selectionStart, selectionEnd) || [];
  }, [selectionStart, selectionEnd]);

  const foundCells = useMemo(() => {
    const cells = new Set<string>();

    positions.forEach((position) => {
      if (foundWords.includes(position.word)) {
        position.cells.forEach((cell) => cells.add(`${cell.row}-${cell.col}`));
      }
    });

    return cells;
  }, [positions, foundWords]);

  const candidateCells = useMemo(() => {
    const cells = new Set<string>();
    const position = positions.find((item) => item.word === candidateWord);

    if (position) {
      position.cells.forEach((cell) => cells.add(`${cell.row}-${cell.col}`));
    }

    return cells;
  }, [positions, candidateWord]);

  const isWordFound = (word: string) => foundWords.includes(word);

  const markWordAsFound = (word: string) => {
    setFoundWords((prev) => (prev.includes(word) ? prev : [...prev, word]));
    setCandidateWord(null);
  };

  const handleListSelect = (word: string) => {
    setCandidateWord((prev) => (prev === word ? null : word));
    setError(null);
  };

  const clearSelection = () => {
    setSelectionStart(null);
    setSelectionEnd(null);
    setIsSelecting(false);
  };

  const validateSelection = (start: WordCell | null, end: WordCell | null) => {
    if (!start || !end) return;

    const cells = getSelectedCells(start, end);

    if (!cells) {
      clearSelection();
      setError('Selecciona una palabra en línea recta: horizontal, vertical o diagonal.');
      setTimeout(() => setError(null), 2500);
      return;
    }

    const selectedWord = cells.map(({ row, col }) => grid[row][col].letter).join('').toUpperCase();
    const reversedWord = selectedWord.split('').reverse().join('');
    const matched = wordList.find((word) => word === selectedWord || word === reversedWord);

    if (matched) {
      markWordAsFound(matched);
    } else if (cells.length > 1) {
      setError('La línea seleccionada no coincide con ninguna palabra válida.');
      setTimeout(() => setError(null), 2000);
    }

    setTimeout(clearSelection, 350);
  };

  const handleSelectStart = (cell: WordCell) => {
    setIsSelecting(true);
    setSelectionStart(cell);
    setSelectionEnd(cell);
    setCandidateWord(null);
    setError(null);
  };

  const handleSelectMove = (cell: WordCell) => {
    if (!isSelecting || !selectionStart) return;
    setSelectionEnd(cell);
  };

  const handleSelectEnd = () => {
    if (!isSelecting) return;
    setIsSelecting(false);
    validateSelection(selectionStart, selectionEnd);
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!isSelecting || !gridRef.current) return;

    const touch = event.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const button = element?.closest<HTMLButtonElement>('[data-word-cell="true"]');

    if (!button) return;

    const row = Number(button.dataset.row);
    const col = Number(button.dataset.col);
    const cell = grid[row]?.[col];

    if (cell) {
      setSelectionEnd(cell);
    }
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
      const result = await submitGameResult(score, xpGained, foundWords.length, wordList.length, game.id, user);

      const updatedUser: UserProfile = {
        ...user,
        gamesPlayed: (user.gamesPlayed || 0) + 1,
        totalXP: (user.totalXP || 0) + xpGained,
        quizHighScore: Math.max(user.quizHighScore || 0, score)
      };

      setUser(updatedUser);
      onViewResults(result);
    } catch {
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
          type="button"
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
          Busca las palabras clave dentro de la cuadrícula. Mantén presionado y arrastra sobre toda la palabra, como en una sopa de letras tradicional.
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
              <p>
                {foundCount} / {totalWords} palabras encontradas
              </p>
              <p className="mt-1 font-black">{completion}% completado</p>
            </div>
          </div>

          <div
            ref={gridRef}
            className="grid gap-0.5 bg-slate-100 rounded-3xl overflow-hidden touch-none"
            onMouseLeave={handleSelectEnd}
            onMouseUp={handleSelectEnd}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleSelectEnd}
          >
            {grid.map((row, rowIndex) => (
              <div
                key={rowIndex}
                className="gap-0.5"
                style={{ display: 'grid', gridTemplateColumns: `repeat(${row.length}, 1fr)` }}
              >
                {row.map((cell) => {
                  const cellKey = `${cell.row}-${cell.col}`;
                  const selected = selectedCells.some((selectedCell) => selectedCell.row === cell.row && selectedCell.col === cell.col);
                  const highlighted = foundCells.has(cellKey);
                  const candidateHighlighted = candidateCells.has(cellKey);

                  return (
                    <button
                      type="button"
                      onMouseDown={() => handleSelectStart(cell)}
                      onMouseEnter={() => handleSelectMove(cell)}
                      onTouchStart={() => handleSelectStart(cell)}
                      data-word-cell="true"
                      data-row={cell.row}
                      data-col={cell.col}
                      key={cellKey}
                      className={`aspect-square flex items-center justify-center text-sm font-black uppercase transition-all cursor-pointer select-none ${
                        highlighted
                          ? 'bg-emerald-600 text-white'
                          : selected
                            ? 'bg-indigo-400 text-white'
                            : candidateHighlighted
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'bg-white text-slate-900 hover:bg-slate-50'
                      }`}
                      aria-label={`Fila ${cell.row + 1}, columna ${cell.col + 1}, letra ${cell.letter}`}
                    >
                      {cell.letter}
                    </button>
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
                  type="button"
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
                  <span>{isWordFound(word) ? 'Encontrada' : candidateWord === word ? 'Ubicada' : 'Ver en sopa'}</span>
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={() => setCandidateWord(null)}
              disabled={!candidateWord}
              className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-black uppercase tracking-wider transition ${
                candidateWord
                  ? 'bg-white text-gray-700 border-2 border-gray-200 hover:bg-gray-50'
                  : 'bg-gray-100 text-gray-400 border-2 border-gray-100 cursor-not-allowed'
              }`}
            >
              Limpiar selección
            </button>

            <button
              id="wordsearch-submit-btn"
              type="button"
              disabled={submitting || foundWords.length === 0}
              onClick={handleFinish}
              className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-black uppercase tracking-wider transition ${
                foundWords.length > 0
                  ? 'bg-indigo-600 text-white hover:bg-indigo-500 border-b-4 border-indigo-800'
                  : 'bg-gray-300 text-gray-500 border-b-4 border-gray-400 cursor-not-allowed'
              }`}
            >
              {submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Enviar resultado
            </button>

            <button
              type="button"
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
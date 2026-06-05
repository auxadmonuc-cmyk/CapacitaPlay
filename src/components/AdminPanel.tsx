import React, { useEffect, useState } from 'react';
import { UserProfile, QuizQuestion, GameResult, TrainingGame, TrainingGameType } from '../types';
import {
  getQuizQuestions,
  addQuizQuestion,
  deleteQuizQuestion,
  getAllUsersProfiles,
  getAllGameResults,
  getTrainingGames,
  addTrainingGame,
  deleteTrainingGame
} from '../services/store';
import { motion } from 'motion/react';
import {
  Plus,
  Trash2,
  Brain,
  Users,
  Award,
  ShieldCheck,
  Activity,
  BookOpen,
  Clock,
  Layers,
  Star,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

interface AdminPanelProps {
  user: UserProfile;
}

type AdminTab = 'games' | 'questions' | 'workers' | 'logs';

export default function AdminPanel({ user }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('questions');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [games, setGames] = useState<TrainingGame[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string>('');
  const [workers, setWorkers] = useState<UserProfile[]>([]);
  const [logs, setLogs] = useState<GameResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const [preguntaForm, setPreguntaForm] = useState('');
  const [opcionA, setOpcionA] = useState('');
  const [opcionB, setOpcionB] = useState('');
  const [opcionC, setOpcionC] = useState('');
  const [opcionD, setOpcionD] = useState('');
  const [correctIndex, setCorrectIndex] = useState(0);
  const [categoria, setCategoria] = useState('Seguridad Industrial');
  const [puntos, setPuntos] = useState(100);

  const [newGameTitle, setNewGameTitle] = useState('');
  const [newGameDescription, setNewGameDescription] = useState('');
  const [newGameActive, setNewGameActive] = useState(true);
  const [newGameMaxAttempts, setNewGameMaxAttempts] = useState(3);
  const [newGameType, setNewGameType] = useState<TrainingGameType>('quiz');
  const [newGameWordList, setNewGameWordList] = useState('');

  useEffect(() => {
    async function loadAdminData() {
      setLoading(true);
      try {
        const [qList, wList, lList, gList] = await Promise.all([
          getQuizQuestions(),
          getAllUsersProfiles(),
          getAllGameResults(),
          getTrainingGames()
        ]);

        setQuestions(qList);
        setWorkers(wList);
        setLogs(lList);
        setGames(gList);

        if (!selectedGameId && gList.length > 0) {
          const firstActive = gList.find((game) => game.activo) || gList[0];
          setSelectedGameId(firstActive.id);
        }
      } catch (err) {
        console.error('Error cargando datos administrativos:', err);
        setActionError('Error de lectura en Firebase Firestore o autenticación denegada.');
      } finally {
        setLoading(false);
      }
    }

    loadAdminData();
  }, [actionSuccess, selectedGameId]);

  const selectedGame = games.find((game) => game.id === selectedGameId);
  const isSelectedGameQuiz = selectedGame?.tipo !== 'word-search';
  const selectedGameQuestions = isSelectedGameQuiz
    ? questions.filter((question) => question.gameId === selectedGameId)
    : [];

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedGameId) {
      setActionError('Selecciona primero un juego válido para asignar la pregunta.');
      return;
    }

    if (selectedGame && selectedGame.tipo !== 'quiz') {
      setActionError('Solo puedes agregar preguntas a juegos del tipo Quiz. Selecciona un juego Quiz.');
      return;
    }

    if (!preguntaForm.trim() || !opcionA.trim() || !opcionB.trim() || !opcionC.trim() || !opcionD.trim()) {
      setActionError('Por favor completa la pregunta y las 4 opciones de respuesta.');
      return;
    }

    setActionError(null);
    setActionSuccess(null);

    const questionPayload = {
      gameId: selectedGameId,
      pregunta: preguntaForm.trim(),
      opciones: [opcionA, opcionB, opcionC, opcionD].map((option) => option.trim()),
      respuestaCorrecta: Number(correctIndex),
      categoria: categoria.trim(),
      puntos: Number(puntos) || 100,
      createdBy: user.uid
    };

    try {
      const createdQuestion = await addQuizQuestion(questionPayload);
      setQuestions((prev) => [...prev, createdQuestion]);
      setActionSuccess('Pregunta registrada exitosamente en CapacitaPlay.');
      setPreguntaForm('');
      setOpcionA('');
      setOpcionB('');
      setOpcionC('');
      setOpcionD('');
      setCorrectIndex(0);
    } catch (err) {
      console.error('Error creando pregunta:', err);
      setActionError('No se pudo registrar la pregunta en la base de datos.');
    }
  };

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanTitle = newGameTitle.trim();
    const cleanDescription = newGameDescription.trim();
    const cleanWords = newGameWordList
      .split(',')
      .map((word) => word.trim())
      .filter(Boolean);

    if (!cleanTitle || !cleanDescription) {
      setActionError('El juego necesita un título y una descripción.');
      return;
    }

    if (newGameType === 'word-search' && cleanWords.length === 0) {
      setActionError('Para Sopa de Letras ingresa al menos una palabra clave separada por comas.');
      return;
    }

    setActionError(null);
    setActionSuccess(null);

    try {
      const payload = {
        titulo: cleanTitle,
        descripcion: cleanDescription,
        activo: Boolean(newGameActive),
        maxAttemptsPerWeek: Number(newGameMaxAttempts) || 3,
        tipo: newGameType,
        createdBy: user.uid,
        ...(newGameType === 'word-search' ? { palabrasClave: cleanWords } : {})
      };

      const game = await addTrainingGame(payload);

      setGames((prev) => [...prev, game]);
      setActionSuccess(`Juego «${game.titulo}» creado correctamente.`);
      setNewGameTitle('');
      setNewGameDescription('');
      setNewGameActive(true);
      setNewGameMaxAttempts(3);
      setNewGameType('quiz');
      setNewGameWordList('');
      setSelectedGameId(game.id);
    } catch (err) {
      console.error('Error creando juego:', err);
      setActionError('No se pudo crear el juego. Revisa la consola para ver el error real de Firebase.');
    }
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta pregunta del catálogo de entrenamiento?')) return;

    setActionError(null);
    setActionSuccess(null);

    try {
      await deleteQuizQuestion(qId);
      setQuestions((prev) => prev.filter((question) => question.id !== qId));
      setActionSuccess('Pregunta eliminada correctamente de los servidores.');
    } catch (err) {
      console.error('Error eliminando pregunta:', err);
      setActionError('Error al eliminar la pregunta. Verifica los privilegios en firestore.rules.');
    }
  };

  const handleDeleteGame = async (gameId: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar este juego?')) return;

    setActionError(null);
    setActionSuccess(null);

    try {
      await deleteTrainingGame(gameId);
      setGames((prev) => prev.filter((game) => game.id !== gameId));
      if (selectedGameId === gameId) setSelectedGameId('');
      setActionSuccess('Juego eliminado correctamente de la base de datos.');
    } catch (err) {
      console.error('Error eliminando juego:', err);
      setActionError('Error al eliminar el juego. Revisa los permisos de Firestore.');
    }
  };

  const totalEnterpriseXP = workers.reduce((sum, w) => sum + (w.totalXP || 0), 0);
  const totalGamesPlayed = workers.reduce((sum, w) => sum + (w.gamesPlayed || 0), 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" id="admin-panel-view">
      <div className="border-b-2 border-gray-200 pb-6 mb-8 md:flex md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-850 flex items-center gap-2 tracking-tight">
            <ShieldCheck className="h-8 w-8 text-indigo-600 animate-pulse" />
            Consola del Administrador
          </h1>
          <p className="mt-1 text-xs text-gray-400 font-bold uppercase tracking-wider">
            Control de usuarios corporativos, catálogo de preguntas de Quiz y métricas de CapacitaPlay.
          </p>
        </div>
      </div>

      {actionError && (
        <div className="mb-6 flex items-start gap-2.5 rounded-2xl border-2 border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="mb-6 flex items-center gap-2.5 rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-4 text-xs font-black text-emerald-800">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 animate-bounce" />
          <span>{actionSuccess}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="rounded-2xl border-2 border-gray-200 bg-white p-5 flex items-center gap-4 shadow-sm">
          <div className="rounded-xl bg-indigo-50 border border-indigo-200 p-3 text-indigo-600">
            <Users className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-black uppercase block leading-none tracking-widest">Colaboradores</span>
            <span className="text-xl font-black text-gray-850 block mt-1.5">{workers.length} col.</span>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-gray-200 bg-white p-5 flex items-center gap-4 shadow-sm">
          <div className="rounded-xl bg-purple-50 border border-purple-200 p-3 text-purple-600">
            <Award className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-black uppercase block leading-none tracking-widest">XP Global</span>
            <span className="text-xl font-black text-indigo-600 block mt-1.5">{totalEnterpriseXP} XP</span>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-gray-200 bg-white p-5 flex items-center gap-4 shadow-sm">
          <div className="rounded-xl bg-indigo-50 border border-indigo-200 p-3 text-indigo-600">
            <BookOpen className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-black uppercase block leading-none tracking-widest">Preguntas</span>
            <span className="text-xl font-black text-gray-850 block mt-1.5">{questions.length} preg.</span>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-gray-200 bg-white p-5 flex items-center gap-4 shadow-sm">
          <div className="rounded-xl bg-purple-50 border border-purple-200 p-3 text-purple-600">
            <Activity className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-black uppercase block leading-none tracking-widest">Juegos Jugados</span>
            <span className="text-xl font-black text-gray-850 block mt-1.5">{totalGamesPlayed} part.</span>
          </div>
        </div>
      </div>

      <div className="border-2 border-gray-200 mb-8 flex gap-1 bg-white p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('games')}
          className={`px-4 py-2.5 rounded-lg text-xs font-black transition-all cursor-pointer uppercase tracking-wider ${
            activeTab === 'games' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-900'
          }`}
        >
          Juegos
        </button>
        <button
          onClick={() => setActiveTab('questions')}
          className={`px-4 py-2.5 rounded-lg text-xs font-black transition-all cursor-pointer uppercase tracking-wider ${
            activeTab === 'questions' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-900'
          }`}
        >
          Preguntas
        </button>
        <button
          onClick={() => setActiveTab('workers')}
          className={`px-4 py-2.5 rounded-lg text-xs font-black transition-all cursor-pointer uppercase tracking-wider ${
            activeTab === 'workers' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-900'
          }`}
        >
          Directorios
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2.5 rounded-lg text-xs font-black transition-all cursor-pointer uppercase tracking-wider ${
            activeTab === 'logs' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-900'
          }`}
        >
          Historial Logs
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center animate-pulse">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <p className="mt-4 text-xs text-gray-400 font-extrabold uppercase tracking-wide">Consultando registros corporativos...</p>
        </div>
      ) : (
        <>
          {activeTab === 'games' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="col-span-1 rounded-3xl border-2 border-gray-200 bg-white p-6 shadow-sm h-fit">
                <h3 className="font-extrabold text-gray-850 text-sm mb-4 flex items-center gap-1.5 border-b border-gray-100 pb-3 uppercase tracking-wider">
                  <Plus className="h-5 w-5 text-indigo-600" />
                  Crear Nuevo Juego
                </h3>

                <form onSubmit={handleCreateGame} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Título del juego</label>
                    <input
                      type="text"
                      value={newGameTitle}
                      onChange={(e) => setNewGameTitle(e.target.value)}
                      placeholder="Ej. Quiz de Seguridad"
                      className="block w-full rounded-xl border-2 border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-900 placeholder-gray-400 focus:border-indigo-600 focus:outline-none transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Descripción</label>
                    <textarea
                      value={newGameDescription}
                      onChange={(e) => setNewGameDescription(e.target.value)}
                      placeholder="Describe el objetivo del juego"
                      className="block w-full rounded-xl border-2 border-gray-200 bg-white px-3 py-2.5 text-xs font-bold text-gray-900 placeholder-gray-400 focus:border-indigo-600 focus:outline-none transition-all h-24 resize-none"
                      required
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      id="game-active-toggle"
                      type="checkbox"
                      checked={newGameActive}
                      onChange={(e) => setNewGameActive(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="game-active-toggle" className="text-xs font-bold text-gray-600 uppercase tracking-widest">
                      Activar juego inmediatamente
                    </label>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Intentos por semana</label>
                    <select
                      value={newGameMaxAttempts}
                      onChange={(e) => setNewGameMaxAttempts(Number(e.target.value))}
                      className="block w-full rounded-xl border-2 border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-900 focus:border-indigo-600 focus:outline-none transition-all"
                    >
                      <option value={1}>1 intento por semana</option>
                      <option value={3}>3 intentos por semana</option>
                      <option value={4}>4 intentos por semana</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Tipo de juego</label>
                    <select
                      value={newGameType}
                      onChange={(e) => setNewGameType(e.target.value as TrainingGameType)}
                      className="block w-full rounded-xl border-2 border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-900 focus:border-indigo-600 focus:outline-none transition-all"
                    >
                      <option value="quiz">Quiz</option>
                      <option value="word-search">Sopa de Letras</option>
                    </select>
                  </div>

                  {newGameType === 'word-search' && (
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                        Palabras clave separadas por comas
                      </label>
                      <textarea
                        value={newGameWordList}
                        onChange={(e) => setNewGameWordList(e.target.value)}
                        placeholder="Ej. seguridad, emergencia, ergonomía, cultura"
                        className="block w-full rounded-xl border-2 border-gray-200 bg-white px-3 py-2.5 text-xs font-bold text-gray-900 placeholder-gray-400 focus:border-indigo-600 focus:outline-none transition-all h-24 resize-none"
                      />
                      <p className="mt-2 text-[10px] text-gray-500 font-bold">Usaremos estas palabras para generar la sopa de letras interactiva.</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-indigo-600 py-3.5 text-xs font-black text-white hover:bg-indigo-500 border-b-4 border-indigo-800 transition uppercase tracking-wider cursor-pointer"
                  >
                    Crear Juego
                  </button>
                </form>
              </div>

              <div className="col-span-1 lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-extrabold text-gray-850 text-sm uppercase tracking-wider">Juegos Existentes</h3>
                  <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest">{games.length} juegos</span>
                </div>

                <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
                  {games.map((game) => (
                    <div key={game.id} className="rounded-2xl border-2 border-gray-200 bg-white p-5 shadow-sm flex justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-lg bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-[9px] font-black text-indigo-700 uppercase tracking-widest">
                            {game.activo ? 'Activo' : 'Inactivo'}
                          </span>
                          <span className="rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-1 text-[9px] font-black text-slate-700 uppercase tracking-widest">
                            {game.tipo === 'quiz' ? 'Quiz' : 'Sopa de Letras'}
                          </span>
                        </div>
                        <h4 className="mt-3.5 text-xs sm:text-sm font-black text-gray-850 leading-relaxed">{game.titulo}</h4>
                        <p className="mt-2 text-[10px] text-gray-500 leading-relaxed">{game.descripcion}</p>
                        <p className="mt-2 text-[9px] text-indigo-600 font-bold uppercase tracking-widest">⏱️ {game.maxAttemptsPerWeek} intentos/semana</p>
                      </div>
                      <div className="self-start flex flex-col items-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedGameId(game.id)}
                          className="rounded-2xl bg-indigo-600 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white hover:bg-indigo-500 transition"
                        >
                          Seleccionar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteGame(game.id)}
                          className="rounded-2xl border border-rose-200 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-50 transition"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}

                  {games.length === 0 && (
                    <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-3xl bg-white">
                      <Plus className="mx-auto h-12 w-12 text-gray-300 animate-bounce" />
                      <h4 className="font-extrabold text-gray-850 text-sm mt-3 uppercase tracking-wider">Todavía no hay juegos</h4>
                      <p className="text-xs text-gray-400 mt-1 font-bold">Crea tu primer juego para que los trabajadores puedan iniciar cursos.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'questions' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="col-span-1 rounded-3xl border-2 border-gray-200 bg-white p-6 shadow-sm h-fit">
                <h3 className="font-extrabold text-gray-850 text-sm mb-4 flex items-center gap-1.5 border-b border-gray-100 pb-3 uppercase tracking-wider">
                  <Plus className="h-5 w-5 text-indigo-600" />
                  Agregar Nueva Pregunta
                </h3>

                <form onSubmit={handleCreateQuestion} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Seleccionar Juego</label>
                    <select
                      id="select-game-for-question"
                      value={selectedGameId}
                      onChange={(e) => setSelectedGameId(e.target.value)}
                      className="block w-full rounded-xl border-2 border-gray-200 bg-white py-2 px-3 text-xs font-bold text-gray-700 outline-none focus:border-indigo-600 transition-all cursor-pointer"
                      required
                    >
                      <option value="" disabled>Selecciona un juego primero</option>
                      {games.map((game) => (
                        <option key={game.id} value={game.id}>{game.titulo}</option>
                      ))}
                    </select>
                    {selectedGame && selectedGame.tipo === 'word-search' && (
                      <p className="mt-2 text-[10px] text-amber-600 font-black uppercase tracking-wider">
                        Este juego es una Sopa de Letras. Las preguntas de Quiz solo aplican a juegos tipo Quiz.
                      </p>
                    )}
                    {games.length === 0 && (
                      <p className="mt-2 text-[10px] text-rose-600 font-bold">Debes crear al menos un juego antes de agregar preguntas.</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Pregunta</label>
                    <textarea
                      id="admin-new-question"
                      value={preguntaForm}
                      onChange={(e) => setPreguntaForm(e.target.value)}
                      placeholder="Escribe la consulta de capacitación laboral..."
                      className="block w-full rounded-xl border-2 border-gray-200 bg-white py-2.5 px-3.5 text-xs sm:text-sm font-bold text-gray-900 placeholder-gray-400 focus:border-indigo-600 focus:outline-none transition-all h-20 resize-none"
                      required
                    />
                  </div>

                  <div className="space-y-2.5">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Opciones de Respuesta</label>
                    {[
                      ['A', opcionA, setOpcionA, 'new-op-a'],
                      ['B', opcionB, setOpcionB, 'new-op-b'],
                      ['C', opcionC, setOpcionC, 'new-op-c'],
                      ['D', opcionD, setOpcionD, 'new-op-d']
                    ].map(([letter, value, setter, id]) => (
                      <div className="flex gap-2" key={String(letter)}>
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-xs font-black text-gray-400 border-2 border-gray-200 font-mono">
                          {String(letter)}
                        </span>
                        <input
                          id={String(id)}
                          type="text"
                          value={value as string}
                          onChange={(e) => (setter as React.Dispatch<React.SetStateAction<string>>)(e.target.value)}
                          placeholder="Opción de respuesta"
                          className="block w-full rounded-xl border-2 border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-900 placeholder-gray-400 focus:border-indigo-600 focus:outline-none transition-all"
                          required
                        />
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Respuesta Correcta</label>
                    <select
                      id="correct-index-select"
                      value={correctIndex}
                      onChange={(e) => setCorrectIndex(Number(e.target.value))}
                      className="block w-full rounded-xl border-2 border-gray-200 bg-white py-2 px-3 text-xs font-bold text-gray-700 outline-none focus:border-indigo-600 transition-all cursor-pointer"
                    >
                      <option value={0}>Opción A</option>
                      <option value={1}>Opción B</option>
                      <option value={2}>Opción C</option>
                      <option value={3}>Opción D</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Categoría</label>
                    <select
                      id="category-select"
                      value={categoria}
                      onChange={(e) => setCategoria(e.target.value)}
                      className="block w-full rounded-xl border-2 border-gray-200 bg-white py-2 px-3 text-xs font-bold text-gray-700 outline-none focus:border-indigo-600 transition-all cursor-pointer"
                    >
                      <option value="Seguridad Industrial">Seguridad Industrial</option>
                      <option value="Ciberseguridad">Ciberseguridad</option>
                      <option value="Trabajo en Equipo">Trabajo en Equipo</option>
                      <option value="Ética y Cultura">Ética y Cultura</option>
                      <option value="Salud Ocupacional">Salud Ocupacional</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Experiencia Recompensa XP</label>
                    <input
                      id="points-input"
                      type="number"
                      value={puntos}
                      onChange={(e) => setPuntos(Number(e.target.value))}
                      min={50}
                      max={500}
                      className="block w-full rounded-xl border-2 border-gray-200 bg-white py-2 px-3 text-xs font-bold text-gray-900 placeholder-gray-400 focus:border-indigo-600 focus:outline-none transition-all"
                      required
                    />
                  </div>

                  <button
                    id="submit-question-btn"
                    type="submit"
                    disabled={!selectedGameId}
                    className={`flex w-full items-center justify-center gap-1.5 rounded-2xl py-3.5 text-xs font-black text-white transition uppercase tracking-wider cursor-pointer ${
                      selectedGameId ? 'bg-indigo-600 hover:bg-indigo-500 border-b-4 border-indigo-800' : 'bg-gray-300 border-b-4 border-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Guardar Pregunta en Base de Datos
                  </button>
                </form>
              </div>

              <div className="col-span-1 lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-extrabold text-gray-850 text-sm uppercase tracking-wider">Preguntas Activas</h3>
                  <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest">{selectedGameQuestions.length} unidades</span>
                </div>

                <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
                  {selectedGameQuestions.map((q) => (
                    <div key={q.id} className="rounded-2xl border-2 border-gray-200 bg-white p-5 shadow-sm flex justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-lg bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-[9px] font-black text-indigo-700 uppercase tracking-widest">{q.categoria}</span>
                          <span className="rounded-lg bg-purple-50 border border-purple-200 px-2.5 py-1 text-[9px] font-black text-purple-700">+{q.puntos} XP</span>
                        </div>
                        <h4 className="mt-3.5 text-xs sm:text-sm font-black text-gray-850 leading-relaxed">{q.pregunta}</h4>
                        <p className="mt-2 text-[10px] uppercase tracking-widest text-gray-500 font-black">Juego: {selectedGame?.titulo || q.gameId}</p>
                        <div className="mt-3 space-y-2">
                          {q.opciones.map((op, idx) => (
                            <p key={idx} className={`text-[10px] py-0.5 line-clamp-1 ${idx === q.respuestaCorrecta ? 'font-black text-emerald-600' : 'text-gray-400 font-bold'}`}>
                              {String.fromCharCode(65 + idx)}) {op} {idx === q.respuestaCorrecta && '✔'}
                            </p>
                          ))}
                        </div>
                      </div>

                      <div className="self-start">
                        <button
                          id={`del-question-${q.id}`}
                          type="button"
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-gray-200 text-gray-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 transition cursor-pointer"
                          title="Eliminar pregunta"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {selectedGameQuestions.length === 0 && (
                    <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-3xl bg-white">
                      <Brain className="mx-auto h-12 w-12 text-gray-300 animate-bounce" />
                      <h4 className="font-extrabold text-gray-850 text-sm mt-3 uppercase tracking-wider">No hay preguntas para este juego</h4>
                      <p className="text-xs text-gray-400 mt-1 font-bold">Selecciona un juego activo y registra tu primera pregunta.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'workers' && (
            <div className="rounded-2xl border-2 border-gray-200 bg-white overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y-2 divide-gray-200" id="admin-workers-table">
                  <thead className="bg-gray-50/75">
                    <tr>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Colaborador</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Email</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Puesto / Cargo</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Rol</th>
                      <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">Juegos</th>
                      <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">Record Quiz</th>
                      <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">XP Sinergia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {workers.map((w) => (
                      <tr key={w.uid} className="hover:bg-gray-50/20 transition">
                        <td className="whitespace-nowrap px-6 py-4"><span className="text-xs sm:text-sm font-black text-gray-850 block">{w.nombre}</span></td>
                        <td className="whitespace-nowrap px-6 py-4 text-xs font-bold text-gray-400 font-mono">{w.email}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-xs text-gray-500 font-bold">{w.puesto || 'Trabajador'}</td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className={`inline-flex rounded-lg border px-2.5 py-0.5 text-[8px] font-black uppercase tracking-widest ${
                            w.rol === 'administrador' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-purple-50 border-purple-200 text-purple-700'
                          }`}>{w.rol}</span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-center text-xs font-black text-gray-700">{w.gamesPlayed || 0}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-xs font-black text-gray-950 font-mono">{w.quizHighScore || 0} pts</td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-xs sm:text-sm font-black text-indigo-600">
                          <span className="inline-flex items-center"><Star className="mr-0.5 h-3.5 w-3.5 text-indigo-600" />{w.totalXP || 0}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="rounded-2xl border-2 border-gray-200 bg-white overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y-2 divide-gray-200" id="admin-logs-table">
                  <thead className="bg-gray-50/75">
                    <tr>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Fecha / Hora</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Trabajador</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Actividad</th>
                      <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">Aciertos Ratio</th>
                      <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">Puntaje</th>
                      <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">XP Sumado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50/20 transition">
                        <td className="whitespace-nowrap px-6 py-4 text-xs font-bold text-gray-400 font-mono">
                          <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-gray-400" />{new Date(log.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}</span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-xs font-black text-gray-850">{log.userName}</td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className="flex items-center gap-1 text-xs text-indigo-700 font-extrabold font-mono"><Layers className="h-3.5 w-3.5 text-indigo-500" />{log.gameId === 'quiz_people' ? 'Quiz People' : log.gameId}</span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-center text-xs font-extrabold text-gray-500 font-mono">{log.correctAnswers} / {log.totalQuestions} ({Math.round((log.correctAnswers / (log.totalQuestions || 1)) * 100)}%)</td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-xs font-black text-gray-950 font-mono">{log.score}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-xs sm:text-sm font-black text-indigo-600">+{log.xpGained} XP</td>
                      </tr>
                    ))}

                    {logs.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-16 text-xs text-gray-400 font-bold uppercase tracking-wider italic">No se han completado entrenamientos todavía.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

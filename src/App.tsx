import React, { useState, useEffect } from 'react';
import { ActiveView, UserProfile, GameResult, TrainingGame } from './types';
import { subscribeToAuth, logoutUser, checkAndSeedMockRanking } from './services/store';
import Header from './components/Header';
import WelcomeView from './components/WelcomeView';
import LoginView from './components/LoginView';
import RegisterView from './components/RegisterView';
import DashboardView from './components/DashboardView';
import QuizGame from './components/QuizGame';
import WordSearchGame from './components/WordSearchGame';
import ResultsView from './components/ResultsView';
import LeaderboardView from './components/LeaderboardView';
import AdminPanel from './components/AdminPanel';
import { RefreshCw, Star, Info, Gamepad2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentView, setView] = useState<ActiveView>('welcome');
  const [activeResult, setActiveResult] = useState<GameResult | null>(null);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [selectedGameTitle, setSelectedGameTitle] = useState<string>('Quiz People');
  const [selectedGame, setSelectedGame] = useState<TrainingGame | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  // Authenticate and seed mock accounts once mounted
  useEffect(() => {
    // 1. Initialise the local storage demo worker profiles
    checkAndSeedMockRanking();

    // 2. Listen to authenticated user profile updates (Real Firebase or Simulation context)
    const unsubscribe = subscribeToAuth((profile) => {
      console.debug('[App] subscribeToAuth callback, profile=', profile);
      setUser(profile);
      if (profile) {
        changeView('dashboard');
      } else {
        changeView('welcome');
      }
      setBootstrapping(false);
    });

    return () => unsubscribe();
  }, []);

  // Wrapper to log view changes
  const changeView = (view: ActiveView) => {
    console.debug('[App] changeView:', { from: currentView, to: view });
    setView(view);
  };

  const handleLogout = async () => {
    if (window.confirm('¿Está seguro de que desea cerrar su sesión?')) {
      await logoutUser();
      setUser(null);
      changeView('welcome');
    }
  };

  const handleStartGame = (game: TrainingGame) => {
    setSelectedGame(game);
    setSelectedGameId(game.id);
    setSelectedGameTitle(game.titulo);
    changeView('quiz');
  };

  const handleQuizResultCompletion = (result: GameResult) => {
    setActiveResult(result);
    changeView('results');
  };

  const handleGoHome = () => {
    changeView('dashboard');
  };

  if (bootstrapping) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#F0F2F5]">
        <RefreshCw className="h-10 w-10 animate-spin text-indigo-600 mb-4" />
        <h3 className="text-sm font-black text-gray-850">Cargando CapacitaPlay...</h3>
        <p className="text-xs text-gray-400 mt-1">Conectando con la base de datos corporativa</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F0F2F5]" id="main-app-container" translate="no">
      
      {/* Universal Responsive Header */}
      <Header 
        user={user}
        currentView={currentView}
        setView={changeView}
        onLogout={handleLogout}
      />

      {/* Main Page Layout Wrapper */}
      <main className="flex-1 pb-16">
        
        {/* Dynamic Route/View Matrix */}
        {currentView === 'welcome' && (
          <WelcomeView setView={changeView} />
        )}

        {currentView === 'login' && (
          <LoginView setView={changeView} setUser={setUser} />
        )}

        {currentView === 'register' && (
          <RegisterView setView={changeView} setUser={setUser} />
        )}

        {user && (
          <>
            {currentView === 'dashboard' && (
              <DashboardView 
                user={user} 
                setView={changeView} 
                onStartGame={handleStartGame} 
              />
            )}

            {currentView === 'quiz' && selectedGame && (
              selectedGame.tipo !== 'word-search' ? (
                <QuizGame 
                  user={user}
                  setUser={setUser}
                  gameId={selectedGame.id}
                  gameTitle={selectedGame.titulo}
                  onClose={handleGoHome}
                  onViewResults={handleQuizResultCompletion}
                />
              ) : (
                <WordSearchGame
                  user={user}
                  setUser={setUser}
                  game={selectedGame}
                  onClose={handleGoHome}
                  onViewResults={handleQuizResultCompletion}
                />
              )
            )}

            {currentView === 'results' && activeResult && (
              <ResultsView 
                result={activeResult}
                onPlayAgain={() => {
                  if (selectedGame) {
                    handleStartGame(selectedGame);
                  }
                }}
                onGoHome={handleGoHome}
              />
            )}

            {currentView === 'leaderboard' && (
              <LeaderboardView user={user} />
            )}

            {currentView === 'admin' && user.rol === 'administrador' && (
              <AdminPanel user={user} />
            )}
          </>
        )}

      </main>

      {/* Persistent Information Bar with Sleek Interface Style */}
      <footer className="bg-white px-8 py-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center text-[10px] uppercase font-black tracking-widest text-gray-400 gap-2" id="app-footer-bar">
        <div>Sincronizado con Servidores de Capacitación • v1.0.4-stable</div>
        <div className="flex space-x-4">
            {user?.rol === 'administrador' && (
            <span className="text-indigo-500 cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => changeView('admin')}>Panel Admin</span>
          )}
          <span>Soporte Técnico</span>
        </div>
      </footer>

    </div>
  );
}

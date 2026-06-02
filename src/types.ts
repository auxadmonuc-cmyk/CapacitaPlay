export type UserRole = 'trabajador' | 'administrador';

export interface UserStats {
  totalXP: number;
  gamesPlayed: number;
  quizHighScore: number;
}

export interface UserProfile {
  uid: string;
  nombre: string;
  email: string;
  rol: UserRole;
  puesto?: string;
  cedula?: string;
  emailVerified?: boolean;
  totalXP: number;
  gamesPlayed: number;
  quizHighScore: number;
  createdAt: string;
  updatedAt?: string;
}

export type TrainingGameType = 'quiz' | 'word-search';

export interface TrainingGame {
  id: string;
  titulo: string;
  descripcion: string;
  activo: boolean;
  maxAttemptsPerWeek: number; // 3 o 4 intentos por semana
  tipo: TrainingGameType;
  palabrasClave?: string[];
  createdBy: string;
  createdAt: string;
}

export interface QuizQuestion {
  id: string;
  gameId: string;
  pregunta: string;
  opciones: string[];
  respuestaCorrecta: number; // Index 0 to 3
  categoria: string;
  puntos: number;
  createdBy: string;
  createdAt: string;
}

export interface GameResult {
  id: string;
  userId: string;
  userName: string;
  gameId: string;
  score: number;
  xpGained: number;
  correctAnswers: number;
  totalQuestions: number;
  createdAt: string;
}

export interface RankingEntry {
  userId: string;
  userName: string;
  puesto?: string;
  totalXP: number;
  lastUpdated: string;
}

export type ActiveView = 
  | 'welcome' 
  | 'login' 
  | 'register' 
  | 'dashboard' 
  | 'quiz' 
  | 'leaderboard' 
  | 'admin'
  | 'results'
  | 'games-hub';

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  limit, 
  where, 
  onSnapshot 
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  reload
} from 'firebase/auth';
import { db, auth, isMockFirebase } from '../firebase';
import { UserProfile, TrainingGame, QuizQuestion, GameResult, RankingEntry, UserRole } from '../types';

// Strict Operation Types for Firebase skill conformity
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

// Conforming Firebase Error Handler
function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: !isMockFirebase ? auth.currentUser?.uid : 'mock-user',
      email: !isMockFirebase ? auth.currentUser?.email : 'mock@example.com',
      emailVerified: !isMockFirebase ? auth.currentUser?.emailVerified : true,
      isAnonymous: !isMockFirebase ? auth.currentUser?.isAnonymous : false,
    },
    operationType,
    path
  };
  console.error('Firestore Error Detailed:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- INITIAL DEFAULT QUESTIONS (Quiz People) ---
const DEFAULT_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q-1',
    gameId: 'quiz_people',
    pregunta: '¿Cuál es el protocolo prioritario si descubres una fuga o derrame de líquidos sospechosos en el área de producción?',
    opciones: [
      'Ignore la fuga y continúe con su labor diaria',
      'Reporte de inmediato al supervisor de seguridad y evacúe / delimite el área de sospecha',
      'Limpie el líquido usted mismo sin preguntar y tire el paño a la basura común',
      'Tome una foto y publíquela en sus redes sociales corporativas'
    ],
    respuestaCorrecta: 1,
    categoria: 'Seguridad Industrial',
    puntos: 100,
    createdBy: 'system',
    createdAt: new Date().toISOString()
  },
  {
    id: 'q-2',
    gameId: 'quiz_people',
    pregunta: 'Recibes un correo sospechoso pidiéndote confirmar tu contraseña de acceso corporativo con urgencia. ¿Qué debes hacer?',
    opciones: [
      'Ingresar al enlace para evitar que bloqueen mi cuenta',
      'Preguntar a un compañero de oficina si también le llegó y responder',
      'Eliminar el correo o reportarlo inmediatamente al área de TI/Ciberseguridad sin hacer clic',
      'Responder con una contraseña falsa para confundirlos'
    ],
    respuestaCorrecta: 2,
    categoria: 'Ciberseguridad',
    puntos: 100,
    createdBy: 'system',
    createdAt: new Date().toISOString()
  },
  {
    id: 'q-3',
    gameId: 'quiz_people',
    pregunta: 'En un equipo de trabajo ágil, ¿cuál es el beneficio principal de realizar la reunión diaria de alineación (Daily Standup)?',
    opciones: [
      'Controlar minuciosamente los horarios de entrada de los trabajadores',
      'Alinear prioridades, identificar bloqueos mutuos y fomentar la colaboración transparente',
      'Justificar el despido de miembros que no tengan avances notables',
      'Presentar informes extensos de ventas generales'
    ],
    respuestaCorrecta: 1,
    categoria: 'Trabajo en Equipo',
    puntos: 100,
    createdBy: 'system',
    createdAt: new Date().toISOString()
  },
  {
    id: 'q-4',
    gameId: 'quiz_people',
    pregunta: 'De acuerdo con el Código de Ética corporativo, si eres testigo de un trato discriminatorio de un supervisor hacia un compañero, ¿cuál es la acción correcta?',
    opciones: [
      'Guardar silencio para no perjudicar tu estabilidad laboral ni meterte en problemas',
      'Enfrentar violentamente al supervisor en frente de los clientes',
      'Fomentar chismes en la cafetería para que todos se enteren',
      'Denunciar a través del canal oficial de denuncias éticas o comunicarte de forma confidencial con Recursos Humanos'
    ],
    respuestaCorrecta: 3,
    categoria: 'Ética y Cultura',
    puntos: 100,
    createdBy: 'system',
    createdAt: new Date().toISOString()
  },
  {
    id: 'q-5',
    gameId: 'quiz_people',
    pregunta: 'Para levantar un objeto pesado del suelo de forma ergonómica y segura, se debe:',
    opciones: [
      'Doblar la espalda por completo manteniendo las piernas rectas y jalar',
      'Mantener la espalda recta, flexionar las rodillas y levantar la carga usando la fuerza de las piernas',
      'Levantar el objeto lo más rápido posible dando un tirón brusco',
      'Pedir ayuda solo si el objeto pesa más de 200 kilos'
    ],
    respuestaCorrecta: 1,
    categoria: 'Salud Ocupacional',
    puntos: 100,
    createdBy: 'system',
    createdAt: new Date().toISOString()
  }
];

// --- LOCAL STORAGE SIMULATION ENGINES ---
class MockDatabase {
  private getStorageItem<T>(key: string, defaultValue: T): T {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  }

  private setStorageItem<T>(key: string, value: T) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  getUsers(): UserProfile[] {
    return this.getStorageItem<UserProfile[]>('mock_users', []);
  }

  getUser(uid: string): UserProfile | null {
    const users = this.getUsers();
    return users.find(u => u.uid === uid) || null;
  }

  saveUser(user: UserProfile) {
    const users = this.getUsers();
    const index = users.findIndex(u => u.uid === user.uid);
    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
    this.setStorageItem('mock_users', users);
    this.syncRanking(user);
  }

  getQuestions(): QuizQuestion[] {
    const questions = this.getStorageItem<QuizQuestion[]>('mock_questions', []);
    if (questions.length === 0) {
      this.setStorageItem('mock_questions', DEFAULT_QUESTIONS);
      return DEFAULT_QUESTIONS;
    }
    return questions;
  }

  getGames(): TrainingGame[] {
    const games = this.getStorageItem<TrainingGame[]>('mock_games', []);
    if (games.length === 0) {
      const defaultGames: TrainingGame[] = [
        {
          id: 'quiz_people',
          titulo: 'Quiz People',
          descripcion: 'Banco de preguntas de capacitación corporativa para evaluar conocimientos de seguridad y cultura.',
          activo: true,
          maxAttemptsPerWeek: 3,
          tipo: 'quiz',
          createdBy: 'system',
          createdAt: new Date().toISOString()
        }
      ];
      // Añadir Sopa de Letras por defecto para que esté disponible en el inicio
      defaultGames.push({
        id: 'sopa_letras',
        titulo: 'Sopa de Letras',
        descripcion: 'Busca y organiza vocabulario técnico y valores organizacionales.',
        activo: true,
        maxAttemptsPerWeek: 3,
        tipo: 'word-search',
        palabrasClave: ['JUAN','DAVID','MENDEZ','MENDEZ'],
        createdBy: 'system',
        createdAt: new Date().toISOString()
      });
      this.setStorageItem('mock_games', defaultGames);
      return defaultGames;
    }
    return games;
  }

  saveGame(game: TrainingGame) {
    const games = this.getGames();
    const index = games.findIndex(g => g.id === game.id);
    if (index >= 0) {
      games[index] = game;
    } else {
      games.push(game);
    }
    this.setStorageItem('mock_games', games);
  }

  deleteGame(id: string) {
    const games = this.getGames();
    const filtered = games.filter(g => g.id !== id);
    this.setStorageItem('mock_games', filtered);
  }

  saveQuestion(question: QuizQuestion) {
    const questions = this.getQuestions();
    const index = questions.findIndex(q => q.id === question.id);
    if (index >= 0) {
      questions[index] = question;
    } else {
      questions.push(question);
    }
    this.setStorageItem('mock_questions', questions);
  }

  deleteQuestion(id: string) {
    const questions = this.getQuestions();
    const filtered = questions.filter(q => q.id !== id);
    this.setStorageItem('mock_questions', filtered);
  }

  getResults(): GameResult[] {
    return this.getStorageItem<GameResult[]>('mock_results', []);
  }

  saveResult(result: GameResult) {
    const results = this.getResults();
    results.push(result);
    this.setStorageItem('mock_results', results);

    // Update user aggregates
    const user = this.getUser(result.userId);
    if (user) {
      user.gamesPlayed += 1;
      user.totalXP += result.xpGained;
      if (result.gameId === 'quiz_people' && result.score > (user.quizHighScore || 0)) {
        user.quizHighScore = result.score;
      }
      user.updatedAt = new Date().toISOString();
      this.saveUser(user);
    }
  }

  getRankings(): RankingEntry[] {
    const users = this.getUsers();
    const rankings: RankingEntry[] = users.map(u => ({
      userId: u.uid,
      userName: u.nombre,
      puesto: u.puesto || 'Trabajador',
      totalXP: u.totalXP,
      lastUpdated: u.updatedAt || u.createdAt
    }));
    return rankings.sort((a, b) => b.totalXP - a.totalXP);
  }

  private syncRanking(user: UserProfile) {
    // In localstorage users list is already up to date, it handles ranks dynamically
  }
}

const mockDB = new MockDatabase();

// --- EXPORTED SERVICE INTERFACE ---

// Auth State Provider Subscriber
export function subscribeToAuth(callback: (user: UserProfile | null) => void): () => void {
  if (isMockFirebase) {
    const loggedInId = localStorage.getItem('mock_logged_in_uid');
    console.debug('[store] subscribeToAuth (mock) invoked, loggedInId=', loggedInId);
    if (loggedInId) {
      const user = mockDB.getUser(loggedInId);
      console.debug('[store] subscribeToAuth (mock) returning user=', user);
      callback(user);
    } else {
      console.debug('[store] subscribeToAuth (mock) no logged user');
      callback(null);
    }
    return () => {};
  } else {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      console.debug('[store] onAuthStateChanged event, firebaseUser=', firebaseUser ? { uid: firebaseUser.uid, email: firebaseUser.email, emailVerified: firebaseUser.emailVerified } : null);
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'usuarios', firebaseUser.uid));
          if (userDoc.exists()) {
            console.debug('[store] user document exists for uid=', firebaseUser.uid);
            callback(userDoc.data() as UserProfile);
          } else {
            // New user signed in via google popup but document not created yet
            const defaultProfile: UserProfile = {
              uid: firebaseUser.uid,
              nombre: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Trabajador',
              email: firebaseUser.email || '',
              rol: 'trabajador',
              puesto: 'Nuevo Ingreso',
              totalXP: 0,
              gamesPlayed: 0,
              quizHighScore: 0,
              createdAt: new Date().toISOString()
            };
            await setDoc(doc(db, 'usuarios', firebaseUser.uid), defaultProfile);
            await setDoc(doc(db, 'ranking', firebaseUser.uid), {
              userId: firebaseUser.uid,
              userName: defaultProfile.nombre,
              puesto: defaultProfile.puesto,
              totalXP: 0,
              lastUpdated: new Date().toISOString()
            });
            console.debug('[store] created default profile for firebase user', firebaseUser.uid);
            callback(defaultProfile);
          }
        } catch (error) {
          console.error('Error fetching on auth state change user profile:', error);
          callback(null);
        }
      } else {
        console.debug('[store] onAuthStateChanged: no firebase user (signed out)');
        callback(null);
      }
    });
  }
}

// 1. Authentications
export async function registerUserEmail(
  email: string, 
  pwd: string, 
  nombre: string, 
  puesto: string,
  cedula: string
): Promise<UserProfile> {
  if (isMockFirebase) {
    const existingUser = mockDB.getUsers().find(u => u.email === email);
    if (existingUser) {
      throw new Error('El correo electrónico ya se encuentra registrado.');
    }
    const uid = 'mock-' + Math.random().toString(36).substring(2, 11);
    const newProfile: UserProfile = {
      uid,
      nombre,
      email,
      rol: 'trabajador',
      puesto: puesto || 'Trabajador',
      cedula,
      emailVerified: false,
      totalXP: 0,
      gamesPlayed: 0,
      quizHighScore: 0,
      createdAt: new Date().toISOString()
    };
    mockDB.saveUser(newProfile);
    return newProfile;
  } else {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pwd);
      const uid = userCredential.user.uid;
      if (userCredential.user) {
        await sendEmailVerification(userCredential.user);
      }
      const newProfile: UserProfile = {
        uid,
        nombre,
        email,
        rol: 'trabajador',
        puesto: puesto || 'Trabajador',
        cedula,
        emailVerified: false,
        totalXP: 0,
        gamesPlayed: 0,
        quizHighScore: 0,
        createdAt: new Date().toISOString()
      };
      // Save user to usuarios/
      await setDoc(doc(db, 'usuarios', uid), newProfile);
      // Save user to ranking/
      await setDoc(doc(db, 'ranking', uid), {
        userId: uid,
        userName: nombre,
        puesto: puesto || 'Trabajador',
        totalXP: 0,
        lastUpdated: new Date().toISOString()
      });
      await signOut(auth);
      return newProfile;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `usuarios/registration`);
      throw error;
    }
  }
}

export async function loginUserEmail(email: string, pwd: string): Promise<UserProfile> {
  if (isMockFirebase) {
    const user = mockDB.getUsers().find(u => u.email === email);
    if (!user) {
      throw new Error('Credenciales incorrectas o el usuario no existe.');
    }
    localStorage.setItem('mock_logged_in_uid', user.uid);
    return user;
  } else {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pwd);
      if (userCredential.user) {
        await reload(userCredential.user);
      }
      const userDoc = await getDoc(doc(db, 'usuarios', userCredential.user.uid));
      if (!userDoc.exists()) {
        throw new Error('Perfil de usuario no encontrado en la base de datos.');
      }
      const profile = userDoc.data() as UserProfile;
      if (userCredential.user.emailVerified && profile.emailVerified !== true) {
        profile.emailVerified = true;
        await setDoc(doc(db, 'usuarios', profile.uid), profile);
      }
      return profile;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `usuarios/login`);
      throw error;
    }
  }
}

export async function loginWithGoogle(): Promise<UserProfile> {
  if (isMockFirebase) {
    // Generate static Google user profile simulation
    const mockGoogleId = 'mock-google-' + Math.random().toString(36).substring(2, 9);
    const existing = mockDB.getUser(mockGoogleId);
    if (existing) {
      localStorage.setItem('mock_logged_in_uid', existing.uid);
      return existing;
    }
    const newProfile: UserProfile = {
      uid: mockGoogleId,
      nombre: 'Colaborador Google',
      email: 'colaborador@empresa.com',
      rol: 'trabajador',
      puesto: 'Enlace de Proyecto',
      emailVerified: true,
      totalXP: 100,
      gamesPlayed: 1,
      quizHighScore: 80,
      createdAt: new Date().toISOString()
    };
    mockDB.saveUser(newProfile);
    localStorage.setItem('mock_logged_in_uid', mockGoogleId);
    return newProfile;
  } else {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;
      const userDoc = await getDoc(doc(db, 'usuarios', firebaseUser.uid));
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      } else {
        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          nombre: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Colaborador',
          email: firebaseUser.email || '',
          rol: 'trabajador',
          puesto: 'Colaborador General',
          totalXP: 0,
          gamesPlayed: 0,
          quizHighScore: 0,
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'usuarios', firebaseUser.uid), newProfile);
        await setDoc(doc(db, 'ranking', firebaseUser.uid), {
          userId: firebaseUser.uid,
          userName: newProfile.nombre,
          puesto: newProfile.puesto,
          totalXP: 0,
          lastUpdated: new Date().toISOString()
        });
        return newProfile;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'usuarios/google');
      throw error;
    }
  }
}

export async function logoutUser() {
  if (isMockFirebase) {
    console.debug('[store] logoutUser (mock) removing mock_logged_in_uid');
    localStorage.removeItem('mock_logged_in_uid');
  } else {
    try {
      console.debug('[store] logoutUser calling signOut on Firebase auth');
      await signOut(auth);
    } catch (error) {
      console.error('Error in signout:', error);
    }
  }
}

export async function sendPasswordRecoveryEmail(email: string): Promise<void> {
  if (isMockFirebase) {
    const user = mockDB.getUsers().find(u => u.email === email);
    if (!user) {
      const err = new Error('No existe una cuenta registrada con ese correo.');
      (err as any).code = 'auth/user-not-found';
      throw err;
    }
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `auth/passwordReset`);
    throw error;
  }
}

// 2. Fetch Questions
export async function getQuizQuestions(gameId?: string): Promise<QuizQuestion[]> {
  if (isMockFirebase) {
    const questions = mockDB.getQuestions();
    return gameId ? questions.filter(q => q.gameId === gameId) : questions;
  } else {
    try {
      let qSnap;
      if (gameId) {
        const q = query(collection(db, 'preguntas'), where('gameId', '==', gameId));
        qSnap = await getDocs(q);
      } else {
        qSnap = await getDocs(collection(db, 'preguntas'));
      }

      if (qSnap.empty && !gameId) {
        // Seed initial default questions into Firebase automatically
        console.log('Seeding initial questions in Firebase...');
        const seedPromises = DEFAULT_QUESTIONS.map(question => 
          setDoc(doc(db, 'preguntas', question.id), question)
        );
        await Promise.all(seedPromises);
        return DEFAULT_QUESTIONS;
      }
      if (qSnap.empty) {
        return [];
      }
      const questions: QuizQuestion[] = [];
      qSnap.forEach(docSnap => {
        questions.push(docSnap.data() as QuizQuestion);
      });
      return questions;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'preguntas');
      return DEFAULT_QUESTIONS;
    }
  }
}

export async function getTrainingGames(): Promise<TrainingGame[]> {
  if (isMockFirebase) {
    return mockDB.getGames();
  } else {
    try {
      const gSnap = await getDocs(collection(db, 'juegos'));
      const games: TrainingGame[] = [];
      gSnap.forEach(docSnap => {
        games.push(docSnap.data() as TrainingGame);
      });
      return games;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'juegos');
      return [];
    }
  }
}

export async function addTrainingGame(game: Omit<TrainingGame, 'id' | 'createdAt'>): Promise<TrainingGame> {
  const newId = game.titulo.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'game_' + Math.random().toString(36).substring(2, 9);
  const newGame: TrainingGame = {
    ...game,
    id: newId,
    createdAt: new Date().toISOString()
  };

  if (isMockFirebase) {
    mockDB.saveGame(newGame);
    return newGame;
  } else {
    try {
      await setDoc(doc(db, 'juegos', newId), newGame);
      return newGame;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `juegos/${newId}`);
      throw error;
    }
  }
}

export async function deleteTrainingGame(id: string): Promise<void> {
  if (isMockFirebase) {
    mockDB.deleteGame(id);
  } else {
    try {
      await deleteDoc(doc(db, 'juegos', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `juegos/${id}`);
      throw error;
    }
  }
}

// Get weekly attempt count for a user on a specific game
export async function getUserGameAttemptsThisWeek(userId: string, gameId: string): Promise<number> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoISO = sevenDaysAgo.toISOString();

  if (isMockFirebase) {
    const results = mockDB.getResults();

    return results.filter(
      (r) =>
        r.userId === userId &&
        r.gameId === gameId &&
        new Date(r.createdAt) >= new Date(sevenDaysAgoISO)
    ).length;
  } else {
    try {
      const q = query(
        collection(db, 'resultados'),
        where('userId', '==', userId),
        where('gameId', '==', gameId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.filter((doc) => {
        const resultDate = new Date(doc.data().createdAt);
        return resultDate >= new Date(sevenDaysAgoISO);
      }).length;
    } catch (error) {
      console.warn('Error fetching weekly attempts:', error);
      return 0;
    }
  }
}

// 3. Submit Question (Admin)
export async function addQuizQuestion(q: Omit<QuizQuestion, 'id' | 'createdAt'>): Promise<QuizQuestion> {
  const newId = 'q-' + Math.random().toString(36).substring(2, 9);
  const createdQuestion: QuizQuestion = {
    ...q,
    id: newId,
    createdAt: new Date().toISOString()
  };

  if (isMockFirebase) {
    mockDB.saveQuestion(createdQuestion);
    return createdQuestion;
  } else {
    try {
      await setDoc(doc(db, 'preguntas', newId), createdQuestion);
      return createdQuestion;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `preguntas/${newId}`);
      throw error;
    }
  }
}

// 4. Delete Question (Admin)
export async function deleteQuizQuestion(id: string): Promise<void> {
  if (isMockFirebase) {
    mockDB.deleteQuestion(id);
  } else {
    try {
      await deleteDoc(doc(db, 'preguntas', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `preguntas/${id}`);
      throw error;
    }
  }
}

// 5. Submit Game Results
export async function submitGameResult(
  score: number,
  xpGained: number,
  correct: number,
  total: number,
  gameId: string,
  userProfile: UserProfile
): Promise<GameResult> {
  const resId = 'res-' + Math.random().toString(36).substring(2, 11);
  const result: GameResult = {
    id: resId,
    userId: userProfile.uid,
    userName: userProfile.nombre,
    gameId,
    score,
    xpGained,
    correctAnswers: correct,
    totalQuestions: total,
    createdAt: new Date().toISOString()
  };

  if (isMockFirebase) {
    mockDB.saveResult(result);
    return result;
  } else {
    try {
      // 1. Save game results
      await setDoc(doc(db, 'resultados', resId), result);

      // 2. Incremental update stats of users
      const updatedProfile: UserProfile = {
        ...userProfile,
        gamesPlayed: (userProfile.gamesPlayed || 0) + 1,
        totalXP: (userProfile.totalXP || 0) + xpGained,
        quizHighScore: gameId === 'quiz_people' 
          ? Math.max(userProfile.quizHighScore || 0, score) 
          : (userProfile.quizHighScore || 0),
        updatedAt: new Date().toISOString()
      };

      // 3. Write profile updates
      await setDoc(doc(db, 'usuarios', userProfile.uid), updatedProfile);

      // 4. Update the ranking node
      await setDoc(doc(db, 'ranking', userProfile.uid), {
        userId: userProfile.uid,
        userName: userProfile.nombre,
        puesto: userProfile.puesto || 'Trabajador',
        totalXP: updatedProfile.totalXP,
        lastUpdated: new Date().toISOString()
      });

      return result;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `resultados/${resId}`);
      throw error;
    }
  }
}

// 6. Fetch Ranking/Leaderboard (General)
export async function getGeneralLeaderboard(): Promise<RankingEntry[]> {
  if (isMockFirebase) {
    return mockDB.getRankings();
  } else {
    try {
      const q = query(collection(db, 'ranking'), orderBy('totalXP', 'desc'), limit(50));
      const rSnap = await getDocs(q);
      const rankings: RankingEntry[] = [];
      rSnap.forEach(docSnap => {
        rankings.push(docSnap.data() as RankingEntry);
      });

      if (rankings.length === 0) {
        // Fallback: build dynamically from users collection if ranking is empty
        const userQ = query(collection(db, 'usuarios'), orderBy('totalXP', 'desc'), limit(50));
        const userSnap = await getDocs(userQ);
        userSnap.forEach(docSnap => {
          const u = docSnap.data() as UserProfile;
          rankings.push({
            userId: u.uid,
            userName: u.nombre,
            puesto: u.puesto || 'Trabajador',
            totalXP: u.totalXP,
            lastUpdated: u.updatedAt || u.createdAt
          });
        });
      }
      return rankings;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'ranking');
      return mockDB.getRankings(); // Fallback on error
    }
  }
}

// 7. Get All Users Profiles (Admin Only)
export async function getAllUsersProfiles(): Promise<UserProfile[]> {
  if (isMockFirebase) {
    return mockDB.getUsers();
  } else {
    try {
      const snap = await getDocs(collection(db, 'usuarios'));
      const profiles: UserProfile[] = [];
      snap.forEach(docSnap => {
        profiles.push(docSnap.data() as UserProfile);
      });
      return profiles;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'usuarios');
      throw error;
    }
  }
}

// 8. Get All Game Results (Admin Only)
export async function getAllGameResults(): Promise<GameResult[]> {
  if (isMockFirebase) {
    return mockDB.getResults();
  } else {
    try {
      const snap = await getDocs(collection(db, 'resultados'));
      const results: GameResult[] = [];
      snap.forEach(docSnap => {
        results.push(docSnap.data() as GameResult);
      });
      return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'resultados');
      throw error;
    }
  }
}

// Seed mock players into localStorage to populate ranking for interactive game fun!
// To add admin users in code, edit the seeded users below and set rol: 'administrador'.
export function checkAndSeedMockRanking() {
  const users = mockDB.getUsers();
  if (users.length === 0) {
    const seedUsers: UserProfile[] = [
      {
        uid: 'seed-1',
        nombre: 'Sofía Jiménez',
        email: 'sofia.j@empresa.com',
        rol: 'trabajador',
        puesto: 'Ingeniera de Procesos',
        emailVerified: true,
        totalXP: 1450,
        gamesPlayed: 12,
        quizHighScore: 95,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        uid: 'seed-2',
        nombre: 'Martín Silva',
        email: 'martin.s@empresa.com',
        rol: 'trabajador',
        puesto: 'Coordinador de Almacén',
        emailVerified: true,
        totalXP: 1210,
        gamesPlayed: 10,
        quizHighScore: 90,
        createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        uid: 'seed-3',
        nombre: 'Valeria Castro',
        email: 'valeria.c@empresa.com',
        rol: 'trabajador',
        puesto: 'Analista de Seguridad TI',
        emailVerified: true,
        totalXP: 980,
        gamesPlayed: 8,
        quizHighScore: 85,
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        uid: 'seed-4',
        nombre: 'Diego Mendoza',
        email: 'diego.m@empresa.com',
        rol: 'trabajador',
        puesto: 'Supervisor de Planta',
        emailVerified: true,
        totalXP: 820,
        gamesPlayed: 7,
        quizHighScore: 80,
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        uid: 'seed-5',
        nombre: 'Paula Novoa',
        email: 'paula.n@empresa.com',
        rol: 'administrador', // Seeded administrator
        puesto: 'Directora de Capacitación',
        emailVerified: true,
        totalXP: 550,
        gamesPlayed: 4,
        quizHighScore: 100,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    seedUsers.forEach(u => mockDB.saveUser(u));
  }
}

export interface UserProfile {
  uid: string;
  displayName: string;
  avatarUrl?: string;
  totalScore: number;
  badges: string[];
  achievements: Achievement[];
  friends: string[];
  parentalControls: ParentalControls;
  createdAt: string;
  updatedAt: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlockedAt: string;
  icon: string;
}

export interface ParentalControls {
  timeLimitMinutes: number;
  restrictedGames: string[];
  isMuted: boolean;
}

export interface GameScore {
  gameId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  score: number;
  timestamp: any; // Firestore serverTimestamp
}

export type GameId = 'space-adventure' | 'candy-cruise' | 'math-quest' | 'word-spark' | 'racing' | 'puzzle';

export interface GameMeta {
  id: GameId;
  title: string;
  description: string;
  icon: string;
  color: string;
  gradient: string;
  category: 'adventure' | 'puzzle' | 'educational' | 'skill';
}

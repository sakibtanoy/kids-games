export interface UserProfile {
  uid: string;
  displayName: string;
  avatarUrl?: string;
  totalScore: number;
  badges: string[];
  achievements: Achievement[];
  friends: string[];
  parentalControls: ParentalControls;
  isUsernameSet: boolean;
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

export type GameId =
  | 'tic-tac-toe'
  | 'space-adventure'
  | 'flappy-forest'
  | 'candy-cruise'
  | 'math-quest'
  | 'word-spark'
  | 'racing'
  | 'fruit-slicer'
  | 'whack-rabbit'
  | 'puzzle'
  | 'tower-stacker'
  | 'snake-arena'
  | 'balloon-pop'
  | 'tiny-cat-runner'
  | 'candy-catcher'
  | 'fish-feeding'
  | 'memory-animals'
  | 'mini-car-dodge'
  | 'bubble-shooter'
  | 'hungry-panda'
  | 'jumping-frog'
  | 'toy-claw'
  | 'monster-cleanup'
  | 'rocket-tap'
  | 'penguin-slide'
  | 'paint-splash';

export interface GameMeta {
  id: GameId;
  title: string;
  description: string;
  icon: string;
  color: string;
  gradient: string;
  category: 'adventure' | 'puzzle' | 'educational' | 'skill';
}

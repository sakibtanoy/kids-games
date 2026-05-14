import { GameMeta } from './types';

export const GAMES: GameMeta[] = [
  {
    id: 'tic-tac-toe',
    title: 'Tic Tac Toe',
    description: 'Play the classic game of noughts and crosses!',
    icon: 'Hash',
    color: '#0ea5e9',
    gradient: 'from-sky-400 to-sky-600',
    category: 'puzzle'
  },
  {
    id: 'math-quest',
    title: 'Math Quest',
    description: 'Master math challenges and become a hero!',
    icon: 'Binary',
    color: '#10b981',
    gradient: 'from-emerald-500 to-teal-600',
    category: 'educational'
  },
  {
    id: 'word-spark',
    title: 'Word Spark',
    description: 'Find hidden words and boost your vocabulary!',
    icon: 'Type',
    color: '#f59e0b',
    gradient: 'from-amber-500 to-orange-600',
    category: 'educational'
  },
  {
    id: 'whack-rabbit',
    title: 'Whack-a-Rabbit',
    description: 'Quick! Smash those pesky rabbits before they hide!',
    icon: 'Hammer',
    color: '#f97316',
    gradient: 'from-orange-400 to-orange-600',
    category: 'skill'
  },
  {
    id: 'space-adventure',
    title: 'Space Adventure',
    description: 'Fly through galaxies and dodge asteroids!',
    icon: 'Rocket',
    color: '#6366f1',
    gradient: 'from-indigo-500 to-purple-600',
    category: 'adventure'
  },
  {
    id: 'racing',
    title: 'Turbo Racing',
    description: 'Speed through cartoon tracks and finish first!',
    icon: 'Car',
    color: '#ef4444',
    gradient: 'from-red-500 to-orange-600',
    category: 'skill'
  },
  {
    id: 'candy-cruise',
    title: 'Candy Cruise',
    description: 'Match candies and clear levels in this sweet journey!',
    icon: 'Candy',
    color: '#ec4899',
    gradient: 'from-pink-500 to-rose-600',
    category: 'puzzle'
  },
  {
    id: 'puzzle',
    title: 'Cube Puzzle',
    description: 'Solve brain-teasing puzzles and unlock secrets!',
    icon: 'Puzzle',
    color: '#3b82f6',
    gradient: 'from-blue-500 to-cyan-600',
    category: 'puzzle'
  },
  {
    id: 'fruit-slicer',
    title: 'Fruit Slicer',
    description: 'Slice juicy fruits and avoid dangerous bombs!',
    icon: 'Apple',
    color: '#10b981',
    gradient: 'from-green-400 to-emerald-600',
    category: 'skill'
  }
];

export const BADGES = [
  { id: 'early-bird', title: 'Early Bird', description: 'Join the hub and start your adventure!', icon: 'Sunrise' },
  { id: 'math-wizard', title: 'Math Wizard', description: 'Score over 1000 points in Math Quest.', icon: 'Sparkles' },
  { id: 'top-racer', title: 'Top Racer', description: 'Complete 10 races in Turbo Racing.', icon: 'Trophy' },
  { id: 'word-master', title: 'Word Master', description: 'Solve 20 words in Word Spark.', icon: 'Languages' },
  { id: 'adventure-hero', title: 'Adventure Hero', description: 'Reach 5000m in Space Adventure.', icon: 'Shield' }
];

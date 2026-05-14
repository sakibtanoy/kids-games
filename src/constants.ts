import { GameMeta } from './types';

export const GAMES: GameMeta[] = [
  {
    id: 'tic-tac-toe',
    title: 'Tic Tac Toe',
    description: 'Play the classic game of noughts and crosses!',
    icon: 'Hash',
    color: '#0ea5e9', // Sky
    gradient: 'from-sky-400 to-sky-600',
    category: 'puzzle'
  },
  {
    id: 'math-quest',
    title: 'Math Quest',
    description: 'Master math challenges and become a hero!',
    icon: 'Binary',
    color: '#10b981', // Emerald
    gradient: 'from-emerald-500 to-teal-600',
    category: 'educational'
  },
  {
    id: 'word-spark',
    title: 'Word Spark',
    description: 'Find hidden words and boost your vocabulary!',
    icon: 'Type',
    color: '#f59e0b', // Amber
    gradient: 'from-amber-500 to-orange-600',
    category: 'educational'
  },
  {
    id: 'racing',
    title: 'Turbo Racing',
    description: 'Speed through cartoon tracks and finish first!',
    icon: 'Car',
    color: '#ef4444', // Red
    gradient: 'from-red-500 to-orange-600',
    category: 'skill'
  },
  {
    id: 'fruit-slicer',
    title: 'Fruit Slicer',
    description: 'Slice juicy fruits and avoid dangerous bombs!',
    icon: 'Apple',
    color: '#84cc16', // Lime
    gradient: 'from-lime-400 to-green-600',
    category: 'skill'
  },
  {
    id: 'whack-rabbit',
    title: 'Whack-a-Rabbit',
    description: 'Quick! Smash those pesky rabbits before they hide!',
    icon: 'Hammer',
    color: '#f97316', // Orange
    gradient: 'from-orange-400 to-orange-600',
    category: 'skill'
  },
  {
    id: 'space-adventure',
    title: 'Space Adventure',
    description: 'Fly through galaxies and dodge asteroids!',
    icon: 'Rocket',
    color: '#6366f1', // Indigo
    gradient: 'from-indigo-500 to-purple-600',
    category: 'adventure'
  },
  {
    id: 'candy-cruise',
    title: 'Candy Cruise',
    description: 'Match candies and clear levels in this sweet journey!',
    icon: 'Candy',
    color: '#ec4899', // Pink
    gradient: 'from-pink-500 to-rose-600',
    category: 'puzzle'
  },
  {
    id: 'puzzle',
    title: 'Cube Puzzle',
    description: 'Solve brain-teasing puzzles and unlock secrets!',
    icon: 'Puzzle',
    color: '#3b82f6', // Blue
    gradient: 'from-blue-500 to-cyan-600',
    category: 'puzzle'
  },
  {
    id: 'tower-stacker',
    title: 'Tower Stacker',
    description: 'Stack blocks to build the tallest animal tower!',
    icon: 'Layers',
    color: '#06b6d4', // Cyan
    gradient: 'from-cyan-400 to-blue-600',
    category: 'skill'
  },
  {
    id: 'snake-arena',
    title: 'Snake Arena',
    description: 'Battle other snakes and grow to dominate the arena!',
    icon: 'ChevronRight',
    color: '#a855f7', // Purple
    gradient: 'from-violet-500 to-purple-600',
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

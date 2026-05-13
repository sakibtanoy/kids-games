import React from 'react';
import { motion } from 'motion/react';
import { 
  Trophy, 
  Settings, 
  LogOut, 
  User as UserIcon,
  ShieldCheck,
  Star,
  Rocket,
  Candy,
  Binary,
  Type,
  Car,
  Puzzle,
  Hammer,
  Hash,
  LucideIcon
} from 'lucide-react';
import { useAuth } from './AuthProvider';
import { cn } from '../lib/utils';

const ICON_MAP: Record<string, LucideIcon> = {
  Rocket,
  Candy,
  Binary,
  Type,
  Car,
  Puzzle,
  Hammer,
  Hash
};

export function Header({ onOpenSettings }: { onOpenSettings: () => void }) {
  const { user, profile } = useAuth();

  return (
    <header className="mb-6 bg-white rounded-3xl p-4 shadow-[0_8px_0_0_#e0e7ff] border-2 border-indigo-200 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-yellow-400 rounded-2xl flex items-center justify-center border-b-4 border-yellow-600 shadow-lg group">
          <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 4 }}>
            <Rocket className="text-white fill-white" size={32} />
          </motion.div>
        </div>
        <div>
          <h1 className="text-3xl font-black text-indigo-900 tracking-tight leading-none">KIDDO HUB</h1>
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mt-1">
            {profile ? `Level ${Math.floor((profile.totalScore / 500) + 1)} • Galactic Explorer` : 'Welcome Hero!'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        {user ? (
          <>
            <div className="bg-orange-100 rounded-full px-5 py-2 hidden md:flex items-center gap-3 border-2 border-orange-200">
              <Star className="text-orange-500 fill-orange-500" size={18} />
              <span className="text-lg font-black text-orange-600">{profile?.totalScore || 0}</span>
            </div>
            
            <div className="flex items-center gap-2 bg-indigo-900 text-white rounded-full px-4 py-2 border-b-4 border-indigo-950 cursor-pointer hover:bg-slate-800 transition-colors" onClick={onOpenSettings}>
              <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                <ShieldCheck size={16} />
              </div>
              <span className="font-bold text-xs uppercase tracking-wider hidden sm:inline">Parent Zone</span>
            </div>

            <div className="w-12 h-12 bg-pink-500 rounded-full border-4 border-white shadow-md overflow-hidden flex items-center justify-center">
              {user.photoURL ? (
                <img src={user.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <span className="text-2xl">🐯</span>
              )}
            </div>
          </>
        ) : (
          <button 
            onClick={() => useAuth().signIn()}
            className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black shadow-[0_4px_0_0_#3730a3] hover:bg-indigo-500 transition-all"
          >
            START
          </button>
        )}
      </div>
    </header>
  );
}

interface GameCardProps {
  game: any;
  onClick: () => void;
  isRestricted?: boolean;
  key?: any;
}

export function GameCard({ 
  game, 
  onClick,
  isRestricted 
}: GameCardProps) {
  const Icon = ICON_MAP[game.icon];

  // Map category to theme colors
  const themeStyles = {
    'adventure': 'bg-blue-400 shadow-[0_12px_0_0_#1e40af] ring-blue-500',
    'puzzle': 'bg-emerald-400 shadow-[0_12px_0_0_#065f46] ring-emerald-500',
    'educational': 'bg-amber-400 shadow-[0_12px_0_0_#b45309] ring-amber-500',
    'skill': 'bg-rose-400 shadow-[0_12px_0_0_#9f1239] ring-rose-500'
  } as const;

  const style = themeStyles[game.category as keyof typeof themeStyles] || themeStyles.adventure;

  return (
    <motion.div
      whileHover={{ y: -8 }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "rounded-[40px] p-2 flex flex-col group h-full",
        style,
        isRestricted && "grayscale opacity-80 pointer-events-none"
      )}
    >
      <div className="bg-white/20 h-44 rounded-[32px] flex items-center justify-center relative overflow-hidden transition-colors group-hover:bg-white/30">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle,_#fff_1px,_transparent_1px)] bg-[size:20px_20px]"></div>
        {Icon && (
          <motion.div
            whileHover={{ rotate: [0, -10, 10, 0] }}
            className="drop-shadow-2xl"
          >
            <Icon className="text-white fill-white/20" size={80} />
          </motion.div>
        )}
        <div className="absolute bottom-4 left-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-widest whitespace-nowrap">
          {game.category}
        </div>
      </div>
      
      <div className="p-4 text-center flex flex-col items-center gap-2">
        <h3 className="text-white font-black text-lg uppercase leading-tight">
          {game.title}
        </h3>
        <button 
          onClick={onClick}
          className="mt-1 bg-white text-indigo-900 font-black py-2.5 px-10 rounded-full shadow-lg text-sm hover:scale-105 active:scale-95 transition-all uppercase tracking-wider"
        >
          {isRestricted ? 'Locked' : 'Play'}
        </button>
      </div>
    </motion.div>
  );
}

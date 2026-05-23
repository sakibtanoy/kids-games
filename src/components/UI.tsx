import React from 'react';
import { motion } from 'motion/react';
import { 
  Users,
  LucideIcon,
  Star,
  Rocket
} from 'lucide-react';
import { ICON_MAP } from '../lib/icons';
import { useAuth } from './AuthProvider';
import { cn } from '../lib/utils';



export function Header({ onOpenSettings, onOpenMultiplayer }: { onOpenSettings: () => void, onOpenMultiplayer: () => void }) {
  const { user, profile } = useAuth();

  return (
    <header className="mb-4 bg-white rounded-2xl md:rounded-3xl p-3 md:p-4 shadow-[0_8px_0_0_#e0e7ff] border-2 border-indigo-200 flex items-center justify-between relative z-10">
      <div className="flex items-center gap-3 md:gap-4">
        <div className="w-10 h-10 md:w-14 md:h-14 bg-yellow-400 rounded-2xl flex items-center justify-center border-b-4 border-yellow-600 shadow-lg group">
          <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 4 }}>
            <Rocket className="text-white fill-white" size={24} />
          </motion.div>
        </div>
        <div>
          <h1 className="text-xl md:text-3xl font-black text-indigo-900 tracking-tight leading-none uppercase">
            {profile?.displayName ? `HI, ${profile.displayName}!` : 'KIDDO HUB'}
          </h1>
          <p className="text-[8px] md:text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mt-1">
            {profile ? `Level ${Math.floor((profile.totalScore / 500) + 1)} • Galactic Explorer` : 'Welcome Hero!'}
          </p>
        </div>

      </div>

      <div className="flex items-center gap-2 md:gap-6">
        {user ? (
          <>
            <div className="bg-orange-100 rounded-full px-4 py-1.5 hidden md:flex items-center gap-3 border-2 border-orange-200">
              <Star className="text-orange-500 fill-orange-500" size={16} />
              <span className="text-base font-black text-orange-600">{profile?.totalScore || 0}</span>
            </div>

            <button 
              onClick={onOpenMultiplayer} 
              className="hidden lg:flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-indigo-200 transition-all shadow-sm"
            >
              <Users size={16} /> Play Together
            </button>
            
            <div className="flex items-center justify-center bg-indigo-900 text-white rounded-full w-10 h-10 md:w-12 md:h-12 border-b-4 border-indigo-950 cursor-pointer hover:bg-slate-800 transition-all" onClick={onOpenMultiplayer}>
              <div className="w-7 h-7 md:w-8 md:h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                <Users size={16} />
              </div>
            </div>

            <div className="w-10 h-10 md:w-12 md:h-12 bg-pink-500 rounded-full border-4 border-white shadow-md overflow-hidden flex items-center justify-center">
              {user.photoURL ? (
                <img src={user.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <span className="text-xl md:text-2xl">🐯</span>
              )}
            </div>
          </>
        ) : (
          <button 
            onClick={() => useAuth().signIn()}
            className="bg-indigo-600 text-white px-6 py-2.5 md:px-8 md:py-3 rounded-2xl font-black shadow-[0_4px_0_0_#3730a3] hover:bg-indigo-500 transition-all text-sm md:text-base"
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

export function GameCard({ game, onClick, isRestricted }: GameCardProps) {
  const Icon = ICON_MAP[game.icon];

  return (
    <motion.div
      whileHover={{ y: -8 }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "rounded-[2.5rem] md:rounded-[40px] p-3 flex flex-col group h-full transition-all mb-[0.25rem] bg-gradient-to-br shadow-[0_10px_0_0_rgba(0,0,0,0.2)]",
        game.gradient,
        isRestricted && "grayscale opacity-80 pointer-events-none"
      )}
    >
      <div className="bg-white/20 h-32 md:h-44 rounded-[24px] md:rounded-[32px] flex items-center justify-center relative overflow-hidden transition-colors group-hover:bg-white/30">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle,_#fff_1px,_transparent_1px)] bg-[size:15px_15px] md:bg-[size:20px_20px]"></div>
        {Icon && (
          <motion.div
            whileHover={{ rotate: [0, -10, 10, 0] }}
            className="drop-shadow-2xl"
          >
            <Icon className="text-white fill-white/20" size={56} />
          </motion.div>
        )}
        <div className="absolute bottom-3 left-3 md:bottom-4 md:left-4 bg-white/20 backdrop-blur-md px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[8px] md:text-[10px] font-black text-white uppercase tracking-widest whitespace-nowrap">
          {game.category}
        </div>
      </div>
      
      <div className="p-3 md:p-4 text-center flex flex-col items-center gap-1 md:gap-2">
        <h3 className="text-white font-black text-xs md:text-lg uppercase leading-tight">
          {game.title}
        </h3>
        <button 
          onClick={isRestricted ? undefined : onClick}
          className={cn(
            "mt-1 font-black py-1.5 md:py-2.5 px-6 md:px-10 rounded-full shadow-lg text-[10px] md:text-sm transition-all uppercase tracking-wider",
            isRestricted ? "bg-slate-200/50 text-slate-400 cursor-not-allowed" : "bg-white text-indigo-900 hover:scale-105 active:scale-95"
          )}
        >
          {isRestricted ? 'Locked' : 'Play'}
        </button>
      </div>
    </motion.div>
  );
}

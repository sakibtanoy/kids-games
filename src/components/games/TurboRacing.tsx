import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Car, X, Trophy, FastForward, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function TurboRacing({ onScoreSubmit, onClose }: { onScoreSubmit: (score: number) => void, onClose: () => void }) {
  const [difficulty, setDifficulty] = useState<'easy' | 'pro' | 'legend' | null>(null);
  const [playerLane, setPlayerLane] = useState(0);
  const [obstacles, setObstacles] = useState<{ id: number, lane: number, y: number, type: string }[]>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const gameRef = useRef<HTMLDivElement>(null);

  const numLanes = difficulty === 'easy' ? 2 : difficulty === 'pro' ? 3 : 4;
  const laneWidth = 100 / numLanes;

  useEffect(() => {
    if (!difficulty || gameOver) return;

    const tick = setInterval(() => {
      setObstacles(prev => {
        const speed = (difficulty === 'easy' ? 1.2 : difficulty === 'pro' ? 1.6 : 2.0) + score / 3000;
        const next = prev
          .map(o => ({ ...o, y: o.y + speed }))
          .filter(o => o.y < 120);
        
        const spawnChance = difficulty === 'easy' ? 0.015 : difficulty === 'pro' ? 0.025 : 0.035;
        if (Math.random() < spawnChance && (next.length === 0 || next[next.length-1].y > 40)) {
          next.push({
            id: Math.random(),
            lane: Math.floor(Math.random() * numLanes),
            y: -20,
            type: Math.random() > 0.5 ? 'blue' : 'yellow'
          });
        }
        return next;
      });
      setScore(s => s + 1);
    }, 20);

    return () => clearInterval(tick);
  }, [difficulty, gameOver, score, numLanes]);

  useEffect(() => {
    if (gameOver) return;
    for (const o of obstacles) {
      // Collision window: player is at bottom-20 (roughly y=70 to y=85)
      // Tighten the collision to the car body
      if (o.lane === playerLane && o.y > 60 && o.y < 88) {
        setGameOver(true);
        onScoreSubmit(score);
        break;
      }
    }
  }, [obstacles, playerLane, gameOver]);

  const moveLeft = () => setPlayerLane(p => Math.max(0, p - 1));
  const moveRight = () => setPlayerLane(p => Math.min(numLanes - 1, p + 1));

  if (!difficulty) {
    return (
      <div className="fixed inset-0 bg-slate-900/95 z-[101] flex items-center justify-center p-6">
        <div className="bg-white rounded-[3rem] p-12 text-center max-w-sm w-full shadow-2xl border-b-[12px] border-rose-100">
          <Car size={64} className="text-rose-500 mx-auto mb-6" />
          <h2 className="text-3xl font-black text-slate-800 mb-8 uppercase tracking-tighter">Turbo Racing</h2>
          <div className="space-y-4">
            {(['easy', 'pro', 'legend'] as const).map(d => (
              <button 
                key={d}
                onClick={() => { setDifficulty(d); setPlayerLane(Math.floor( (d === 'easy' ? 2 : d === 'pro' ? 3 : 4) / 2)); }}
                className="w-full py-4 rounded-2xl font-black uppercase text-xl bg-slate-50 text-slate-900 hover:bg-rose-500 hover:text-white transition-all shadow-md active:translate-y-1 active:shadow-none"
              >
                {d === 'easy' ? 'Easy (2 Lanes)' : d === 'pro' ? 'Medium (3 Lanes)' : 'Hard (4 Lanes)'}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={gameRef}
      className="fixed inset-0 bg-slate-900 z-[101] flex flex-col items-center justify-center overflow-hidden touch-none"
    >
      {/* Grass/Background */}
      <div className="absolute inset-0 bg-emerald-800 opacity-20" />

      {/* Road & Lanes */}
      <div className="absolute inset-y-0 flex justify-center w-full">
        <div className="h-full bg-slate-800 relative shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden border-x-8 border-slate-700" style={{ width: '100%', maxWidth: '500px' }}>
          
          {/* Lane Dividers */}
          {Array.from({ length: numLanes - 1 }).map((_, i) => (
            <div 
              key={i}
              className="absolute h-full border-l-4 border-dashed border-white/10 z-0"
              style={{ left: `${(i + 1) * laneWidth}%` }}
            />
          ))}
          
          {/* Animated Road Lines */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
             {[...Array(6)].map((_, i) => (
               <motion.div
                 key={i}
                 animate={{ y: [-200, 1000] }}
                 transition={{ repeat: Infinity, duration: 1, ease: 'linear', delay: i * 0.2 }}
                 className="absolute left-1/2 -translate-x-1/2 w-3 h-24 bg-yellow-400 rounded-full"
               />
             ))}
          </div>

          {/* Player Car */}
          <motion.div
            animate={{ x: `${playerLane * laneWidth + laneWidth / 2}%` }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className="absolute bottom-20 z-10 w-20 h-28 -translate-x-1/2 flex items-center justify-center"
          >
            <img 
              src="/assets/car_player.png" 
              alt="player" 
              className="w-full h-full object-contain -rotate-90 drop-shadow-[0_15px_15px_rgba(0,0,0,0.6)]"
            />
          </motion.div>

          {/* Traffic */}
          <AnimatePresence>
            {obstacles.map(o => (
              <div
                key={o.id}
                className="absolute z-10 w-20 h-28 -translate-x-1/2 flex items-center justify-center"
                style={{ 
                  left: `${o.lane * laneWidth + laneWidth / 2}%`, 
                  top: `${o.y}%`,
                }}
              >
                <img 
                  src={o.type === 'blue' ? '/assets/car_blue.png' : '/assets/car_yellow.png'} 
                  alt="obstacle" 
                  className="w-full h-full object-contain -rotate-90 drop-shadow-xl"
                />
              </div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* UI Overlay */}
      <div className="absolute top-8 left-8 right-8 flex justify-between items-center z-20">
        <div className="bg-black/60 backdrop-blur-xl px-8 py-3 rounded-3xl border-2 border-white/10 text-white shadow-2xl">
          <p className="text-[10px] font-black uppercase text-emerald-400 tracking-[0.2em] mb-1">Distance</p>
          <p className="text-4xl font-black tabular-nums">{Math.floor(score/10)}<span className="text-lg ml-1 opacity-50">m</span></p>
        </div>
        <button onClick={onClose} className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-colors">
          <X size={28} />
        </button>
      </div>

      {/* Control Buttons (L/R) */}
      <div className="absolute bottom-10 left-0 right-0 px-8 flex justify-between items-center z-30 md:hidden">
        <button 
          onClick={moveLeft}
          className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white border-4 border-white/20 active:scale-90 transition-transform shadow-2xl"
        >
          <ChevronLeft size={48} strokeWidth={4} />
        </button>
        <button 
          onClick={moveRight}
          className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white border-4 border-white/20 active:scale-90 transition-transform shadow-2xl"
        >
          <ChevronRight size={48} strokeWidth={4} />
        </button>
      </div>

      <AnimatePresence>
        {gameOver && (
          <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white p-12 rounded-[4rem] text-center max-w-sm w-full border-b-[16px] border-rose-100 shadow-2xl"
            >
              <div className="w-24 h-24 bg-rose-100 text-rose-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                 <X size={48} strokeWidth={4} />
              </div>
              <h2 className="text-5xl font-black text-slate-800 mb-4 tracking-tighter uppercase">CRASHED!</h2>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-2">Distance Reached</p>
              <p className="text-rose-500 font-black text-5xl mb-12 italic tabular-nums">{Math.floor(score/10)}m</p>
              <button 
                onClick={() => { setGameOver(false); setScore(0); setObstacles([]); }}
                className="w-full py-6 bg-rose-600 text-white font-black text-2xl rounded-[2.5rem] shadow-[0_12px_0_0_#9f1239] transition-all active:translate-y-2 active:shadow-none uppercase tracking-widest"
              >
                Race Again
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="hidden md:block absolute bottom-8 text-white/20 font-black uppercase tracking-[0.3em] text-xs">
        Use Arrow Keys or Swipe to Switch Lanes
      </div>
    </div>
  );
}

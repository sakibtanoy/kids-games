import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Car, X, Trophy, FastForward } from 'lucide-react';
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
        const speed = (difficulty === 'easy' ? 1.5 : difficulty === 'pro' ? 2 : 2.5) + score / 2000;
        const next = prev
          .map(o => ({ ...o, y: o.y + speed }))
          .filter(o => o.y < 110);
        
        const spawnChance = difficulty === 'easy' ? 0.02 : difficulty === 'pro' ? 0.03 : 0.04;
        if (Math.random() < spawnChance && (next.length === 0 || next[next.length-1].y > 30)) {
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
    // Collision detection
    // Player is at y=75, lane=playerLane
    for (const o of obstacles) {
      if (o.lane === playerLane && o.y > 65 && o.y < 85) {
        setGameOver(true);
        onScoreSubmit(score);
        break;
      }
    }
  }, [obstacles, playerLane, gameOver]);

  const handleControl = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const rect = gameRef.current?.getBoundingClientRect();
    if (rect) {
      const xPercent = ((clientX - rect.left) / rect.width) * 100;
      const lane = Math.floor(xPercent / laneWidth);
      setPlayerLane(Math.max(0, Math.min(numLanes - 1, lane)));
    }
  };

  if (!difficulty) {
    return (
      <div className="fixed inset-0 bg-slate-900/95 z-[101] flex items-center justify-center p-6">
        <div className="bg-white rounded-[3rem] p-12 text-center max-w-sm w-full shadow-2xl">
          <Car size={64} className="text-rose-500 mx-auto mb-6" />
          <h2 className="text-3xl font-black text-slate-800 mb-8 uppercase tracking-tighter">Turbo Racing</h2>
          <div className="space-y-4">
            {(['easy', 'pro', 'legend'] as const).map(d => (
              <button 
                key={d}
                onClick={() => setDifficulty(d)}
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
      onMouseMove={handleControl}
      onTouchMove={handleControl}
      className="fixed inset-0 bg-slate-800 z-[101] flex flex-col items-center justify-center overflow-hidden touch-none"
    >
      {/* Road & Lanes */}
      <div className="absolute inset-0 flex justify-center">
        <div className="h-full bg-slate-700 relative shadow-inner overflow-hidden" style={{ width: '100%', maxWidth: '600px' }}>
          {/* Lane Dividers */}
          {Array.from({ length: numLanes - 1 }).map((_, i) => (
            <div 
              key={i}
              className="absolute h-full border-l-4 border-dashed border-white/20 z-0"
              style={{ left: `${(i + 1) * laneWidth}%` }}
            />
          ))}
          
          {/* Animated Road Lines */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
             {[...Array(6)].map((_, i) => (
               <motion.div
                 key={i}
                 animate={{ y: [-100, 800] }}
                 transition={{ repeat: Infinity, duration: 1.5, ease: 'linear', delay: i * 0.25 }}
                 className="absolute left-1/2 -translate-x-1/2 w-2 h-20 bg-white rounded-full"
               />
             ))}
          </div>

          {/* Player Car */}
          <motion.div
            animate={{ x: `${playerLane * laneWidth + laneWidth / 2}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute bottom-20 z-10 w-16 h-24 -translate-x-1/2"
          >
            <img 
              src="/assets/car_player.png" 
              alt="player" 
              className="w-full h-full object-contain drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]"
            />
          </motion.div>

          {/* Traffic */}
          <AnimatePresence>
            {obstacles.map(o => (
              <div
                key={o.id}
                className="absolute z-10 w-16 h-24 -translate-x-1/2"
                style={{ 
                  left: `${o.lane * laneWidth + laneWidth / 2}%`, 
                  top: `${o.y}%`,
                }}
              >
                <img 
                  src={o.type === 'blue' ? '/assets/car_blue.png' : '/assets/car_yellow.png'} 
                  alt="obstacle" 
                  className="w-full h-full object-contain drop-shadow-lg"
                />
              </div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* UI Overlay */}
      <div className="absolute top-8 left-8 right-8 flex justify-between items-center z-20">
        <div className="bg-black/40 backdrop-blur-md px-6 py-2 rounded-2xl border-2 border-white/10 text-white">
          <p className="text-[10px] font-black uppercase text-white/50">Distance</p>
          <p className="text-3xl font-black">{Math.floor(score/10)} m</p>
        </div>
        <button onClick={onClose} className="p-4 bg-white/10 rounded-2xl text-white backdrop-blur-md">
          <X size={24} />
        </button>
      </div>

      <AnimatePresence>
        {gameOver && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-lg flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white p-12 rounded-[3rem] text-center max-w-sm w-full border-b-[12px] border-rose-100 shadow-2xl"
            >
              <h2 className="text-5xl font-black text-slate-800 mb-4 tracking-tighter uppercase">CRASHED!</h2>
              <p className="text-rose-500 font-bold text-2xl mb-8 italic">Distance: {Math.floor(score/10)}m</p>
              <button 
                onClick={() => { setGameOver(false); setScore(0); setObstacles([]); }}
                className="w-full py-5 bg-rose-600 text-white font-black text-xl rounded-2xl shadow-[0_8px_0_0_#9f1239] transition-all active:translate-y-2 active:shadow-none uppercase"
              >
                Restart Race
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-8 text-white/40 font-black uppercase tracking-widest text-[10px] bg-black/20 px-4 py-1 rounded-full backdrop-blur-sm">
        Swipe or Move to Switch Lanes
      </div>
    </div>
  );
}

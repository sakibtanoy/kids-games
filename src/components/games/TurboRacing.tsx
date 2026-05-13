import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Car, X, Trophy, FastForward } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function TurboRacing({ onScoreSubmit, onClose }: { onScoreSubmit: (score: number) => void, onClose: () => void }) {
  const [playerX, setPlayerX] = useState(50);
  const [obstacles, setObstacles] = useState<{ id: number, x: number, y: number, color: string }[]>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [difficulty, setDifficulty] = useState<'easy' | 'pro' | 'legend' | null>(null);
  const gameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!difficulty || gameOver) return;

    const tick = setInterval(() => {
      setObstacles(prev => {
        const next = prev
          .map(o => ({ ...o, y: o.y + (difficulty === 'easy' ? 2 : difficulty === 'pro' ? 3 : 4) + score / 1000 }))
          .filter(o => o.y < 110);
        
        if (Math.random() < (difficulty === 'easy' ? 0.05 : 0.08)) {
          next.push({
            id: Math.random(),
            x: Math.random() * 80 + 10,
            y: -10,
            color: ['#ef4444', '#3b82f6', '#f59e0b', '#10b981'][Math.floor(Math.random() * 4)]
          });
        }
        return next;
      });
      setScore(s => s + 1);
    }, 20);

    return () => clearInterval(tick);
  }, [difficulty, gameOver, score]);

  useEffect(() => {
    const playerRect = { x: playerX - 5, y: 80, width: 10, height: 15 };
    for (const o of obstacles) {
      if (
        playerRect.x < o.x + 8 &&
        playerRect.x + playerRect.width > o.x &&
        playerRect.y < o.y + 12 &&
        playerRect.y + playerRect.height > o.y
      ) {
        setGameOver(true);
        onScoreSubmit(score);
        break;
      }
    }
  }, [obstacles, playerX]);

  const handleControl = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const rect = gameRef.current?.getBoundingClientRect();
    if (rect) {
      const x = ((clientX - rect.left) / rect.width) * 100;
      setPlayerX(Math.max(10, Math.min(90, x)));
    }
  };

  if (!difficulty) {
    return (
      <div className="fixed inset-0 bg-slate-900/95 z-[101] flex items-center justify-center p-6">
        <div className="bg-white rounded-[3rem] p-12 text-center max-w-sm w-full shadow-2xl">
          <Car size={64} className="text-rose-500 mx-auto mb-6" />
          <h2 className="text-3xl font-black text-slate-800 mb-8 uppercase">Turbo Racing</h2>
          <div className="space-y-4">
            {(['easy', 'pro', 'legend'] as const).map(d => (
              <button 
                key={d}
                onClick={() => setDifficulty(d)}
                className="w-full py-4 rounded-2xl font-black uppercase text-xl bg-slate-100 hover:bg-rose-500 hover:text-white transition-all shadow-md"
              >
                {d}
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
      {/* Road Lines */}
      <div className="absolute inset-0 flex justify-center gap-24">
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            animate={{ y: [0, 200] }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            className="w-2 h-20 bg-white/10 rounded-full"
            style={{ marginTop: i * 150 }}
          />
        ))}
      </div>

      <div className="absolute top-8 left-8 right-8 flex justify-between items-center z-20">
        <div className="bg-black/40 backdrop-blur-md px-6 py-2 rounded-2xl border-2 border-white/10 text-white">
          <p className="text-[10px] font-black uppercase text-white/50">Speed</p>
          <p className="text-3xl font-black">{Math.floor(score/10)} km/h</p>
        </div>
        <button onClick={onClose} className="p-4 bg-white/10 rounded-2xl text-white backdrop-blur-md">
          <X size={24} />
        </button>
      </div>

      {/* Player Car */}
      <div
        className="absolute bottom-20 z-10"
        style={{ left: `${playerX}%`, transform: 'translateX(-50%)' }}
      >
        <div className="w-12 h-20 bg-rose-500 rounded-xl border-b-8 border-rose-700 shadow-2xl relative">
          <div className="absolute top-2 left-1 w-2 h-4 bg-white/30 rounded-sm" />
          <div className="absolute top-2 right-1 w-2 h-4 bg-white/30 rounded-sm" />
          <div className="absolute bottom-1 left-2 right-2 h-1 bg-rose-400 rounded-full" />
        </div>
      </div>

      {/* Traffic */}
      {obstacles.map(o => (
        <div
          key={o.id}
          className="absolute w-12 h-20 rounded-xl border-b-8 shadow-lg"
          style={{ 
            left: `${o.x}%`, 
            top: `${o.y}%`, 
            backgroundColor: o.color,
            borderColor: 'rgba(0,0,0,0.2)',
            transform: 'translateX(-50%)' 
          }}
        />
      ))}

      <AnimatePresence>
        {gameOver && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-lg flex items-center justify-center p-6">
            <div className="bg-white p-12 rounded-[3rem] text-center max-w-sm w-full border-b-[12px] border-rose-100 shadow-2xl animate-in zoom-in-95 duration-200">
              <h2 className="text-5xl font-black text-slate-800 mb-4 tracking-tighter uppercase">CRASHED!</h2>
              <p className="text-rose-500 font-bold text-2xl mb-8 italic">Distance: {Math.floor(score/10)}m</p>
              <button 
                onClick={() => { setGameOver(false); setScore(0); setObstacles([]); }}
                className="w-full py-5 bg-rose-600 text-white font-black text-xl rounded-2xl shadow-[0_8px_0_0_#9f1239] transition-all active:translate-y-2 active:shadow-none uppercase"
              >
                Restart Race
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-8 text-white/20 font-black uppercase tracking-widest text-[10px]">
        Slide to steer through traffic
      </div>
    </div>
  );
}

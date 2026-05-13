import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Rocket, Star, X, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function SpaceAdventure({ onScoreSubmit, onClose }: { onScoreSubmit: (score: number) => void, onClose: () => void }) {
  const [playerX, setPlayerX] = useState(50);
  const [asteroids, setAsteroids] = useState<{ id: number, x: number, y: number, size: number }[]>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [difficulty, setDifficulty] = useState<'easy' | 'pro' | 'legend' | null>(null);
  const gameRef = useRef<HTMLDivElement>(null);
  const keysPressed = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (!difficulty || gameOver) return;

    const interval = setInterval(() => {
      // Keyboard Movement
      if (keysPressed.current['ArrowLeft'] || keysPressed.current['a']) {
        setPlayerX(prev => Math.max(5, prev - 2));
      }
      if (keysPressed.current['ArrowRight'] || keysPressed.current['d']) {
        setPlayerX(prev => Math.min(95, prev + 2));
      }

      setAsteroids(prev => {
        const speedMultiplier = difficulty === 'easy' ? 1 : difficulty === 'pro' ? 2 : 3;
        const next = prev
          .map(a => ({ ...a, y: a.y + (2 + score / 500) * speedMultiplier }))
          .filter(a => a.y < 110);
        
        if (Math.random() < (difficulty === 'easy' ? 0.05 : 0.1)) {
          next.push({
            id: Math.random(),
            x: Math.random() * 90 + 5,
            y: -10,
            size: Math.random() * 20 + 20
          });
        }
        return next;
      });
      setScore(s => s + 1);
    }, 30);

    return () => clearInterval(interval);
  }, [difficulty, gameOver, score]);

  useEffect(() => {
    if (gameOver) return;
    const playerRect = { x: playerX - 5, y: 80, width: 10, height: 15 };
    for (const a of asteroids) {
      if (
        playerRect.x < a.x + a.size / 10 &&
        playerRect.x + playerRect.width > a.x &&
        playerRect.y < a.y + a.size / 20 &&
        playerRect.y + playerRect.height > a.y
      ) {
        setGameOver(true);
        onScoreSubmit(score);
        break;
      }
    }
  }, [asteroids, playerX]);

  const handleTouch = (e: React.MouseEvent | React.TouchEvent) => {
    if (gameOver || !difficulty) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const rect = gameRef.current?.getBoundingClientRect();
    if (rect) {
      const x = ((clientX - rect.left) / rect.width) * 100;
      setPlayerX(Math.max(5, Math.min(95, x)));
    }
  };

  if (!difficulty) {
    return (
      <div className="fixed inset-0 bg-slate-900/95 z-[101] flex items-center justify-center p-6">
        <div className="bg-white rounded-[3rem] p-12 text-center shadow-2xl">
          <Rocket size={64} className="text-indigo-500 mx-auto mb-6" />
          <h2 className="text-3xl font-black text-slate-800 mb-8 uppercase">Galactic Adventure</h2>
          <div className="space-y-4">
            {(['easy', 'pro', 'legend'] as const).map(d => (
              <button 
                key={d}
                onClick={() => setDifficulty(d)}
                className="w-full py-4 rounded-2xl font-black uppercase text-xl bg-slate-100 hover:bg-indigo-600 hover:text-white transition-all shadow-md active:translate-y-1 active:shadow-none"
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
      onMouseMove={handleTouch}
      onTouchMove={handleTouch}
      className="fixed inset-0 bg-slate-950 z-[100] flex flex-col items-center justify-center overflow-hidden touch-none"
    >
      {/* Stars Background */}
      <div className="absolute inset-0">
        {Array.from({ length: 50 }).map((_, i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.2, 0.8, 0.2] }}
            transition={{ duration: Math.random() * 2 + 1, repeat: Infinity }}
            className="absolute bg-white rounded-full"
            style={{ 
              width: Math.random() * 3, 
              height: Math.random() * 3,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`
            }}
          />
        ))}
      </div>

      <div className="absolute top-8 left-8 right-8 flex justify-between items-center z-20">
        <div className="bg-indigo-600/30 backdrop-blur-md px-6 py-3 rounded-2xl border border-indigo-500/50">
          <p className="text-indigo-300 font-black text-xs tracking-widest">DISTANCE</p>
          <h2 className="text-white font-black text-3xl">{score}m</h2>
        </div>
        <button onClick={onClose} className="p-4 bg-white/10 rounded-2xl text-white backdrop-blur-md">
          <X size={24} />
        </button>
      </div>

      {/* Player Rocket */}
      <div
        className="absolute bottom-20 z-10"
        style={{ left: `${playerX}%`, transform: 'translateX(-50%)' }}
      >
        <div className="relative">
          <Rocket className="text-slate-200 fill-slate-200 rotate-0" size={48} />
          <motion.div
            animate={{ height: [10, 20, 10], opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 0.2 }}
            className="absolute top-full left-1/2 -translate-x-1/2 w-4 bg-orange-500 blur-sm rounded-full"
          />
        </div>
      </div>

      {/* Asteroids */}
      {asteroids.map(a => (
        <div
          key={a.id}
          className="absolute bg-slate-700 rounded-full border-b-4 border-slate-900 shadow-lg flex items-center justify-center overflow-hidden"
          style={{ 
            left: `${a.x}%`, 
            top: `${a.y}%`, 
            width: a.size, 
            height: a.size,
            transform: 'translateX(-50%)' 
          }}
        >
          <div className="w-1/2 h-1/2 bg-black/20 rounded-full absolute -top-1 -left-1" />
        </div>
      ))}

      <AnimatePresence>
        {gameOver && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute z-50 bg-white/10 backdrop-blur-xl p-12 rounded-[3rem] text-center border-4 border-white/20 shadow-2xl"
          >
            <h2 className="text-6xl font-black text-white mb-4">CRASH!</h2>
            <p className="text-indigo-300 font-bold text-xl mb-8">You traveled {score} light years!</p>
            <button 
              onClick={() => { setGameOver(false); setScore(0); setAsteroids([]); }}
              className="px-12 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-[0_8px_0_0_#4338ca] hover:bg-indigo-500 active:shadow-none active:translate-y-2 transition-all"
            >
              FLY AGAIN
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-8 left-0 right-0 text-center text-white/30 font-black uppercase tracking-[0.2em] pointer-events-none text-[10px]">
        Arrows / WASD or Drag to Steer
      </div>
    </div>
  );
}

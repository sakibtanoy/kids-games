import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Rocket, Star, X, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';

function RocketModel({ className }: { className?: string }) {
  return (
    <div className={cn("relative", className)}>
      {/* Body */}
      <div className="w-10 h-16 bg-slate-200 rounded-t-full rounded-b-lg relative overflow-hidden">
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-sky-400 rounded-full border-2 border-slate-300" />
        <div className="absolute bottom-4 left-0 right-0 h-1 bg-rose-500" />
      </div>
      {/* Fins */}
      <div className="absolute -left-3 bottom-0 w-4 h-6 bg-rose-600 rounded-l-full rotate-[15deg]" />
      <div className="absolute -right-3 bottom-0 w-4 h-6 bg-rose-600 rounded-r-full -rotate-[15deg]" />
      {/* Engine Flame */}
      <motion.div
        animate={{ 
          height: [12, 24, 12],
          opacity: [0.6, 1, 0.6],
          scaleX: [1, 1.2, 1]
        }}
        transition={{ repeat: Infinity, duration: 0.1 }}
        className="absolute top-full left-1/2 -translate-x-1/2 w-5 bg-orange-500 blur-sm rounded-full origin-top"
      />
      <motion.div
        animate={{ 
          height: [8, 16, 8],
          opacity: [0.8, 1, 0.8]
        }}
        transition={{ repeat: Infinity, duration: 0.15 }}
        className="absolute top-full left-1/2 -translate-x-1/2 w-3 bg-yellow-300 blur-[2px] rounded-full origin-top"
      />
    </div>
  );
}

export default function SpaceAdventure({ onScoreSubmit, onClose }: { onScoreSubmit: (score: number) => void, onClose: () => void }) {
  const [playerX, setPlayerX] = useState(50);
  const [asteroids, setAsteroids] = useState<{ id: number, x: number, y: number, size: number }[]>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [difficulty, setDifficulty] = useState<'easy' | 'pro' | 'legend' | null>(null);
  const gameRef = useRef<HTMLDivElement>(null);
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => keysPressed.current[e.key] = true;
    const handleKeyUp = (e: KeyboardEvent) => keysPressed.current[e.key] = false;
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (!difficulty || gameOver) return;

    let frameId: number;
    const loop = (time: number) => {
      const delta = time - lastTimeRef.current;
      if (delta > 16) { // ~60fps
        lastTimeRef.current = time;
        
        // Keyboard Movement
        if (keysPressed.current['ArrowLeft'] || keysPressed.current['a']) {
          setPlayerX(prev => Math.max(5, prev - 1.5));
        }
        if (keysPressed.current['ArrowRight'] || keysPressed.current['d']) {
          setPlayerX(prev => Math.min(95, prev + 1.5));
        }

        setAsteroids(prev => {
          const speedMultiplier = difficulty === 'easy' ? 0.8 : difficulty === 'pro' ? 1.2 : 1.8;
          const next = prev
            .map(a => ({ ...a, y: a.y + (1.5 + score / 2000) * speedMultiplier }))
            .filter(a => a.y < 110);
          
          if (Math.random() < (difficulty === 'easy' ? 0.03 : 0.06)) {
            next.push({
              id: Math.random(),
              x: Math.random() * 90 + 5,
              y: -15,
              size: Math.random() * 25 + 25
            });
          }
          return next;
        });
        setScore(s => s + 1);
      }
      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [difficulty, gameOver, score]);

  useEffect(() => {
    if (gameOver) return;
    const playerRect = { x: playerX - 4, y: 78, width: 8, height: 12 };
    for (const a of asteroids) {
      if (
        playerRect.x < a.x + a.size / 15 &&
        playerRect.x + playerRect.width > a.x - a.size / 15 &&
        playerRect.y < a.y + a.size / 15 &&
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
        <div className="bg-white rounded-[3rem] p-12 text-center shadow-2xl border-b-[12px] border-slate-100">
          <Rocket size={64} className="text-indigo-500 mx-auto mb-6" />
          <h2 className="text-3xl font-black text-slate-800 mb-8 uppercase tracking-tighter">Space Adventure</h2>
          <div className="space-y-4">
            {(['easy', 'pro', 'legend'] as const).map(d => (
              <button 
                key={d}
                onClick={() => setDifficulty(d)}
                className="w-full py-4 rounded-2xl font-black uppercase text-xl bg-slate-50 text-slate-600 hover:bg-indigo-600 hover:text-white transition-all shadow-md active:translate-y-1 active:shadow-none"
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
        {Array.from({ length: 40 }).map((_, i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.2, 0.8, 0.2] }}
            transition={{ duration: Math.random() * 2 + 1, repeat: Infinity }}
            className="absolute bg-white rounded-full"
            style={{ 
              width: Math.random() * 2, 
              height: Math.random() * 2,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`
            }}
          />
        ))}
      </div>

      <div className="absolute top-8 left-8 right-8 flex justify-between items-center z-20">
        <div className="bg-indigo-600/30 backdrop-blur-md px-6 py-2 rounded-2xl border border-indigo-500/50">
          <p className="text-[10px] font-black text-indigo-300 tracking-widest">DISTANCE</p>
          <h2 className="text-white font-black text-2xl">{score}m</h2>
        </div>
        <button onClick={onClose} className="p-3 bg-white/10 rounded-2xl text-white backdrop-blur-md">
          <X size={20} />
        </button>
      </div>

      {/* Player Rocket */}
      <div
        className="absolute bottom-24 z-10"
        style={{ left: `${playerX}%`, transform: 'translateX(-50%)' }}
      >
        <RocketModel />
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
          <div className="w-2 h-2 bg-slate-800 rounded-full absolute bottom-2 right-2" />
        </div>
      ))}

      <AnimatePresence>
        {gameOver && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute z-50 bg-white p-12 rounded-[3rem] text-center max-w-sm w-full border-b-[12px] border-slate-100 shadow-2xl"
          >
            <h2 className="text-5xl font-black text-slate-800 mb-4 tracking-tighter uppercase">CRASHED!</h2>
            <p className="text-indigo-500 font-bold text-2xl mb-8 italic">Distance: {score}m</p>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <button 
                onClick={() => { setGameOver(false); setScore(0); setAsteroids([]); }}
                className="py-5 bg-indigo-600 text-white font-black text-xl rounded-2xl shadow-[0_8px_0_0_#4338ca] hover:bg-indigo-500 active:translate-y-2 active:shadow-none transition-all uppercase"
              >
                Fly Again
              </button>
              <button 
                onClick={onClose}
                className="py-5 bg-slate-100 text-slate-500 font-black text-xl rounded-2xl border-b-8 border-slate-200 hover:bg-slate-200 active:translate-y-2 active:shadow-none transition-all uppercase"
              >
                Exit
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-8 text-white/20 font-black uppercase tracking-widest text-[10px]">
        Arrows / WASD or Drag to Steer
      </div>
    </div>
  );
}

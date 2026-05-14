import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, X, Trophy, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';

function CarModel({ color, design, className }: { color: string, design: string, className?: string }) {
  return (
    <div className={cn("w-10 h-16 relative transition-all duration-300", className)}>
      {/* Main Body Shape */}
      <div 
        className={cn(
          "absolute inset-0 shadow-2xl transition-all duration-300",
          design === 'classic' ? "rounded-2xl" : design === 'sport' ? "rounded-lg" : "rounded-t-[2rem] rounded-b-lg"
        )}
        style={{ 
          backgroundColor: color, 
          borderBottom: '4px solid rgba(0,0,0,0.2)',
          clipPath: design === 'stealth' ? 'polygon(15% 0%, 85% 0%, 100% 100%, 0% 100%)' : 'none'
        }}
      >
        {/* Windshield */}
        <div className={cn(
          "absolute left-1.5 right-1.5 h-3 bg-slate-800/60 backdrop-blur-sm",
          design === 'classic' ? "top-1.5 rounded-t-xl" : design === 'sport' ? "top-1 rounded-t-sm" : "top-0 rounded-t-[1.5rem]"
        )} />
        
        {/* Racing Stripes for Sport */}
        {design === 'sport' && (
          <>
            <div className="absolute inset-y-0 left-2.5 w-1 bg-white/20" />
            <div className="absolute inset-y-0 right-2.5 w-1 bg-white/20" />
          </>
        )}
        
        {/* Hood Detail for Classic */}
        {design === 'classic' && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 w-5 h-2 bg-black/5 rounded-full" />
        )}

        {/* Roof detail */}
        <div className={cn(
          "absolute bg-white/10 rounded-lg",
          design === 'classic' ? "top-6 left-2.5 right-2.5 bottom-4" : 
          design === 'sport' ? "top-5 left-2 right-2 bottom-3" : 
          "top-5 left-3 right-3 bottom-6 bg-black/20"
        )} />
      </div>

      {/* Accessories (Outside Body) */}
      
      {/* Spoiler / Wings for Sport */}
      {design === 'sport' && (
        <div 
          className="absolute -bottom-1 -left-1 -right-1 h-3 rounded-sm shadow-xl border-t-2 border-white/20" 
          style={{ backgroundColor: color, filter: 'brightness(0.8)' }}
        />
      )}

      {/* Stealth Bottom Detail */}
      {design === 'stealth' && (
        <div className="absolute -bottom-1 left-1 right-1 h-2 bg-slate-900 rounded-b-xl opacity-60" />
      )}

      {/* Headlights */}
      <div className="absolute top-1 left-1.5 right-1.5 flex justify-between">
        <div className={cn("w-2 h-3 bg-white/90 shadow-[0_0_10px_#fff]", design === 'classic' ? "rounded-full" : "rounded-sm")} />
        <div className={cn("w-2 h-3 bg-white/90 shadow-[0_0_10px_#fff]", design === 'classic' ? "rounded-full" : "rounded-sm")} />
      </div>
    </div>
  );
}

export default function TurboRacing({ onScoreSubmit, onClose }: { onScoreSubmit: (score: number) => void, onClose: () => void }) {
  const [playerX, setPlayerX] = useState(50);
  const [obstacles, setObstacles] = useState<{ id: number, x: number, y: number, color: string, design: 'classic' | 'sport' | 'stealth' }[]>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [difficulty, setDifficulty] = useState<'easy' | 'pro' | 'legend' | null>(null);
  const [carColor, setCarColor] = useState('#f43f5e'); 
  const [carDesign, setCarDesign] = useState<'classic' | 'sport' | 'stealth'>('classic');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const gameRef = useRef<HTMLDivElement>(null);

  const getLanes = () => {
    if (difficulty === 'easy') return 2;
    if (difficulty === 'pro') return 3;
    return 4;
  };

  const getLaneX = (laneIndex: number) => {
    const lanes = getLanes();
    const laneWidth = 80 / lanes;
    return 10 + (laneIndex + 0.5) * laneWidth;
  };

  useEffect(() => {
    if (!difficulty || gameOver) return;

    const tick = setInterval(() => {
      setObstacles(prev => {
        const lanes = getLanes();
        const next = prev
          .map(o => ({ ...o, y: o.y + (difficulty === 'easy' ? 1.5 : difficulty === 'pro' ? 2 : 2.5) + score / 5000 }))
          .filter(o => o.y < 110);
        
        if (Math.random() < (difficulty === 'easy' ? 0.02 : difficulty === 'pro' ? 0.03 : 0.04)) {
          const lane = Math.floor(Math.random() * lanes);
          const isOccupied = next.some(o => Math.abs(o.x - getLaneX(lane)) < 5 && o.y < 15);
          if (!isOccupied) {
            next.push({
              id: Math.random(),
              x: getLaneX(lane),
              y: -15,
              color: [
                '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#a855f7', 
                '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
              ][Math.floor(Math.random() * 10)],
              design: (['classic', 'sport', 'stealth'] as const)[Math.floor(Math.random() * 3)]
            });
          }
        }
        return next;
      });
      setScore(s => s + 1);
    }, 20);

    return () => clearInterval(tick);
  }, [difficulty, gameOver, score]);

  useEffect(() => {
    if (gameOver || hasSubmitted) return;
    const playerRect = { x: playerX - 2, y: 76, width: 4, height: 10 };
    for (const o of obstacles) {
      if (
        playerRect.x < o.x + 2 &&
        playerRect.x + playerRect.width > o.x - 2 &&
        playerRect.y < o.y + 10 &&
        playerRect.y + playerRect.height > o.y
      ) {
        setGameOver(true);
        setHasSubmitted(true);
        onScoreSubmit(score);
        break;
      }
    }
  }, [obstacles, playerX, gameOver, hasSubmitted, score, onScoreSubmit]);

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
      <div className="fixed inset-0 bg-slate-900/95 z-[101] flex items-center justify-center p-4">
        <div className="bg-white rounded-[2.5rem] p-6 md:p-10 text-center max-w-sm w-full shadow-2xl border-b-[10px] border-slate-100 max-h-[85vh] overflow-y-auto relative">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-50 rounded-xl transition-colors">
            <X size={20} />
          </button>
          
          <h2 className="text-2xl font-black text-slate-800 mb-6 uppercase tracking-tighter">Turbo Racing</h2>
          
          <div className="mb-6 flex flex-col items-center gap-4 bg-slate-50 p-4 rounded-[2rem] border-2 border-slate-100">
            <div className="relative group">
              <div className="absolute inset-0 bg-rose-500/10 blur-2xl transition-all" />
              <motion.div key={`${carColor}-${carDesign}`} initial={{ rotate: -5, scale: 0.9 }} animate={{ rotate: 5, scale: 1.1 }} className="relative z-10">
                <CarModel color={carColor} design={carDesign} className="w-14 h-24" />
              </motion.div>
            </div>

            <div className="w-full space-y-4">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Paint</p>
                <div className="flex justify-center gap-1.5">
                  {['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#a855f7'].map(color => (
                    <button key={color} onClick={() => setCarColor(color)} className={cn("w-7 h-7 rounded-full border-4 transition-all", carColor === color ? "border-slate-800 scale-110" : "border-transparent")} style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Body</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['classic', 'sport', 'stealth'] as const).map(design => (
                    <button key={design} onClick={() => setCarDesign(design)} className={cn("py-2 px-1 rounded-xl text-[11px] font-black uppercase border-2 transition-all", carDesign === design ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-400 border-slate-100")}>{design}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            {(['easy', 'pro', 'legend'] as const).map(d => (
              <button key={d} onClick={() => setDifficulty(d)} className="w-full py-3.5 rounded-2xl font-black uppercase text-lg bg-slate-100 text-slate-600 hover:bg-rose-500 hover:text-white transition-all shadow-md active:translate-y-1">{d}</button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={gameRef} onMouseMove={handleControl} onTouchMove={handleControl} className="fixed inset-0 bg-slate-800 z-[101] flex flex-col items-center justify-center overflow-hidden touch-none">
      {/* HUD Overlay */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-50 pointer-events-none">
        <div className="bg-slate-900/60 backdrop-blur-md px-6 py-2 rounded-2xl border-2 border-white/10 shadow-xl">
          <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Score</p>
          <p className="text-3xl font-black text-white tabular-nums">{score}</p>
        </div>
        <button onClick={onClose} className="w-12 h-12 bg-slate-900/60 backdrop-blur-md rounded-full flex items-center justify-center text-white border-2 border-white/10 pointer-events-auto active:scale-90">
          <X size={24} />
        </button>
      </div>

      <div className="relative h-full w-full max-w-md bg-slate-700 shadow-2xl overflow-hidden">
        {/* Road Lanes */}
        <div className="absolute inset-0 flex justify-evenly">
          {[...Array(getLanes() + 1)].map((_, i) => (
            <div key={i} className="w-1 h-full border-l-2 border-dashed border-white/10" />
          ))}
        </div>

        {/* Speed Lines */}
        <div className="absolute inset-0">
          {[...Array(10)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ y: -100 }}
              animate={{ y: window.innerHeight + 100 }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2, ease: "linear" }}
              className="absolute left-1/2 w-1 h-20 bg-white/5"
            />
          ))}
        </div>

        {/* Obstacles */}
        {obstacles.map(o => (
          <div key={o.id} className="absolute" style={{ left: `${o.x}%`, top: `${o.y}%`, transform: 'translate(-50%, 0)' }}>
            <CarModel color={o.color} design={o.design} className="rotate-180 opacity-90" />
          </div>
        ))}

        {/* Player Car */}
        <div className="absolute bottom-[14%] transition-all duration-75" style={{ left: `${playerX}%`, transform: 'translateX(-50%)' }}>
          <CarModel color={carColor} design={carDesign} />
          {/* Flame effect */}
          <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }} transition={{ repeat: Infinity, duration: 0.2 }} className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-4 h-8 bg-gradient-to-t from-orange-500 to-transparent blur-sm" />
        </div>
      </div>

      {/* Game Over Screen */}
      <AnimatePresence>
        {gameOver && (
          <div className="absolute inset-0 z-[150] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-8 rounded-[2.5rem] text-center max-w-sm w-full border-b-[10px] border-slate-100 shadow-2xl">
              <Trophy size={48} className="text-rose-500 mx-auto mb-6" />
              <h2 className="text-3xl font-black text-slate-800 mb-2 tracking-tighter uppercase leading-none">CRASHED!</h2>
              <p className="text-rose-500 font-bold text-2xl mb-8 italic">Distance: {score}m</p>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => { setDifficulty(null); setGameOver(false); setScore(0); setObstacles([]); setHasSubmitted(false); }} className="py-4 bg-rose-500 text-white font-black text-xl rounded-2xl shadow-[0_6px_0_0_#be123c] hover:bg-rose-400 active:translate-y-2 active:shadow-none transition-all uppercase">Again</button>
                <button onClick={onClose} className="py-4 bg-slate-100 text-slate-500 font-black text-xl rounded-2xl border-b-4 border-slate-200 hover:bg-slate-200 active:translate-y-2 active:shadow-none transition-all uppercase">Exit</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

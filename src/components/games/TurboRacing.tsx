import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Car, X, Trophy, FastForward } from 'lucide-react';
import { cn } from '../../lib/utils';

function CarModel({ color, design, className }: { color: string, design: string, className?: string }) {
  return (
    <div 
      className={cn("w-12 h-20 rounded-xl shadow-2xl relative transition-all duration-300", className)}
      style={{ backgroundColor: color, borderBottom: '8px solid rgba(0,0,0,0.2)' }}
    >
      {/* Windshield */}
      <div className="absolute top-1 left-1.5 right-1.5 h-3 bg-slate-800/40 rounded-t-lg backdrop-blur-sm" />
      
      {/* Racing Stripe */}
      {design === 'sport' && (
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-3 bg-white/20" />
      )}
      
      {/* Stealth Lines */}
      {design === 'stealth' && (
        <>
          <div className="absolute top-6 left-0 w-full h-px bg-black/10" />
          <div className="absolute top-12 left-0 w-full h-px bg-black/10" />
        </>
      )}

      {/* Spoiler */}
      {(design === 'sport' || design === 'stealth') && (
        <div className="absolute -bottom-2 -left-1 -right-1 h-3 bg-inherit rounded-full shadow-lg brightness-75" />
      )}

      {/* Headlights */}
      <div className="absolute top-1 left-1 w-2.5 h-5 bg-white rounded-sm shadow-[0_0_15px_#fff] opacity-80" />
      <div className="absolute top-1 right-1 w-2.5 h-5 bg-white rounded-sm shadow-[0_0_15px_#fff] opacity-80" />
      
      {/* Roof detail */}
      <div className="absolute top-6 left-2 right-2 bottom-4 bg-white/10 rounded-lg" />
    </div>
  );
}

export default function TurboRacing({ onScoreSubmit, onClose }: { onScoreSubmit: (score: number) => void, onClose: () => void }) {
  const [playerX, setPlayerX] = useState(50);
  const [obstacles, setObstacles] = useState<{ id: number, x: number, y: number, color: string }[]>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [difficulty, setDifficulty] = useState<'easy' | 'pro' | 'legend' | null>(null);
  const [carColor, setCarColor] = useState('#f43f5e'); // Default rose-500
  const [carDesign, setCarDesign] = useState<'classic' | 'sport' | 'stealth'>('classic');
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
        
        // Lower density and ensures they are in lanes
        if (Math.random() < (difficulty === 'easy' ? 0.02 : difficulty === 'pro' ? 0.03 : 0.04)) {
          const lane = Math.floor(Math.random() * lanes);
          // Check if lane is occupied near the top to avoid overlap
          const isOccupied = next.some(o => Math.abs(o.x - getLaneX(lane)) < 5 && o.y < 15);
          
          if (!isOccupied) {
            next.push({
              id: Math.random(),
              x: getLaneX(lane),
              y: -15,
              color: ['#ef4444', '#3b82f6', '#f59e0b', '#10b981', '#a855f7'][Math.floor(Math.random() * 5)]
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
    const playerRect = { x: playerX - 2, y: 76, width: 4, height: 10 };
    for (const o of obstacles) {
      if (
        playerRect.x < o.x + 2 &&
        playerRect.x + playerRect.width > o.x - 2 &&
        playerRect.y < o.y + 10 &&
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
        <div className="bg-white rounded-[3rem] p-8 md:p-12 text-center max-w-md w-full shadow-2xl border-b-[12px] border-slate-100 max-h-[90vh] overflow-y-auto">
          <Car size={64} className="text-rose-500 mx-auto mb-4" />
          <h2 className="text-3xl font-black text-slate-800 mb-6 uppercase tracking-tighter">Turbo Racing</h2>
          
          <div className="mb-8 flex flex-col md:flex-row items-center gap-8 bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-100">
            {/* Showroom Preview */}
            <div className="relative group">
              <div className="absolute inset-0 bg-rose-500/10 blur-3xl group-hover:bg-rose-500/20 transition-all" />
              <motion.div
                key={`${carColor}-${carDesign}`}
                initial={{ rotate: -10, scale: 0.8 }}
                animate={{ rotate: 5, scale: 1.2 }}
                className="relative z-10"
              >
                <CarModel color={carColor} design={carDesign} className="w-16 h-28" />
              </motion.div>
            </div>

            <div className="flex-1 w-full space-y-6">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 text-left">Paint Color</p>
                <div className="flex justify-start gap-2">
                  {['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#a855f7'].map(color => (
                    <button
                      key={color}
                      onClick={() => setCarColor(color)}
                      className={cn(
                        "w-8 h-8 rounded-full border-4 transition-all hover:scale-110",
                        carColor === color ? "border-slate-800 scale-110" : "border-transparent"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 text-left">Body Design</p>
                <div className="grid grid-cols-3 gap-2">
                  {(['classic', 'sport', 'stealth'] as const).map(design => (
                    <button
                      key={design}
                      onClick={() => setCarDesign(design)}
                      className={cn(
                        "py-2 px-1 rounded-xl text-[9px] font-black uppercase border-2 transition-all",
                        carDesign === design ? "bg-slate-800 text-white border-slate-800 shadow-md" : "bg-white text-slate-400 border-slate-100"
                      )}
                    >
                      {design}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Select Difficulty</p>
          <div className="grid gap-3">
            {(['easy', 'pro', 'legend'] as const).map(d => (
              <button 
                key={d}
                onClick={() => setDifficulty(d)}
                className="w-full py-4 rounded-2xl font-black uppercase text-xl bg-slate-100 text-slate-600 hover:bg-rose-500 hover:text-white transition-all shadow-md active:translate-y-1 active:shadow-none"
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
      {/* Road & Lane Markers */}
      <div className="absolute inset-y-0 w-[80%] bg-slate-700/50 border-x-4 border-white/20">
        {Array.from({ length: getLanes() - 1 }).map((_, i) => (
           <div 
             key={i}
             className="absolute h-full border-r-2 border-dashed border-white/20"
             style={{ left: `${((i + 1) / getLanes()) * 100}%` }}
           />
        ))}
        
        {/* Moving Lane Dashes for speed effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ y: [-100, 800] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'linear', delay: i * 0.3 }}
              className="absolute left-1/2 -translate-x-1/2 w-2 h-24 bg-white/10 rounded-full"
            />
          ))}
        </div>
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
        className="absolute bottom-24 z-10"
        style={{ 
          left: `${playerX}%`, 
          transform: 'translateX(-50%)'
        }}
      >
        <CarModel color={carColor} design={carDesign} />
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

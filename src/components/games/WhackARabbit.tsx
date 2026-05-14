import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trophy } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function WhackARabbit({ onScoreSubmit, onClose }: { onScoreSubmit: (score: number) => void, onClose: () => void }) {
  const [moles, setMoles] = useState<{status: 'hidden' | 'active' | 'whacked' | 'missed' | 'miss_anim', id: number}[]>(
    new Array(9).fill(null).map((_, i) => ({ status: 'hidden', id: i }))
  );
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [difficulty, setDifficulty] = useState<'easy' | 'pro' | 'legend' | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);


  useEffect(() => {
    if (!difficulty || timeLeft <= 0) return;

    const speed = difficulty === 'easy' ? 1000 : difficulty === 'pro' ? 700 : 500;
    const interval = setInterval(() => {
      const idx = Math.floor(Math.random() * 9);

      setMoles(prev => {
        if (prev[idx].status !== 'hidden') return prev;
        const next = [...prev];
        next[idx] = { ...next[idx], status: 'active' };
        return next;
      });
      
      setTimeout(() => {
        setMoles(prev => {
          if (prev[idx].status === 'active') { // If still active, it's a miss
            const next = [...prev];
            next[idx] = { ...next[idx], status: 'miss_anim' };
            
            setTimeout(() => {
              setMoles(p => {
                 const n = [...p];
                 n[idx] = { ...n[idx], status: 'hidden' };
                 return n;
              })
            }, 300);
            return next;
          }
          return prev;
        });
      }, speed * 0.8);
    }, speed);

    const timer = setInterval(() => {
      setTimeLeft(t => t - 1);
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(timer);
    };
  }, [difficulty, timeLeft]);

  useEffect(() => {
    if (timeLeft === 0 && !hasSubmitted) {
      setHasSubmitted(true);
      onScoreSubmit(score);
    }
  }, [timeLeft, score, hasSubmitted, onScoreSubmit]);


  if (!difficulty) {
    return (
      <div className="fixed inset-0 bg-indigo-900/95 z-[101] flex items-center justify-center p-6">
        <div className="bg-white rounded-[3rem] p-12 text-center max-w-sm w-full border-b-[12px] border-indigo-100 shadow-2xl">
          <span className="text-7xl mb-6 block">🐰</span>
          <h2 className="text-3xl font-black text-indigo-900 mb-8 uppercase">WHACK-A-RABBIT</h2>
          <div className="space-y-4">
            {(['easy', 'pro', 'legend'] as const).map(d => (
              <button 
                key={d}
                onClick={() => setDifficulty(d)}
                className={cn(
                  "w-full py-4 rounded-2xl font-black uppercase text-xl transition-all shadow-lg active:translate-y-1 active:shadow-none",
                  d === 'easy' ? "bg-emerald-500 text-white" : d === 'pro' ? "bg-orange-500 text-white" : "bg-rose-500 text-white"
                )}
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
    <div className="fixed inset-0 bg-orange-500 z-[101] flex flex-col items-center justify-center p-6 select-none overflow-hidden touch-none">
      <div className="w-full max-w-md flex justify-between items-center mb-8 relative z-10">
        <div className="bg-white/20 backdrop-blur-md px-6 py-2 rounded-2xl border-2 border-white/30 text-white">
          <p className="text-[10px] font-black uppercase tracking-widest text-orange-200">Time</p>
          <p className="text-3xl font-black">{timeLeft}s</p>
        </div>
        <div className="text-center text-white">
          <p className="text-orange-200 font-black text-xs uppercase tracking-[0.3em]">Score</p>
          <h2 className="text-5xl font-black">{score}</h2>
        </div>
        <button onClick={() => { if (!hasSubmitted) onScoreSubmit(score); onClose(); }} className="p-4 bg-white/20 rounded-2xl text-white">
          <X size={24} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6 relative z-10">
        {moles.map((mole, i) => (
          <div key={i} className="relative w-24 h-24 sm:w-32 sm:h-32">
            {/* Hole */}
            <div className="absolute inset-0 bg-orange-900/40 rounded-full border-b-[8px] border-orange-950/20" />
            <AnimatePresence>
              {mole.status !== 'hidden' && (
                <motion.button
                  initial={{ y: 50, scale: 0.5 }}
                  animate={{ 
                    y: mole.status === 'active' ? 0 : 20, 
                    scale: mole.status === 'active' ? 1 : 0.8,
                    rotate: mole.status === 'whacked' ? [0, -20, 20, -10, 10, 0] : 0,
                    opacity: mole.status === 'miss_anim' ? 0.5 : 1
                  }}
                  exit={{ y: 50, scale: 0.5 }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    if (mole.status !== 'active') return;
                    setScore(s => s + 10);
                    setMoles(prev => {
                      const next = [...prev];
                      next[i] = { ...next[i], status: 'whacked' };
                      
                      setTimeout(() => {
                         setMoles(p => {
                           const n = [...p];
                           n[i] = { ...n[i], status: 'hidden' };
                           return n;
                         })
                      }, 500);
                      
                      return next;
                    });
                  }}
                  className="absolute -inset-4 flex items-center justify-center text-5xl sm:text-7xl group z-20 cursor-pointer"
                >
                  <motion.span 
                    animate={
                      mole.status === 'active' 
                        ? { rotate: [0, -5, 5, 0] } 
                        : mole.status === 'miss_anim'
                        ? { y: [0, 10, 50], opacity: [1, 0] }
                        : {}
                    } 
                    transition={mole.status === 'active' ? { repeat: Infinity, duration: 0.2 } : { duration: 0.3 }}
                  >
                    {mole.status === 'whacked' ? '😵' : mole.status === 'miss_anim' ? '💨' : '🐰'}
                  </motion.span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {timeLeft === 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-6"
        >
          <div className="bg-white rounded-[3rem] p-12 text-center shadow-2xl border-b-[12px] border-orange-100">
            <Trophy className="text-yellow-400 mx-auto mb-6" size={80} />
            <h3 className="text-3xl md:text-4xl font-black text-slate-800 mb-2 uppercase">TIME UP!</h3>
            <p className="text-indigo-400 font-black text-xl md:text-2xl mb-6 md:mb-8">Score: {score}</p>
            <button 
              onClick={() => { setTimeLeft(30); setScore(0); setHasSubmitted(false); }}
              className="px-12 py-4 bg-orange-500 text-white font-black rounded-2xl shadow-[0_8px_0_0_#9a3412] uppercase"
            >
              Play Again
            </button>
            <button 
              onClick={() => { if (!hasSubmitted) onScoreSubmit(score); onClose(); }}
              className="mt-4 px-12 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl border-b-8 border-slate-200 uppercase"
            >
              Exit
            </button>
          </div>
        </motion.div>
      )}

      <div className="mt-12 text-white/40 font-black uppercase tracking-widest text-xs">
        Tap the rabbits before they hide!
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../AuthProvider';
import { Trophy, ArrowDown, RefreshCw, X, Award, Shield, Zap, Flame } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Block {
  id: number;
  x: number;
  y: number;
  width: number;
  type: string;
  isStable: boolean;
}

const ANIMALS = ['🐼', '🐱', '🐻', '🦁', '🐨', '🐯', '🐸', '🐷'];
const BLOCK_HEIGHT = 60;
const BASE_WIDTH = 120;

type Difficulty = 'easy' | 'medium' | 'hard';

export default function TowerStacker({ onScoreSubmit, onClose }: { onScoreSubmit: (score: number) => void, onClose: () => void }) {
  const { profile } = useAuth();
  const [gameState, setGameState] = useState<'idle' | 'difficulty' | 'playing' | 'gameOver'>('idle');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [score, setScore] = useState(0);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [currentBlockX, setCurrentBlockX] = useState(0);
  const [isDropping, setIsDropping] = useState(false);
  const [viewOffset, setViewOffset] = useState(0);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>();
  const speedRef = useRef(3);
  const directionRef = useRef(1);

  const selectDifficulty = (diff: Difficulty) => {
    setDifficulty(diff);
    setGameState('playing');
    setScore(0);
    const startWidth = diff === 'hard' ? 90 : BASE_WIDTH;
    setBlocks([{ id: 0, x: 100, y: 0, width: startWidth, type: '🏠', isStable: true }]);
    setCurrentBlockX(100);
    setIsDropping(false);
    setViewOffset(0);
    speedRef.current = diff === 'easy' ? 2 : diff === 'medium' ? 3.5 : 5;
  };

  const update = () => {
    if (gameState !== 'playing' || isDropping) return;

    setCurrentBlockX(prev => {
      let next = prev + (speedRef.current * directionRef.current);
      if (next > 200 || next < 0) {
        directionRef.current *= -1;
        return prev + (speedRef.current * directionRef.current);
      }
      return next;
    });

    requestRef.current = requestAnimationFrame(update);
  };

  const handleDrop = () => {
    if (gameState !== 'playing' || isDropping) return;
    setIsDropping(true);

    const lastBlock = blocks[blocks.length - 1];
    const newWidth = calculateNewWidth(currentBlockX, lastBlock);

    if (newWidth <= 5) { // If it's too small, it falls
      setGameState('gameOver');
      return;
    }

    const newBlock: Block = {
      id: Date.now(),
      x: Math.max(currentBlockX, lastBlock.x),
      y: blocks.length * BLOCK_HEIGHT,
      width: newWidth,
      type: ANIMALS[Math.floor(Math.random() * ANIMALS.length)],
      isStable: true
    };

    setBlocks(prev => [...prev, newBlock]);
    setScore(prev => prev + 1);
    
    if (blocks.length > 4) {
      setViewOffset(prev => prev + BLOCK_HEIGHT);
    }

    // Speed increase based on difficulty
    const inc = difficulty === 'easy' ? 0.08 : difficulty === 'medium' ? 0.15 : 0.25;
    speedRef.current += inc;

    setTimeout(() => {
      setIsDropping(false);
    }, 400);
  };

  const calculateNewWidth = (currentX: number, lastBlock: Block) => {
    const diff = Math.abs(currentX - lastBlock.x);
    return lastBlock.width - diff;
  };

  useEffect(() => {
    if (gameState === 'playing' && !isDropping) {
      requestRef.current = requestAnimationFrame(update);
    }
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [gameState, isDropping]);

  useEffect(() => {
    if (gameState === 'gameOver') {
      const multiplier = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 30;
      onScoreSubmit(score * multiplier);
    }
  }, [gameState]);

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-sky-400 to-indigo-500 z-[100] overflow-hidden flex flex-col items-center">
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-20 left-10 text-6xl">☁️</div>
        <div className="absolute top-40 right-20 text-8xl">☁️</div>
        <div className="absolute top-80 left-1/2 text-7xl">☁️</div>
      </div>

      <div className="w-full p-4 flex justify-between items-center text-white relative z-10">
        <div className="bg-white/20 backdrop-blur-md px-6 py-2 rounded-2xl border border-white/30 shadow-xl">
          <p className="text-[10px] font-black uppercase text-sky-100">Height</p>
          <p className="text-3xl font-black text-yellow-300 leading-none">{score}</p>
        </div>
        <button onClick={onClose} className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center hover:bg-red-500 transition-colors shadow-lg border border-white/30">
          <X />
        </button>
      </div>

      <div ref={containerRef} onClick={handleDrop} className="relative w-[300px] flex-1 cursor-pointer overflow-hidden mt-12">
        <div className="absolute bottom-20 left-0 transition-transform duration-500 ease-out" style={{ transform: `translateY(${viewOffset}px)` }}>
          {blocks.map((block, i) => (
            <motion.div
              key={block.id}
              initial={i === blocks.length - 1 && i > 0 ? { y: -400, opacity: 0 } : false}
              animate={{ y: -block.y, opacity: 1 }}
              transition={{ type: 'spring', damping: 20 }}
              style={{ left: block.x, width: block.width, height: BLOCK_HEIGHT }}
              className="absolute bg-white rounded-2xl flex items-center justify-center text-4xl shadow-[0_8px_0_0_#e2e8f0] border-2 border-slate-100"
            >
              {block.type}
            </motion.div>
          ))}
        </div>

        {!isDropping && gameState === 'playing' && (
          <div 
            style={{ 
              left: currentBlockX, 
              width: blocks[blocks.length - 1]?.width || BASE_WIDTH,
              height: BLOCK_HEIGHT,
              top: 40
            }}
            className="absolute bg-white/80 backdrop-blur-md rounded-2xl flex items-center justify-center text-4xl border-2 border-white shadow-xl animate-pulse"
          >
            {ANIMALS[score % ANIMALS.length]}
          </div>
        )}
      </div>

      <AnimatePresence>
        {gameState === 'idle' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-20">
            <div className="text-8xl mb-8 animate-bounce">🏗️</div>
            <h2 className="text-7xl font-black text-white mb-12 tracking-tighter uppercase italic text-center px-4">Tower Stacker</h2>
            <button onClick={() => setGameState('difficulty')} className="bg-yellow-400 text-indigo-900 px-16 py-6 rounded-[2.5rem] font-black text-3xl shadow-[0_12px_0_0_#ca8a04] hover:scale-105 active:translate-y-2 active:shadow-none transition-all uppercase">
              Start Building!
            </button>
          </motion.div>
        )}

        {gameState === 'difficulty' && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="absolute inset-0 flex flex-col items-center justify-center bg-indigo-900/90 backdrop-blur-xl z-20 p-8">
            <h2 className="text-5xl font-black text-white mb-12 uppercase italic tracking-tight">Select Level</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
              {[
                { id: 'easy', label: 'Easy', color: 'bg-emerald-500', icon: <Shield className="w-8 h-8" />, desc: 'Slow & Steady' },
                { id: 'medium', label: 'Pro', color: 'bg-orange-500', icon: <Zap className="w-8 h-8" />, desc: 'Fast & Focused' },
                { id: 'hard', label: 'Legend', color: 'bg-red-500', icon: <Flame className="w-8 h-8" />, desc: 'Expert Builder' }
              ].map((diff) => (
                <button
                  key={diff.id}
                  onClick={() => selectDifficulty(diff.id as Difficulty)}
                  className={cn(
                    "p-8 rounded-[3rem] text-white flex flex-col items-center gap-4 transition-all hover:scale-105 active:scale-95 shadow-2xl border-4 border-white/20",
                    diff.color
                  )}
                >
                  <div className="w-20 h-20 bg-white/20 rounded-[2rem] flex items-center justify-center shadow-inner">
                    {diff.icon}
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-black uppercase tracking-tighter leading-none mb-2">{diff.label}</p>
                    <p className="text-xs font-bold opacity-80 uppercase tracking-widest">{diff.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {gameState === 'gameOver' && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-0 flex flex-col items-center justify-center bg-indigo-900/95 backdrop-blur-md z-20 text-white p-8">
            <div className="text-8xl mb-8">🧱</div>
            <h2 className="text-7xl font-black mb-4 uppercase italic tracking-tighter">Tumble!</h2>
            <p className="text-2xl mb-12 opacity-90 text-center font-bold">Your tower reached {score} blocks!</p>
            
            <div className="bg-white/10 p-10 rounded-[3.5rem] mb-12 text-center w-full max-w-md border-4 border-white/10 shadow-2xl">
              <p className="text-xs font-black uppercase tracking-[0.3em] mb-4 text-sky-200">Final Height</p>
              <p className="text-9xl font-black text-yellow-400 tracking-tighter leading-none mb-6">{score}</p>
              <div className="flex items-center justify-center gap-2 text-yellow-400 bg-white/10 py-3 px-6 rounded-full inline-flex">
                <Trophy size={28} />
                <span className="text-2xl font-black">MASTER PIECE!</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 w-full max-w-md">
              <button onClick={() => setGameState('difficulty')} className="flex-1 bg-yellow-400 text-indigo-900 py-6 rounded-[2.5rem] font-black text-2xl shadow-[0_10px_0_0_#ca8a04] hover:scale-105 active:translate-y-2 active:shadow-none transition-all uppercase flex items-center justify-center gap-3">
                <RefreshCw size={28} /> Rebuild
              </button>
              <button onClick={onClose} className="flex-1 bg-white/10 text-white py-6 rounded-[2.5rem] font-black text-2xl border-4 border-white/10 hover:bg-white/20 transition-all uppercase">
                Quit
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

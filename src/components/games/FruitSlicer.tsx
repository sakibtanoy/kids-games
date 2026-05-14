import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../AuthProvider';
import { cn } from '../../lib/utils';
import { Trophy, Heart, Play, RefreshCw, X, Bomb } from 'lucide-react';

interface Fruit {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: string;
  isSliced: boolean;
  angle: number;
  rotationSpeed: number;
  isBomb: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
}

const FRUIT_TYPES = [
  { icon: '🍉', color: '#4ade80' },
  { icon: '🍎', color: '#f87171' },
  { icon: '🍊', color: '#fb923c' },
  { icon: '🍍', color: '#facc15' },
  { icon: '🍓', color: '#fb7185' },
];

export default function FruitSlicer({ onComplete, onClose }: { onComplete: (score: number) => void, onClose: () => void }) {
  const { updatePoints } = useAuth();
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameOver'>('idle');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fruitsRef = useRef<Fruit[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const trailRef = useRef<{ x: number, y: number, time: number }[]>([]);
  const lastMousePos = useRef<{ x: number, y: number } | null>(null);
  const requestRef = useRef<number>();

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setLives(3);
    fruitsRef.current = [];
    particlesRef.current = [];
  };

  const spawnFruit = () => {
    const isBomb = Math.random() < 0.15;
    const type = FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)].icon;
    
    const newFruit: Fruit = {
      id: Date.now() + Math.random(),
      x: Math.random() * (window.innerWidth - 100) + 50,
      y: window.innerHeight + 50,
      vx: (Math.random() - 0.5) * 8,
      vy: -Math.random() * 15 - 10,
      type: isBomb ? '💣' : type,
      isSliced: false,
      angle: 0,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      isBomb
    };
    fruitsRef.current.push(newFruit);
  };

  const update = () => {
    if (gameState !== 'playing') return;

    // Spawn chance
    if (Math.random() < 0.03 + (score * 0.0001)) {
      spawnFruit();
    }

    // Update fruits
    fruitsRef.current = fruitsRef.current.filter(fruit => {
      fruit.x += fruit.vx;
      fruit.y += fruit.vy;
      fruit.vy += 0.3; // Gravity
      fruit.angle += fruit.rotationSpeed;

      // Missed fruit
      if (fruit.y > window.innerHeight + 100 && !fruit.isSliced && !fruit.isBomb) {
        setLives(prev => {
          if (prev <= 1) setGameState('gameOver');
          return prev - 1;
        });
        return false;
      }
      
      return fruit.y < window.innerHeight + 200;
    });

    // Update particles
    particlesRef.current = particlesRef.current.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2;
      p.life -= 0.02;
      return p.life > 0;
    });

    // Update trail
    const now = Date.now();
    trailRef.current = trailRef.current.filter(p => now - p.time < 150);

    draw();
    requestRef.current = requestAnimationFrame(update);
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Trail
    if (trailRef.current.length > 1) {
      ctx.beginPath();
      ctx.moveTo(trailRef.current[0].x, trailRef.current[0].y);
      for (let i = 1; i < trailRef.current.length; i++) {
        ctx.lineTo(trailRef.current[i].x, trailRef.current[i].y);
      }
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    // Draw Particles
    particlesRef.current.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // Draw Fruits
    fruitsRef.current.forEach(fruit => {
      if (fruit.isSliced) return;
      
      ctx.save();
      ctx.translate(fruit.x, fruit.y);
      ctx.rotate(fruit.angle);
      ctx.font = '60px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(fruit.type, 0, 0);
      ctx.restore();
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (gameState !== 'playing') return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    trailRef.current.push({ x, y, time: Date.now() });

    if (lastMousePos.current) {
      const p1 = lastMousePos.current;
      const p2 = { x, y };

      fruitsRef.current.forEach(fruit => {
        if (!fruit.isSliced) {
          const dist = Math.hypot(fruit.x - x, fruit.y - y);
          if (dist < 40) {
            sliceFruit(fruit);
          }
        }
      });
    }
    
    lastMousePos.current = { x, y };
  };

  const sliceFruit = (fruit: Fruit) => {
    fruit.isSliced = true;
    
    if (fruit.isBomb) {
      setGameState('gameOver');
      return;
    }

    setScore(prev => prev + 10);
    
    // Spawn particles
    const fruitColor = FRUIT_TYPES.find(f => f.icon === fruit.type)?.color || '#fff';
    for (let i = 0; i < 15; i++) {
      particlesRef.current.push({
        x: fruit.x,
        y: fruit.y,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15,
        color: fruitColor,
        life: 1.0
      });
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    
    if (gameState === 'playing') {
      requestRef.current = requestAnimationFrame(update);
    }
    
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState]);

  useEffect(() => {
    if (gameState === 'gameOver') {
      updatePoints(score);
      onComplete(score);
    }
  }, [gameState]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-900 to-slate-900 z-[100] overflow-hidden flex flex-col">
      {/* HUD */}
      <div className="p-4 flex justify-between items-center text-white relative z-10">
        <div className="flex items-center gap-4">
          <div className="bg-white/10 backdrop-blur-md px-6 py-2 rounded-2xl border border-white/20">
            <p className="text-[10px] font-black uppercase text-indigo-300">Score</p>
            <p className="text-3xl font-black text-yellow-400 leading-none">{score}</p>
          </div>
          <div className="flex gap-1">
            {[...Array(3)].map((_, i) => (
              <Heart 
                key={i} 
                className={cn("w-6 h-6", i < lives ? "fill-red-500 text-red-500" : "text-white/20")} 
              />
            ))}
          </div>
        </div>
        <button 
          onClick={onClose}
          className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center hover:bg-red-500 transition-colors"
        >
          <X />
        </button>
      </div>

      <canvas 
        ref={canvasRef}
        onPointerMove={handlePointerMove}
        className="flex-1 cursor-crosshair touch-none"
      />

      <AnimatePresence>
        {gameState === 'idle' && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-20"
          >
            <div className="text-8xl mb-8">🍉</div>
            <h2 className="text-6xl font-black text-white mb-8 tracking-tighter uppercase italic">Fruit Slicer</h2>
            <button 
              onClick={startGame}
              className="bg-yellow-400 text-indigo-900 px-12 py-6 rounded-[2.5rem] font-black text-2xl shadow-[0_12px_0_0_#ca8a04] hover:scale-105 transition-all"
            >
              SLICE TO START!
            </button>
          </motion.div>
        )}

        {gameState === 'gameOver' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-red-600/90 backdrop-blur-md z-20 text-white p-8"
          >
            <Bomb size={120} className="mb-8 animate-bounce" />
            <h2 className="text-7xl font-black mb-4 uppercase italic">Boom!</h2>
            <p className="text-2xl mb-8 opacity-90">Game Over! You sliced a bomb or missed too many fruits.</p>
            
            <div className="bg-white/20 p-8 rounded-[3rem] mb-12 text-center w-full max-w-md border border-white/30 shadow-2xl">
              <p className="text-sm font-bold uppercase tracking-widest mb-2">Final Score</p>
              <p className="text-8xl font-black text-yellow-400 tracking-tighter mb-4">{score}</p>
              <div className="flex items-center justify-center gap-2 text-yellow-400">
                <Trophy size={24} />
                <span className="text-xl font-bold">New High Score!</span>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={startGame}
                className="bg-white text-red-600 px-12 py-5 rounded-[2rem] font-black text-xl shadow-[0_8px_0_0_#fee2e2] flex items-center gap-3 hover:scale-105 transition-all"
              >
                <RefreshCw /> TRY AGAIN
              </button>
              <button 
                onClick={onClose}
                className="bg-indigo-900 text-white px-12 py-5 rounded-[2rem] font-black text-xl shadow-[0_8px_0_0_#1e1b4b] hover:scale-105 transition-all"
              >
                QUIT
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


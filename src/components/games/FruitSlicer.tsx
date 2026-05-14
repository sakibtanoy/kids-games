import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../AuthProvider';
import { cn } from '../../lib/utils';
import { Trophy, Heart, RefreshCw, X, Bomb, Zap, Shield, Flame, Apple } from 'lucide-react';

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

type Difficulty = 'easy' | 'pro' | 'legend';

export default function FruitSlicer({ onComplete, onClose }: { onComplete: (score: number) => void, onClose: () => void }) {
  const { profile } = useAuth();
  const [gameState, setGameState] = useState<'difficulty' | 'playing' | 'gameOver'>('difficulty');
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fruitsRef = useRef<Fruit[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const trailRef = useRef<{ x: number, y: number, time: number }[]>([]);
  const lastMousePos = useRef<{ x: number, y: number } | null>(null);
  const requestRef = useRef<number>();

  const selectDifficulty = (diff: Difficulty) => {
    setDifficulty(diff);
    setGameState('playing');
    setScore(0);
    setLives(3);
    fruitsRef.current = [];
    particlesRef.current = [];
    // Short delay to ensure canvas is ready
    setTimeout(resizeCanvas, 50);
  };

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set internal dimensions to match screen size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };

  const spawnFruit = () => {
    if (!difficulty) return;
    
    let count = 1;
    if (difficulty === 'pro' && Math.random() < 0.2) count = 2;
    else if (difficulty === 'legend') {
      const r = Math.random();
      if (r < 0.1) count = 3;
      else if (r < 0.3) count = 2;
    }

    const speedMult = difficulty === 'easy' ? 0.75 : difficulty === 'pro' ? 0.9 : 1.1;

    for (let i = 0; i < count; i++) {
      const isBomb = Math.random() < (difficulty === 'easy' ? 0.04 : difficulty === 'legend' ? 0.18 : 0.1);
      const type = FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)].icon;
      
      const width = window.innerWidth;
      const x = (width * 0.25) + (Math.random() * width * 0.5);
      
      const targetHeight = window.innerHeight * (0.65 + Math.random() * 0.15); 
      const g = 0.3;
      const vyRequired = -Math.sqrt(2 * g * targetHeight);

      const newFruit: Fruit = {
        id: Date.now() + Math.random() + i,
        x,
        y: window.innerHeight + 60,
        vx: (x < width / 2 ? 1 : -1) * (Math.random() * 1.2 + 0.3) * speedMult,
        vy: vyRequired,
        type: isBomb ? '💣' : type,
        isSliced: false,
        angle: 0,
        rotationSpeed: (Math.random() - 0.5) * 0.08,
        isBomb
      };
      fruitsRef.current.push(newFruit);
    }
  };

  const update = () => {
    if (gameState !== 'playing' || !difficulty) return;

    const spawnChance = difficulty === 'easy' ? 0.008 : difficulty === 'pro' ? 0.012 : 0.02;
    if (Math.random() < spawnChance) {
      if (fruitsRef.current.length < (difficulty === 'easy' ? 1 : difficulty === 'pro' ? 3 : 4)) {
        spawnFruit();
      }
    }

    fruitsRef.current = fruitsRef.current.filter(fruit => {
      fruit.x += fruit.vx;
      fruit.y += fruit.vy;
      fruit.vy += 0.3;
      fruit.angle += fruit.rotationSpeed;

      const margin = 40;
      if (fruit.x < margin) { fruit.x = margin; fruit.vx *= -0.4; }
      else if (fruit.x > window.innerWidth - margin) { fruit.x = window.innerWidth - margin; fruit.vx *= -0.4; }

      if (fruit.y > window.innerHeight + 150 && !fruit.isSliced && !fruit.isBomb) {
        setLives(prev => {
          if (prev <= 1) { setGameState('gameOver'); return 0; }
          return prev - 1;
        });
        return false;
      }
      return fruit.y < window.innerHeight + 250;
    });

    particlesRef.current = particlesRef.current.filter(p => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.25; p.life -= 0.03;
      return p.life > 0;
    });

    const now = Date.now();
    trailRef.current = trailRef.current.filter(p => now - p.time < 120);

    draw();
    requestRef.current = requestAnimationFrame(update);
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Trail
    if (trailRef.current.length > 1) {
      ctx.beginPath();
      ctx.moveTo(trailRef.current[0].x, trailRef.current[0].y);
      for (let i = 1; i < trailRef.current.length; i++) ctx.lineTo(trailRef.current[i].x, trailRef.current[i].y);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }

    // Particles
    particlesRef.current.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // Fruits
    fruitsRef.current.forEach(fruit => {
      if (fruit.isSliced) return;
      ctx.save();
      ctx.translate(fruit.x, fruit.y);
      ctx.rotate(fruit.angle);
      // Adjusted font size to be more mobile-friendly (approx 12-15% of screen width)
      const fontSize = Math.min(window.innerWidth * 0.15, 60);
      ctx.font = `${fontSize}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (fruit.isBomb) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ff4444';
      }
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
    fruitsRef.current.forEach(fruit => {
      if (!fruit.isSliced && Math.hypot(fruit.x - x, fruit.y - y) < 40) sliceFruit(fruit);
    });
  };

  const sliceFruit = (fruit: Fruit) => {
    fruit.isSliced = true;
    if (fruit.isBomb) { setGameState('gameOver'); return; }
    setScore(prev => prev + (difficulty === 'easy' ? 10 : difficulty === 'pro' ? 20 : 30));
    const color = FRUIT_TYPES.find(f => f.icon === fruit.type)?.color || '#fff';
    for (let i = 0; i < 12; i++) {
      particlesRef.current.push({ x: fruit.x, y: fruit.y, vx: (Math.random() - 0.5) * 12, vy: (Math.random() - 0.5) * 12, color, life: 1.0 });
    }
  };

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  useEffect(() => {
    if (gameState === 'playing') requestRef.current = requestAnimationFrame(update);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [gameState, difficulty]);

  useEffect(() => {
    if (gameState === 'gameOver') onComplete(score);
  }, [gameState]);

  if (gameState === 'difficulty') {
    return (
      <div className="fixed inset-0 bg-indigo-900/95 z-[101] flex items-center justify-center p-6">
        <div className="bg-white rounded-[3rem] p-8 md:p-12 text-center max-w-sm w-full shadow-2xl border-b-[12px] border-indigo-100 relative">
          <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-400 bg-slate-50 rounded-xl"><X size={20} /></button>
          <div className="w-16 h-16 bg-indigo-50 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6"><Apple size={32} className="text-indigo-500" /></div>
          <h2 className="text-2xl font-black text-slate-800 mb-6 uppercase tracking-tighter">Fruit Slicer</h2>
          <div className="space-y-3">
            {(['easy', 'pro', 'legend'] as const).map(d => (
              <button key={d} onClick={() => selectDifficulty(d)} className="w-full py-4 rounded-2xl font-black uppercase text-lg bg-indigo-50 text-indigo-900 hover:bg-indigo-500 hover:text-white transition-all shadow-md active:translate-y-1">{d}</button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-indigo-950 z-[100] overflow-hidden flex flex-col">
      <div className="p-4 flex justify-between items-center text-white relative z-10 pointer-events-none">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-xl px-4 py-1.5 rounded-xl border-2 border-white/20">
            <p className="text-[8px] font-black uppercase text-indigo-300">Score</p>
            <p className="text-2xl font-black text-yellow-400 leading-none">{score}</p>
          </div>
          <div className="flex gap-1">
            {[...Array(3)].map((_, i) => <Heart key={i} size={20} className={cn("drop-shadow-lg", i < lives ? "fill-red-500 text-red-500" : "text-white/10")} />)}
          </div>
        </div>
        <button onClick={onClose} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-red-500 transition-all pointer-events-auto active:scale-90"><X size={20} /></button>
      </div>

      <canvas ref={canvasRef} onPointerMove={handlePointerMove} className="fixed inset-0 w-full h-full cursor-crosshair touch-none" />

      <AnimatePresence>
        {gameState === 'gameOver' && (
          <div className="absolute inset-0 z-[150] bg-indigo-950/90 backdrop-blur-xl flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-8 rounded-[2.5rem] text-center max-w-sm w-full border-b-[12px] border-indigo-100 shadow-2xl">
              <Trophy size={40} className="text-indigo-500 mx-auto mb-4" />
              <h2 className="text-3xl font-black text-slate-800 mb-1 tracking-tighter uppercase leading-none">GAME OVER</h2>
              <p className="text-indigo-500 font-bold text-2xl mb-6 italic">Score: {score}</p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => { setDifficulty(null); setGameState('difficulty'); }} className="py-4 bg-indigo-500 text-white font-black text-lg rounded-2xl shadow-[0_6px_0_0_#4f46e5] hover:bg-indigo-400 active:translate-y-1 transition-all uppercase">Again</button>
                <button onClick={onClose} className="py-4 bg-slate-100 text-slate-500 font-black text-lg rounded-2xl border-b-4 border-slate-200 hover:bg-slate-200 active:translate-y-1 transition-all uppercase">Exit</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

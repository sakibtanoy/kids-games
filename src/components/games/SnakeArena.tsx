import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../AuthProvider';
import { db } from '../../lib/firebase';
import { collection, doc, setDoc, onSnapshot, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Trophy, Users, RefreshCw, X, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Shield, Zap, Flame } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Point {
  x: number;
  y: number;
}

interface Snake {
  id: string;
  username: string;
  segments: Point[];
  direction: string;
  score: number;
  color: string;
}

const GRID_SIZE = 20;
const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

type Difficulty = 'easy' | 'medium' | 'hard';

export default function SnakeArena({ roomId, onScoreSubmit, onClose }: { roomId?: string, onScoreSubmit: (score: number) => void, onClose: () => void }) {
  const { user, profile } = useAuth();
  const [gameState, setGameState] = useState<'idle' | 'difficulty' | 'playing' | 'gameOver'>('idle');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [snakes, setSnakes] = useState<Record<string, Snake>>({});
  const [food, setFood] = useState<Point>({ x: 10, y: 10 });
  const [direction, setDirection] = useState('RIGHT');
  const [score, setScore] = useState(0);
  
  const snakeColor = useRef(COLORS[Math.floor(Math.random() * COLORS.length)]);

  const selectDifficulty = (diff: Difficulty) => {
    setDifficulty(diff);
    setGameState('playing');
    setScore(0);
    setDirection('RIGHT');
    if (!roomId && user) {
      setSnakes({ [user.uid]: { 
        id: user.uid, 
        username: profile?.displayName || 'Player', 
        segments: [{ x: 5, y: 5 }], 
        direction: 'RIGHT', 
        score: 0, 
        color: snakeColor.current 
      }});
    }
  };

  // Multiplayer Sync
  useEffect(() => {
    if (!roomId || !user) return;

    const snakesRef = collection(db, `rooms/${roomId}/snakes`);
    const unsubscribe = onSnapshot(snakesRef, (snapshot) => {
      const updatedSnakes: Record<string, Snake> = {};
      snapshot.forEach(doc => {
        updatedSnakes[doc.id] = doc.data() as Snake;
      });
      setSnakes(updatedSnakes);
    });

    const foodRef = doc(db, `rooms/${roomId}`, 'gameData');
    const unsubscribeFood = onSnapshot(foodRef, (snapshot) => {
      if (snapshot.exists()) {
        setFood(snapshot.data().food);
      }
    });

    return () => {
      unsubscribe();
      unsubscribeFood();
      if (user) deleteDoc(doc(db, `rooms/${roomId}/snakes`, user.uid));
    };
  }, [roomId, user]);

  const moveSnake = useCallback(() => {
    if (gameState !== 'playing' || !user) return;

    const mySnake = snakes[user.uid];
    if (!mySnake) return;

    const head = { ...mySnake.segments[0] };
    
    switch (direction) {
      case 'UP': head.y -= 1; break;
      case 'DOWN': head.y += 1; break;
      case 'LEFT': head.x -= 1; break;
      case 'RIGHT': head.x += 1; break;
    }

    // Wall Collision
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      setGameState('gameOver');
      return;
    }

    // Self/Other Collision
    const allSegments = Object.values(snakes).flatMap(s => s.segments);
    if (allSegments.some(seg => seg.x === head.x && seg.y === head.y)) {
      setGameState('gameOver');
      return;
    }

    const newSegments = [head, ...mySnake.segments];
    let newScore = mySnake.score;
    let grew = false;

    // Food Collision
    if (head.x === food.x && head.y === food.y) {
      const points = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 30;
      newScore += points;
      setScore(newScore);
      grew = true;
      if (roomId) {
        const newFood = { x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) };
        updateDoc(doc(db, `rooms/${roomId}`, 'gameData'), { food: newFood });
      } else {
        setFood({ x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) });
      }
    }

    if (!grew) {
      newSegments.pop();
    }

    const updatedSnake = {
      ...mySnake,
      segments: newSegments,
      direction,
      score: newScore,
    };

    if (roomId) {
      setDoc(doc(db, `rooms/${roomId}/snakes`, user.uid), { ...updatedSnake, lastUpdate: serverTimestamp() });
    } else {
      setSnakes({ ...snakes, [user.uid]: updatedSnake });
    }
  }, [gameState, direction, food, snakes, user, roomId, profile, difficulty]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': if (direction !== 'DOWN') setDirection('UP'); break;
        case 'ArrowDown': if (direction !== 'UP') setDirection('DOWN'); break;
        case 'ArrowLeft': if (direction !== 'RIGHT') setDirection('LEFT'); break;
        case 'ArrowRight': if (direction !== 'LEFT') setDirection('RIGHT'); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction]);

  useEffect(() => {
    if (gameState === 'playing') {
      const speed = difficulty === 'easy' ? 200 : difficulty === 'medium' ? 150 : 100;
      const interval = setInterval(moveSnake, speed);
      return () => clearInterval(interval);
    }
  }, [gameState, moveSnake, difficulty]);

  useEffect(() => {
    if (gameState === 'gameOver') {
      onScoreSubmit(score);
    }
  }, [gameState]);

  return (
    <div className="fixed inset-0 bg-indigo-950 z-[100] flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="w-full max-w-md flex justify-between items-center mb-6 text-white relative z-10">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 p-3 rounded-2xl border border-white/20 shadow-xl backdrop-blur-md">
            <Trophy className="text-yellow-400 inline-block mr-2" />
            <span className="font-black text-2xl tracking-tighter">{score}</span>
          </div>
          {roomId && (
            <div className="flex items-center gap-1 text-indigo-300 bg-white/5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">
              <Users size={12} /> {Object.keys(snakes).length} ONLINE
            </div>
          )}
        </div>
        <button onClick={onClose} className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center hover:bg-red-500 transition-colors shadow-lg border border-white/10">
          <X />
        </button>
      </div>

      {/* Arena Grid */}
      <div 
        className="relative bg-indigo-900/30 rounded-[2.5rem] border-4 border-indigo-500/30 shadow-2xl overflow-hidden backdrop-blur-sm"
        style={{ 
          width: 'min(85vw, 400px)', 
          height: 'min(85vw, 400px)',
          display: 'grid',
          gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
          gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`
        }}
      >
        {/* Food */}
        <motion.div 
          animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
          style={{ gridColumn: food.x + 1, gridRow: food.y + 1 }}
          className="bg-yellow-400 rounded-full shadow-[0_0_20px_rgba(250,204,21,0.8)] m-1.5"
        />

        {/* Snakes */}
        {Object.values(snakes).map((snake) => (
          <React.Fragment key={snake.id}>
            {snake.segments.map((seg, i) => (
              <motion.div 
                key={`${snake.id}-${i}`}
                initial={false}
                animate={{ scale: 1 }}
                style={{ 
                  gridColumn: seg.x + 1, gridRow: seg.y + 1,
                  backgroundColor: snake.color,
                  opacity: 1 - (i * 0.015),
                  borderRadius: i === 0 ? '35%' : '20%',
                  zIndex: i === 0 ? 10 : 1
                }}
                className={cn(
                  "m-[0.5px] shadow-sm",
                  i === 0 && "shadow-[0_0_15px_rgba(255,255,255,0.4)]"
                )}
              >
                {i === 0 && (
                  <div className="flex gap-1 justify-center mt-1.5">
                    <div className="w-1 h-1 bg-white rounded-full opacity-90" />
                    <div className="w-1 h-1 bg-white rounded-full opacity-90" />
                  </div>
                )}
              </motion.div>
            ))}
          </React.Fragment>
        ))}
      </div>

      {/* Mobile Controls */}
      <div className="mt-8 grid grid-cols-3 gap-3 md:hidden">
        <div />
        <button onClick={() => direction !== 'DOWN' && setDirection('UP')} className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-white active:scale-90 transition-transform border border-white/10 shadow-lg">
          <ChevronUp size={32} />
        </button>
        <div />
        <button onClick={() => direction !== 'RIGHT' && setDirection('LEFT')} className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-white active:scale-90 transition-transform border border-white/10 shadow-lg">
          <ChevronLeft size={32} />
        </button>
        <button onClick={() => direction !== 'UP' && setDirection('DOWN')} className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-white active:scale-90 transition-transform border border-white/10 shadow-lg">
          <ChevronDown size={32} />
        </button>
        <button onClick={() => direction !== 'LEFT' && setDirection('RIGHT')} className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-white active:scale-90 transition-transform border border-white/10 shadow-lg">
          <ChevronRight size={32} />
        </button>
      </div>

      <AnimatePresence>
        {gameState === 'idle' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center z-50 p-8">
            <div className="text-9xl mb-8 animate-pulse">🐍</div>
            <h2 className="text-7xl font-black text-white mb-12 tracking-tighter uppercase italic text-center">Snake Arena</h2>
            <button 
              onClick={() => setGameState('difficulty')}
              className="bg-indigo-600 text-white px-16 py-6 rounded-[2.5rem] font-black text-3xl shadow-[0_10px_0_0_#3730a3] hover:scale-105 active:translate-y-2 active:shadow-none transition-all uppercase"
            >
              Enter Arena
            </button>
          </motion.div>
        )}

        {gameState === 'difficulty' && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="absolute inset-0 flex flex-col items-center justify-center bg-indigo-950/90 backdrop-blur-xl z-50 p-8">
            <h2 className="text-5xl font-black text-white mb-12 uppercase italic tracking-tight">Select Level</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
              {[
                { id: 'easy', label: 'Easy', color: 'bg-emerald-500', icon: <Shield className="w-8 h-8" />, desc: 'Slow speed' },
                { id: 'medium', label: 'Pro', color: 'bg-orange-500', icon: <Zap className="w-8 h-8" />, desc: 'Normal speed' },
                { id: 'hard', label: 'Legend', color: 'bg-red-500', icon: <Flame className="w-8 h-8" />, desc: 'Extreme speed' }
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
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="absolute inset-0 bg-red-600/95 backdrop-blur-xl flex flex-col items-center justify-center z-50 p-8 text-white">
            <div className="text-9xl mb-8">💥</div>
            <h2 className="text-7xl font-black mb-4 uppercase italic tracking-tighter">Smashed!</h2>
            <p className="text-2xl mb-12 opacity-90 text-center font-bold">You hit a wall or another snake!</p>
            <div className="bg-white/10 p-10 rounded-[3.5rem] mb-12 text-center w-full max-w-xs border-4 border-white/10 shadow-2xl backdrop-blur-md">
              <p className="text-xs font-black uppercase tracking-[0.3em] mb-4 text-white/70">Final Score</p>
              <p className="text-9xl font-black text-yellow-400 leading-none">{score}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-6 w-full max-w-md">
              <button onClick={() => setGameState('difficulty')} className="flex-1 bg-white text-red-600 py-5 rounded-[2rem] font-black text-2xl shadow-[0_8px_0_0_#fee2e2] flex items-center justify-center gap-3 active:translate-y-2 active:shadow-none transition-all uppercase">
                <RefreshCw size={28} /> Respawn
              </button>
              <button onClick={onClose} className="flex-1 bg-indigo-950 text-white py-5 rounded-[2rem] font-black text-2xl border-4 border-white/10 hover:bg-indigo-900 transition-all uppercase">
                Quit
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

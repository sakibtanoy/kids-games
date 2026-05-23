import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../AuthProvider';
import { db } from '../../lib/firebase';
import { collection, doc, setDoc, onSnapshot, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Trophy, Users, RefreshCw, X, Shield, Zap, Flame } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Point {
  x: number;
  y: number;
}

interface Food extends Point {
  id: string;
  value: number;
  radius: number;
  color: string;
  emoji: string;
}

interface ArenaSnake {
  id: string;
  username: string;
  x: number;
  y: number;
  angle: number;
  targetAngle: number;
  length: number;
  radius: number;
  score: number;
  color: string;
  trail: Point[];
  alive: boolean;
  isAi: boolean;
  respawnAt?: number;
}

type Difficulty = 'easy' | 'medium' | 'hard';
type GameState = 'idle' | 'difficulty' | 'playing' | 'gameOver';

const ARENA = { width: 2400, height: 1600 };
const COLORS = ['#22c55e', '#38bdf8', '#f97316', '#ec4899', '#a855f7', '#facc15', '#fb7185', '#14b8a6'];
const FOOD = [
  { emoji: '🍓', color: '#fb7185' },
  { emoji: '🍊', color: '#fb923c' },
  { emoji: '🍏', color: '#84cc16' },
  { emoji: '🫐', color: '#60a5fa' },
  { emoji: '⭐', color: '#facc15' }
];

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const normalizeAngle = (angle: number) => Math.atan2(Math.sin(angle), Math.cos(angle));

const createFood = (x = Math.random() * ARENA.width, y = Math.random() * ARENA.height, value = 10): Food => {
  const item = FOOD[Math.floor(Math.random() * FOOD.length)];
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    x: clamp(x, 45, ARENA.width - 45),
    y: clamp(y, 45, ARENA.height - 45),
    value,
    radius: value > 10 ? 15 : 11,
    color: item.color,
    emoji: item.emoji
  };
};

const trimTrail = (points: Point[], maxLength: number) => {
  if (points.length <= 2) return points;
  const trimmed = [points[0]];
  let traveled = 0;

  for (let i = 1; i < points.length; i++) {
    const segment = dist(points[i - 1], points[i]);
    if (traveled + segment > maxLength) {
      const remaining = maxLength - traveled;
      const ratio = segment === 0 ? 0 : remaining / segment;
      trimmed.push({
        x: points[i - 1].x + (points[i].x - points[i - 1].x) * ratio,
        y: points[i - 1].y + (points[i].y - points[i - 1].y) * ratio
      });
      break;
    }
    traveled += segment;
    trimmed.push(points[i]);
  }

  return trimmed;
};

const makeSnake = (id: string, username: string, color: string, isAi: boolean, index: number): ArenaSnake => {
  const angle = Math.random() * Math.PI * 2;
  const x = isAi ? 240 + (index % 4) * 520 + Math.random() * 160 : ARENA.width / 2;
  const y = isAi ? 240 + Math.floor(index / 4) * 420 + Math.random() * 160 : ARENA.height / 2;
  const trail = Array.from({ length: 18 }, (_, i) => ({
    x: x - Math.cos(angle) * i * 12,
    y: y - Math.sin(angle) * i * 12
  }));

  return {
    id,
    username,
    x,
    y,
    angle,
    targetAngle: angle,
    length: isAi ? 210 + Math.random() * 90 : 230,
    radius: isAi ? 10 : 12,
    score: 0,
    color,
    trail,
    alive: true,
    isAi
  };
};

const snakeValues = (record: Record<string, ArenaSnake>) => Object.values(record) as ArenaSnake[];

export default function SnakeArena({ roomId, onScoreSubmit, onClose }: { roomId?: string | null, onScoreSubmit: (score: number) => void, onClose: () => void }) {
  const { user, profile } = useAuth();
  const [gameState, setGameState] = useState<GameState>('idle');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [score, setScore] = useState(0);
  const [roster, setRoster] = useState<ArenaSnake[]>([]);
  const [deathReason, setDeathReason] = useState('Another snake tagged you.');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const snakesRef = useRef<Record<string, ArenaSnake>>({});
  const remoteSnakesRef = useRef<Record<string, ArenaSnake>>({});
  const foodsRef = useRef<Food[]>([]);
  const rafRef = useRef<number>();
  const lastTimeRef = useRef(0);
  const controlAngleRef = useRef<number | null>(null);
  const keyboardRef = useRef({ up: false, down: false, left: false, right: false });
  const killedRemoteRef = useRef<Set<string>>(new Set());

  const playerId = user?.uid || 'guest-player';
  const playerName = profile?.displayName || 'Hero';
  const playerColor = useRef(COLORS[Math.floor(Math.random() * COLORS.length)]);

  const spawnFood = useCallback((count: number) => {
    for (let i = 0; i < count; i++) foodsRef.current.push(createFood());
  }, []);

  const dropSnakeFruit = useCallback((snake: ArenaSnake) => {
    const drops = clamp(Math.floor(snake.score / 20) + Math.floor(snake.length / 95), 5, 24);
    for (let i = 0; i < drops; i++) {
      const point = snake.trail[Math.min(snake.trail.length - 1, Math.floor((i / drops) * snake.trail.length))] || { x: snake.x, y: snake.y };
      foodsRef.current.push(createFood(point.x + (Math.random() - 0.5) * 70, point.y + (Math.random() - 0.5) * 70, 15));
    }
  }, []);

  const selectDifficulty = (diff: Difficulty) => {
    setDifficulty(diff);
    setGameState('playing');
    setScore(0);
    setDeathReason('Another snake tagged you.');
    killedRemoteRef.current.clear();
    foodsRef.current = [];
    spawnFood(diff === 'easy' ? 65 : diff === 'medium' ? 82 : 96);

    const aiCount = roomId ? (diff === 'easy' ? 3 : diff === 'medium' ? 4 : 5) : (diff === 'easy' ? 4 : diff === 'medium' ? 6 : 7);
    const snakes: Record<string, ArenaSnake> = {
      [playerId]: makeSnake(playerId, playerName, playerColor.current, false, 0)
    };

    for (let i = 0; i < aiCount; i++) {
      const id = `ai-${i}`;
      snakes[id] = makeSnake(id, ['Mango', 'Fizz', 'Sunny', 'Dash', 'Poppy', 'Zippy', 'Noodle'][i] || `Bot ${i + 1}`, COLORS[(i + 1) % COLORS.length], true, i + 1);
    }

    snakesRef.current = snakes;
    setRoster(Object.values(snakes));
    setTimeout(resizeCanvas, 40);
  };

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
  }, []);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  useEffect(() => {
    if (!roomId || !user) return;
    const snakesCollection = collection(db, 'rooms', roomId, 'snakes');
    const unsubscribe = onSnapshot(snakesCollection, (snapshot) => {
      const remote: Record<string, ArenaSnake> = {};
      snapshot.forEach(snap => {
        if (snap.id !== user.uid) remote[snap.id] = snap.data() as ArenaSnake;
      });
      remoteSnakesRef.current = remote;
    });

    return () => {
      unsubscribe();
      deleteDoc(doc(db, 'rooms', roomId, 'snakes', user.uid)).catch(() => {});
    };
  }, [roomId, user]);

  useEffect(() => {
    if (!roomId || !user || gameState !== 'playing') return;
    const sync = setInterval(() => {
      const snake = snakesRef.current[playerId];
      if (!snake) return;
      setDoc(doc(db, 'rooms', roomId, 'snakes', user.uid), {
        ...snake,
        isAi: false,
        updatedAt: serverTimestamp()
      }).catch(err => console.error('Snake sync failed:', err));
    }, 140);
    return () => clearInterval(sync);
  }, [roomId, user, gameState, playerId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') keyboardRef.current.up = true;
      if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') keyboardRef.current.down = true;
      if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') keyboardRef.current.left = true;
      if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') keyboardRef.current.right = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') keyboardRef.current.up = false;
      if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') keyboardRef.current.down = false;
      if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') keyboardRef.current.left = false;
      if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') keyboardRef.current.right = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const gameOver = useCallback((reason: string) => {
    const player = snakesRef.current[playerId];
    if (player) player.alive = false;
    const finalScore = player?.score || score;
    setScore(finalScore);
    setDeathReason(reason);
    setGameState('gameOver');
    onScoreSubmit(finalScore);
  }, [onScoreSubmit, playerId, score]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const player = snakesRef.current[playerId];
    const camera = player?.alive ? { x: player.x, y: player.y } : { x: ARENA.width / 2, y: ARENA.height / 2 };
    const zoom = clamp(Math.min(width / 760, height / 620), 0.48, 0.9);

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-camera.x, -camera.y);

    ctx.fillStyle = '#dcfce7';
    ctx.fillRect(0, 0, ARENA.width, ARENA.height);
    ctx.strokeStyle = '#86efac';
    ctx.lineWidth = 4;
    for (let x = 0; x <= ARENA.width; x += 120) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, ARENA.height);
      ctx.stroke();
    }
    for (let y = 0; y <= ARENA.height; y += 120) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(ARENA.width, y);
      ctx.stroke();
    }
    ctx.strokeStyle = '#16a34a';
    ctx.lineWidth = 26;
    ctx.strokeRect(13, 13, ARENA.width - 26, ARENA.height - 26);

    foodsRef.current.forEach(food => {
      ctx.save();
      ctx.translate(food.x, food.y);
      ctx.shadowColor = food.color;
      ctx.shadowBlur = 14;
      ctx.fillStyle = food.color;
      ctx.beginPath();
      ctx.arc(0, 0, food.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.font = `${food.radius * 1.6}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(food.emoji, 0, 1);
      ctx.restore();
    });

    const drawSnake = (snake: ArenaSnake) => {
      if (!snake.alive || snake.trail.length < 2) return;
      for (let i = snake.trail.length - 1; i >= 0; i--) {
        const point = snake.trail[i];
        const t = 1 - i / snake.trail.length;
        const radius = Math.max(4, snake.radius * (0.58 + t * 0.42));
        ctx.fillStyle = snake.color;
        ctx.globalAlpha = 0.45 + t * 0.55;
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      const head = snake.trail[0];
      ctx.save();
      ctx.translate(head.x, head.y);
      ctx.rotate(snake.angle);
      ctx.fillStyle = snake.color;
      ctx.shadowColor = 'rgba(0,0,0,0.22)';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(0, 0, snake.radius + 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(7, -6, 4, 0, Math.PI * 2);
      ctx.arc(7, 6, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(8.5, -6, 1.8, 0, Math.PI * 2);
      ctx.arc(8.5, 6, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.font = '700 24px Fredoka, sans-serif';
      ctx.fillStyle = '#14532d';
      ctx.textAlign = 'center';
      ctx.fillText(snake.username, head.x, head.y - snake.radius - 18);
    };

    [...snakeValues(remoteSnakesRef.current), ...snakeValues(snakesRef.current)].forEach(drawSnake);
    ctx.restore();
  }, [playerId]);

  const step = useCallback((time: number) => {
    if (gameState !== 'playing') return;

    const delta = clamp((time - (lastTimeRef.current || time)) / 16.67, 0.5, 2);
    lastTimeRef.current = time;
    const snakes = snakesRef.current;
    const player = snakes[playerId];
    const baseSpeed = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 5.2 : 6.4;

    if (player?.alive) {
      const keys = keyboardRef.current;
      if (keys.up || keys.down || keys.left || keys.right) {
        controlAngleRef.current = Math.atan2((keys.down ? 1 : 0) - (keys.up ? 1 : 0), (keys.right ? 1 : 0) - (keys.left ? 1 : 0));
      }
      if (controlAngleRef.current !== null) player.targetAngle = controlAngleRef.current;
    }

    snakeValues(snakes).forEach(snake => {
      if (!snake.alive) {
        if (snake.isAi && snake.respawnAt && Date.now() > snake.respawnAt) {
          snakes[snake.id] = makeSnake(snake.id, snake.username, snake.color, true, Math.floor(Math.random() * 6));
        }
        return;
      }

      if (snake.isAi) {
        const nearest = foodsRef.current.reduce<Food | null>((best, food) => !best || dist(snake, food) < dist(snake, best) ? food : best, null);
        if (nearest) snake.targetAngle = Math.atan2(nearest.y - snake.y, nearest.x - snake.x);
        if (snake.x < 120 || snake.x > ARENA.width - 120 || snake.y < 120 || snake.y > ARENA.height - 120) {
          snake.targetAngle = Math.atan2(ARENA.height / 2 - snake.y, ARENA.width / 2 - snake.x);
        }
      }

      const turn = normalizeAngle(snake.targetAngle - snake.angle);
      snake.angle += clamp(turn, -0.13 * delta, 0.13 * delta);
      const speed = baseSpeed * (snake.isAi ? 0.9 : 1) * (1 - Math.min(0.22, snake.length / 2600));
      snake.x += Math.cos(snake.angle) * speed * delta;
      snake.y += Math.sin(snake.angle) * speed * delta;

      if (snake.x < 24 || snake.x > ARENA.width - 24 || snake.y < 24 || snake.y > ARENA.height - 24) {
        if (snake.id === playerId) {
          gameOver('You slid into the garden wall.');
          return;
        }
        snake.alive = false;
        snake.respawnAt = Date.now() + 1800;
        dropSnakeFruit(snake);
        return;
      }

      snake.trail = trimTrail([{ x: snake.x, y: snake.y }, ...snake.trail], snake.length);
      snake.radius = clamp(9 + snake.length / 140, 9, 28);
    });

    foodsRef.current = foodsRef.current.filter(food => {
      for (const snake of snakeValues(snakes)) {
        if (!snake.alive) continue;
        if (dist(snake, food) < snake.radius + food.radius + 4) {
          snake.score += food.value;
          snake.length += 26 + food.value;
          if (snake.id === playerId) {
            const nextScore = snake.score;
            setScore(nextScore);
          }
          return false;
        }
      }
      return true;
    });
    if (foodsRef.current.length < 55) spawnFood(18);

    const remote = snakeValues(remoteSnakesRef.current).filter(s => s.alive);
    const allSnakes = [...snakeValues(snakes), ...remote];

    allSnakes.forEach(attacker => {
      if (!attacker.alive) return;
      const head = attacker.trail[0];
      if (!head) return;

      allSnakes.forEach(victim => {
        if (!victim.alive || victim.id === attacker.id) return;
        const body = victim.trail.slice(5);
        const wasBitten = body.some(point => dist(head, point) < attacker.radius + victim.radius * 0.65);
        if (!wasBitten) return;

        if (attacker.id === playerId) {
          dropSnakeFruit(attacker);
          gameOver('You bumped into another snake.');
        } else if (snakes[attacker.id]) {
          snakes[attacker.id].alive = false;
          snakes[attacker.id].respawnAt = Date.now() + 2200;
          dropSnakeFruit(snakes[attacker.id]);
        } else {
          if (!killedRemoteRef.current.has(attacker.id)) {
            killedRemoteRef.current.add(attacker.id);
            dropSnakeFruit(attacker);
          }
        }
      });
    });

    render();
    if (Math.floor(time / 500) !== Math.floor((time - 16) / 500)) {
      setRoster([...snakeValues(remoteSnakesRef.current), ...snakeValues(snakesRef.current)].filter(s => s.alive).sort((a, b) => b.score - a.score).slice(0, 8));
    }
    rafRef.current = requestAnimationFrame(step);
  }, [difficulty, dropSnakeFruit, gameOver, gameState, playerId, render, spawnFood]);

  useEffect(() => {
    if (gameState !== 'playing') return;
    lastTimeRef.current = 0;
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [gameState, step]);

  const updatePointerAngle = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    controlAngleRef.current = Math.atan2(clientY - (rect.top + rect.height / 2), clientX - (rect.left + rect.width / 2));
  };

  return (
    <div className="fixed inset-0 bg-emerald-950 z-[100] flex flex-col overflow-hidden touch-none">
      <canvas
        ref={canvasRef}
        onPointerDown={(e) => updatePointerAngle(e.clientX, e.clientY)}
        onPointerMove={(e) => e.buttons && updatePointerAngle(e.clientX, e.clientY)}
        className="absolute inset-0 h-full w-full"
      />

      <div className="relative z-10 p-3 md:p-5 flex items-start justify-between text-white pointer-events-none">
        <div className="flex gap-2 md:gap-3">
          <div className="bg-white/15 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/20 shadow-xl">
            <p className="text-[9px] font-black uppercase tracking-widest text-emerald-100">Fruit</p>
            <p className="font-black text-3xl text-yellow-300 leading-none">{score}</p>
          </div>
          <div className="bg-white/15 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/20 shadow-xl hidden sm:block">
            <p className="text-[9px] font-black uppercase tracking-widest text-emerald-100">Arena</p>
            <p className="font-black text-xl leading-none flex items-center gap-2"><Users size={18} /> {roster.length}</p>
          </div>
        </div>
        <button onClick={onClose} className="pointer-events-auto w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center hover:bg-red-500 transition-colors shadow-lg border border-white/20">
          <X />
        </button>
      </div>

      <div className="absolute right-3 top-24 z-10 hidden md:block pointer-events-none">
        <div className="bg-white/15 backdrop-blur-xl rounded-3xl border border-white/20 p-4 w-52 text-white shadow-xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-100 mb-3">Leaders</p>
          <div className="space-y-2">
            {roster.slice(0, 5).map((snake, index) => (
              <div key={snake.id} className="flex items-center gap-2 text-sm font-black">
                <span className="w-5 text-yellow-200">{index + 1}</span>
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: snake.color }} />
                <span className="flex-1 truncate">{snake.username}</span>
                <span>{snake.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {gameState === 'idle' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-emerald-950/80 backdrop-blur-md flex flex-col items-center justify-center z-50 p-6 text-center">
            <div className="text-8xl md:text-9xl mb-6">🍭</div>
            <h2 className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tighter uppercase">Snake Arena</h2>
            <button
              onClick={() => setGameState('difficulty')}
              className="bg-lime-400 text-emerald-950 px-10 md:px-16 py-5 md:py-6 rounded-[2rem] font-black text-2xl md:text-3xl shadow-[0_10px_0_0_#65a30d] hover:scale-105 active:translate-y-2 active:shadow-none transition-all uppercase"
            >
              Enter Arena
            </button>
          </motion.div>
        )}

        {gameState === 'difficulty' && (
          <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }} className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-950/90 backdrop-blur-xl z-50 p-5">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-8 md:mb-12 uppercase tracking-tight text-center">Select Arena</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 w-full max-w-4xl">
              {[
                { id: 'easy', label: 'Easy', color: 'bg-emerald-500', icon: <Shield className="w-8 h-8" />, desc: '4-5 snakes' },
                { id: 'medium', label: 'Pro', color: 'bg-orange-500', icon: <Zap className="w-8 h-8" />, desc: '6-7 snakes' },
                { id: 'hard', label: 'Legend', color: 'bg-red-500', icon: <Flame className="w-8 h-8" />, desc: '8-player chaos' }
              ].map((diff) => (
                <button
                  key={diff.id}
                  onClick={() => selectDifficulty(diff.id as Difficulty)}
                  className={cn(
                    "p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] text-white flex flex-col items-center gap-4 transition-all hover:scale-105 active:scale-95 shadow-2xl border-4 border-white/20",
                    diff.color
                  )}
                >
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center shadow-inner">
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
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="absolute inset-0 bg-rose-600/95 backdrop-blur-xl flex flex-col items-center justify-center z-50 p-6 text-white text-center">
            <div className="text-8xl mb-6">💥</div>
            <h2 className="text-5xl md:text-7xl font-black mb-3 uppercase tracking-tighter">Tagged!</h2>
            <p className="text-lg md:text-2xl mb-8 opacity-90 font-bold">{deathReason}</p>
            <div className="bg-white/12 p-8 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] mb-8 text-center w-full max-w-xs border-4 border-white/10 shadow-2xl backdrop-blur-md">
              <p className="text-xs font-black uppercase tracking-[0.3em] mb-3 text-white/70">Final Fruit</p>
              <p className="text-7xl md:text-8xl font-black text-yellow-300 leading-none">{score}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
              <button onClick={() => setGameState('difficulty')} className="flex-1 bg-white text-rose-600 py-5 rounded-[2rem] font-black text-xl md:text-2xl shadow-[0_8px_0_0_#fee2e2] flex items-center justify-center gap-3 active:translate-y-2 active:shadow-none transition-all uppercase">
                <RefreshCw size={26} /> Respawn
              </button>
              <button onClick={onClose} className="flex-1 bg-emerald-950 text-white py-5 rounded-[2rem] font-black text-xl md:text-2xl border-4 border-white/10 hover:bg-emerald-900 transition-all uppercase">
                Quit
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trophy, RefreshCw, Star, Heart, Timer } from 'lucide-react';
import { cn } from '../../lib/utils';

interface GameProps {
  onScoreSubmit: (score: number) => void;
  onClose: () => void;
}

interface FallingThing {
  id: number;
  x: number;
  y: number;
  speed: number;
  kind: string;
  value: number;
  bad?: boolean;
  special?: string;
}

interface RunnerThing {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: 'obstacle' | 'coin' | 'food' | 'hole';
  icon: string;
}

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const pick = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const playTone = (freq = 520, duration = 0.08, type: OscillatorType = 'sine') => {
  try {
    const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = 0.045;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio is best-effort and depends on the browser gesture policy.
  }
};

function Shell({
  title,
  theme,
  score,
  lives,
  time,
  onClose,
  children
}: {
  title: string;
  theme: string;
  score: number;
  lives?: number;
  time?: number;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('fixed inset-0 z-[100] overflow-hidden touch-none select-none', theme)}>
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle,_#fff_1px,_transparent_1px)] bg-[size:22px_22px]" />
      <div className="relative z-20 p-3 md:p-5 flex items-center justify-between text-white pointer-events-none">
        <div className="flex items-center gap-2">
          <div className="bg-white/18 backdrop-blur-xl rounded-2xl px-4 py-2 border border-white/20 shadow-xl">
            <p className="text-[9px] font-black uppercase tracking-widest text-white/70">{title}</p>
            <p className="text-3xl font-black text-yellow-200 leading-none">{score}</p>
          </div>
          {typeof time === 'number' && (
            <div className="bg-white/18 backdrop-blur-xl rounded-2xl px-3 py-2 border border-white/20 shadow-xl flex items-center gap-2">
              <Timer size={18} />
              <span className="font-black">{time}s</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {typeof lives === 'number' && (
            <div className="hidden xs:flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Heart key={i} size={18} className={i < lives ? 'fill-rose-400 text-rose-400' : 'text-white/20'} />
              ))}
            </div>
          )}
          <button onClick={onClose} className="pointer-events-auto w-11 h-11 rounded-2xl bg-white/18 border border-white/20 flex items-center justify-center active:scale-95">
            <X size={22} />
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}

function EndCard({
  score,
  title = 'Great Job!',
  onAgain,
  onExit
}: {
  score: number;
  title?: string;
  onAgain: () => void;
  onExit: () => void;
}) {
  return (
    <div className="absolute inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2.5rem] p-8 text-center max-w-sm w-full shadow-2xl border-b-[10px] border-slate-100">
        <Trophy size={46} className="text-yellow-400 fill-yellow-400 mx-auto mb-4" />
        <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight mb-1">{title}</h2>
        <p className="text-2xl font-black text-indigo-500 mb-6">{score}</p>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={onAgain} className="py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase shadow-[0_6px_0_0_#3730a3] active:translate-y-1 active:shadow-none">
            Again
          </button>
          <button onClick={onExit} className="py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase border-b-4 border-slate-200">
            Exit
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function useCountdown(active: boolean, seconds: number, onDone: () => void) {
  const [time, setTime] = useState(seconds);
  useEffect(() => {
    if (!active) return;
    setTime(seconds);
  }, [active, seconds]);
  useEffect(() => {
    if (!active || time <= 0) return;
    const timer = setTimeout(() => setTime(t => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [active, time]);
  useEffect(() => {
    if (active && time === 0) onDone();
  }, [active, time, onDone]);
  return [time, setTime] as const;
}

function FallingTapGame({
  title,
  theme,
  items,
  badItems,
  onScoreSubmit,
  onClose
}: GameProps & {
  title: string;
  theme: string;
  items: string[];
  badItems: string[];
}) {
  const [things, setThings] = useState<FallingThing[]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [lives, setLives] = useState(5);
  const [ended, setEnded] = useState(false);
  const [time] = useCountdown(!ended, 45, () => setEnded(true));

  useEffect(() => {
    if (ended) return;
    const tick = setInterval(() => {
      setThings(prev => {
        const next = prev
          .map(item => ({ ...item, y: item.y - item.speed }))
          .filter(item => {
            if (item.y < -12) {
              if (!item.bad) setLives(l => Math.max(0, l - 1));
              return false;
            }
            return true;
          });

        if (Math.random() < 0.24 + score / 1800) {
          const bad = Math.random() < 0.13;
          next.push({
            id: Date.now() + Math.random(),
            x: rand(8, 88),
            y: 108,
            speed: rand(0.7, 1.45) + score / 4000,
            kind: bad ? pick(badItems) : pick(items),
            value: bad ? -15 : 10,
            bad
          });
        }
        return next.slice(-22);
      });
    }, 70);
    return () => clearInterval(tick);
  }, [badItems, ended, items, score]);

  useEffect(() => {
    if (lives <= 0) setEnded(true);
  }, [lives]);

  const pop = (thing: FallingThing) => {
    playTone(thing.bad ? 180 : 680 + combo * 35, 0.07, thing.bad ? 'sawtooth' : 'triangle');
    setThings(prev => prev.filter(item => item.id !== thing.id));
    if (thing.bad) {
      setCombo(0);
      setScore(s => Math.max(0, s - 20));
      setLives(l => Math.max(0, l - 1));
    } else {
      setCombo(c => c + 1);
      setScore(s => s + thing.value + Math.min(combo * 2, 30));
    }
  };

  const restart = () => {
    setThings([]);
    setScore(0);
    setCombo(0);
    setLives(5);
    setEnded(false);
  };

  return (
    <Shell title={title} theme={theme} score={score} lives={lives} time={time} onClose={() => { onScoreSubmit(score); onClose(); }}>
      <div className="absolute inset-x-0 top-20 bottom-0 overflow-hidden">
        <AnimatePresence>
          {things.map(thing => (
            <motion.button
              key={thing.id}
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.8, opacity: 0, rotate: 25 }}
              onPointerDown={() => pop(thing)}
              className={cn(
                'absolute -translate-x-1/2 -translate-y-1/2 rounded-full text-5xl md:text-6xl drop-shadow-2xl active:scale-90',
                thing.bad ? 'grayscale' : ''
              )}
              style={{ left: `${thing.x}%`, top: `${thing.y}%` }}
            >
              {thing.kind}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {combo > 4 && !ended && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute left-1/2 top-24 z-30 -translate-x-1/2 bg-yellow-300 text-pink-900 px-5 py-2 rounded-full font-black shadow-xl">
            Combo {combo}
          </motion.div>
        )}
        {ended && <EndCard score={score} title="Pop Party!" onAgain={restart} onExit={() => { onScoreSubmit(score); onClose(); }} />}
      </AnimatePresence>
    </Shell>
  );
}

export function BalloonPopAdventure(props: GameProps) {
  return <FallingTapGame {...props} title="Balloon Pop" theme="bg-gradient-to-b from-sky-400 via-fuchsia-400 to-pink-500" items={['🎈', '🎈', '🎈', '⭐', '💎']} badItems={['🪨', '⚡']} />;
}

function CatcherGame({
  title,
  theme,
  basket,
  good,
  bad,
  onScoreSubmit,
  onClose
}: GameProps & {
  title: string;
  theme: string;
  basket: string;
  good: string[];
  bad: string[];
}) {
  const [x, setX] = useState(50);
  const [items, setItems] = useState<FallingThing[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(5);
  const [frozen, setFrozen] = useState(0);
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    if (ended) return;
    const timer = setInterval(() => {
      setItems(prev => {
        const next = prev
          .map(item => ({ ...item, y: item.y + item.speed * (frozen > 0 ? 0.35 : 1) }))
          .filter(item => {
            if (item.y > 104) {
              if (!item.bad) setLives(l => Math.max(0, l - 1));
              return false;
            }
            return true;
          });

        if (Math.random() < 0.18 + score / 2600) {
          const isBad = Math.random() < 0.16;
          const special = !isBad && Math.random() < 0.14 ? pick(['freeze', 'bonus', 'combo']) : undefined;
          next.push({
            id: Date.now() + Math.random(),
            x: rand(8, 92),
            y: -8,
            speed: rand(0.8, 1.6) + score / 3500,
            kind: isBad ? pick(bad) : special === 'freeze' ? '❄️' : special === 'bonus' ? '🌟' : pick(good),
            value: special ? 25 : 10,
            bad: isBad,
            special
          });
        }
        return next.slice(-24);
      });
      setFrozen(value => Math.max(0, value - 1));
    }, 65);
    return () => clearInterval(timer);
  }, [bad, ended, frozen, good, score]);

  useEffect(() => {
    setItems(prev => {
      let changed = false;
      const next = prev.filter(item => {
      if (item.y > 78 && item.y < 96 && Math.abs(item.x - x) < 13) {
        changed = true;
        if (item.bad) {
          setLives(l => Math.max(0, l - 1));
          playTone(160, 0.1, 'sawtooth');
        } else {
          if (item.special === 'freeze') setFrozen(24);
          setScore(s => s + item.value);
          playTone(620, 0.06, 'triangle');
        }
        return false;
      }
      return true;
      });
      return changed ? next : prev;
    });
  }, [items, x]);

  useEffect(() => {
    if (lives <= 0) setEnded(true);
  }, [lives]);

  const restart = () => {
    setItems([]);
    setScore(0);
    setLives(5);
    setFrozen(0);
    setEnded(false);
  };

  const move = (clientX: number, target: EventTarget & HTMLDivElement) => {
    const rect = target.getBoundingClientRect();
    setX(clamp(((clientX - rect.left) / rect.width) * 100, 7, 93));
  };

  return (
    <Shell title={title} theme={theme} score={score} lives={lives} onClose={() => { onScoreSubmit(score); onClose(); }}>
      <div
        onPointerMove={(e) => move(e.clientX, e.currentTarget)}
        onPointerDown={(e) => move(e.clientX, e.currentTarget)}
        className="absolute inset-0 pt-20"
      >
        {items.map(item => (
          <motion.div
            key={item.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 text-4xl md:text-5xl drop-shadow-xl"
            style={{ left: `${item.x}%`, top: `${item.y}%` }}
            animate={{ rotate: [0, 8, -8, 0] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          >
            {item.kind}
          </motion.div>
        ))}
        <motion.div className="absolute bottom-6 text-7xl md:text-8xl drop-shadow-2xl" animate={{ left: `${x}%` }} style={{ transform: 'translateX(-50%)' }}>
          {basket}
        </motion.div>
      </div>
      <AnimatePresence>
        {ended && <EndCard score={score} title="Nice Catch!" onAgain={restart} onExit={() => { onScoreSubmit(score); onClose(); }} />}
      </AnimatePresence>
    </Shell>
  );
}

export function CandyCatcher(props: GameProps) {
  return <CatcherGame {...props} title="Candy Catcher" theme="bg-gradient-to-b from-fuchsia-500 via-pink-500 to-amber-400" basket="🧺" good={['🍬', '🍭', '🍫', '🧁']} bad={['💨', '🧊']} />;
}

export function HungryPanda(props: GameProps) {
  return <CatcherGame {...props} title="Hungry Panda" theme="bg-gradient-to-b from-emerald-400 via-lime-300 to-yellow-200" basket="🐼" good={['🎋', '🍎', '🥕', '🍐']} bad={['🌶️', '🪨']} />;
}

function RunnerGame({
  title,
  theme,
  hero,
  ground,
  obstacles,
  treats,
  onScoreSubmit,
  onClose
}: GameProps & {
  title: string;
  theme: string;
  hero: string;
  ground: string;
  obstacles: string[];
  treats: string[];
}) {
  const [playerY, setPlayerY] = useState(0);
  const velocityRef = useRef(0);
  const [things, setThings] = useState<RunnerThing[]>([]);
  const [score, setScore] = useState(0);
  const [ended, setEnded] = useState(false);
  const speedRef = useRef(1.5);

  const jump = () => {
    if (playerY < 4) {
      velocityRef.current = 7.8;
      playTone(560, 0.06, 'triangle');
    }
  };

  useEffect(() => {
    if (ended) return;
    const tick = setInterval(() => {
      velocityRef.current -= 0.45;
      setPlayerY(y => clamp(y + velocityRef.current, 0, 42));
      speedRef.current += 0.002;
      setThings(prev => {
        const next = prev
          .map(item => ({ ...item, x: item.x - speedRef.current }))
          .filter(item => item.x > -14);
        if (Math.random() < 0.045) {
          const treat = Math.random() < 0.35;
          next.push({
            id: Date.now() + Math.random(),
            x: 108,
            y: treat ? rand(35, 62) : 76,
            w: treat ? 8 : 10,
            h: treat ? 8 : 18,
            kind: treat ? 'coin' : 'obstacle',
            icon: treat ? pick(treats) : pick(obstacles)
          });
        }
        return next;
      });
      setScore(s => s + 1);
    }, 32);
    return () => clearInterval(tick);
  }, [ended, obstacles, playerY, treats]);

  useEffect(() => {
    const heroRect = { x: 18, y: 76 - playerY, w: 12, h: 14 };
    setThings(prev => {
      let changed = false;
      const next = prev.filter(item => {
      const hit = heroRect.x < item.x + item.w && heroRect.x + heroRect.w > item.x && heroRect.y < item.y + item.h && heroRect.y + heroRect.h > item.y;
      if (!hit) return true;
      if (item.kind === 'coin') {
        setScore(s => s + 40);
        playTone(760, 0.05, 'sine');
        changed = true;
        return false;
      }
      setEnded(true);
      return true;
      });
      return changed ? next : prev;
    });
  }, [playerY, things]);

  const restart = () => {
    setPlayerY(0);
    velocityRef.current = 0;
    speedRef.current = 1.5;
    setThings([]);
    setScore(0);
    setEnded(false);
  };

  return (
    <Shell title={title} theme={theme} score={score} onClose={() => { onScoreSubmit(score); onClose(); }}>
      <button onPointerDown={jump} className="absolute inset-0 z-10" aria-label={title} />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-white/20 border-t-4 border-white/30">
        <div className="absolute -top-8 inset-x-0 text-5xl whitespace-nowrap opacity-80">{ground.repeat(18)}</div>
      </div>
      <motion.div className="absolute left-[18%] text-7xl md:text-8xl z-20 drop-shadow-2xl" animate={{ bottom: `${88 + playerY * 4}px`, rotate: playerY > 6 ? -8 : 0 }}>
        {hero}
      </motion.div>
      {things.map(item => (
        <motion.div key={item.id} className="absolute z-20 text-5xl md:text-6xl drop-shadow-xl" style={{ left: `${item.x}%`, top: `${item.y}%` }}>
          {item.icon}
        </motion.div>
      ))}
      <AnimatePresence>
        {ended && <EndCard score={score} title="Run Complete!" onAgain={restart} onExit={() => { onScoreSubmit(score); onClose(); }} />}
      </AnimatePresence>
    </Shell>
  );
}

export function TinyCatRunner(props: GameProps) {
  return <RunnerGame {...props} title="Tiny Cat" theme="bg-gradient-to-b from-sky-300 via-orange-200 to-lime-300" hero="🐱" ground="🌼" obstacles={['🧱', '🪵', '🧸']} treats={['🐟', '🪙']} />;
}

export function JumpingFrog(props: GameProps) {
  return <RunnerGame {...props} title="Jumping Frog" theme="bg-gradient-to-b from-cyan-300 via-emerald-300 to-blue-500" hero="🐸" ground="🪷" obstacles={['🌊', '🪵', '🪨']} treats={['🪰', '⭐']} />;
}

export function PenguinIceSlide(props: GameProps) {
  return <RunnerGame {...props} title="Penguin Slide" theme="bg-gradient-to-b from-sky-200 via-blue-300 to-indigo-500" hero="🐧" ground="❄️" obstacles={['🧊', '🕳️', '⛄']} treats={['🐟', '⭐']} />;
}

function FlightGame({
  title,
  theme,
  hero,
  obstacle,
  collectible,
  tapPower,
  gravity,
  onScoreSubmit,
  onClose
}: GameProps & {
  title: string;
  theme: string;
  hero: string;
  obstacle: string;
  collectible: string;
  tapPower: number;
  gravity: number;
}) {
  const [y, setY] = useState(45);
  const velocityRef = useRef(0);
  const [pipes, setPipes] = useState<{ id: number; x: number; gap: number; coinY: number; scored?: boolean }[]>([]);
  const [score, setScore] = useState(0);
  const [ended, setEnded] = useState(false);

  const flap = () => {
    velocityRef.current = -tapPower;
    playTone(640, 0.05, 'triangle');
  };

  useEffect(() => {
    if (ended) return;
    const timer = setInterval(() => {
      velocityRef.current += gravity;
      setY(prev => clamp(prev + velocityRef.current, 6, 92));
      setPipes(prev => {
        const next = prev.map(pipe => ({ ...pipe, x: pipe.x - 1.35 })).filter(pipe => pipe.x > -20);
        if (!next.length || next[next.length - 1].x < 58) next.push({ id: Date.now(), x: 110, gap: rand(30, 66), coinY: rand(26, 74) });
        return next;
      });
    }, 28);
    return () => clearInterval(timer);
  }, [ended, gravity]);

  useEffect(() => {
    if (y >= 91 || y <= 7) setEnded(true);
    setPipes(prev => {
      let changed = false;
      const next = prev.map(pipe => {
      const inX = pipe.x > 23 && pipe.x < 39;
      const safe = y > pipe.gap - 15 && y < pipe.gap + 15;
      if (inX && !safe) setEnded(true);
      if (!pipe.scored && pipe.x < 24) {
        setScore(s => s + 25);
        changed = true;
        return { ...pipe, scored: true };
      }
      if (Math.abs(pipe.x - 30) < 5 && Math.abs(y - pipe.coinY) < 7) {
        setScore(s => s + 15);
        changed = true;
        return { ...pipe, coinY: -999 };
      }
      return pipe;
      });
      return changed ? next : prev;
    });
  }, [pipes, y]);

  const restart = () => {
    setY(45);
    velocityRef.current = 0;
    setPipes([]);
    setScore(0);
    setEnded(false);
  };

  return (
    <Shell title={title} theme={theme} score={score} onClose={() => { onScoreSubmit(score); onClose(); }}>
      <button onPointerDown={flap} className="absolute inset-0 z-10" aria-label={title} />
      <motion.div className="absolute left-[24%] z-20 text-7xl md:text-8xl drop-shadow-2xl" animate={{ top: `${y}%`, rotate: velocityRef.current * 4 }} style={{ transform: 'translateY(-50%)' }}>
        {hero}
      </motion.div>
      {pipes.map(pipe => (
        <React.Fragment key={pipe.id}>
          <div className="absolute z-10 text-6xl md:text-7xl text-center" style={{ left: `${pipe.x}%`, top: 0, transform: 'translateX(-50%)' }}>
            {Array.from({ length: 5 }).map((_, i) => <div key={i}>{obstacle}</div>)}
          </div>
          <div className="absolute z-10 text-6xl md:text-7xl text-center" style={{ left: `${pipe.x}%`, top: `${pipe.gap + 18}%`, transform: 'translateX(-50%)' }}>
            {Array.from({ length: 5 }).map((_, i) => <div key={i}>{obstacle}</div>)}
          </div>
          {pipe.coinY > 0 && <div className="absolute z-20 text-4xl" style={{ left: `${pipe.x + 7}%`, top: `${pipe.coinY}%` }}>{collectible}</div>}
        </React.Fragment>
      ))}
      <AnimatePresence>
        {ended && <EndCard score={score} title="Nice Flight!" onAgain={restart} onExit={() => { onScoreSubmit(score); onClose(); }} />}
      </AnimatePresence>
    </Shell>
  );
}

export function FlappyForest(props: GameProps) {
  return <FlightGame {...props} title="Flappy Forest" theme="bg-gradient-to-b from-sky-300 via-emerald-300 to-lime-500" hero="🐦" obstacle="🌳" collectible="🌟" tapPower={2.35} gravity={0.17} />;
}

export function RocketTapEscape(props: GameProps) {
  return <FlightGame {...props} title="Rocket Tap" theme="bg-gradient-to-b from-indigo-950 via-violet-700 to-cyan-600" hero="🚀" obstacle="🟪" collectible="⭐" tapPower={2.8} gravity={0.2} />;
}

export function FishFeedingFrenzy({ onScoreSubmit, onClose }: GameProps) {
  const [foods, setFoods] = useState<{ id: number; x: number; y: number }[]>([]);
  const [fish, setFish] = useState(() => [
    { id: 1, x: 22, y: 55, size: 1, icon: '🐠', dir: 1 },
    { id: 2, x: 65, y: 42, size: 1, icon: '🐟', dir: -1 }
  ]);
  const [score, setScore] = useState(0);
  const [ended, setEnded] = useState(false);
  const [time] = useCountdown(!ended, 60, () => setEnded(true));

  useEffect(() => {
    if (ended) return;
    const timer = setInterval(() => {
      setFoods(prev => prev.map(food => ({ ...food, y: food.y + 1.1 })).filter(food => food.y < 94));
      setFish(prev => prev.map(item => {
        let x = item.x + item.dir * (0.4 + item.size * 0.04);
        let dir = item.dir;
        if (x < 8 || x > 92) dir *= -1;
        x = clamp(x, 8, 92);
        return { ...item, x, dir };
      }));
    }, 60);
    return () => clearInterval(timer);
  }, [ended]);

  useEffect(() => {
    setFoods(prev => {
      let changed = false;
      const next = prev.filter(food => {
      const eater = fish.find(item => Math.abs(item.x - food.x) < 9 + item.size * 2 && Math.abs(item.y - food.y) < 8 + item.size * 2);
      if (!eater) return true;
      setFish(current => current.map(item => item.id === eater.id ? { ...item, size: Math.min(2.4, item.size + 0.08), icon: item.size > 1.7 ? '🐡' : item.icon } : item));
      setScore(s => s + 12);
      playTone(540, 0.05, 'sine');
      changed = true;
      return false;
      });
      return changed ? next : prev;
    });
  }, [fish, foods]);

  const drop = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setFoods(prev => [...prev, { id: Date.now(), x: ((e.clientX - rect.left) / rect.width) * 100, y: 16 }]);
  };

  const restart = () => {
    setFoods([]);
    setFish([
      { id: 1, x: 22, y: 55, size: 1, icon: '🐠', dir: 1 },
      { id: 2, x: 65, y: 42, size: 1, icon: '🐟', dir: -1 }
    ]);
    setScore(0);
    setEnded(false);
  };

  return (
    <Shell title="Fish Feeding" theme="bg-gradient-to-b from-cyan-300 via-blue-500 to-indigo-700" score={score} time={time} onClose={() => { onScoreSubmit(score); onClose(); }}>
      <div onPointerDown={drop} className="absolute inset-0 pt-20">
        {Array.from({ length: 18 }).map((_, i) => <motion.div key={i} className="absolute text-2xl opacity-40" style={{ left: `${(i * 17) % 100}%`, bottom: `${rand(4, 80)}%` }} animate={{ y: [-10, -40], opacity: [0, 0.5, 0] }} transition={{ repeat: Infinity, duration: rand(3, 6), delay: i * 0.2 }}>○</motion.div>)}
        {foods.map(food => <div key={food.id} className="absolute text-2xl" style={{ left: `${food.x}%`, top: `${food.y}%` }}>🟡</div>)}
        {fish.map(item => <motion.div key={item.id} className="absolute text-6xl md:text-7xl drop-shadow-xl" animate={{ left: `${item.x}%`, top: `${item.y}%`, scale: item.size, rotateY: item.dir < 0 ? 180 : 0 }}>{item.icon}</motion.div>)}
      </div>
      <AnimatePresence>
        {ended && <EndCard score={score} title="Aquarium Happy!" onAgain={restart} onExit={() => { onScoreSubmit(score); onClose(); }} />}
      </AnimatePresence>
    </Shell>
  );
}

export function MemoryMatchAnimals({ onScoreSubmit, onClose }: GameProps) {
  const [deckSeed, setDeckSeed] = useState(0);
  const animals = useMemo(() => ['🐶', '🐱', '🐼', '🐸', '🐵', '🐧', '🦊', '🐰'].flatMap(item => [item, item]).sort(() => Math.random() - 0.5), [deckSeed]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (flipped.length !== 2) return;
    const [a, b] = flipped;
    if (animals[a] === animals[b]) {
      setMatched(prev => [...prev, a, b]);
      setScore(s => s + 30);
      playTone(720, 0.08, 'triangle');
      setTimeout(() => setFlipped([]), 500);
    } else {
      setScore(s => Math.max(0, s - 5));
      setTimeout(() => setFlipped([]), 800);
    }
  }, [animals, flipped]);

  const restart = () => {
    setDeckSeed(seed => seed + 1);
    setFlipped([]);
    setMatched([]);
    setScore(0);
  };
  const done = matched.length === animals.length;

  return (
    <Shell title="Memory Match" theme="bg-gradient-to-b from-yellow-300 via-orange-400 to-rose-500" score={score} onClose={() => { onScoreSubmit(score); onClose(); }}>
      <div className="absolute inset-x-4 top-24 bottom-10 grid grid-cols-4 gap-3 max-w-lg mx-auto">
        {animals.map((animal, index) => {
          const show = flipped.includes(index) || matched.includes(index);
          return (
            <button key={index} onClick={() => flipped.length < 2 && !show && setFlipped(prev => [...prev, index])} className={cn('rounded-2xl border-b-8 text-4xl md:text-6xl font-black shadow-xl transition-all', show ? 'bg-white border-yellow-100' : 'bg-indigo-500 border-indigo-800')}>
              {show ? animal : '★'}
            </button>
          );
        })}
      </div>
      <AnimatePresence>
        {done && <EndCard score={score} title="All Matched!" onAgain={restart} onExit={() => { onScoreSubmit(score); onClose(); }} />}
      </AnimatePresence>
    </Shell>
  );
}

export function MiniCarDodge({ onScoreSubmit, onClose }: GameProps) {
  const [lane, setLane] = useState(1);
  const [items, setItems] = useState<{ id: number; lane: number; y: number; kind: string; bad: boolean }[]>([]);
  const [score, setScore] = useState(0);
  const [fuel, setFuel] = useState(100);
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    if (ended) return;
    const timer = setInterval(() => {
      setFuel(f => Math.max(0, f - 0.35));
      setScore(s => s + 1);
      setItems(prev => {
        const next = prev.map(item => ({ ...item, y: item.y + 1.7 + score / 1800 })).filter(item => item.y < 105);
        if (Math.random() < 0.08) {
          const bonus = Math.random() < 0.28;
          next.push({ id: Date.now(), lane: Math.floor(Math.random() * 3), y: -10, kind: bonus ? pick(['🪙', '⛽']) : pick(['🚗', '🛢️', '🚧']), bad: !bonus });
        }
        return next;
      });
    }, 45);
    return () => clearInterval(timer);
  }, [ended, score]);

  useEffect(() => {
    setItems(prev => {
      let changed = false;
      const next = prev.filter(item => {
      if (item.lane === lane && item.y > 72 && item.y < 91) {
        changed = true;
        if (item.bad) setEnded(true);
        else {
          setScore(s => s + 30);
          setFuel(f => Math.min(100, f + 18));
          playTone(680, 0.05, 'triangle');
        }
        return false;
      }
      return true;
      });
      return changed ? next : prev;
    });
  }, [items, lane]);

  useEffect(() => {
    if (fuel <= 0) setEnded(true);
  }, [fuel]);

  const restart = () => {
    setLane(1);
    setItems([]);
    setScore(0);
    setFuel(100);
    setEnded(false);
  };

  return (
    <Shell title="Mini Car" theme="bg-gradient-to-b from-slate-700 via-slate-600 to-lime-500" score={score} onClose={() => { onScoreSubmit(score); onClose(); }}>
      <div className="absolute left-4 right-4 top-24 h-3 bg-white/20 rounded-full overflow-hidden"><div className="h-full bg-yellow-300" style={{ width: `${fuel}%` }} /></div>
      <div className="absolute inset-x-0 top-32 bottom-0 mx-auto max-w-md bg-slate-700 border-x-8 border-slate-500">
        {[33, 66].map(x => <div key={x} className="absolute top-0 bottom-0 border-l-4 border-dashed border-white/20" style={{ left: `${x}%` }} />)}
        {items.map(item => <div key={item.id} className="absolute text-5xl -translate-x-1/2" style={{ left: `${16.5 + item.lane * 33}%`, top: `${item.y}%` }}>{item.kind}</div>)}
        <div className="absolute bottom-8 text-6xl -translate-x-1/2" style={{ left: `${16.5 + lane * 33}%` }}>🚙</div>
      </div>
      <div className="absolute bottom-5 left-6 right-6 z-20 grid grid-cols-2 gap-4">
        <button onClick={() => setLane(l => Math.max(0, l - 1))} className="py-4 bg-white/20 rounded-2xl text-white font-black text-2xl">←</button>
        <button onClick={() => setLane(l => Math.min(2, l + 1))} className="py-4 bg-white/20 rounded-2xl text-white font-black text-2xl">→</button>
      </div>
      <AnimatePresence>{ended && <EndCard score={score} title="Drive Done!" onAgain={restart} onExit={() => { onScoreSubmit(score); onClose(); }} />}</AnimatePresence>
    </Shell>
  );
}

export function BubbleShooterIsland({ onScoreSubmit, onClose }: GameProps) {
  const colors = ['#f43f5e', '#38bdf8', '#facc15', '#22c55e', '#a855f7'];
  const makeGrid = () => Array.from({ length: 9 }, (_, row) => Array.from({ length: 7 }, () => row < 4 ? pick(colors) : ''));
  const [grid, setGrid] = useState(makeGrid);
  const [current, setCurrent] = useState(pick(colors));
  const [score, setScore] = useState(0);
  const [shots, setShots] = useState(0);
  const [ended, setEnded] = useState(false);

  const shoot = (col: number) => {
    if (ended) return;
    const next = grid.map(row => [...row]);
    let row = next.length - 1;
    while (row >= 0 && next[row][col]) row--;
    if (row < 0) {
      setEnded(true);
      return;
    }
    next[row][col] = current;

    const seen = new Set<string>();
    const stack = [[row, col]];
    const group: [number, number][] = [];
    while (stack.length) {
      const [r, c] = stack.pop()!;
      const key = `${r}-${c}`;
      if (seen.has(key) || next[r]?.[c] !== current) continue;
      seen.add(key);
      group.push([r, c]);
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dr, dc]) => stack.push([r + dr, c + dc]));
    }
    if (group.length >= 3) {
      group.forEach(([r, c]) => { next[r][c] = ''; });
      setScore(s => s + group.length * 20);
      playTone(700, 0.08, 'triangle');
    }
    const nextShots = shots + 1;
    if (nextShots % 5 === 0) {
      next.unshift(Array.from({ length: 7 }, () => pick(colors)));
      if (next[9]?.some(Boolean)) setEnded(true);
      next.pop();
    }
    setShots(nextShots);
    setGrid(next);
    setCurrent(pick(colors));
  };

  const restart = () => {
    setGrid(makeGrid());
    setCurrent(pick(colors));
    setScore(0);
    setShots(0);
    setEnded(false);
  };

  return (
    <Shell title="Bubble Island" theme="bg-gradient-to-b from-sky-300 via-cyan-400 to-emerald-500" score={score} onClose={() => { onScoreSubmit(score); onClose(); }}>
      <div className="absolute inset-x-3 top-24 bottom-28 max-w-lg mx-auto grid gap-1 content-start">
        {grid.map((row, r) => (
          <div key={r} className="grid grid-cols-7 gap-1">
            {row.map((color, c) => <button key={`${r}-${c}`} onClick={() => shoot(c)} className="aspect-square rounded-full border-b-4 border-black/10 shadow-lg" style={{ backgroundColor: color || 'rgba(255,255,255,0.15)' }} />)}
          </div>
        ))}
      </div>
      <button onClick={() => shoot(3)} className="absolute bottom-6 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full border-b-8 border-black/20 shadow-xl" style={{ backgroundColor: current }}>
        <Star className="mx-auto text-white fill-white" size={42} />
      </button>
      <AnimatePresence>{ended && <EndCard score={score} title="Bubble Burst!" onAgain={restart} onExit={() => { onScoreSubmit(score); onClose(); }} />}</AnimatePresence>
    </Shell>
  );
}

export function ToyClawMachine({ onScoreSubmit, onClose }: GameProps) {
  const [clawX, setClawX] = useState(50);
  const [dropping, setDropping] = useState(false);
  const [score, setScore] = useState(0);
  const [ended, setEnded] = useState(false);
  const [prizes, setPrizes] = useState(() => Array.from({ length: 8 }, (_, i) => ({ id: i, x: rand(12, 88), icon: pick(['🧸', '🦄', '🍭', '🚗', '⭐']), value: i === 0 ? 80 : 25 })));
  const [time] = useCountdown(!ended, 50, () => setEnded(true));

  useEffect(() => {
    if (dropping) return;
    const timer = setInterval(() => setClawX(x => 50 + Math.sin(Date.now() / 520) * 38), 30);
    return () => clearInterval(timer);
  }, [dropping]);

  const grab = () => {
    if (dropping) return;
    setDropping(true);
    setTimeout(() => {
      const prize = prizes.find(item => Math.abs(item.x - clawX) < 9);
      if (prize) {
        setScore(s => s + prize.value);
        setPrizes(prev => prev.filter(item => item.id !== prize.id));
        playTone(760, 0.1, 'triangle');
      } else playTone(180, 0.08, 'sawtooth');
      setDropping(false);
    }, 820);
  };

  const restart = () => {
    setScore(0);
    setEnded(false);
    setPrizes(Array.from({ length: 8 }, (_, i) => ({ id: i, x: rand(12, 88), icon: pick(['🧸', '🦄', '🍭', '🚗', '⭐']), value: i === 0 ? 80 : 25 })));
  };

  return (
    <Shell title="Toy Claw" theme="bg-gradient-to-b from-violet-500 via-fuchsia-500 to-yellow-300" score={score} time={time} onClose={() => { onScoreSubmit(score); onClose(); }}>
      <button onPointerDown={grab} className="absolute inset-0 z-10" aria-label="Drop claw" />
      <div className="absolute left-1/2 top-24 -translate-x-1/2 w-[90vw] max-w-md h-[68vh] bg-white/20 rounded-[2.5rem] border-4 border-white/30 shadow-2xl overflow-hidden">
        <motion.div className="absolute top-0 text-6xl z-20" animate={{ left: `${clawX}%`, top: dropping ? '56%' : '2%' }} transition={{ type: 'spring', damping: 14 }}>
          🕹️
        </motion.div>
        {prizes.map(item => <div key={item.id} className="absolute bottom-8 text-6xl -translate-x-1/2" style={{ left: `${item.x}%` }}>{item.icon}</div>)}
      </div>
      {(ended || !prizes.length) && <EndCard score={score} title="Prize Shelf!" onAgain={restart} onExit={() => { onScoreSubmit(score); onClose(); }} />}
    </Shell>
  );
}

export function CuteMonsterCleanup({ onScoreSubmit, onClose }: GameProps) {
  const [items, setItems] = useState(() => Array.from({ length: 18 }, (_, i) => ({ id: i, x: rand(8, 86), y: rand(22, 82), icon: pick(['🧦', '🧸', '📚', '🍌', '🧃', '🧩']) })));
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [ended, setEnded] = useState(false);
  const [time] = useCountdown(!ended && items.length > 0, 60, () => setEnded(true));

  const clean = (id: number) => {
    setItems(prev => prev.filter(item => item.id !== id));
    setScore(s => s + 10 * level);
    playTone(650, 0.05, 'triangle');
  };

  useEffect(() => {
    if (items.length === 0 && level < 3) {
      setTimeout(() => {
        setLevel(l => l + 1);
        setItems(Array.from({ length: 14 + level * 5 }, (_, i) => ({ id: Date.now() + i, x: rand(8, 86), y: rand(22, 82), icon: pick(['🧦', '🧸', '📚', '🍌', '🧃', '🧩', '🫧']) })));
      }, 900);
    }
  }, [items.length, level]);

  const restart = () => {
    setItems(Array.from({ length: 18 }, (_, i) => ({ id: i, x: rand(8, 86), y: rand(22, 82), icon: pick(['🧦', '🧸', '📚', '🍌', '🧃', '🧩']) })));
    setScore(0);
    setLevel(1);
    setEnded(false);
  };

  return (
    <Shell title={`Cleanup ${level}`} theme="bg-gradient-to-b from-teal-300 via-lime-300 to-orange-300" score={score} time={time} onClose={() => { onScoreSubmit(score); onClose(); }}>
      <div className="absolute inset-x-4 top-24 bottom-8 rounded-[2.5rem] bg-white/25 border-4 border-white/30 shadow-2xl">
        <div className="absolute left-5 bottom-4 text-7xl">👾</div>
        {items.map(item => <motion.button key={item.id} onPointerDown={() => clean(item.id)} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute text-5xl drop-shadow-xl active:scale-75" style={{ left: `${item.x}%`, top: `${item.y}%` }}>{item.icon}</motion.button>)}
      </div>
      {(ended || (items.length === 0 && level >= 3)) && <EndCard score={score} title="Room Sparkles!" onAgain={restart} onExit={() => { onScoreSubmit(score); onClose(); }} />}
    </Shell>
  );
}

export function MagicPaintSplash({ onScoreSubmit, onClose }: GameProps) {
  const [targets, setTargets] = useState(() => Array.from({ length: 6 }, (_, i) => ({ id: i, x: rand(12, 82), y: rand(25, 78), fill: 0, color: pick(['#f43f5e', '#38bdf8', '#facc15', '#22c55e', '#a855f7']) })));
  const [score, setScore] = useState(0);
  const [ended, setEnded] = useState(false);
  const [time] = useCountdown(!ended, 50, () => setEnded(true));

  useEffect(() => {
    if (ended) return;
    const timer = setInterval(() => setTargets(prev => prev.map(target => ({ ...target, x: clamp(target.x + Math.sin(Date.now() / 800 + target.id) * 0.45, 8, 88) }))), 60);
    return () => clearInterval(timer);
  }, [ended]);

  const splash = (id: number) => {
    setTargets(prev => prev.map(target => target.id === id ? { ...target, fill: Math.min(100, target.fill + 28) } : target));
    setScore(s => s + 8);
    playTone(520 + Math.random() * 260, 0.06, 'triangle');
  };

  useEffect(() => {
    if (targets.every(target => target.fill >= 100)) setEnded(true);
  }, [targets]);

  const restart = () => {
    setTargets(Array.from({ length: 6 }, (_, i) => ({ id: i, x: rand(12, 82), y: rand(25, 78), fill: 0, color: pick(['#f43f5e', '#38bdf8', '#facc15', '#22c55e', '#a855f7']) })));
    setScore(0);
    setEnded(false);
  };

  return (
    <Shell title="Paint Splash" theme="bg-gradient-to-b from-violet-500 via-rose-400 to-yellow-300" score={score} time={time} onClose={() => { onScoreSubmit(score); onClose(); }}>
      {targets.map(target => (
        <button key={target.id} onPointerDown={() => splash(target.id)} className="absolute z-10 w-24 h-24 md:w-32 md:h-32 rounded-[2rem] border-4 border-white/50 shadow-2xl overflow-hidden active:scale-95" style={{ left: `${target.x}%`, top: `${target.y}%`, transform: 'translate(-50%, -50%)', backgroundColor: 'rgba(255,255,255,.35)' }}>
          <motion.div className="absolute bottom-0 inset-x-0" animate={{ height: `${target.fill}%` }} style={{ backgroundColor: target.color }} />
          <span className="relative z-10 text-4xl">✨</span>
        </button>
      ))}
      <AnimatePresence>{ended && <EndCard score={score + targets.filter(t => t.fill >= 100).length * 40} title="Paint Magic!" onAgain={restart} onExit={() => { onScoreSubmit(score + targets.filter(t => t.fill >= 100).length * 40); onClose(); }} />}</AnimatePresence>
    </Shell>
  );
}

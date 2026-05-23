import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, RefreshCw, X, Star } from 'lucide-react';
import { cn } from '../../lib/utils';

const CANDIES = [
  { id: 'strawberry', color: '#fb7185', shine: '#fecdd3', emoji: '🍓' },
  { id: 'lemon', color: '#facc15', shine: '#fef08a', emoji: '🍋' },
  { id: 'mint', color: '#2dd4bf', shine: '#99f6e4', emoji: '🍬' },
  { id: 'berry', color: '#60a5fa', shine: '#bfdbfe', emoji: '🫐' },
  { id: 'orange', color: '#fb923c', shine: '#fed7aa', emoji: '🍊' },
  { id: 'grape', color: '#a78bfa', shine: '#ddd6fe', emoji: '🍇' }
] as const;

type Difficulty = 'easy' | 'pro' | 'legend';

interface CandyTile {
  id: string;
  type: number;
  row: number;
  col: number;
  matched?: boolean;
  dropDelay?: number;
  spawnOffset?: number;
}

interface Burst {
  id: string;
  row: number;
  col: number;
  color: string;
}

const makeTile = (row: number, col: number, type: number, spawnOffset = 0): CandyTile => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  type,
  row,
  col,
  spawnOffset
});

const randomType = () => Math.floor(Math.random() * CANDIES.length);

const cloneBoard = (board: CandyTile[][]) => board.map(row => row.map(tile => ({ ...tile })));

const getSize = (difficulty: Difficulty) => difficulty === 'easy' ? 6 : difficulty === 'pro' ? 7 : 8;

const buildBoard = (size: number) => {
  const next: CandyTile[][] = [];
  for (let row = 0; row < size; row++) {
    next[row] = [];
    for (let col = 0; col < size; col++) {
      let type = randomType();
      let guard = 0;
      while (
        guard < 20 &&
        ((col >= 2 && next[row][col - 1]?.type === type && next[row][col - 2]?.type === type) ||
          (row >= 2 && next[row - 1][col]?.type === type && next[row - 2][col]?.type === type))
      ) {
        type = randomType();
        guard++;
      }
      next[row][col] = makeTile(row, col, type);
    }
  }
  return next;
};

const findMatches = (board: CandyTile[][]) => {
  const size = board.length;
  const matches = new Map<string, { row: number; col: number }>();

  for (let row = 0; row < size; row++) {
    let runStart = 0;
    for (let col = 1; col <= size; col++) {
      const stillRunning = col < size && board[row][col].type === board[row][runStart].type;
      if (stillRunning) continue;
      if (col - runStart >= 3) {
        for (let c = runStart; c < col; c++) matches.set(`${row}-${c}`, { row, col: c });
      }
      runStart = col;
    }
  }

  for (let col = 0; col < size; col++) {
    let runStart = 0;
    for (let row = 1; row <= size; row++) {
      const stillRunning = row < size && board[row][col].type === board[runStart][col].type;
      if (stillRunning) continue;
      if (row - runStart >= 3) {
        for (let r = runStart; r < row; r++) matches.set(`${r}-${col}`, { row: r, col });
      }
      runStart = row;
    }
  }

  return [...matches.values()];
};

const swapTiles = (board: CandyTile[][], a: { row: number; col: number }, b: { row: number; col: number }) => {
  const next = cloneBoard(board);
  const first = { ...next[a.row][a.col], row: b.row, col: b.col };
  const second = { ...next[b.row][b.col], row: a.row, col: a.col };
  next[a.row][a.col] = second;
  next[b.row][b.col] = first;
  return next;
};

const settleBoard = (board: CandyTile[][], matched: { row: number; col: number }[]) => {
  const size = board.length;
  const matchedKeys = new Set(matched.map(m => `${m.row}-${m.col}`));
  const next: CandyTile[][] = Array.from({ length: size }, () => Array(size));

  for (let col = 0; col < size; col++) {
    const survivors: CandyTile[] = [];
    for (let row = size - 1; row >= 0; row--) {
      if (!matchedKeys.has(`${row}-${col}`)) survivors.push(board[row][col]);
    }

    for (let row = size - 1; row >= 0; row--) {
      const survivor = survivors[size - 1 - row];
      if (survivor) {
        const distance = row - survivor.row;
        next[row][col] = {
          ...survivor,
          row,
          col,
          matched: false,
          spawnOffset: 0,
          dropDelay: Math.max(0, distance) * 0.035 + col * 0.01
        };
      } else {
        const spawnOffset = row + 1;
        next[row][col] = {
          ...makeTile(row, col, randomType(), spawnOffset),
          dropDelay: (size - row) * 0.045 + col * 0.012
        };
      }
    }
  }

  return next;
};

export default function CandyCruise({ onScoreSubmit, onClose }: { onScoreSubmit: (score: number) => void, onClose: () => void }) {
  const [board, setBoard] = useState<CandyTile[][]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [selected, setSelected] = useState<{ row: number; col: number } | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bursts, setBursts] = useState<Burst[]>([]);

  const size = useMemo(() => difficulty ? getSize(difficulty) : 7, [difficulty]);

  const initBoard = useCallback(() => {
    if (!difficulty) return;
    setBoard(buildBoard(getSize(difficulty)));
    setScore(0);
    setCombo(0);
    setSelected(null);
    setBursts([]);
    setIsProcessing(false);
  }, [difficulty]);

  useEffect(() => {
    initBoard();
  }, [initBoard]);

  const processMatches = useCallback(async (startBoard: CandyTile[][]) => {
    setIsProcessing(true);
    let current = cloneBoard(startBoard);
    let cascade = 0;

    while (true) {
      const matches = findMatches(current);
      if (!matches.length) break;

      cascade++;
      const matchedKeys = new Set(matches.map(m => `${m.row}-${m.col}`));
      const marked = current.map(row => row.map(tile => ({
        ...tile,
        matched: matchedKeys.has(`${tile.row}-${tile.col}`)
      })));

      const nextBursts = matches.map(m => {
        const tile = current[m.row][m.col];
        return {
          id: `${tile.id}-${cascade}`,
          row: m.row,
          col: m.col,
          color: CANDIES[tile.type].shine
        };
      });

      setCombo(cascade);
      setBursts(nextBursts);
      setBoard(marked);
      setScore(prev => prev + matches.length * 12 * cascade);

      await new Promise(resolve => setTimeout(resolve, 330));
      current = settleBoard(current, matches);
      setBoard(current);
      setBursts([]);
      await new Promise(resolve => setTimeout(resolve, 520 + Math.min(220, cascade * 70)));
    }

    setCombo(0);
    setIsProcessing(false);
  }, []);

  const handleTileClick = async (row: number, col: number) => {
    if (isProcessing || !board.length) return;

    if (!selected) {
      setSelected({ row, col });
      return;
    }

    if (selected.row === row && selected.col === col) {
      setSelected(null);
      return;
    }

    const distance = Math.abs(selected.row - row) + Math.abs(selected.col - col);
    if (distance !== 1) {
      setSelected({ row, col });
      return;
    }

    const swapped = swapTiles(board, selected, { row, col });
    setSelected(null);
    setIsProcessing(true);
    setBoard(swapped);

    await new Promise(resolve => setTimeout(resolve, 250));
    if (findMatches(swapped).length > 0) {
      await processMatches(swapped);
    } else {
      const reverted = swapTiles(swapped, selected, { row, col });
      setBoard(reverted);
      await new Promise(resolve => setTimeout(resolve, 240));
      setIsProcessing(false);
    }
  };

  if (!difficulty) {
    return (
      <div className="fixed inset-0 bg-pink-900/95 z-[101] flex items-center justify-center p-4">
        <div className="bg-white rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-12 text-center max-w-sm w-full shadow-2xl border-b-[12px] border-pink-100">
          <Star className="text-pink-500 fill-pink-500 mx-auto mb-6 animate-pulse" size={48} />
          <h2 className="text-3xl font-black text-slate-800 mb-8 uppercase tracking-tighter">Candy Cruise</h2>
          <div className="space-y-4">
            {(['easy', 'pro', 'legend'] as const).map(d => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className="w-full py-4 rounded-2xl font-black uppercase text-xl bg-pink-50 text-pink-600 hover:bg-pink-500 hover:text-white transition-all shadow-md active:translate-y-1 active:shadow-none"
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
    <div className="fixed inset-0 bg-[radial-gradient(circle_at_top,#fb7185_0%,#831843_65%)] z-[101] flex flex-col items-center justify-center p-3 md:p-6 overflow-hidden">
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle,_#fff_1px,_transparent_1px)] bg-[size:22px_22px]" />

      <div className="w-full max-w-md flex items-center justify-between mb-4 md:mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="bg-white/15 p-3 rounded-2xl backdrop-blur-md border border-white/20">
            <Trophy className="text-yellow-300" size={24} />
          </div>
          <div>
            <h2 className="text-white/70 font-black text-xs uppercase tracking-widest">Score</h2>
            <p className="text-yellow-300 font-black text-3xl leading-none">{score}</p>
          </div>
        </div>

        <AnimatePresence>
          {combo > 1 && (
            <motion.div
              initial={{ scale: 0, rotate: -12 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 12 }}
              className="px-4 py-2 rounded-full bg-yellow-300 text-pink-900 font-black shadow-lg"
            >
              x{combo}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-2">
          <button onClick={initBoard} className="p-3 bg-white/15 hover:bg-white/25 rounded-xl text-white transition-all border border-white/15">
            <RefreshCw size={22} />
          </button>
          <button onClick={() => { onScoreSubmit(score); onClose(); }} className="p-3 bg-rose-500 hover:bg-rose-600 rounded-xl text-white transition-all shadow-lg">
            <X size={22} />
          </button>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-[min(94vw,520px)] bg-white/12 p-2.5 md:p-4 rounded-[2rem] md:rounded-[2.5rem] backdrop-blur-xl border-4 border-white/15 shadow-2xl">
        <div
          className="grid gap-1.5 md:gap-2"
          style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
        >
          {board.flat().map(tile => {
            const candy = CANDIES[tile.type];
            const isSelected = selected?.row === tile.row && selected?.col === tile.col;
            return (
              <motion.button
                key={tile.id}
                layout
                initial={{ y: tile.spawnOffset ? -38 * tile.spawnOffset : 0, scale: tile.spawnOffset ? 0.7 : 1, opacity: 0 }}
                animate={{
                  y: 0,
                  scale: tile.matched ? [1, 1.18, 0] : 1,
                  opacity: tile.matched ? [1, 1, 0] : 1,
                  rotate: tile.matched ? [0, -8, 8, 0] : 0
                }}
                transition={{
                  layout: {
                    type: 'spring',
                    stiffness: 430,
                    damping: 28,
                    mass: 0.85,
                    delay: tile.dropDelay || 0
                  },
                  scale: { duration: 0.28 },
                  opacity: { duration: 0.24 }
                }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleTileClick(tile.row, tile.col)}
                className={cn(
                  "aspect-square rounded-[1rem] md:rounded-[1.35rem] cursor-pointer border-b-[5px] md:border-b-[7px] border-black/20 shadow-lg relative overflow-hidden touch-manipulation",
                  "focus:outline-none focus:ring-4 focus:ring-white/70",
                  isSelected && "ring-4 ring-white ring-offset-4 ring-offset-pink-700 z-20"
                )}
                style={{ backgroundColor: candy.color }}
              >
                <span className="absolute inset-0 rounded-[inherit] bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.65),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.22),transparent_45%)]" />
                <span className="relative z-10 flex h-full items-center justify-center text-[clamp(1.15rem,7vw,2.35rem)] drop-shadow-md">
                  {candy.emoji}
                </span>
                <span className="absolute bottom-1 right-2 h-2 w-6 rounded-full bg-black/10 blur-[1px]" />
              </motion.button>
            );
          })}
        </div>

        <AnimatePresence>
          {bursts.map(burst => (
            <motion.div
              key={burst.id}
              className="pointer-events-none absolute"
              style={{
                left: `${(burst.col + 0.5) * (100 / size)}%`,
                top: `${(burst.row + 0.5) * (100 / size)}%`
              }}
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 1.9, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.42, ease: 'easeOut' }}
            >
              <div
                className="h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ background: `radial-gradient(circle, ${burst.color}, transparent 68%)` }}
              />
              {[0, 1, 2, 3, 4, 5].map(i => (
                <span
                  key={i}
                  className="absolute left-1/2 top-1/2 h-2 w-2 rounded-full bg-white"
                  style={{ transform: `rotate(${i * 60}deg) translateX(26px)` }}
                />
              ))}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

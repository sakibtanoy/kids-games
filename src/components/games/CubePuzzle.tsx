import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, RefreshCw, Trophy } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function CubePuzzle({ onScoreSubmit, onClose }: { onScoreSubmit: (score: number) => void, onClose: () => void }) {
  const [grid, setGrid] = useState<number[][]>([]);
  const [score, setScore] = useState(0);
  const [difficulty, setDifficulty] = useState<'easy' | 'pro' | 'legend' | null>(null);

  const initGrid = (size: number) => {
    const newGrid = [];
    for (let y = 0; y < size; y++) {
      newGrid[y] = [];
      for (let x = 0; x < size; x++) {
        newGrid[y][x] = Math.floor(Math.random() * 4) + 1;
      }
    }
    setGrid(newGrid);
  };

  useEffect(() => {
    if (difficulty) {
      initGrid(difficulty === 'easy' ? 5 : difficulty === 'pro' ? 7 : 8);
    }
  }, [difficulty]);

  const handleTileClick = (x: number, y: number) => {
    const target = grid[y][x];
    const connected: { x: number, y: number }[] = [];
    
    const find = (cx: number, cy: number) => {
      if (cx < 0 || cy < 0 || cx >= grid[0].length || cy >= grid.length) return;
      if (grid[cy][cx] !== target) return;
      if (connected.find(p => p.x === cx && p.y === cy)) return;
      
      connected.push({ x: cx, y: cy });
      find(cx + 1, cy);
      find(cx - 1, cy);
      find(cx, cy + 1);
      find(cx, cy - 1);
    };

    find(x, y);

    if (connected.length >= 2) {
      const newGrid = grid.map(row => [...row]);
      connected.forEach(p => { newGrid[p.y][p.x] = 0; });
      
      // Apply Gravity
      for (let col = 0; col < newGrid[0].length; col++) {
        let emptyCount = 0;
        for (let row = newGrid.length - 1; row >= 0; row--) {
          if (newGrid[row][col] === 0) {
            emptyCount++;
          } else if (emptyCount > 0) {
            newGrid[row + emptyCount][col] = newGrid[row][col];
            newGrid[row][col] = 0;
          }
        }
        // Refill from top
        for (let row = 0; row < emptyCount; row++) {
          newGrid[row][col] = Math.floor(Math.random() * 4) + 1;
        }
      }

      setGrid(newGrid);
      setScore(s => s + connected.length * 10);
    }
  };

  if (!difficulty) {
    return (
      <div className="fixed inset-0 bg-blue-900/95 z-[101] flex items-center justify-center p-6">
        <div className="bg-white rounded-[3rem] p-12 text-center max-w-sm w-full shadow-2xl border-b-[12px] border-blue-100">
          <div className="grid grid-cols-2 gap-2 w-20 mx-auto mb-6">
             <div className="w-8 h-8 bg-blue-500 rounded-lg" />
             <div className="w-8 h-8 bg-indigo-500 rounded-lg" />
             <div className="w-8 h-8 bg-emerald-500 rounded-lg" />
             <div className="w-8 h-8 bg-rose-500 rounded-lg" />
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-8 uppercase">Cube Puzzle</h2>
          <div className="space-y-4">
            {(['easy', 'pro', 'legend'] as const).map(d => (
              <button 
                key={d}
                onClick={() => setDifficulty(d)}
                className="w-full py-4 rounded-2xl font-black uppercase text-xl bg-blue-50 text-blue-900 hover:bg-blue-500 hover:text-white transition-all shadow-md active:translate-y-1 active:shadow-none"
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const COLORS = ['', 'bg-blue-400', 'bg-indigo-400', 'bg-emerald-400', 'bg-rose-400'];

  return (
    <div className="fixed inset-0 bg-[#e0f2fe] z-[101] flex flex-col items-center justify-center p-4 select-none touch-none">
      <div className="w-full max-w-md flex justify-between items-center mb-12">
        <div className="bg-white rounded-3xl p-4 shadow-xl border-b-4 border-blue-100">
           <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest">Points</p>
           <p className="text-4xl font-black text-blue-600">{score}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => initGrid(grid.length)} className="p-4 bg-white rounded-2xl text-blue-400 shadow-md"><RefreshCw size={24} /></button>
          <button onClick={() => { onScoreSubmit(score); onClose(); }} className="p-4 bg-rose-500 rounded-2xl text-white shadow-lg"><X size={24} /></button>
        </div>
      </div>

      <div 
        className="bg-white/50 backdrop-blur-md p-4 rounded-[2.5rem] border-4 border-white shadow-2xl grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${grid[0]?.length || 1}, 1fr)` }}
      >
        {grid.map((row, y) => row.map((tile, x) => (
          <motion.button
            key={`${x}-${y}`}
            layout
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleTileClick(x, y)}
            className={cn(
              "w-10 h-10 sm:w-12 sm:h-12 rounded-xl transition-all border-b-4 border-black/10 shadow-sm",
              COLORS[tile]
            )}
          />
        )))}
      </div>

      <div className="mt-12 text-blue-400 font-black uppercase text-xs tracking-widest flex items-center gap-2">
         Tap groups of 2 or more cubes!
      </div>
    </div>
  );
}

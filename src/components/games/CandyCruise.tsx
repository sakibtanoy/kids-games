import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, RefreshCw, X, Star } from 'lucide-react';
import { cn } from '../../lib/utils';

const COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#1A535C', '#FF9F1C', '#9264FA'];
const BOARD_SIZE = 7;

interface Tile {
  id: string;
  color: string;
  x: number;
  y: number;
}

export default function CandyCruise({ onScoreSubmit, onClose }: { onScoreSubmit: (score: number) => void, onClose: () => void }) {
  const [board, setBoard] = useState<Tile[][]>([]);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<{ x: number, y: number } | null>(null);
  const [difficulty, setDifficulty] = useState<'easy' | 'pro' | 'legend' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize board
  const initBoard = useCallback(() => {
    if (!difficulty) return;
    const size = difficulty === 'easy' ? 6 : difficulty === 'pro' ? 7 : 8;
    const newBoard: Tile[][] = [];
    for (let y = 0; y < size; y++) {
      newBoard[y] = [];
      for (let x = 0; x < size; x++) {
        newBoard[y][x] = {
          id: Math.random().toString(36).substr(2, 9),
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          x,
          y
        };
      }
    }
    setBoard(newBoard);
    setScore(0);
  }, [difficulty]);

  useEffect(() => {
    initBoard();
  }, [initBoard]);

  const checkMatches = useCallback((currentBoard: Tile[][]) => {
    const matches: { x: number, y: number }[] = [];
    const size = currentBoard.length;

    // Horizontal
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size - 2; x++) {
        if (currentBoard[y][x].color !== 'transparent' &&
            currentBoard[y][x].color === currentBoard[y][x + 1].color && 
            currentBoard[y][x].color === currentBoard[y][x + 2].color) {
          matches.push({ x, y }, { x: x + 1, y }, { x: x + 2, y });
        }
      }
    }

    // Vertical
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size - 2; y++) {
        if (currentBoard[y][x].color !== 'transparent' &&
            currentBoard[y][x].color === currentBoard[y + 1][x].color && 
            currentBoard[y][x].color === currentBoard[y + 2][x].color) {
          matches.push({ x, y }, { x, y: y + 1 }, { x, y: y + 2 });
        }
      }
    }

    return Array.from(new Set(matches.map(m => `${m.x},${m.y}`))).map(s => {
      const [x, y] = s.split(',').map(Number);
      return { x, y };
    });
  }, []);

  const handleTileClick = async (x: number, y: number) => {
    if (isProcessing) return;

    if (!selected) {
      setSelected({ x, y });
    } else {
      const dist = Math.abs(selected.x - x) + Math.abs(selected.y - y);
      if (dist === 1) {
        // Swap
        const newBoard = board.map(row => [...row]);
        const temp = newBoard[selected.y][selected.x].color;
        newBoard[selected.y][selected.x].color = newBoard[y][x].color;
        newBoard[y][x].color = temp;
        setBoard([...newBoard]);
        
        setIsProcessing(true);
        setTimeout(() => {
          const matches = checkMatches(newBoard);
          if (matches.length > 0) {
            processMatches(newBoard);
          } else {
            // Animate back
            const revertBoard = newBoard.map(row => [...row]);
            revertBoard[y][x].color = newBoard[selected.y][selected.x].color;
            revertBoard[selected.y][selected.x].color = newBoard[y][x].color;
            setBoard(revertBoard);
            setIsProcessing(false);
          }
        }, 300);
      }
      setSelected(null);
    }
  };

  const processMatches = async (currentBoard: Tile[][]) => {
    setIsProcessing(true);
    let tempBoard = currentBoard.map(row => [...row]);
    const size = tempBoard.length;

    const findAndRemove = () => {
      const matches = checkMatches(tempBoard);
      if (matches.length === 0) return false;

      matches.forEach(m => {
        tempBoard[m.y][m.x].color = 'transparent';
      });

      // Drop down
      for (let x = 0; x < size; x++) {
        let emptyCount = 0;
        for (let y = size - 1; y >= 0; y--) {
          if (tempBoard[y][x].color === 'transparent') {
            emptyCount++;
          } else if (emptyCount > 0) {
            tempBoard[y + emptyCount][x].color = tempBoard[y][x].color;
            tempBoard[y][x].color = 'transparent';
          }
        }
        // Fill new
        for (let y = 0; y < emptyCount; y++) {
          tempBoard[y][x].color = COLORS[Math.floor(Math.random() * COLORS.length)];
        }
      }

      setBoard([...tempBoard]);
      setScore(prev => prev + matches.length * 10);
      return true;
    };

    while (findAndRemove()) {
      await new Promise(r => setTimeout(r, 400));
    }

    setIsProcessing(false);
  };

  if (!difficulty) {
    return (
      <div className="fixed inset-0 bg-pink-900/95 z-[101] flex items-center justify-center p-6">
        <div className="bg-white rounded-[3rem] p-12 text-center max-w-sm w-full shadow-2xl border-b-[12px] border-pink-100">
          <Star className="text-pink-500 fill-pink-500 mx-auto mb-6 animate-pulse" size={48} />
          <h2 className="text-3xl font-black text-slate-800 mb-8 uppercase tracking-tighter">CANDY CRUISE</h2>
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
    <div className="fixed inset-0 bg-pink-900/90 z-[101] flex flex-col items-center justify-center p-4 backdrop-blur-xl">
      {/* Game Header */}
      <div className="w-full max-w-md flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md">
            <Trophy className="text-yellow-400" size={24} />
          </div>
          <div>
            <h2 className="text-white font-black text-xl">SCORE</h2>
            <p className="text-yellow-400 font-black text-3xl">{score}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button onClick={initBoard} className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all">
            <RefreshCw size={24} />
          </button>
          <button onClick={() => { onScoreSubmit(score); onClose(); }} className="p-3 bg-rose-500 hover:bg-rose-600 rounded-xl text-white transition-all">
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Board */}
      <div className="bg-white/5 p-4 rounded-[2rem] backdrop-blur-xl border-4 border-white/10 shadow-2xl">
        <div 
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${board[0]?.length || 7}, 1fr)` }}
        >
          {board.map((row, y) => row.map((tile, x) => (
            <motion.div
              key={`${x}-${y}-${tile.id}`}
              layout
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleTileClick(x, y)}
              className={cn(
                "w-10 h-10 md:w-14 md:h-14 rounded-xl cursor-pointer border-b-4 border-black/20 shadow-lg relative overflow-hidden",
                selected?.x === x && selected?.y === y && "ring-4 ring-white ring-offset-4 ring-offset-transparent z-10"
              )}
              style={{ backgroundColor: tile.color }}
            >
              {tile.color !== 'transparent' && (
                <>
                  <div className="absolute top-1 left-1 w-2 h-2 bg-white/30 rounded-full" />
                  <div className="absolute top-2 left-2 w-1 h-1 bg-white/20 rounded-full" />
                </>
              )}
            </motion.div>
          )))}
        </div>
      </div>

      <div className="mt-8 text-white/50 font-bold text-center">
        MATCH 3 OF A KIND TO EXPLODE!
      </div>
    </div>
  );
}

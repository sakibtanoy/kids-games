import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Hash, X, Circle, Users } from 'lucide-react';

import { useAuth } from '../AuthProvider';
import { db } from '../../lib/firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { cn } from '../../lib/utils';

type Mark = 'X' | 'O';
type Cell = Mark | null;
type Difficulty = 'easy' | 'pro' | 'legend' | 'local';
type Winner = 'player' | 'bot' | 'player1' | 'player2' | 'draw' | Mark | null;

const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

const CORNERS = [0, 2, 6, 8];
const SIDES = [1, 3, 5, 7];

const randomItem = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];
const availableMoves = (squares: Cell[]) => squares.map((cell, index) => cell ? -1 : index).filter(index => index >= 0);

const getOutcome = (squares: Cell[]) => {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { symbol: squares[a] as Mark, line };
    }
  }
  if (!squares.includes(null)) return { symbol: 'draw' as const, line: null };
  return null;
};

const mapOutcomeToWinner = (symbol: Mark | 'draw', mode: Difficulty, isRoom: boolean): Winner => {
  if (symbol === 'draw') return 'draw';
  if (isRoom) return symbol;
  if (mode === 'local') return symbol === 'X' ? 'player1' : 'player2';
  return symbol === 'X' ? 'player' : 'bot';
};

const findWinningMoves = (squares: Cell[], symbol: Mark) => {
  const moves: number[] = [];
  for (const move of availableMoves(squares)) {
    const next = [...squares];
    next[move] = symbol;
    if (getOutcome(next)?.symbol === symbol) moves.push(move);
  }
  return moves;
};

const findForkMoves = (squares: Cell[], symbol: Mark) => {
  const moves: number[] = [];
  for (const move of availableMoves(squares)) {
    const next = [...squares];
    next[move] = symbol;
    if (findWinningMoves(next, symbol).length >= 2) moves.push(move);
  }
  return moves;
};

const lineHeuristic = (squares: Cell[]) => {
  let score = 0;
  for (const line of WIN_LINES) {
    const cells = line.map(i => squares[i]);
    const botCount = cells.filter(cell => cell === 'O').length;
    const playerCount = cells.filter(cell => cell === 'X').length;
    if (botCount && playerCount) continue;
    if (botCount === 2) score += 5;
    if (botCount === 1) score += 1;
    if (playerCount === 2) score -= 6;
    if (playerCount === 1) score -= 1;
  }
  if (squares[4] === 'O') score += 3;
  if (squares[4] === 'X') score -= 3;
  return score;
};

const minimax = (squares: Cell[], depth: number, isBotTurn: boolean, maxDepth: number): number => {
  const outcome = getOutcome(squares);
  if (outcome) {
    if (outcome.symbol === 'O') return 100 - depth;
    if (outcome.symbol === 'X') return depth - 100;
    return 0;
  }

  if (depth >= maxDepth) return lineHeuristic(squares);

  const symbol: Mark = isBotTurn ? 'O' : 'X';
  const scores = availableMoves(squares).map(move => {
    squares[move] = symbol;
    const score = minimax(squares, depth + 1, !isBotTurn, maxDepth);
    squares[move] = null;
    return score;
  });

  return isBotTurn ? Math.max(...scores) : Math.min(...scores);
};

const rankedMoves = (squares: Cell[], maxDepth: number) => {
  return availableMoves(squares)
    .map(move => {
      const next = [...squares];
      next[move] = 'O';
      return { move, score: minimax(next, 0, false, maxDepth) };
    })
    .sort((a, b) => b.score - a.score);
};

const chooseBotMove = (squares: Cell[], difficulty: Exclude<Difficulty, 'local'>) => {
  const empty = availableMoves(squares);
  if (!empty.length) return -1;

  const wins = findWinningMoves(squares, 'O');
  const blocks = findWinningMoves(squares, 'X');
  const botForks = findForkMoves(squares, 'O');
  const playerForks = findForkMoves(squares, 'X');
  const openCorners = CORNERS.filter(i => !squares[i]);
  const openSides = SIDES.filter(i => !squares[i]);

  if (difficulty === 'easy') {
    if (wins.length && Math.random() < 0.65) return randomItem(wins);
    if (blocks.length && Math.random() < 0.45) return randomItem(blocks);
    const friendlyPool = [...openCorners, ...openSides, ...empty];
    return randomItem(friendlyPool);
  }

  if (wins.length) return randomItem(wins);
  if (blocks.length) return randomItem(blocks);

  if (difficulty === 'pro') {
    const roll = Math.random();
    if (botForks.length && roll < 0.35) return randomItem(botForks);
    if (playerForks.length && roll < 0.7) return randomItem(playerForks);
    if (!squares[4] && roll < 0.82) return 4;
    if (roll < 0.92 && openCorners.length) return randomItem(openCorners);

    const ranked = rankedMoves(squares, 4);
    const best = ranked[0].score;
    return randomItem(ranked.filter(item => item.score >= best - 8).slice(0, 3)).move;
  }

  if (botForks.length && Math.random() < 0.4) return randomItem(botForks);
  if (playerForks.length) return randomItem(playerForks);

  const ranked = rankedMoves(squares, 9);
  const best = ranked[0].score;
  const elite = ranked.filter(item => item.score === best);
  const strong = ranked.filter(item => item.score >= best - 2);
  const personality = Math.random();

  if (personality < 0.68) return randomItem(elite).move;
  if (personality < 0.88 && strong.length) return randomItem(strong).move;
  if (!squares[4]) return 4;
  if (openCorners.length) return randomItem(openCorners);
  return ranked[0].move;
};

export default function TicTacToe({ onScoreSubmit, onClose, roomId }: { onScoreSubmit: (score: number) => void, onClose: () => void, roomId?: string | null }) {
  const { user } = useAuth();
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(roomId ? 'legend' : null);
  const [winner, setWinner] = useState<Winner>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [localTurn, setLocalTurn] = useState<Mark>('X');
  const [remotePlayerSymbol, setRemotePlayerSymbol] = useState<Mark | null>(null);
  const [currentTurnStr, setCurrentTurnStr] = useState<Mark>('X');

  const aiMood = useMemo(() => randomItem(['tricky', 'patient', 'bold', 'mirror']), [difficulty]);

  useEffect(() => {
    if (!roomId) return;
    const unsub = onSnapshot(doc(db, 'rooms', roomId), (snap) => {
      if (!snap.exists()) return;

      const data = snap.data();
      const isHost = data.host === user?.uid;
      setRemotePlayerSymbol(isHost ? 'X' : 'O');

      if (data.tictactoe) {
        const { tBoard, turn, tWinner, tLine } = data.tictactoe;
        if (tBoard) setBoard(tBoard);
        if (turn) setCurrentTurnStr(turn);
        setWinner(tWinner || null);
        setWinningLine(tLine || null);
      } else {
        setBoard(Array(9).fill(null));
        setCurrentTurnStr('X');
        setWinner(null);
        setWinningLine(null);
      }
    }, (err) => {
      console.error('TicTacToe Firestore Error:', err);
    });

    return unsub;
  }, [roomId, user?.uid]);

  const applyOutcome = (squares: Cell[], mode: Difficulty, isRoom = false) => {
    const outcome = getOutcome(squares);
    if (!outcome) return false;
    if (outcome.line) setWinningLine(outcome.line);
    const mapped = mapOutcomeToWinner(outcome.symbol, mode, isRoom);
    setTimeout(() => setWinner(mapped), outcome.line ? 650 : 200);
    return true;
  };

  const botMove = () => {
    if (!difficulty || difficulty === 'local') return;
    const current = [...board];
    const nextMove = chooseBotMove(current, difficulty);
    if (nextMove === -1) return;

    const newBoard = [...current];
    newBoard[nextMove] = 'O';
    setBoard(newBoard);
    if (!applyOutcome(newBoard, difficulty)) {
      setIsPlayerTurn(true);
    }
  };

  useEffect(() => {
    if (!roomId && difficulty && difficulty !== 'local' && !isPlayerTurn && !winner) {
      const delay = aiMood === 'bold' ? 420 : aiMood === 'patient' ? 760 : 560;
      const timer = setTimeout(botMove, delay);
      return () => clearTimeout(timer);
    }
  }, [roomId, isPlayerTurn, winner, board, difficulty, aiMood]);

  const handleCellClick = async (index: number) => {
    if (!difficulty || winner || board[index]) return;

    if (roomId) {
      if (!remotePlayerSymbol || currentTurnStr !== remotePlayerSymbol) return;
      const newBoard = [...board];
      newBoard[index] = remotePlayerSymbol;
      setBoard(newBoard);

      const outcome = getOutcome(newBoard);
      if (outcome?.line) setWinningLine(outcome.line);
      if (outcome) setWinner(outcome.symbol);

      const nextTurnStr = currentTurnStr === 'X' ? 'O' : 'X';
      setCurrentTurnStr(nextTurnStr);

      try {
        await updateDoc(doc(db, 'rooms', roomId), {
          tictactoe: {
            tBoard: newBoard,
            turn: nextTurnStr,
            tWinner: outcome?.symbol || null,
            tLine: outcome?.line || null
          }
        });
      } catch (err) {
        console.error('Failed to update TicTacToe room:', err);
      }
      return;
    }

    if (difficulty === 'local') {
      const newBoard = [...board];
      newBoard[index] = localTurn;
      setBoard(newBoard);
      if (!applyOutcome(newBoard, difficulty)) {
        setLocalTurn(localTurn === 'X' ? 'O' : 'X');
      }
      return;
    }

    if (!isPlayerTurn) return;
    const newBoard = [...board];
    newBoard[index] = 'X';
    setBoard(newBoard);
    if (!applyOutcome(newBoard, difficulty)) {
      setIsPlayerTurn(false);
    }
  };

  const handleRestart = () => {
    setBoard(Array(9).fill(null));
    setWinner(null);
    setWinningLine(null);
    setIsPlayerTurn(true);
    setLocalTurn('X');
    setHasSubmitted(false);
    if (roomId) onClose();
  };

  const handleEnd = () => {
    if (!hasSubmitted && winner === 'player') {
      const pts = difficulty === 'legend' ? 100 : difficulty === 'pro' ? 60 : 25;
      onScoreSubmit(pts);
      setHasSubmitted(true);
    }
    onClose();
  };

  if (!difficulty) {
    return (
      <div className="fixed inset-0 bg-sky-900/95 z-[101] flex items-center justify-center p-4">
        <div className="bg-white rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-12 text-center max-w-sm w-full shadow-2xl border-b-[12px] border-sky-100">
          <Hash size={64} className="text-sky-500 mx-auto mb-6" />
          <h2 className="text-3xl font-black text-slate-800 mb-8 uppercase tracking-tighter">Tic Tac Toe</h2>
          <div className="grid gap-3">
            {(['easy', 'pro', 'legend'] as const).map(d => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className="w-full py-4 rounded-2xl font-black uppercase text-xl bg-sky-50 text-sky-900 hover:bg-sky-500 hover:text-white transition-all shadow-md active:translate-y-1 active:shadow-none"
              >
                {d}
              </button>
            ))}
            <div className="h-px bg-slate-100 my-2" />
            <button
              onClick={() => setDifficulty('local')}
              className="w-full py-4 rounded-2xl font-black uppercase text-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-lg active:translate-y-1 active:shadow-none flex items-center justify-center gap-3"
            >
              <Users size={24} /> 2 Players Local
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statusText = roomId
    ? winner
      ? winner === 'draw' ? 'Draw!' : winner === remotePlayerSymbol ? 'You won!' : 'They won!'
      : currentTurnStr === remotePlayerSymbol ? 'Your turn' : "Friend's turn"
    : difficulty === 'local'
      ? winner
        ? winner === 'draw' ? 'Draw!' : winner === 'player1' ? 'Player 1 wins!' : 'Player 2 wins!'
        : `Player ${localTurn === 'X' ? '1' : '2'}`
      : winner
        ? winner === 'player' ? 'You won!' : winner === 'bot' ? 'Bot won!' : 'Draw!'
        : isPlayerTurn ? 'Your turn' : "Bot's turn";

  return (
    <div className="fixed inset-0 bg-[radial-gradient(circle_at_top,#38bdf8,#0c4a6e_70%)] z-[100] flex flex-col items-center justify-center p-4 md:p-6 overflow-hidden">
      <div className="absolute top-4 right-4 md:top-8 md:right-8 z-20">
        <button onClick={handleEnd} className="p-3 md:p-4 bg-white/15 rounded-2xl text-white backdrop-blur-md border border-white/15">
          <X size={24} />
        </button>
      </div>

      <div className="mb-6 md:mb-10 text-center">
        <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight uppercase mb-2">Tic Tac Toe</h2>
        <p className="text-sky-200 font-black tracking-widest uppercase text-xs md:text-sm">{statusText}</p>
      </div>

      <div className="bg-white/12 p-3 sm:p-5 rounded-[2rem] md:rounded-[2.5rem] backdrop-blur-xl border-4 border-white/20 shadow-2xl">
        <div className="grid grid-cols-3 gap-2 md:gap-3">
          {board.map((cell, i) => (
            <button
              key={i}
              onClick={() => handleCellClick(i)}
              disabled={roomId ? (currentTurnStr !== remotePlayerSymbol || !!cell || !!winner) : (difficulty !== 'local' && (!isPlayerTurn || !!cell || !!winner))}
              className={cn(
                "w-[26vw] h-[26vw] max-w-28 max-h-28 md:w-32 md:h-32 rounded-2xl flex items-center justify-center transition-all duration-300 border-b-4 border-black/10",
                winningLine?.includes(i) ? "bg-emerald-400 scale-105 shadow-[0_0_28px_rgba(74,222,128,0.55)]" : "bg-white/20 hover:bg-white/30 disabled:hover:bg-white/20"
              )}
            >
              <AnimatePresence>
                {cell === 'X' && (
                  <motion.div initial={{ scale: 0, rotate: -35 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}>
                    <X className="text-white w-12 h-12 md:w-16 md:h-16 drop-shadow-lg" strokeWidth={4} />
                  </motion.div>
                )}
                {cell === 'O' && (
                  <motion.div initial={{ scale: 0, rotate: 35 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}>
                    <Circle className="text-yellow-300 w-11 h-11 md:w-14 md:h-14 drop-shadow-lg" strokeWidth={5} />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {winner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute z-50 bg-white p-8 md:p-12 rounded-[2.5rem] md:rounded-[3rem] text-center max-w-sm w-[calc(100%-2rem)] border-b-[12px] border-sky-100 shadow-2xl"
          >
            <h2 className="text-4xl md:text-5xl font-black text-slate-800 mb-4 tracking-tighter uppercase">
              {roomId
                ? winner === 'draw' ? 'Draw!' : winner === remotePlayerSymbol ? 'You Win!' : 'They Win!'
                : winner === 'player' ? 'You Win!' : winner === 'bot' ? 'Nice Try!' : winner === 'draw' ? 'Draw!' : winner === 'player1' ? 'P1 Wins!' : 'P2 Wins!'}
            </h2>
            <div className="grid gap-3 mt-4">
              <button
                onClick={handleRestart}
                className="w-full py-5 bg-sky-500 text-white font-black text-xl rounded-2xl shadow-[0_8px_0_0_#0ea5e9] hover:bg-sky-400 active:translate-y-2 active:shadow-none transition-all uppercase"
              >
                Play Again
              </button>
              <button
                onClick={handleEnd}
                className="w-full py-4 bg-slate-100 text-slate-400 font-black text-lg rounded-2xl hover:bg-slate-200 transition-all uppercase"
              >
                Exit Game
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Hash, X, Circle, Users } from 'lucide-react';

import { useAuth } from '../AuthProvider';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { cn } from '../../lib/utils';


export default function TicTacToe({ onScoreSubmit, onClose, roomId }: { onScoreSubmit: (score: number) => void, onClose: () => void, roomId?: string | null }) {
  const { user } = useAuth();
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState<boolean>(true);
  const [difficulty, setDifficulty] = useState<'easy' | 'pro' | 'legend' | 'local' | null>(roomId ? 'legend' : null);
  const [winner, setWinner] = useState<'player' | 'bot' | 'player1' | 'player2' | 'draw' | null>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [localTurn, setLocalTurn] = useState<'X' | 'O'>('X');
  
  // Realtime state
  const [remotePlayerSymbol, setRemotePlayerSymbol] = useState<'X' | 'O' | null>(null);
  const [currentTurnStr, setCurrentTurnStr] = useState<'X'|'O'>('X');

  useEffect(() => {
    if (!roomId) return;
    const unsub = onSnapshot(doc(db, 'rooms', roomId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.tictactoe) {
          const { tBoard, turn, tWinner } = data.tictactoe;
          if (tBoard) setBoard(tBoard);
          if (turn) setCurrentTurnStr(turn);
          if (tWinner) setWinner(tWinner);
        } else {
          // Initialize online matching
          const isHost = data.host === user?.uid;
          setRemotePlayerSymbol(isHost ? 'X' : 'O');
          setCurrentTurnStr('X');
        }
      }
    }, (err) => {
      console.error("TicTacToe Firestore Error:", err);
    });

    return unsub;
  }, [roomId, user?.uid]);

  const checkWinner = (squares: (string | null)[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        let winType: 'player' | 'bot' | 'player1' | 'player2' | 'draw' = 'draw';
        if (difficulty === 'local') winType = squares[a] === 'X' ? 'player1' : 'player2';
        else winType = squares[a] === 'X' ? 'player' : 'bot';
        return { type: winType, line: [a, b, c] };
      }
    }
    if (!squares.includes(null)) return { type: 'draw' as const, line: null };
    return null;
  };

  const getBestMove = (squares: (string | null)[], depth = 0, isMaximizing = true): number => {
    const result = checkWinner(squares);
    if (!result) return 0;
    if (result.type === 'bot') return 10 - depth;
    if (result.type === 'player') return depth - 10;
    if (result.type === 'draw') return 0;
    
    if (depth > (difficulty === 'pro' ? 2 : difficulty === 'legend' ? 10 : 0)) {
      return 0; // limit depth for lower difficulties
    }

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (!squares[i]) {
          squares[i] = 'O';
          let score = getBestMove(squares, depth + 1, false);
          squares[i] = null;
          bestScore = Math.max(score, bestScore);
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < 9; i++) {
        if (!squares[i]) {
          squares[i] = 'X';
          let score = getBestMove(squares, depth + 1, true);
          squares[i] = null;
          bestScore = Math.min(score, bestScore);
        }
      }
      return bestScore;
    }
  };

  const botMove = () => {
    let nextMove = -1;
    const isRandomMove = 
      (difficulty === 'easy' && Math.random() < 0.5) ||
      (difficulty === 'pro' && Math.random() < 0.25) ||
      (difficulty === 'legend' && Math.random() < 0.05);

    if (isRandomMove) {
      const emptySlots = board.map((v, i) => v === null ? i : null).filter(v => v !== null) as number[];
      nextMove = emptySlots[Math.floor(Math.random() * emptySlots.length)];
    } else {
      let bestScore = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (!board[i]) {
          board[i] = 'O';
          let score = getBestMove(board, 0, false);
          board[i] = null;
          if (score > bestScore) {
            bestScore = score;
            nextMove = i;
          }
        }
      }
      if (nextMove === -1) {
        const emptySlots = board.map((v, i) => v === null ? i : null).filter(v => v !== null) as number[];
        nextMove = emptySlots[Math.floor(Math.random() * emptySlots.length)];
      }
    }

    if (nextMove !== -1) {
      const newBoard = [...board];
      newBoard[nextMove] = 'O';
      setBoard(newBoard);
      const win = checkWinner(newBoard);
      if (win) {
        if (win.line) setWinningLine(win.line);
        setTimeout(() => {
          setWinner(win.type as any);
        }, 1000);
      } else {
        setIsPlayerTurn(true);
      }
    }
  };

  useEffect(() => {
    if (!roomId && !isPlayerTurn && !winner) {
      const timer = setTimeout(botMove, 600);
      return () => clearTimeout(timer);
    }
  }, [roomId, isPlayerTurn, winner, board]);

  const handleCellClick = async (index: number) => {
    if (winner || board[index]) return;
    
    if (roomId) {
      if (currentTurnStr !== remotePlayerSymbol) return; // not my turn
      const newBoard = [...board];
      newBoard[index] = remotePlayerSymbol;
      setBoard(newBoard);
      const winStatus = checkWinner(newBoard);
      let nextWinner = null;
      if (winStatus) {
        nextWinner = winStatus.type === 'draw' ? 'draw' : (winStatus.type === 'player' ? 'X' : 'O');
        setWinner(winStatus.type as any);
      }
      
      const nextTurnStr = currentTurnStr === 'X' ? 'O' : 'X';
      setCurrentTurnStr(nextTurnStr);
      
      try {
        await updateDoc(doc(db, 'rooms', roomId), {
          tictactoe: {
             tBoard: newBoard,
             turn: nextTurnStr,
             tWinner: nextWinner
          }
        });
      } catch (err) {
        console.error("Failed to update TicTacToe room:", err);
      }
      return;

    }

    if (difficulty === 'local') {
      const newBoard = [...board];
      newBoard[index] = localTurn;
      setBoard(newBoard);
      const win = checkWinner(newBoard);
      if (win) {
        if (win.line) setWinningLine(win.line);
        setTimeout(() => {
          setWinner(win.type as any);
        }, 1000);
      } else {
        setLocalTurn(localTurn === 'X' ? 'O' : 'X');
      }
      return;
    }

    if (!isPlayerTurn) return;
    const newBoard = [...board];
    newBoard[index] = 'X';
    setBoard(newBoard);
    const win = checkWinner(newBoard);
    if (win) {
      if (win.line) setWinningLine(win.line);
      setTimeout(() => {
        setWinner(win.type as any);
      }, 1000);
    } else {
      setIsPlayerTurn(false);
    }
  };

  const handleRestart = () => {
    setBoard(Array(9).fill(null));
    setWinner(null);
    setWinningLine(null);
    setIsPlayerTurn(true);
    setLocalTurn('X');
    if (roomId) {
      onClose();
    }
  };

  const handleEnd = () => {
    if (winner === 'player') {
      const pts = difficulty === 'legend' ? 100 : difficulty === 'pro' ? 50 : 20;
      onScoreSubmit(pts);
    }
    onClose();
  };

  if (!difficulty) {
    return (
      <div className="fixed inset-0 bg-sky-900/95 z-[101] flex items-center justify-center p-6">
        <div className="bg-white rounded-[3rem] p-12 text-center max-w-sm w-full shadow-2xl border-b-[12px] border-sky-100">
          <Hash size={64} className="text-sky-500 mx-auto mb-6" />
          <h2 className="text-3xl font-black text-slate-800 mb-8 uppercase tracking-tighter">TIC TAC TOE</h2>
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

  return (
    <div className="fixed inset-0 bg-sky-900/95 z-[100] flex flex-col items-center justify-center p-6">
      <div className="absolute top-8 left-8 right-8 flex justify-end z-20">
        <button onClick={onClose} className="p-4 bg-white/10 rounded-2xl text-white backdrop-blur-md">
          <X size={24} />
        </button>
      </div>

      <div className="mb-12 text-center">
        <h2 className="text-4xl font-black text-white tracking-widest uppercase mb-2">Tic Tac Toe</h2>
        <p className="text-sky-300 font-bold tracking-widest uppercase">
          {roomId ? (
            winner ? (winner === 'draw' ? 'DRAW!' : (winner === 'player' ? 'YOU WON!' : 'THEY WON!')) 
            : (currentTurnStr === remotePlayerSymbol ? 'Your Turn' : "Opponent's Turn")
          ) : difficulty === 'local' ? (
            winner ? (winner === 'draw' ? 'DRAW!' : (winner === 'player1' ? 'PLAYER 1 WINS!' : 'PLAYER 2 WINS!'))
            : `Player ${localTurn === 'X' ? '1' : '2'}'s Turn`
          ) : (
            winner ? (winner === 'player' ? 'YOU WON!' : (winner === 'bot' ? 'BOT WON!' : 'DRAW!')) 
            : (isPlayerTurn ? 'Your Turn' : "Bot's Turn")
          )}
        </p>
      </div>

      <div className="bg-white/10 p-3 sm:p-6 rounded-[2.5rem] md:rounded-[3rem] backdrop-blur-xl border-4 border-white/20 shadow-2xl">
        <div className="grid grid-cols-3 gap-2 md:gap-3">
          {board.map((cell, i) => (
            <button
              key={i}
              onClick={() => handleCellClick(i)}
              disabled={roomId ? (currentTurnStr !== remotePlayerSymbol || !!cell || !!winner) : (!isPlayerTurn || !!cell || !!winner)}
              className={cn(
                "w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-2xl flex items-center justify-center transition-all duration-500",
                winningLine?.includes(i) ? "bg-emerald-500 scale-105 shadow-[0_0_20px_rgba(16,185,129,0.5)]" : "bg-white/20 hover:bg-white/30 disabled:hover:bg-white/20"
              )}
            >
              <AnimatePresence>
                {cell === 'X' && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    <X className="text-white w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16" strokeWidth={3} />
                  </motion.div>
                )}
                {cell === 'O' && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    <Circle className="text-sky-300 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14" strokeWidth={4} />
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
            className="absolute z-50 bg-white p-12 rounded-[3rem] text-center max-w-sm w-full border-b-[12px] border-sky-100 shadow-2xl"
          >
            <h2 className="text-5xl font-black text-slate-800 mb-4 tracking-tighter uppercase">
              {roomId ? (
                 winner === 'draw' ? 'DRAW!' : winner === remotePlayerSymbol ? 'YOU WIN!' : 'THEY WIN!'
              ) : (
                 winner === 'player' ? 'YOU WIN!' : winner === 'bot' ? 'YOU LOSE' : 'DRAW!'
              )}
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

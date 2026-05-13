import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Zap, Heart, Star, X, Trophy } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function MathQuest({ onScoreSubmit, onClose }: { onScoreSubmit: (score: number) => void, onClose: () => void }) {
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [problem, setProblem] = useState({ a: 0, b: 0, op: '+', answer: 0, options: [0] });
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [difficulty, setDifficulty] = useState<'easy' | 'pro' | 'legend' | null>(null);

  const generateProblem = (currentLevel: number, currentDifficulty: 'easy' | 'pro' | 'legend' | null) => {
    if (!currentDifficulty) return;
    
    let ops = ['+', '-'];
    if (currentDifficulty !== 'easy') ops.push('*');
    if (currentDifficulty === 'legend') ops.push('/');

    const op = ops[Math.floor(Math.random() * ops.length)];
    let a = 0, b = 0;
    
    if (currentDifficulty === 'easy') {
       if (op === '+' || op === '-') {
         a = Math.floor(Math.random() * 20) + 1;
         b = Math.floor(Math.random() * 20) + 1;
       } else {
         a = Math.floor(Math.random() * 5) + 1;
         b = Math.floor(Math.random() * 5) + 1;
       }
    } else if (currentDifficulty === 'pro') {
       if (op === '+' || op === '-') {
         a = Math.floor(Math.random() * 999) + 1;
         b = Math.floor(Math.random() * 999) + 1;
       } else {
         a = Math.floor(Math.random() * 20) + 1;
         b = Math.floor(Math.random() * 20) + 1;
       }
    } else { // legend
       if (op === '+' || op === '-') {
         a = Math.floor(Math.random() * 9999) + 1000;
         b = Math.floor(Math.random() * 9999) + 1000;
       } else if (op === '*') {
         a = Math.floor(Math.random() * 99) + 10;
         b = Math.floor(Math.random() * 99) + 10;
       }
    }

    if (op === '-' && a < b) [a, b] = [b, a];
    
    if (op === '/') {
      if (currentDifficulty === 'easy') {
        b = Math.floor(Math.random() * 5) + 1;
        a = b * (Math.floor(Math.random() * 5) + 1);
      } else if (currentDifficulty === 'pro') {
        b = Math.floor(Math.random() * 20) + 1;
        a = b * (Math.floor(Math.random() * 20) + 1);
      } else {
        b = Math.floor(Math.random() * 99) + 2;
        a = b * (Math.floor(Math.random() * 50) + 5);
      }
    }
    
    const ans = op === '+' ? a + b : op === '-' ? a - b : op === '*' ? a * b : a / b;
    const options = new Set<number>([ans]);
    
    const offsetRange = currentDifficulty === 'legend' ? 1000 : currentDifficulty === 'pro' ? 100 : 10;
    
    while (options.size < 4) {
      let wrongAns = ans + (Math.floor(Math.random() * offsetRange) - offsetRange / 2);
      if (wrongAns === ans) wrongAns += 1;
      options.add(wrongAns);
    }
    
    setProblem({
      a, b, op, answer: ans,
      options: Array.from(options).sort(() => Math.random() - 0.5)
    });
  };

  useEffect(() => {
    if (difficulty) {
      generateProblem(level, difficulty);
    }
  }, [difficulty]);

  const handleAnswer = (choice: number) => {
    if (feedback) return;

    if (choice === problem.answer) {
      setFeedback('correct');
      setScore(s => s + 100 * level);
      setTimeout(() => {
        setFeedback(null);
        setLevel(l => l + 1);
        generateProblem(level + 1, difficulty);
      }, 1000);
    } else {
      setFeedback('wrong');
      setLives(l => l - 1);
      setTimeout(() => {
        setFeedback(null);
        if (lives <= 1) {
          onScoreSubmit(score);
          onClose();
        } else {
          generateProblem(level, difficulty);
        }
      }, 1000);
    }
  };

  if (!difficulty) {
    return (
      <div className="fixed inset-0 bg-emerald-900/95 z-[101] flex items-center justify-center p-6">
        <div className="bg-white rounded-[3rem] p-12 text-center max-w-sm w-full shadow-2xl border-b-[12px] border-emerald-100">
          <Zap size={64} className="text-emerald-500 mx-auto mb-6" />
          <h2 className="text-3xl font-black text-slate-800 mb-8 uppercase tracking-tighter">MATH QUEST</h2>
          <div className="space-y-4">
            {(['easy', 'pro', 'legend'] as const).map(d => (
              <button 
                key={d}
                onClick={() => setDifficulty(d)}
                className="w-full py-4 rounded-2xl font-black uppercase text-xl bg-emerald-50 text-emerald-900 hover:bg-emerald-500 hover:text-white transition-all shadow-md active:translate-y-1 active:shadow-none"
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
    <div className="fixed inset-0 bg-emerald-900/95 z-[100] flex flex-col items-center justify-center p-6 overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ y: -100, opacity: 0 }}
            animate={{ 
              y: [null, 1000], 
              opacity: [0, 0.1, 0],
              rotate: [0, 360]
            }}
            transition={{ 
              duration: Math.random() * 5 + 5, 
              repeat: Infinity, 
              delay: Math.random() * 5 
            }}
            className="absolute text-emerald-400 font-black text-4xl"
            style={{ left: `${Math.random() * 100}%` }}
          >
            {['1', '+', '7', '=', '?', '×', '4', '/'][Math.floor(Math.random() * 8)]}
          </motion.div>
        ))}
      </div>

      {/* Header */}
      <div className="w-full max-w-xl flex items-center justify-between mb-12 relative z-10">
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Heart 
              key={i} 
              className={cn("transition-all duration-500", i < lives ? "text-rose-500 fill-rose-500 scale-110" : "text-white/20")} 
              size={32} 
            />
          ))}
        </div>
        <div className="text-center">
          <p className="text-emerald-300 font-black tracking-widest text-xs">LEVEL {level}</p>
          <h2 className="text-white font-black text-4xl text-shadow-lg">{score}</h2>
        </div>
        <button onClick={onClose} className="p-3 bg-white/10 rounded-2xl text-white">
          <X size={24} />
        </button>
      </div>

      {/* Problem Card */}
      <motion.div
        key={level}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative z-10 w-full max-w-md bg-white rounded-[3rem] p-12 shadow-2xl flex flex-col items-center border-b-[12px] border-emerald-100"
      >
        <div className="text-8xl font-black text-slate-800 mb-12 flex items-center gap-6">
          <span>{problem.a}</span>
          <span className="text-emerald-500">{problem.op === '*' ? '×' : problem.op}</span>
          <span>{problem.b}</span>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full">
          {problem.options.map((opt, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.05, translateY: -4 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleAnswer(opt)}
              className={cn(
                "p-6 rounded-3xl text-3xl font-black border-b-8 transition-all",
                feedback === 'correct' && opt === problem.answer ? "bg-emerald-500 text-white border-emerald-700" :
                feedback === 'wrong' && opt !== problem.answer ? "bg-rose-500 text-white border-rose-700" :
                "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              )}
            >
              {opt}
            </motion.button>
          ))}
        </div>
      </motion.div>

      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 20 }}
            className={cn(
              "absolute z-50 px-12 py-6 rounded-full font-black text-5xl shadow-2xl skew-x-[-12deg]",
              feedback === 'correct' ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
            )}
          >
            {feedback === 'correct' ? 'AMAZING!' : 'OOPS!'}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

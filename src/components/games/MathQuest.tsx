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
  const [timeLeft, setTimeLeft] = useState(30);
  const [maxTime, setMaxTime] = useState(30);
  const [showResult, setShowResult] = useState(false);

  const generateProblem = (currentLevel: number, currentDifficulty: 'easy' | 'pro' | 'legend' | null) => {
    if (!currentDifficulty) return;
    
    let a = 0, b = 0;
    let ops = ['+', '-'];

    if (currentDifficulty === 'easy') {
       ops.push('*', '/'); 
       const op = ops[Math.floor(Math.random() * ops.length)];
       if (op === '+' || op === '-') {
         a = Math.floor(Math.random() * 20) + 1;
         b = Math.floor(Math.random() * 20) + 1;
       } else if (op === '*') {
         a = Math.floor(Math.random() * 10) + 1;
         b = Math.floor(Math.random() * 10) + 1;
       } else {
         b = Math.floor(Math.random() * 10) + 1;
         a = b * (Math.floor(Math.random() * 5) + 1);
       }
       const ans = op === '+' ? a + b : op === '-' ? a - b : op === '*' ? a * b : a / b;
       setProblemData(a, b, op, ans, currentDifficulty);
    } else if (currentDifficulty === 'pro') {
       ops.push('*', '/');
       const op = ops[Math.floor(Math.random() * ops.length)];
       if (op === '+' || op === '-') {
         a = Math.floor(Math.random() * 100) + 1; 
         b = Math.floor(Math.random() * 100) + 1;
       } else if (op === '*') {
         a = Math.floor(Math.random() * 12) + 2;
         b = Math.floor(Math.random() * 12) + 2;
       } else {
         b = Math.floor(Math.random() * 12) + 2;
         a = b * (Math.floor(Math.random() * 10) + 1);
       }
       const ans = op === '+' ? a + b : op === '-' ? a - b : op === '*' ? a * b : a / b;
       setProblemData(a, b, op, ans, currentDifficulty);
    } else { // legend
       ops.push('*', '/');
       const op = ops[Math.floor(Math.random() * ops.length)];
       if (op === '+' || op === '-') {
         a = Math.floor(Math.random() * 500) + 100;
         b = Math.floor(Math.random() * 500) + 100;
       } else if (op === '*') {
         a = Math.floor(Math.random() * 20) + 5;
         b = Math.floor(Math.random() * 20) + 5;
       } else {
         b = Math.floor(Math.random() * 20) + 2;
         a = b * (Math.floor(Math.random() * 15) + 1);
       }
       const ans = op === '+' ? a + b : op === '-' ? a - b : op === '*' ? a * b : a / b;
       setProblemData(a, b, op, ans, currentDifficulty);
    }
  };

  const setProblemData = (a: number, b: number, op: string, ans: number, diff: string) => {
    if (op === '-' && a < b) [a, b] = [b, a];
    const options = new Set<number>([ans]);
    const offsetRange = diff === 'legend' ? 50 : diff === 'pro' ? 20 : 10;
    
    while (options.size < 4) {
      let wrongAns = ans + (Math.floor(Math.random() * offsetRange) - offsetRange / 2);
      if (wrongAns === ans || wrongAns < 0) wrongAns = ans + Math.floor(Math.random() * 10) + 1;
      options.add(wrongAns);
    }
    
    setProblem({
      a, b, op, answer: ans,
      options: Array.from(options).sort(() => Math.random() - 0.5)
    });
  };

  useEffect(() => {
    if (difficulty) {
      const time = difficulty === 'easy' ? 30 : difficulty === 'pro' ? 20 : 10;
      setTimeLeft(time);
      setMaxTime(time);
      generateProblem(level, difficulty);
    }
  }, [difficulty]);

  useEffect(() => {
    if (!difficulty || feedback || lives <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timer);
          setFeedback('wrong');
          setLives(l => {
            const next = l - 1;
            if (next <= 0) {
              onScoreSubmit(score);
              onClose();
            } else {
              setTimeout(() => {
                setFeedback(null);
                setTimeLeft(maxTime);
                generateProblem(level, difficulty);
              }, 1000);
            }
            return next;
          });
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [difficulty, feedback, level, lives]);

  const handleAnswer = (choice: number) => {
    if (feedback) return;

    if (choice === problem.answer) {
      setFeedback('correct');
      setScore(s => s + 100 * level);
      setTimeout(() => {
        setFeedback(null);
        setLevel(l => l + 1);
        setTimeLeft(maxTime); // Reset timer
        generateProblem(level + 1, difficulty);
      }, 1000);
    } else {
      setFeedback('wrong');
      setLives(l => {
        const next = l - 1;
        if (next <= 0) {
          setShowResult(true);
        } else {
          setTimeout(() => {
            setFeedback(null);
            generateProblem(level, difficulty);
          }, 1000);
        }
        return next;
      });
      setTimeout(() => setFeedback(null), 1000);
    }
  };

  const handleRestart = () => {
    setLevel(1);
    setScore(0);
    setLives(3);
    setShowResult(false);
    setTimeLeft(maxTime);
    generateProblem(1, difficulty);
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
      <div className="w-full max-w-xl flex flex-col gap-4 mb-8 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Heart 
                key={i} 
                className={cn("transition-all duration-500", i < lives ? "text-rose-500 fill-rose-500 scale-110" : "text-white/20")} 
                size={24} 
              />
            ))}
          </div>
          <div className="text-center">
            <p className="text-emerald-300 font-black tracking-widest text-xs">LEVEL {level}</p>
            <h2 className="text-white font-black text-2xl">{score}</h2>
          </div>
          <button onClick={onClose} className="p-2 bg-white/10 rounded-xl text-white">
            <X size={20} />
          </button>
        </div>
        
        {/* Timer Bar */}
        <div className="w-full h-4 bg-emerald-950/50 rounded-full overflow-hidden border-2 border-white/10">
          <motion.div 
            initial={{ width: '100%' }}
            animate={{ width: `${(timeLeft / maxTime) * 100}%` }}
            className={cn(
              "h-full transition-colors",
              timeLeft < 5 ? "bg-rose-500" : "bg-yellow-400"
            )}
          />
        </div>
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

      <AnimatePresence>
        {showResult && (
          <div className="absolute inset-0 z-50 bg-emerald-950/90 backdrop-blur-xl flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white p-12 rounded-[3rem] text-center max-w-sm w-full border-b-[12px] border-emerald-100 shadow-2xl"
            >
              <Trophy size={64} className="text-emerald-500 mx-auto mb-6" />
              <h2 className="text-5xl font-black text-slate-800 mb-2 tracking-tighter uppercase">QUIZ OVER</h2>
              <p className="text-emerald-500 font-bold text-3xl mb-8 italic">Score: {score}</p>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={handleRestart}
                  className="py-5 bg-emerald-500 text-white font-black text-xl rounded-2xl shadow-[0_8px_0_0_#10b981] hover:bg-emerald-400 active:translate-y-2 active:shadow-none transition-all uppercase"
                >
                  Again
                </button>
                <button 
                  onClick={onClose}
                  className="py-5 bg-slate-100 text-slate-500 font-black text-xl rounded-2xl border-b-8 border-slate-200 hover:bg-slate-200 active:translate-y-2 active:shadow-none transition-all uppercase"
                >
                  Exit
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

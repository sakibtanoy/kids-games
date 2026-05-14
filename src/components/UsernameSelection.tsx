import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Check, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { cn } from '../lib/utils';

export default function UsernameSelection() {
  const { checkUsername, claimUsername } = useAuth();


  const [username, setUsername] = useState('');
  const [status, setStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'error'>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (username.length < 3) {
      setStatus('idle');
      return;
    }

    const timer = setTimeout(async () => {
      setStatus('checking');
      try {
        const isAvailable = await checkUsername(username);
        setStatus(isAvailable ? 'available' : 'taken');
      } catch (err) {
        console.error("Username check error:", err);
        setStatus('error');
      }

    }, 500);

    return () => clearTimeout(timer);
  }, [username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status !== 'available' || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await claimUsername(username);
    } catch (err) {
      console.error("Username claim error:", err);
      setStatus('error');
      setIsSubmitting(false);
    }

  };

  return (
    <div className="fixed inset-0 bg-indigo-600 flex items-center justify-center p-6 z-[200]">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0, 0.2, 0],
              scale: [0.5, 1.5, 0.5],
              x: [Math.random() * 100 + '%', Math.random() * 100 + '%'],
              y: [Math.random() * 100 + '%', Math.random() * 100 + '%']
            }}
            transition={{ 
              duration: Math.random() * 10 + 10, 
              repeat: Infinity,
              ease: "linear" 
            }}
            className="absolute text-white/20 text-6xl"
          >
            {['✨', '🎈', '🎨', '🚀', '🌟'][Math.floor(Math.random() * 5)]}
          </motion.div>
        ))}
      </div>

      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative bg-white w-full max-w-lg rounded-[3rem] shadow-2xl p-10 md:p-16 border-b-[16px] border-indigo-100"
      >
        <div className="text-center mb-10">
          <div className="w-24 h-24 bg-indigo-100 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
            <User size={48} className="text-indigo-600" />
          </div>
          <h2 className="text-4xl font-black text-indigo-950 tracking-tight uppercase mb-4">Choose Your Hero Name!</h2>
          <p className="text-indigo-400 font-bold text-lg uppercase tracking-wider">Pick something unique and cool</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="relative">
            <input
              autoFocus
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 15))}
              placeholder="CoolGamer123"

              className={cn(
                "w-full px-8 py-6 bg-slate-50 border-4 rounded-[2rem] text-2xl font-black text-indigo-900 placeholder:text-slate-300 outline-none transition-all",
                status === 'available' ? "border-emerald-400 bg-emerald-50" : 
                status === 'taken' ? "border-rose-400 bg-rose-50" : 
                "border-slate-100 focus:border-indigo-400 focus:bg-white"
              )}
            />
            
            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-3">
              {status === 'checking' && <Loader2 className="animate-spin text-indigo-400" size={32} />}
              {status === 'available' && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-emerald-500 bg-white rounded-full p-1 shadow-sm">
                  <Check size={28} strokeWidth={4} />
                </motion.div>
              )}
              {status === 'taken' && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-rose-500 bg-white rounded-full p-1 shadow-sm">
                  <AlertCircle size={28} strokeWidth={4} />
                </motion.div>
              )}
            </div>
          </div>

          <div className="min-h-[24px] text-center">
            <AnimatePresence mode="wait">
              {status === 'taken' && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }} 
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="text-rose-500 font-black uppercase text-sm tracking-widest"
                >
                  Oh no! That name is already taken!
                </motion.p>
              )}
              {status === 'available' && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }} 
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="text-emerald-500 font-black uppercase text-sm tracking-widest flex items-center justify-center gap-2"
                >
                  <Sparkles size={16} /> That name is perfect! <Sparkles size={16} />
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <button
            disabled={status !== 'available' || isSubmitting}
            className={cn(
              "w-full py-8 rounded-[2.5rem] font-black text-2xl uppercase tracking-widest transition-all shadow-[0_12px_0_0_#312e81] active:shadow-none active:translate-y-3",
              status === 'available' 
                ? "bg-indigo-600 text-white hover:bg-indigo-500" 
                : "bg-slate-200 text-slate-400 shadow-none cursor-not-allowed"
            )}
          >
            {isSubmitting ? <Loader2 className="animate-spin mx-auto" size={32} /> : "LET'S PLAY!"}
          </button>
        </form>

        <p className="mt-10 text-center text-slate-300 font-bold text-xs uppercase tracking-widest">
          No spaces or special characters allowed
        </p>
      </motion.div>
    </div>
  );
}

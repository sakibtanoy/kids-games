import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Type, Sparkles, X, RotateCcw, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

const EASY_WORDS = [
  'CAT', 'DOG', 'BIRD', 'FISH', 'FROG', 'BEAR', 'LION', 'WOLF', 'FOX', 'DEER',
  'ANT', 'BEE', 'BUG', 'PIG', 'COW', 'MOON', 'SUN', 'STAR', 'SKY', 'SEA',
  'TREE', 'LEAF', 'ROCK', 'SAND', 'DIRT', 'FIRE', 'WIND', 'SNOW', 'RAIN', 'ICE',
  'APPLE', 'PEACH', 'PEAR', 'PLUM', 'GRAPE', 'MELON', 'LEMON', 'LIME', 'CHERRY', 'BERRY',
  'CUP', 'MUG', 'BOWL', 'PLATE', 'FORK', 'SPOON', 'KNIFE', 'PAN', 'POT', 'DISH',
  'BOOK', 'PAGE', 'WORD', 'LINE', 'PEN', 'INK', 'DESK', 'CHAIR', 'LAMP', 'BED',
  'DOOR', 'WALL', 'ROOF', 'ROOM', 'HALL', 'YARD', 'GATE', 'PATH', 'ROAD', 'STREET',
  'CAR', 'BUS', 'VAN', 'TRUCK', 'BIKE', 'BOAT', 'SHIP', 'TRAIN', 'JET', 'PLANE',
  'HAT', 'CAP', 'COAT', 'SHOE', 'SOCK', 'SHIRT', 'PANT', 'BELT', 'RING', 'WATCH',
  'HAND', 'FOOT', 'ARM', 'LEG', 'HEAD', 'EYE', 'EAR', 'NOSE', 'LIP', 'FACE',
  'HAPPY', 'SAD', 'MAD', 'GLAD', 'GOOD', 'BAD', 'BIG', 'SMALL', 'TALL', 'SHORT'
];

const PRO_WORDS = [
  'ANIMAL', 'MONKEY', 'RABBIT', 'TURTLE', 'SPIDER', 'LIZARD', 'SNAKE', 'PARROT', 'FALCON', 'EAGLE',
  'PLANET', 'GALAXY', 'COSMOS', 'METEOR', 'COMET', 'NEBULA', 'ROCKET', 'ORBIT', 'SYSTEM', 'QUASAR',
  'FOREST', 'JUNGLE', 'DESERT', 'TUNDRA', 'VALLEY', 'CANYON', 'ISLAND', 'MEADOW', 'STREAM', 'SPRING',
  'BANANA', 'ORANGE', 'TOMATO', 'CARROT', 'POTATO', 'ONION', 'GARLIC', 'PEPPER', 'CELERY', 'RADISH',
  'KITCHEN', 'BEDROOM', 'WINDOW', 'MIRROR', 'CARPET', 'CLOSET', 'DRAWER', 'SHELF', 'BASKET', 'BUCKET',
  'SCHOOL', 'PENCIL', 'ERASER', 'MARKER', 'CRAYON', 'FOLDER', 'BINDER', 'LOCKER', 'RECESS', 'PLAYER',
  'BOTTLE', 'GLASS', 'PITCHER', 'TEAPOT', 'SAUCER', 'NAPKIN', 'TRAY', 'CARTON', 'BARREL', 'BOTTLE',
  'JACKET', 'SWEATER', 'BUTTON', 'COLLAR', 'SLEEVE', 'POCKET', 'ZIPPER', 'GLOVES', 'MITTEN', 'SCARF',
  'FINGER', 'MUSCLE', 'BONE', 'BLOOD', 'BRAIN', 'HEART', 'LUNGS', 'STOMACH', 'THROAT', 'TONGUE',
  'SUMMER', 'WINTER', 'SPRING', 'AUTUMN', 'SEASON', 'NATURE', 'WEATHER', 'STORM', 'BREEZE', 'THUNDER'
];

const LEGEND_WORDS = [
  'ABANDONED', 'BEAUTIFUL', 'CHALLENGE', 'DANGEROUS', 'EDUCATION', 'FASCINATE', 'GENUINELY', 'HAPPINESS', 'IMPORTANT', 'JEALOUSY',
  'KNOWLEDGE', 'LANDSCAPE', 'MACHINERY', 'NARRATIVE', 'OBJECTIVE', 'PARTICULAR', 'QUALIFYING', 'RECOGNIZE', 'SITUATION', 'TREATMENT',
  'UMBRELLA', 'VACATION', 'WANDERING', 'XYLOPHONE', 'YESTERDAY', 'ZEPPELIN', 'ASTRONOMY', 'BIOLOGY', 'CHEMISTRY', 'DISCOVERY',
  'ELEVATOR', 'FIREPLACE', 'GRATITUDE', 'HEROISM', 'INVENTION', 'JUSTICE', 'KANGAROO', 'LITERATURE', 'MOUNTAIN', 'NUTRITION',
  'OPERATION', 'PENGUIN', 'QUESTION', 'REVOLUTION', 'SYMPHONY', 'TRADITION', 'UNIVERSE', 'VEGETABLE', 'WATERFALL', 'XYLOPHONE',
  'AGRICULTURE', 'BOULEVARD', 'COMPANION', 'DICTIONARY', 'EARTHQUAKE', 'FURNITURE', 'GEOGRAPHY', 'HISTORIAN', 'IMPRESSION', 'JOURNALIST',
  'LABORATORY', 'MATHEMATIC', 'NAVIGATION', 'OBSERVATION', 'PALEONTOLOGY', 'QUARANTINE', 'RESTAURANT', 'SCIENTIST', 'TELEVISION', 'UNIVERSITY',
  'VOCABULARY', 'WILDERNESS', 'APARTMENT', 'BARRICADE', 'CELEBRATE', 'DEDICATE', 'ENCOURAGE', 'FESTIVAL', 'GENEROUS', 'HIGHLIGHT',
  'ILLUSTRATE', 'JUSTIFY', 'KILOMETER', 'LUMINANCE', 'MAGNITUDE', 'NEGOTIATE', 'OPTIMISTIC', 'PHOTOGRAPH', 'QUALITATIVE', 'RESONANCE',
  'STRUCTURE', 'TOLERANCE', 'UNBELIEVABLE', 'VALIDATE', 'WONDERFUL', 'ZEALOUSLY', 'ACCOUNTANT', 'BACTERIA', 'CELESTATIAL', 'DIAGNOSIS'
];

export default function WordSpark({ onScoreSubmit, onClose }: { onScoreSubmit: (score: number) => void, onClose: () => void }) {
  const [level, setLevel] = useState(0);
  const [currentWord, setCurrentWord] = useState('');
  const [scrambled, setScrambled] = useState<string[]>([]);
  const [guess, setGuess] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<'success' | 'fail' | null>(null);
  const [difficulty, setDifficulty] = useState<'easy' | 'pro' | 'legend' | null>(null);

  const initLevel = () => {
    if (!difficulty) return;
    const pool = difficulty === 'easy' ? EASY_WORDS : difficulty === 'pro' ? PRO_WORDS : LEGEND_WORDS;
    const word = pool[Math.floor(Math.random() * pool.length)];
    setCurrentWord(word);
    const s = word.split('').sort(() => Math.random() - 0.5);
    setScrambled(s);
    setGuess([]);
    setFeedback(null);
  };

  useEffect(() => {
    initLevel();
  }, [level, difficulty]);

  const addLetter = (char: string, idx: number) => {
    if (feedback || guess.length >= currentWord.length) return;
    setGuess([...guess, char]);
    const newScrambled = [...scrambled];
    newScrambled.splice(idx, 1);
    setScrambled(newScrambled);
  };

  const removeLetter = (char: string, idx: number) => {
    if (feedback) return;
    const newGuess = [...guess];
    newGuess.splice(idx, 1);
    setGuess(newGuess);
    setScrambled([...scrambled, char]);
  };

  const checkGuess = () => {
    const g = guess.join('');
    if (g === currentWord) {
      setFeedback('success');
      const bonus = difficulty === 'pro' ? 20 : difficulty === 'legend' ? 40 : 0;
      setScore(s => s + 50 + bonus);
      setTimeout(() => {
        setLevel(l => l + 1);
      }, 1500);
    } else {
      setFeedback('fail');
      setTimeout(() => {
        setFeedback(null);
        // Reset level
        setScrambled(currentWord.split('').sort(() => Math.random() - 0.5));
        setGuess([]);
      }, 1000);
    }
  };

  if (!difficulty) {
    return (
      <div className="fixed inset-0 bg-amber-900/95 z-[101] flex items-center justify-center p-6">
        <div className="bg-white rounded-[3rem] p-12 text-center max-w-sm w-full shadow-2xl border-b-[12px] border-amber-100">
          <Type size={64} className="text-amber-500 mx-auto mb-6" />
          <h2 className="text-3xl font-black text-slate-800 mb-8 uppercase tracking-tighter">WORD SPARK</h2>
          <div className="space-y-4">
            {(['easy', 'pro', 'legend'] as const).map(d => (
              <button 
                key={d}
                onClick={() => setDifficulty(d)}
                className="w-full py-4 rounded-2xl font-black uppercase text-xl bg-amber-50 text-amber-900 hover:bg-amber-500 hover:text-white transition-all shadow-md active:translate-y-1 active:shadow-none"
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
    <div className="fixed inset-0 bg-amber-900/95 z-[100] flex flex-col items-center justify-center p-6">
      {/* Header */}
      <div className="w-full max-w-xl flex items-center justify-between mb-16">
        <div className="bg-amber-400 p-4 rounded-3xl shadow-[0_8px_0_0_rgba(180,83,9,1)]">
          <Type className="text-amber-900" size={32} />
        </div>
        <div className="text-center">
          <p className="text-amber-300 font-black text-sm tracking-widest uppercase">Word Finder</p>
          <h2 className="text-white font-black text-5xl tracking-tight">{score}</h2>
        </div>
        <button onClick={onClose} className="p-4 bg-white/10 rounded-3xl text-white">
          <X size={24} />
        </button>
      </div>

      <div className="relative w-full max-w-md flex flex-col items-center">
        {/* Guess Slots */}
        <div className="flex flex-wrap justify-center gap-2 mb-12 min-h-[80px]">
          {Array.from({ length: currentWord.length }).map((_, i) => (
            <motion.div
              key={i}
              layout
              onClick={() => guess[i] && removeLetter(guess[i], i)}
              className={cn(
                "rounded-2xl flex items-center justify-center font-black border-4 transition-all cursor-pointer",
                currentWord.length > 8 ? "w-10 h-12 text-xl" : "w-14 h-16 text-3xl",
                guess[i] 
                  ? "bg-white text-slate-800 border-white shadow-[0_6px_0_0_#e2e8f0]" 
                  : "bg-amber-800/50 border-amber-700/50 border-dashed"
              )}
            >
              {guess[i]}
            </motion.div>
          ))}
        </div>

        {/* Letters Bank */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {scrambled.map((char, i) => (
            <motion.button
              key={`${char}-${i}`}
              whileHover={{ scale: 1.1, y: -4 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => addLetter(char, i)}
              className={cn(
                "bg-amber-400 rounded-2xl flex items-center justify-center font-black text-amber-900 shadow-[0_6px_0_0_#b45309] active:shadow-none active:translate-y-1 transition-all",
                currentWord.length > 8 ? "w-10 h-12 text-xl" : "w-14 h-16 text-3xl"
              )}
            >
              {char}
            </motion.button>
          ))}
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-4 w-full">
          <motion.button
            disabled={guess.length !== currentWord.length || !!feedback}
            onClick={checkGuess}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "py-6 rounded-[2.5rem] text-2xl font-black transition-all flex items-center justify-center gap-3",
              guess.length === currentWord.length && !feedback
                ? "bg-white text-amber-600 shadow-[0_10px_0_0_#e2e8f0]"
                : "bg-white/10 text-white/20 shadow-none grayscale"
            )}
          >
            {feedback === 'success' ? <Check size={32} /> : 'CHECK WORD'}
          </motion.button>
          <button 
            onClick={onClose}
            className="px-8 py-6 rounded-[2.5rem] bg-amber-800/30 text-amber-200 font-black border-2 border-amber-700/50 hover:bg-amber-800/50 transition-all"
          >
            EXIT
          </button>
        </div>
      </div>

      {feedback === 'success' && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1.2, rotate: [0, -5, 5, 0] }}
          className="absolute text-7xl font-black text-white pointer-events-none drop-shadow-2xl"
        >
          GENIUS!
        </motion.div>
      )}
    </div>
  );
}

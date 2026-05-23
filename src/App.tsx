import React, { useState, useMemo, useEffect } from 'react';
import { AuthProvider, useAuth } from './components/AuthProvider';
import { db } from './lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, increment, updateDoc, doc } from 'firebase/firestore';

import { Header, GameCard } from './components/UI';
import { GAMES, BADGES } from './constants';
import { GameId } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Shield, 
  Clock, 
  Volume2, 
  VolumeX, 
  Users, 
  Trophy,
  Award,
  Lock,
  ChevronRight,
  User as UserIcon,
  Crown
} from 'lucide-react';
import { cn } from './lib/utils';

// Game Components
import CandyCruise from './components/games/CandyCruise';
import MathQuest from './components/games/MathQuest';
import WordSpark from './components/games/WordSpark';
import SpaceAdventure from './components/games/SpaceAdventure';
import TurboRacing from './components/games/TurboRacing';
import CubePuzzle from './components/games/CubePuzzle';
import WhackARabbit from './components/games/WhackARabbit';
import TicTacToe from './components/games/TicTacToe';
import FruitSlicer from './components/games/FruitSlicer';
import TowerStacker from './components/games/TowerStacker';
import SnakeArena from './components/games/SnakeArena';
import {
  BalloonPopAdventure,
  TinyCatRunner,
  CandyCatcher,
  FishFeedingFrenzy,
  MemoryMatchAnimals,
  MiniCarDodge,
  BubbleShooterIsland,
  HungryPanda,
  JumpingFrog,
  ToyClawMachine,
  CuteMonsterCleanup,
  RocketTapEscape,
  PenguinIceSlide,
  MagicPaintSplash,
  FlappyForest
} from './components/games/MiniArcade';
import MultiplayerLobby from './components/MultiplayerLobby';
import UsernameSelection from './components/UsernameSelection';
import SocialManager from './components/SocialManager';
import { UserProfile } from './types';


function Dashboard() {
  const { user, profile, signIn, updateProfile } = useAuth();
  const [activeGame, setActiveGame] = useState<GameId | null>(null);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showMultiplayer, setShowMultiplayer] = useState(false);
  const [activeTab, setActiveTab] = useState<'games' | 'friends' | 'awards' | 'leaderboard'>('games');
  const [leaderboard, setLeaderboard] = useState<UserProfile[]>([]);

  useEffect(() => {
    if (activeTab === 'leaderboard') {
      const q = query(collection(db, 'users'), orderBy('totalScore', 'desc'), limit(10));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => doc.data() as UserProfile);
        setLeaderboard(data);
      });
      return () => unsubscribe();
    }
  }, [activeTab]);


  const handleScoreSubmit = async (score: number) => {
    try {
      if (!profile) return;
      
      const currentScore = profile.totalScore || 0;
      const newTotal = currentScore + score;
      const updates: any = { 
        totalScore: increment(score) 
      };
      
      // Check for achievements using the calculated local total for immediate feedback
      if (newTotal > 1000 && !profile.badges?.includes('early-bird')) {
        updates.badges = [...(profile.badges || []), 'early-bird'];
      }
      
      await updateProfile(updates);
    } catch (error) {
      console.error("Score submission failed:", error);
    }
  };

  const handleCloseGame = async () => {
    if (activeRoomId) {
      try {
        await updateDoc(doc(db, 'rooms', activeRoomId), {
          status: 'waiting',
          gameId: null
        });
      } catch (error) {
        console.error("Failed to reset room status", error);
      }
    }
    setActiveGame(null);
    setActiveRoomId(null);
  };




  const restrictedGames = profile?.parentalControls?.restrictedGames || [];

  return (
    <div className="min-h-screen p-2 md:p-4 lg:p-6 flex flex-col max-h-screen overflow-hidden relative">
      <Header onOpenSettings={() => setShowSettings(true)} onOpenMultiplayer={() => setShowMultiplayer(true)} />

      {!user ? (
        <main className="flex-1 flex flex-col items-center justify-center text-center">
          <motion.div 
            initial={{ scale: 0 }} 
            animate={{ scale: 1 }} 
            className="w-24 h-24 md:w-40 md:h-40 bg-white rounded-[2rem] md:rounded-[40px] flex items-center justify-center mb-6 md:mb-8 shadow-[0_8px_0_0_#e0e7ff] border-2 border-indigo-100"
          >
            <span className="text-5xl md:text-7xl">🎮</span>
          </motion.div>
          <div className="mb-8 md:mb-12">
            <h2 className="text-3xl md:text-6xl font-black text-indigo-900 tracking-tighter uppercase leading-none">
              {profile?.displayName ? `LET'S PLAY, ${profile.displayName}!` : 'KIDDO HUB'}
            </h2>
            <p className="text-indigo-400 font-black text-xs md:text-xl mt-3 md:mt-4 uppercase tracking-widest opacity-60">
              Pick an adventure and start scoring!
            </p>
          </div>
          <button 
            onClick={signIn}
            className="px-10 py-4 md:px-16 md:py-6 bg-indigo-600 text-white text-xl md:text-3xl font-black rounded-[2rem] md:rounded-[2.5rem] shadow-[0_8px_0_0_#312e81] hover:bg-indigo-500 active:shadow-none active:translate-y-2 transition-all uppercase"
          >
            PLAY NOW
          </button>
        </main>
      ) : !profile?.isUsernameSet ? (
        <UsernameSelection />
      ) : (
        <div className="flex-1 flex gap-6 overflow-hidden">

          {/* Main Navigation Sidebar */}
          <nav className="w-24 hidden md:flex flex-col gap-4">
            <button 
              onClick={() => setActiveTab('games')}
              className={cn(
                "w-full aspect-square rounded-[32px] flex flex-col items-center justify-center gap-1 transition-all",
                activeTab === 'games' 
                  ? "bg-indigo-600 text-white shadow-[0_8px_0_0_#3730a3]" 
                  : "bg-white text-indigo-400 border-b-8 border-indigo-100 hover:bg-indigo-50"
              )}
            >
              <motion.div whileHover={{ scale: 1.1 }}><Clock size={32} /></motion.div>
              <span className="text-[10px] font-black uppercase">Home</span>
            </button>
            <button 
              onClick={() => setActiveTab('leaderboard')}
              className={cn(
                "w-full aspect-square rounded-[32px] flex flex-col items-center justify-center gap-1 transition-all",
                activeTab === 'leaderboard' 
                  ? "bg-indigo-600 text-white shadow-[0_8px_0_0_#3730a3]" 
                  : "bg-white text-indigo-400 border-b-8 border-indigo-100 hover:bg-indigo-50"
              )}
            >
              <motion.div whileHover={{ scale: 1.1 }}><Trophy size={32} /></motion.div>
              <span className="text-[10px] font-black uppercase">Ranks</span>
            </button>
            <button 
              onClick={() => setActiveTab('awards')}
              className={cn(
                "w-full aspect-square rounded-[32px] flex flex-col items-center justify-center gap-1 transition-all",
                activeTab === 'awards' 
                  ? "bg-indigo-600 text-white shadow-[0_8px_0_0_#3730a3]" 
                  : "bg-white text-indigo-400 border-b-8 border-indigo-100 hover:bg-indigo-50"
              )}
            >
              <motion.div whileHover={{ scale: 1.1 }}><Award size={32} /></motion.div>
              <span className="text-[10px] font-black uppercase">Awards</span>
            </button>
            <button 
              onClick={() => setActiveTab('friends')}
              className={cn(
                "w-full aspect-square rounded-[32px] flex flex-col items-center justify-center gap-1 transition-all",
                activeTab === 'friends' 
                  ? "bg-indigo-600 text-white shadow-[0_8px_0_0_#3730a3]" 
                  : "bg-white text-indigo-400 border-b-8 border-indigo-100 hover:bg-indigo-50"
              )}
            >
              <motion.div whileHover={{ scale: 1.1 }}><Users size={32} /></motion.div>
              <span className="text-[10px] font-black uppercase">Friends</span>
            </button>
            <button 
              onClick={() => setShowSettings(true)}
              className="w-full aspect-square bg-white text-indigo-400 rounded-[32px] border-b-8 border-indigo-100 flex flex-col items-center justify-center gap-1 mt-auto hover:bg-indigo-50 transition-all"
            >
              <motion.div whileHover={{ scale: 1.1 }}><Shield size={32} /></motion.div>
              <span className="text-[10px] font-black uppercase">Safe</span>
            </button>
          </nav>

          {/* Center Content Scrollable area */}
          <main className="flex-1 flex flex-col gap-8 overflow-y-auto pb-24 md:pb-10 no-scrollbar pt-4">
            {activeTab === 'games' && (
              <>

                


                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {GAMES.map(game => (
                    <GameCard 
                      key={game.id} 
                      game={game} 
                      isRestricted={restrictedGames.includes(game.id)}
                      onClick={() => {
                        setActiveGame(game.id);
                        document.documentElement.requestFullscreen().catch(() => {});
                      }} 
                    />
                  ))}
                </div>
              </>
            )}

            {activeTab === 'friends' && (
              <SocialManager onOpenMultiplayer={() => setShowMultiplayer(true)} />
            )}

            {activeTab === 'awards' && (
              <div className="space-y-6 md:space-y-8 pb-10">
                <h3 className="text-2xl md:text-3xl font-black text-indigo-900 uppercase tracking-tighter">My Badges ({profile?.badges?.length || 0})</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                  {BADGES.map(badge => {
                    const isUnlocked = profile?.badges?.includes(badge.id);
                    return (
                      <div 
                        key={badge.id}
                        className={cn(
                          "flex flex-col items-center p-2 md:p-6 rounded-[2rem] md:rounded-[40px] border-4 transition-all aspect-square justify-center relative overflow-hidden",
                          isUnlocked 
                            ? "bg-white border-yellow-400 shadow-[0_8px_0_0_#fef08a]" 
                            : "bg-indigo-50 border-indigo-100 grayscale opacity-40"
                        )}
                      >
                        <div className={cn(
                          "w-12 h-12 md:w-20 md:h-20 rounded-xl md:rounded-[2rem] flex items-center justify-center mb-3 md:mb-6 shadow-md transition-transform",
                          isUnlocked ? "bg-yellow-400 text-white scale-110" : "bg-indigo-200 text-indigo-400"
                        )}>
                          {isUnlocked ? <Trophy size={24} className="fill-white/20" /> : <Award size={24} />}
                        </div>
                        <span className="font-black text-xs md:text-sm text-center uppercase tracking-tight text-indigo-900">{badge.title}</span>
                        <p className="text-[10px] md:text-xs text-center font-bold text-indigo-400 mt-1 max-w-[90%] mx-auto leading-tight">{badge.description}</p>
                        {isUnlocked && <div className="absolute top-1 right-2 md:top-2 md:right-4 text-lg md:text-2xl">✨</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'leaderboard' && (
              <div className="bg-white rounded-[2rem] md:rounded-[40px] p-4 md:p-8 shadow-[0_12px_0_0_#e0e7ff] border-4 border-indigo-50 min-h-[400px]">
                <h3 className="text-xl md:text-3xl font-black text-indigo-900 mb-4 md:mb-8 tracking-tighter uppercase">Global Leaderboard</h3>
                <div className="space-y-2 md:space-y-4">
                  {leaderboard.length > 0 ? leaderboard.map((entry, idx) => (
                    <div key={entry.uid} className={cn(
                      "flex items-center gap-3 md:gap-4 p-3 md:p-5 rounded-[1.5rem] md:rounded-[2rem] border-b-4 transition-all",
                      entry.uid === user.uid ? "bg-indigo-600 text-white shadow-xl border-indigo-800 scale-[1.02]" : "bg-indigo-50/50 border-indigo-100"
                    )}>
                      <span className={cn(
                        "w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-black text-sm md:text-xl",
                        idx === 0 ? "bg-yellow-400 text-white shadow-[0_4px_0_0_#d97706]" : "text-indigo-300"
                      )}>{idx + 1}</span>
                      <div className={cn(
                        "w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center text-xl md:text-3xl shadow-sm bg-white/20",
                        idx === 0 ? "bg-amber-100" : ""
                      )}>
                        {idx === 0 ? '👑' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '🐯'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-black text-sm md:text-xl uppercase tracking-tight truncate">{entry.displayName}</h4>
                        <p className={cn("text-[8px] md:text-xs font-bold uppercase tracking-widest truncate", entry.uid === user.uid ? "text-white/60" : "text-indigo-300")}>Explorer Rank</p>
                      </div>
                      <div className="text-right">
                        <span className="block font-black text-lg md:text-2xl tracking-tighter">{entry.totalScore.toLocaleString()}</span>
                        <span className={cn("text-[8px] md:text-[10px] font-black uppercase tracking-widest", entry.uid === user.uid ? "text-white/40" : "text-indigo-200")}>Points</span>
                      </div>
                    </div>
                  )) : (
                    <div className="flex flex-col items-center justify-center py-20 text-indigo-200">
                      <Trophy size={48} className="mb-4 opacity-20" />
                      <p className="font-black uppercase tracking-widest text-sm">Waiting for heroes...</p>
                    </div>
                  )}
                </div>
              </div>
            )}

          </main>

          {/* Right Aside Panel (Leaderboard & Friends Sidebar) */}
          <aside className="w-72 hidden lg:flex flex-col gap-6 overflow-y-auto pb-10 pr-2">
            {/* Leaderboard Card */}
            <div className="bg-white rounded-[40px] p-6 shadow-[0_12px_0_0_#e0e7ff] border-2 border-indigo-100 flex flex-col">
              <h3 className="text-indigo-900 font-black text-center mb-6 flex items-center justify-center gap-2 tracking-tighter">
                <span className="text-2xl">🥇</span> LEADERBOARD
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-[1.5rem] border-2 border-yellow-100">
                  <span className="w-6 text-center font-black text-yellow-600">1</span>
                  <div className="w-10 h-10 bg-blue-400 rounded-xl flex items-center justify-center text-xl shadow-sm">🦊</div>
                  <span className="flex-1 text-sm font-black text-indigo-900 truncate uppercase">SkyFox</span>
                  <span className="text-xs font-black text-indigo-300">12K</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-[1.5rem] border-2 border-indigo-100">
                  <span className="w-6 text-center font-black text-indigo-400">2</span>
                  <div className="w-10 h-10 bg-emerald-400 rounded-xl flex items-center justify-center text-xl shadow-sm">🐻</div>
                  <span className="flex-1 text-sm font-black text-indigo-900 truncate uppercase">BearCub</span>
                  <span className="text-xs font-black text-indigo-300">11K</span>
                </div>
                <div className="flex items-center gap-3 p-4 bg-indigo-600 rounded-[1.8rem] border-b-4 border-indigo-800 text-white shadow-lg">
                  <span className="w-6 text-center font-black">3</span>
                  <div className="w-10 h-10 bg-pink-400 rounded-xl flex items-center justify-center text-xl shadow-sm">🐯</div>
                  <span className="flex-1 text-sm font-black truncate uppercase">YOU</span>
                  <span className="text-xs font-black text-white/50">{profile?.totalScore || 0}</span>
                </div>
              </div>
            </div>

            {/* Online Friends Mini Card */}
            <div className="bg-white rounded-[40px] p-6 shadow-[0_12px_0_0_#e0e7ff] border-2 border-indigo-100">
              <h3 className="text-indigo-900 font-black text-xs mb-6 uppercase tracking-widest opacity-40">ONLINE PALS</h3>
              <div className="flex flex-wrap gap-3">
                <div className="relative group cursor-pointer hover:scale-110 transition-transform">
                  <div className="w-14 h-14 bg-orange-400 rounded-2xl flex items-center justify-center text-2xl shadow-sm hover:shadow-orange-200">🐼</div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-[3px] border-white shadow-sm"></div>
                </div>
                <div className="relative group cursor-pointer hover:scale-110 transition-transform">
                  <div className="w-14 h-14 bg-teal-400 rounded-2xl flex items-center justify-center text-2xl shadow-sm hover:shadow-teal-200">🦄</div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-[3px] border-white shadow-sm"></div>
                </div>
                <div className="relative group cursor-pointer hover:scale-110 transition-transform">
                  <div className="w-14 h-14 bg-rose-400 rounded-2xl flex items-center justify-center text-2xl shadow-sm hover:shadow-rose-200">🦁</div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-[3px] border-white shadow-sm"></div>
                </div>
                <div className="w-14 h-14 bg-indigo-50 border-4 border-dashed border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-200 text-3xl font-black cursor-pointer hover:bg-white hover:border-indigo-200 transition-all">+</div>
              </div>
            </div>
          </aside>
        </div>
      )}


      {/* Game Modals */}
      <AnimatePresence>
        {activeGame === 'candy-cruise' && (
          <CandyCruise 
            onScoreSubmit={handleScoreSubmit} 
            onClose={handleCloseGame} 
          />
        )}
        {activeGame === 'math-quest' && (
          <MathQuest 
            onScoreSubmit={handleScoreSubmit} 
            onClose={handleCloseGame} 
          />
        )}
        {activeGame === 'word-spark' && (
          <WordSpark 
            onScoreSubmit={handleScoreSubmit} 
            onClose={handleCloseGame} 
          />
        )}
        {activeGame === 'space-adventure' && (
          <SpaceAdventure 
            onScoreSubmit={handleScoreSubmit} 
            onClose={handleCloseGame} 
          />
        )}
        {activeGame === 'racing' && (
          <TurboRacing 
            onScoreSubmit={handleScoreSubmit} 
            onClose={handleCloseGame} 
          />
        )}
        {activeGame === 'puzzle' && (
          <CubePuzzle 
            onScoreSubmit={handleScoreSubmit} 
            onClose={handleCloseGame} 
          />
        )}
        {activeGame === 'whack-rabbit' && (
          <WhackARabbit 
            onScoreSubmit={handleScoreSubmit} 
            onClose={handleCloseGame} 
          />
        )}
        {activeGame === 'tic-tac-toe' && (
          <TicTacToe 
            roomId={activeRoomId}
            onScoreSubmit={handleScoreSubmit} 
            onClose={handleCloseGame} 
          />
        )}
        {activeGame === 'fruit-slicer' && (
          <FruitSlicer 
            onComplete={handleScoreSubmit} 
            onClose={handleCloseGame}
          />
        )}
        {activeGame === 'tower-stacker' && (
          <TowerStacker 
            onScoreSubmit={handleScoreSubmit} 
            onClose={handleCloseGame}
          />
        )}
        {activeGame === 'snake-arena' && (
          <SnakeArena 
            roomId={activeRoomId}
            onScoreSubmit={handleScoreSubmit} 
            onClose={handleCloseGame} 
          />
        )}
        {activeGame === 'flappy-forest' && (
          <FlappyForest 
            onScoreSubmit={handleScoreSubmit} 
            onClose={handleCloseGame} 
          />
        )}
        {activeGame === 'balloon-pop' && (
          <BalloonPopAdventure 
            onScoreSubmit={handleScoreSubmit} 
            onClose={handleCloseGame} 
          />
        )}
        {activeGame === 'tiny-cat-runner' && (
          <TinyCatRunner 
            onScoreSubmit={handleScoreSubmit} 
            onClose={handleCloseGame} 
          />
        )}
        {activeGame === 'candy-catcher' && (
          <CandyCatcher 
            onScoreSubmit={handleScoreSubmit} 
            onClose={handleCloseGame} 
          />
        )}
        {activeGame === 'fish-feeding' && (
          <FishFeedingFrenzy 
            onScoreSubmit={handleScoreSubmit} 
            onClose={handleCloseGame} 
          />
        )}
        {activeGame === 'memory-animals' && (
          <MemoryMatchAnimals 
            onScoreSubmit={handleScoreSubmit} 
            onClose={handleCloseGame} 
          />
        )}
        {activeGame === 'mini-car-dodge' && (
          <MiniCarDodge 
            onScoreSubmit={handleScoreSubmit} 
            onClose={handleCloseGame} 
          />
        )}
        {activeGame === 'bubble-shooter' && (
          <BubbleShooterIsland 
            onScoreSubmit={handleScoreSubmit} 
            onClose={handleCloseGame} 
          />
        )}
        {activeGame === 'hungry-panda' && (
          <HungryPanda 
            onScoreSubmit={handleScoreSubmit} 
            onClose={handleCloseGame} 
          />
        )}
        {activeGame === 'jumping-frog' && (
          <JumpingFrog 
            onScoreSubmit={handleScoreSubmit} 
            onClose={handleCloseGame} 
          />
        )}
        {activeGame === 'toy-claw' && (
          <ToyClawMachine 
            onScoreSubmit={handleScoreSubmit} 
            onClose={handleCloseGame} 
          />
        )}
        {activeGame === 'monster-cleanup' && (
          <CuteMonsterCleanup 
            onScoreSubmit={handleScoreSubmit} 
            onClose={handleCloseGame} 
          />
        )}
        {activeGame === 'rocket-tap' && (
          <RocketTapEscape 
            onScoreSubmit={handleScoreSubmit} 
            onClose={handleCloseGame} 
          />
        )}
        {activeGame === 'penguin-slide' && (
          <PenguinIceSlide 
            onScoreSubmit={handleScoreSubmit} 
            onClose={handleCloseGame} 
          />
        )}
        {activeGame === 'paint-splash' && (
          <MagicPaintSplash 
            onScoreSubmit={handleScoreSubmit} 
            onClose={handleCloseGame} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMultiplayer && (
          <MultiplayerLobby 
            onStartGame={(gameId, roomId) => {
               setShowMultiplayer(false);
               setActiveRoomId(roomId);
               setActiveGame(gameId as GameId);
            }} 
            onClose={() => setShowMultiplayer(false)} 
          />
        )}
      </AnimatePresence>

      {/* Settings Modal (Parental Controls) */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-[3rem] shadow-2xl p-8 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-100 text-red-600 rounded-2xl">
                    <Shield size={24} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-800">PARENTAL CENTER</h3>
                </div>
                <button onClick={() => setShowSettings(false)} className="p-2 bg-slate-100 rounded-full text-slate-400">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="p-6 bg-slate-50 rounded-[2rem] space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Clock className="text-slate-400" size={20} />
                      <span className="font-bold text-slate-700">Daily Play Time</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <input 
                          type="number" 
                          value={profile?.parentalControls?.timeLimitMinutes || 60} 
                          onChange={(e) => updateProfile({ parentalControls: { ...(profile?.parentalControls || { restrictedGames: [], isMuted: false }), timeLimitMinutes: parseInt(e.target.value) || 60 }})}
                          className="w-16 p-2 bg-white rounded-xl border-2 border-slate-200 font-bold text-center"
                       />
                       <span className="text-slate-400 font-bold text-sm">min</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-slate-50 rounded-[2rem] space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {profile?.parentalControls?.isMuted ? <VolumeX className="text-slate-400" size={20} /> : <Volume2 className="text-slate-400" size={20} />}
                      <span className="font-bold text-slate-700">Mute Game Audio</span>
                    </div>
                    <button 
                      onClick={() => updateProfile({ parentalControls: { ...(profile?.parentalControls || { timeLimitMinutes: 60, restrictedGames: [] }), isMuted: !profile?.parentalControls?.isMuted }})}
                      className={cn(
                        "w-12 h-6 rounded-full relative transition-all",
                        profile?.parentalControls?.isMuted ? "bg-indigo-600" : "bg-slate-300"
                      )}
                    >
                      <motion.div 
                        animate={{ x: profile?.parentalControls?.isMuted ? 24 : 0 }}
                        className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full" 
                      />
                    </button>
                  </div>
                </div>

                <div className="pt-4">
                  <h4 className="text-slate-400 font-black text-xs uppercase tracking-widest mb-4">RESTRICTED GAMES</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {GAMES.map(game => (
                      <button
                        key={game.id}
                        onClick={() => {
                          const current = profile?.parentalControls?.restrictedGames || [];
                          const next = current.includes(game.id) 
                            ? current.filter(id => id !== game.id) 
                            : [...current, game.id];
                          updateProfile({ parentalControls: { ...(profile?.parentalControls || { timeLimitMinutes: 60, isMuted: false }), restrictedGames: next }});
                        }}
                        className={cn(
                          "px-4 py-2 rounded-xl border-2 text-xs font-bold transition-all",
                          (profile?.parentalControls?.restrictedGames || []).includes(game.id) 
                            ? "bg-red-50 border-red-200 text-red-600" 
                            : "bg-white border-slate-100 text-slate-500"
                        )}
                      >
                        {game.title}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-100 text-center">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Logged in as {user?.email}</p>
                 <button onClick={() => { useAuth().logout(); setShowSettings(false); }} className="mt-4 text-red-500 font-bold hover:underline">SIGN OUT</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Mobile Navigation */}
      {user && (
        <div className="md:hidden fixed bottom-6 left-2 right-2 bg-white/95 backdrop-blur-xl rounded-[2rem] p-2 flex justify-between items-center z-[50] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_0_0_#e0e7ff] border-2 border-white">
          {[
            { id: 'games', icon: <Clock className="w-6 h-6" /> },
            { id: 'leaderboard', icon: <Trophy className="w-6 h-6" /> },
            { id: 'awards', icon: <Award className="w-6 h-6" /> },
            { id: 'friends', icon: <Users className="w-6 h-6" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "w-12 h-12 flex items-center justify-center rounded-[1.5rem] transition-all",
                activeTab === tab.id 
                  ? "bg-indigo-600 text-white shadow-lg scale-110" 
                  : "text-indigo-300 hover:bg-indigo-50"
              )}
            >
              {tab.icon}
            </button>
          ))}
          <div className="w-px h-8 bg-indigo-100 mx-1" />
          <button
            onClick={() => setShowSettings(true)}
            className="w-12 h-12 flex items-center justify-center rounded-2xl text-indigo-300 hover:bg-indigo-50"
          >
            <Shield className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Dashboard />
    </AuthProvider>
  );
}

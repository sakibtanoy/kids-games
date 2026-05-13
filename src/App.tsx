import React, { useState, useMemo } from 'react';
import { AuthProvider, useAuth } from './components/AuthProvider';
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
import MultiplayerLobby from './components/MultiplayerLobby';

function Dashboard() {
  const { user, profile, signIn, updateProfile } = useAuth();
  const [activeGame, setActiveGame] = useState<GameId | null>(null);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showMultiplayer, setShowMultiplayer] = useState(false);
  const [activeTab, setActiveTab] = useState<'games' | 'friends' | 'awards' | 'leaderboard'>('games');

  const handleScoreSubmit = (score: number) => {
    if (!profile) return;
    const newTotal = (profile.totalScore || 0) + score;
    updateProfile({ totalScore: newTotal });
    
    // Check for achievements
    if (newTotal > 1000 && !profile.badges.includes('early-bird')) {
      updateProfile({ badges: [...profile.badges, 'early-bird'] });
    }
  };

  const restrictedGames = profile?.parentalControls?.restrictedGames || [];

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-10 flex flex-col max-h-screen overflow-hidden">
      <Header onOpenSettings={() => setShowSettings(true)} />

      {!user ? (
        <main className="flex-1 flex flex-col items-center justify-center text-center">
          <motion.div 
            initial={{ scale: 0 }} 
            animate={{ scale: 1 }} 
            className="w-40 h-40 bg-white rounded-[40px] flex items-center justify-center mb-8 shadow-[0_12px_0_0_#e0e7ff] border-2 border-indigo-100"
          >
            <span className="text-7xl">🎮</span>
          </motion.div>
          <h2 className="text-6xl font-black text-indigo-900 mb-6 tracking-tight">KIDDO HUB</h2>
          <p className="text-indigo-400 font-black text-xl mb-12 max-w-md uppercase tracking-wider">
            Ready for your next huge adventure?
          </p>
          <button 
            onClick={signIn}
            className="px-16 py-6 bg-indigo-600 text-white text-3xl font-black rounded-[2.5rem] shadow-[0_12px_0_0_#312e81] hover:bg-indigo-500 active:shadow-none active:translate-y-2 transition-all uppercase"
          >
            PLAY NOW
          </button>
        </main>
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
              <span className="text-3xl">🏠</span>
              <span className="text-[10px] font-black uppercase">Home</span>
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
              <span className="text-3xl">🏆</span>
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
              <span className="text-3xl">👥</span>
              <span className="text-[10px] font-black uppercase">Friends</span>
            </button>
            <button 
              onClick={() => setShowSettings(true)}
              className="w-full aspect-square bg-white text-indigo-400 rounded-[32px] border-b-8 border-indigo-100 flex flex-col items-center justify-center gap-1 mt-auto hover:bg-indigo-50 transition-all"
            >
              <span className="text-3xl">⚙️</span>
              <span className="text-[10px] font-black uppercase">Safe</span>
            </button>
          </nav>

          {/* Center Content Scrollable area */}
          <main className="flex-1 flex flex-col gap-8 overflow-y-auto pr-2 pb-24 md:pb-10">
            {activeTab === 'games' && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-black text-indigo-900 tracking-tight">FEATURED GAMES</h2>
                    <div className="flex gap-2">
                      <span className="bg-indigo-200 px-4 py-1.5 rounded-full text-[10px] font-black text-indigo-700 uppercase tracking-widest">Everything</span>
                    </div>
                  </div>
                  <button onClick={() => setShowMultiplayer(true)} className="flex items-center gap-2 bg-indigo-100 text-indigo-700 px-6 py-3 rounded-2xl font-black uppercase text-sm tracking-widest hover:bg-indigo-200 transition-all hover:scale-105 active:scale-95 shadow-md">
                    <span className="text-xl">👥</span> Play Together
                  </button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {GAMES.map(game => (
                    <GameCard 
                      key={game.id} 
                      game={game} 
                      isRestricted={restrictedGames.includes(game.id)}
                      onClick={() => setActiveGame(game.id)} 
                    />
                  ))}
                </div>

                {/* Daily Challenge Banner */}
                <div className="bg-indigo-900 rounded-[40px] p-8 flex flex-col md:flex-row items-center justify-between text-white border-b-[12px] border-indigo-950 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-800 rounded-full -mr-20 -mt-20 opacity-30" />
                  <div className="flex items-center gap-6 relative z-10 text-center md:text-left">
                    <div className="text-6xl bg-white/10 p-5 rounded-[2rem] backdrop-blur-md">⚡</div>
                    <div>
                      <p className="text-indigo-400 font-black text-xs uppercase tracking-[0.2em] mb-1">Daily Challenge</p>
                      <h3 className="text-2xl font-black italic tracking-tight underline decoration-yellow-400 underline-offset-4">MATH MANIA: GALAXY QUEST</h3>
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row gap-6 items-center mt-6 md:mt-0 relative z-10">
                    <div className="text-center md:text-right">
                      <p className="text-xs font-black text-indigo-400 uppercase tracking-widest">Reward</p>
                      <p className="text-2xl font-black text-yellow-400">+500 XP</p>
                    </div>
                    <button 
                      onClick={() => setActiveGame('math-quest')}
                      className="bg-yellow-400 text-indigo-900 px-10 py-4 rounded-[2rem] font-black shadow-[0_8px_0_0_#ca8a04] hover:bg-yellow-300 active:shadow-none active:translate-y-2 transition-all uppercase tracking-wider"
                    >
                      START NOW
                    </button>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'friends' && (
              <div className="bg-white rounded-[40px] p-8 shadow-[0_12px_0_0_#e0e7ff] border-4 border-indigo-50 min-h-[400px]">
                <h3 className="text-3xl font-black text-indigo-900 mb-8 tracking-tighter">FRIEND LIST</h3>
                <div className="grid gap-4">
                  {profile?.friends.length === 0 ? (
                    <div className="py-20 text-center bg-indigo-50/50 rounded-[2.5rem] border-4 border-dashed border-indigo-100">
                      <div className="text-5xl mb-4">👋</div>
                      <p className="text-indigo-400 font-bold text-xl uppercase italic">No buddies yet? Add some!</p>
                      <button className="mt-6 px-10 py-3 bg-indigo-600 text-white font-black rounded-full shadow-lg">FIND FRIENDS</button>
                    </div>
                  ) : (
                    profile?.friends.map(friendId => (
                      <div key={friendId} className="flex items-center justify-between p-6 bg-indigo-50 rounded-[2rem] border-b-4 border-indigo-100">
                         <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm italic">🐱</div>
                            <span className="font-black text-lg text-indigo-900 uppercase">Explorer #{friendId.slice(0,4)}</span>
                         </div>
                         <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm" />
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'awards' && (
              <div className="space-y-8 pb-10">
                <h3 className="text-3xl font-black text-indigo-900 uppercase tracking-tighter">My Badges ({profile?.badges.length || 0})</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                  {BADGES.map(badge => {
                    const isUnlocked = profile?.badges.includes(badge.id);
                    return (
                      <div 
                        key={badge.id}
                        className={cn(
                          "flex flex-col items-center p-8 rounded-[40px] border-4 transition-all aspect-square justify-center relative overflow-hidden",
                          isUnlocked 
                            ? "bg-white border-yellow-400 shadow-[0_12px_0_0_#fef08a]" 
                            : "bg-indigo-50 border-indigo-100 grayscale opacity-40"
                        )}
                      >
                        <div className={cn(
                          "w-20 h-20 rounded-[2rem] flex items-center justify-center mb-6 shadow-md transition-transform",
                          isUnlocked ? "bg-yellow-400 text-white scale-110" : "bg-indigo-200 text-indigo-400"
                        )}>
                          {isUnlocked ? <Trophy size={40} className="fill-white/20" /> : <Award size={40} />}
                        </div>
                        <span className="font-black text-xs text-center uppercase tracking-[0.2em] text-indigo-900">{badge.title}</span>
                        {isUnlocked && <div className="absolute top-2 right-4 text-2xl">✨</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'leaderboard' && (
              <div className="bg-white rounded-[40px] p-8 shadow-[0_12px_0_0_#e0e7ff] border-4 border-indigo-50 min-h-[400px]">
                <h3 className="text-3xl font-black text-indigo-900 mb-8 tracking-tighter uppercase">Global Leaderboard</h3>
                <div className="space-y-4">
                  {[
                    { rank: 1, name: 'SkyFox', score: '12,400', icon: '🦊', color: 'bg-blue-400', tag: 'bg-yellow-50' },
                    { rank: 2, name: 'BearCub', score: '11,210', icon: '🐻', color: 'bg-emerald-400', tag: 'bg-indigo-50' },
                    { rank: 3, name: profile?.displayName || 'YOU', score: profile?.totalScore || 0, icon: '🐯', color: 'bg-pink-400', tag: 'bg-indigo-600 text-white' },
                    { rank: 4, name: 'GalaxyKid', score: '8,900', icon: '👩‍🚀', color: 'bg-orange-400', tag: 'bg-indigo-50' },
                    { rank: 5, name: 'StarPanda', score: '7,500', icon: '🐼', color: 'bg-teal-400', tag: 'bg-indigo-50' },
                  ].map((entry) => (
                    <div key={entry.rank} className={cn(
                      "flex items-center gap-4 p-5 rounded-[2rem] border-b-4 transition-all",
                      entry.tag,
                      entry.rank === 3 ? "shadow-xl border-indigo-800 scale-[1.02]" : "border-indigo-100"
                    )}>
                      <span className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center font-black text-xl",
                        entry.rank === 1 ? "bg-yellow-400 text-white" : "text-indigo-300"
                      )}>{entry.rank}</span>
                      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm", entry.color)}>
                        {entry.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-black text-xl uppercase tracking-tight">{entry.name}</h4>
                        <p className={cn("text-xs font-bold uppercase tracking-widest", entry.rank === 3 ? "text-white/60" : "text-indigo-300")}>Explorer Rank</p>
                      </div>
                      <div className="text-right">
                        <span className="block font-black text-2xl tracking-tighter">{entry.score}</span>
                        <span className={cn("text-[10px] font-black uppercase tracking-widest", entry.rank === 3 ? "text-white/40" : "text-indigo-200")}>XP Points</span>
                      </div>
                    </div>
                  ))}
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
            onClose={() => setActiveGame(null)} 
          />
        )}
        {activeGame === 'math-quest' && (
          <MathQuest 
            onScoreSubmit={handleScoreSubmit} 
            onClose={() => setActiveGame(null)} 
          />
        )}
        {activeGame === 'word-spark' && (
          <WordSpark 
            onScoreSubmit={handleScoreSubmit} 
            onClose={() => setActiveGame(null)} 
          />
        )}
        {activeGame === 'space-adventure' && (
          <SpaceAdventure 
            onScoreSubmit={handleScoreSubmit} 
            onClose={() => setActiveGame(null)} 
          />
        )}
        {activeGame === 'racing' && (
          <TurboRacing 
            onScoreSubmit={handleScoreSubmit} 
            onClose={() => setActiveGame(null)} 
          />
        )}
        {activeGame === 'puzzle' && (
          <CubePuzzle 
            onScoreSubmit={handleScoreSubmit} 
            onClose={() => setActiveGame(null)} 
          />
        )}
        {activeGame === 'whack-rabbit' && (
          <WhackARabbit 
            onScoreSubmit={handleScoreSubmit} 
            onClose={() => setActiveGame(null)} 
          />
        )}
        {activeGame === 'tic-tac-toe' && (
          <TicTacToe 
            roomId={activeRoomId}
            onScoreSubmit={handleScoreSubmit} 
            onClose={() => { setActiveGame(null); setActiveRoomId(null); }} 
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
                          value={profile?.parentalControls.timeLimitMinutes} 
                          onChange={(e) => updateProfile({ parentalControls: { ...profile!.parentalControls, timeLimitMinutes: parseInt(e.target.value) }})}
                          className="w-16 p-2 bg-white rounded-xl border-2 border-slate-200 font-bold text-center"
                       />
                       <span className="text-slate-400 font-bold text-sm">min</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-slate-50 rounded-[2rem] space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {profile?.parentalControls.isMuted ? <VolumeX className="text-slate-400" size={20} /> : <Volume2 className="text-slate-400" size={20} />}
                      <span className="font-bold text-slate-700">Mute Game Audio</span>
                    </div>
                    <button 
                      onClick={() => updateProfile({ parentalControls: { ...profile!.parentalControls, isMuted: !profile?.parentalControls.isMuted }})}
                      className={cn(
                        "w-12 h-6 rounded-full relative transition-all",
                        profile?.parentalControls.isMuted ? "bg-indigo-600" : "bg-slate-300"
                      )}
                    >
                      <motion.div 
                        animate={{ x: profile?.parentalControls.isMuted ? 24 : 0 }}
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
                          const current = profile?.parentalControls.restrictedGames || [];
                          const next = current.includes(game.id) 
                            ? current.filter(id => id !== game.id) 
                            : [...current, game.id];
                          updateProfile({ parentalControls: { ...profile!.parentalControls, restrictedGames: next }});
                        }}
                        className={cn(
                          "px-4 py-2 rounded-xl border-2 text-xs font-bold transition-all",
                          restrictedGames.includes(game.id) 
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
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-indigo-100 p-2 flex justify-around items-center z-[50] shadow-[0_-8px_20px_rgba(0,0,0,0.05)]">
          {[
            { id: 'games', icon: '🏠', label: 'Home' },
            { id: 'leaderboard', icon: '🏆', label: 'Ranks' },
            { id: 'awards', icon: '✨', label: 'Badges' },
            { id: 'friends', icon: '👥', label: 'Buddies' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex flex-col items-center p-2 rounded-2xl transition-all",
                activeTab === tab.id ? "bg-indigo-100 text-indigo-600 scale-110" : "text-indigo-300"
              )}
            >
              <span className="text-2xl">{tab.icon}</span>
              <span className="text-[10px] font-black uppercase tracking-tighter">{tab.label}</span>
            </button>
          ))}
          <button
            onClick={() => setShowSettings(true)}
            className="flex flex-col items-center p-2 rounded-2xl text-indigo-300"
          >
            <span className="text-2xl">⚙️</span>
            <span className="text-[10px] font-black uppercase tracking-tighter">Safe</span>
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

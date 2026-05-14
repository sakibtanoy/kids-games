import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { Search, UserPlus, UserCheck, UserX, Clock, Users, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { UserProfile } from '../types';

export default function SocialManager({ onOpenMultiplayer }: { onOpenMultiplayer?: () => void }) {
  const { user, profile, searchUsers, sendFriendRequest, respondToFriendRequest } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [friendsData, setFriendsData] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Listen for pending requests
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'friendRequests'),
      where('receiverUid', '==', user.uid),
      where('status', '==', 'pending')
    );
    return onSnapshot(q, (snap) => {
      setPendingRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [user]);

  // Load friends data
  useEffect(() => {
    if (!profile?.friends?.length) {
      setFriendsData([]);
      return;
    }
    const q = query(
      collection(db, 'users'),
      where('uid', 'in', profile.friends)
    );
    return onSnapshot(q, (snap) => {
      setFriendsData(snap.docs.map(d => d.data() as UserProfile));
    });
  }, [profile?.friends]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.length < 3) return;
    setIsSearching(true);
    try {
      const results = await searchUsers(searchTerm);
      setSearchResults(results);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Quick Play Together Access */}
      <div className="md:hidden">
        <button 
          onClick={onOpenMultiplayer} 
          className="w-full bg-indigo-600 text-white p-5 rounded-[2rem] font-black uppercase tracking-widest shadow-[0_8px_0_0_#3730a3] flex items-center justify-center gap-3 active:translate-y-1 active:shadow-none transition-all"
        >
          <Users /> PLAY TOGETHER ONLINE
        </button>
      </div>

      {/* Search Section */}
      <section className="bg-white rounded-[2.5rem] p-4 md:p-8 shadow-[0_8px_0_0_#e0e7ff] border-4 border-indigo-50">
        <h3 className="text-xl md:text-2xl font-black text-indigo-900 mb-6 flex items-center gap-3">
          <Search className="text-indigo-400" /> FIND NEW BUDDIES
        </h3>
        <form onSubmit={handleSearch} className="relative mb-6">
          <input 
            type="text" 
            placeholder="TYPE A NAME (min 3 letters)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-5 bg-indigo-50 rounded-2xl font-bold text-indigo-900 border-2 border-transparent focus:border-indigo-300 outline-none transition-all placeholder:text-indigo-200"
          />
          <button 
            type="submit"
            disabled={isSearching || searchTerm.length < 3}
            className="absolute right-2 top-2 bottom-2 px-8 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-md active:translate-y-0.5"
          >
            {isSearching ? '...' : 'SEARCH'}
          </button>
        </form>

        <div className="grid gap-4">
          {searchResults.map(res => {
            const isFriend = profile?.friends?.includes(res.uid);
            return (
              <div key={res.uid} className="flex items-center justify-between p-4 bg-white rounded-2xl border-2 border-indigo-50 hover:border-indigo-200 transition-all shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-2xl shadow-inner">🐯</div>
                  <div>
                    <p className="font-black text-indigo-900 uppercase leading-none">{res.displayName}</p>
                    <p className="text-[10px] font-bold text-indigo-300 mt-1 uppercase tracking-widest">Level {Math.floor((res.totalScore / 500) + 1)}</p>
                  </div>
                </div>
                {isFriend ? (
                  <span className="flex items-center gap-1 text-emerald-500 font-black text-xs bg-emerald-50 px-4 py-2 rounded-lg">
                    <UserCheck size={14} /> BUDDY
                  </span>
                ) : (
                  <button 
                    onClick={() => sendFriendRequest(res.uid)}
                    className="flex items-center gap-2 bg-indigo-100 text-indigo-600 px-4 py-2 rounded-lg font-black text-xs hover:bg-indigo-600 hover:text-white transition-all"
                  >
                    <UserPlus size={14} /> ADD
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Pending Requests */}
      <AnimatePresence>
        {pendingRequests.length > 0 && (
          <motion.section 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-amber-50 rounded-[2.5rem] p-6 md:p-8 border-4 border-amber-100 shadow-[0_8px_0_0_#fef3c7]"
          >
            <h3 className="text-xl md:text-2xl font-black text-amber-900 mb-6 flex items-center gap-3">
              <Clock className="text-amber-400" /> NEW BUDDY REQUESTS!
            </h3>
            <div className="grid gap-4">
              {pendingRequests.map(req => (
                <div key={req.id} className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-md border-b-4 border-amber-200">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-2xl">🐯</div>
                    <p className="font-black text-indigo-900 uppercase">{req.senderName}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => respondToFriendRequest(req.id, true)}
                      className="p-2.5 bg-emerald-500 text-white rounded-xl shadow-md hover:bg-emerald-400 active:translate-y-0.5 transition-all"
                    >
                      <UserCheck size={20} />
                    </button>
                    <button 
                      onClick={() => respondToFriendRequest(req.id, false)}
                      className="p-2.5 bg-rose-500 text-white rounded-xl shadow-md hover:bg-rose-400 active:translate-y-0.5 transition-all"
                    >
                      <UserX size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Friends List */}
      <section className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-[0_8px_0_0_#e0e7ff] border-4 border-indigo-50 min-h-[300px]">
        <h3 className="text-xl md:text-2xl font-black text-indigo-900 mb-8 flex items-center gap-3">
          <Users className="text-indigo-400" /> MY BUDDIES ({friendsData.length})
        </h3>
        {friendsData.length === 0 ? (
          <div className="py-20 text-center bg-indigo-50/50 rounded-[2rem] border-4 border-dashed border-indigo-100">
            <div className="text-5xl mb-4">🏠</div>
            <p className="text-indigo-300 font-bold text-lg uppercase tracking-tight italic">Your lobby is empty! Search for friends above.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {friendsData.map(friend => (
              <div key={friend.uid} className="group relative flex items-center justify-between p-5 bg-white rounded-[2rem] border-2 border-indigo-50 shadow-sm hover:border-indigo-400 hover:shadow-xl transition-all overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-50 rounded-full -mr-8 -mt-8 group-hover:scale-[3] group-hover:bg-indigo-100 transition-all duration-500" />
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center text-3xl shadow-sm border-2 border-white group-hover:rotate-6 transition-transform">🐯</div>
                  <div>
                    <h4 className="font-black text-indigo-900 uppercase text-lg leading-none">{friend.displayName}</h4>
                    <div className="flex items-center gap-2 mt-2">
                       <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                       <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Online</span>
                    </div>
                  </div>
                </div>
                <button className="relative z-10 p-3 bg-indigo-600 text-white rounded-xl shadow-lg hover:scale-110 active:scale-95 transition-all opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0">
                  <UserCheck size={20} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

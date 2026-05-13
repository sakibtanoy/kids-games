import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';
import { useAuth } from './AuthProvider';
import { Users, X, Play, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';
import { GAMES } from '../constants';

export default function MultiplayerLobby({ onStartGame, onClose }: { onStartGame: (gameId: string, roomId: string) => void, onClose: () => void }) {
  const { user, profile } = useAuth();
  const [roomId, setRoomId] = useState('');
  const [roomData, setRoomData] = useState<any>(null);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (!roomData?.id) return;
    const unsub = onSnapshot(doc(db, 'rooms', roomData.id), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setRoomData({ id: snap.id, ...data });
        if (data.status === 'playing' && data.gameId) {
          onStartGame(data.gameId, snap.id);
        }
      }
    });
    return unsub;
  }, [roomData?.id, onStartGame]);

  const createRoom = async () => {
    if (!user || !profile) return;
    const newCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    const payload = {
      host: user.uid,
      status: 'waiting',
      players: [{ uid: user.uid, name: profile.displayName }],
      createdAt: Date.now()
    };
    await setDoc(doc(db, 'rooms', newCode), payload);
    setRoomData({ id: newCode, ...payload });
  };

  const joinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || !roomId) return;
    setIsJoining(true);
    try {
      const code = roomId.toUpperCase();
      const r = await getDoc(doc(db, 'rooms', code));
      if (r.exists()) {
        await updateDoc(doc(db, 'rooms', code), {
          players: arrayUnion({ uid: user.uid, name: profile.displayName })
        });
        setRoomData({ id: code, ...r.data(), players: [...r.data().players, { uid: user.uid, name: profile.displayName }] });
      } else {
        alert('Room not found');
      }
    } finally {
      setIsJoining(false);
    }
  };

  const startGame = async (gameId: string) => {
    if (!roomData || roomData.host !== user?.uid) return;
    await updateDoc(doc(db, 'rooms', roomData.id), {
      status: 'playing',
      gameId
    });
  };

  if (roomData) {
    return (
      <div className="fixed inset-0 bg-indigo-900/95 z-[100] flex items-center justify-center p-6">
        <div className="bg-white rounded-[3rem] p-12 max-w-lg w-full text-center shadow-2xl relative">
          <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-xl">
            <X size={24} />
          </button>
          
          <h2 className="text-3xl font-black text-slate-800 mb-2 uppercase tracking-tighter">Lobby Code</h2>
          <div className="text-6xl font-black text-indigo-500 tracking-widest mb-8">{roomData.id}</div>
          
          <div className="bg-indigo-50 rounded-2xl p-6 mb-8 text-left">
            <h3 className="text-xl font-bold text-indigo-900 mb-4 flex items-center gap-2">
              <Users /> Players ({roomData.players.length}/4)
            </h3>
            <div className="space-y-3">
              {roomData.players.map((p: any, i: number) => (
                <div key={i} className="bg-white p-3 rounded-xl shadow-sm text-indigo-800 font-bold uppercase tracking-tight flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm">{i+1}</span>
                  {p.name}
                  {p.uid === roomData.host && <span className="ml-auto text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-md">HOST</span>}
                </div>
              ))}
            </div>
          </div>

          {roomData.host === user?.uid ? (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-500 uppercase tracking-widest text-left">Choose Game to Start:</h3>
              <div className="grid grid-cols-2 gap-3">
                {GAMES.map(g => (
                  <button key={g.id} onClick={() => startGame(g.id)} className={cn("p-4 rounded-2xl text-white font-black uppercase text-sm flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-lg", g.gradient)}>
                    <Play size={16} /> {g.title}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3 text-slate-500 font-bold uppercase tracking-widest h-20 animate-pulse">
              <RefreshCw className="animate-spin" /> Waiting for Host...
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-indigo-900/95 z-[100] flex items-center justify-center p-6">
      <div className="bg-white rounded-[3rem] p-12 max-w-sm w-full text-center shadow-2xl relative">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-xl">
          <X size={24} />
        </button>

        <Users size={64} className="text-indigo-500 mx-auto mb-6" />
        <h2 className="text-3xl font-black text-slate-800 mb-8 uppercase tracking-tighter">Multiplayer</h2>

        <button onClick={createRoom} className="w-full py-5 bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-[0_6px_0_0_rgba(79,70,229,1)] hover:bg-indigo-400 hover:translate-y-1 hover:shadow-[0_4px_0_0_rgba(79,70,229,1)] active:translate-y-2 active:shadow-none transition-all mb-8">
          Create Room
        </button>

        <div className="relative border-b-2 border-dashed border-slate-200 mb-8">
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-4 text-slate-400 font-bold tracking-widest text-sm uppercase">OR JOIN</span>
        </div>

        <form onSubmit={joinRoom} className="space-y-4">
          <input 
            type="text" 
            placeholder="ENTER 4-LETTER CODE" 
            value={roomId}
            onChange={(e) => setRoomId(e.target.value.toUpperCase())}
            maxLength={4}
            className="w-full p-5 bg-slate-100 rounded-2xl text-center text-2xl font-black text-slate-700 tracking-[0.2em] outline-none focus:ring-4 focus:ring-indigo-100 transition-all border-2 border-transparent focus:border-indigo-300 placeholder:text-slate-300"
          />
          <button disabled={roomId.length !== 4 || isJoining} type="submit" className="w-full py-5 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-[0_6px_0_0_rgba(16,185,129,1)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-400 active:translate-y-2 active:shadow-none transition-all">
            {isJoining ? 'Joining...' : 'Join Room'}
          </button>
        </form>
      </div>
    </div>
  );
}

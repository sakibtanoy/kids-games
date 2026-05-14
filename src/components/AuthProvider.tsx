import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInAnonymously, 
  User as FirebaseUser,
  signOut
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp, 
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
  arrayUnion,
  deleteDoc,
  updateDoc
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  checkUsername: (username: string) => Promise<boolean>;
  claimUsername: (username: string) => Promise<void>;
  searchUsers: (query: string) => Promise<UserProfile[]>;
  sendFriendRequest: (targetUid: string) => Promise<void>;
  respondToFriendRequest: (requestId: string, accept: boolean) => Promise<void>;
}


const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);


        
        // Use onSnapshot for real-time profile updates (scores, achievements, parental controls)
        const unsubProfile = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            // Create profile if it doesn't exist
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || 'Hero',
              avatarUrl: firebaseUser.photoURL || undefined,
              totalScore: 0,
              badges: [],
              achievements: [],
              friends: [],
              parentalControls: {
                timeLimitMinutes: 60,
                restrictedGames: [],
                isMuted: false
              },
              isUsernameSet: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };

            setDoc(userDocRef, {
              ...newProfile,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            }).catch(e => {
              console.error("Failed to create user profile:", e);
              handleFirestoreError(e, OperationType.WRITE, `users/${firebaseUser.uid}`);
            });
          }
          setLoading(false);
        }, (error) => {
          console.error("Profile snapshot error:", error);
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
          setLoading(false);
        });

        return () => unsubProfile();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    try {
      await signInAnonymously(auth);
    } catch (error) {
      console.error("Anonymous sign in failed", error);
    } finally {
      setIsSigningIn(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    try {
      await setDoc(userDocRef, {
        ...data,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    }


  };

  const checkUsername = async (username: string) => {
    const docRef = doc(db, 'usernames', username.toLowerCase());
    const docSnap = await getDoc(docRef);
    return !docSnap.exists();
  };

  const claimUsername = async (username: string) => {
    if (!user) return;
    const lowerUsername = username.toLowerCase();
    const usernameDocRef = doc(db, 'usernames', lowerUsername);
    
    // 1. Claim in usernames collection
    await setDoc(usernameDocRef, { uid: user.uid });
    
    await updateProfile({ 
      displayName: username,
      isUsernameSet: true 
    });
  };

  const searchUsers = async (searchTerm: string): Promise<UserProfile[]> => {
    if (!searchTerm || searchTerm.length < 3) return [];
    const q = query(
      collection(db, 'users'),
      where('displayName', '>=', searchTerm),
      where('displayName', '<=', searchTerm + '\uf8ff')
    );
    const snap = await getDocs(q);
    return snap.docs
      .map(d => d.data() as UserProfile)
      .filter(p => p.uid !== user?.uid);
  };

  const sendFriendRequest = async (targetUid: string) => {
    if (!user || !profile) return;
    const requestId = [user.uid, targetUid].sort().join('_');
    await setDoc(doc(db, 'friendRequests', requestId), {
      senderUid: user.uid,
      senderName: profile.displayName,
      receiverUid: targetUid,
      status: 'pending',
      createdAt: serverTimestamp()
    });
  };

  const respondToFriendRequest = async (requestId: string, accept: boolean) => {
    if (!user) return;
    const requestRef = doc(db, 'friendRequests', requestId);
    
    if (accept) {
      const snap = await getDoc(requestRef);
      if (snap.exists()) {
        const data = snap.data();
        const otherUid = data.senderUid === user.uid ? data.receiverUid : data.senderUid;
        
        // Add to both users' friend lists
        await updateProfile({ friends: arrayUnion(otherUid) });
        await updateDoc(doc(db, 'users', otherUid), { friends: arrayUnion(user.uid) });
      }
    }
    
    await deleteDoc(requestRef);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, logout, updateProfile, checkUsername, claimUsername, searchUsers, sendFriendRequest, respondToFriendRequest }}>
      {children}
    </AuthContext.Provider>
  );

}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

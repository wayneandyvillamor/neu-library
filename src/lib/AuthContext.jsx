// src/lib/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithPopup, GoogleAuthProvider,
  signOut, onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

const AuthContext = createContext(null);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  hd: 'neu.edu.ph',
  prompt: 'select_account', // Always show account picker, never auto sign-in
});

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function ensureProfile(firebaseUser) {
    const ref  = doc(db, 'users', firebaseUser.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      setProfile(snap.data());
      return snap.data();
    }
    // Auto-create profile for first-time Google sign-in
    const displayName = firebaseUser.displayName || firebaseUser.email.split('@')[0];
    const parts = displayName.trim().split(' ');
    const data = {
      uid:         firebaseUser.uid,
      email:       firebaseUser.email,
      displayName,
      firstName:   parts[0] || '',
      lastName:    parts.slice(1).join(' ') || '',
      photoURL:    firebaseUser.photoURL || '',
      role:        'student', // default; manually set to 'admin' in Firestore
      department:  '',
      program:     '',
      studentId:   '',
      createdAt:   serverTimestamp(),
      updatedAt:   serverTimestamp(),
    };
    await setDoc(ref, data);
    setProfile(data);
    return data;
  }

  async function loginGoogle() {
    const result = await signInWithPopup(auth, googleProvider);
    if (!result.user.email?.endsWith('@neu.edu.ph')) {
      await signOut(auth);
      throw new Error('Only @neu.edu.ph Google accounts are allowed.');
    }
    const profile = await ensureProfile(result.user);
    if (profile?.blocked) {
      await signOut(auth);
      throw new Error('Your account has been blocked. Please contact the library admin.');
    }
    return profile;
  }

  function logout() {
    return signOut(auth);
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        await ensureProfile(u);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const value = {
    user, profile, loading,
    loginGoogle, logout,
    isAdmin:   profile?.role === 'admin',
    isStudent: profile?.role === 'student',
    // Refresh profile from Firestore
    refreshProfile: async () => {
      if (user) await ensureProfile(user);
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

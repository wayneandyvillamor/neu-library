// src/lib/firebase.js
// Replace values below with your own from Firebase Console → Project Settings
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            "AIzaSyB74pONP8H2a_q-AAt8XXCwaNa4ywiU0qw",
  authDomain:        "neweralibrary-1a846.firebaseapp.com",
  projectId:         "neweralibrary-1a846",
  storageBucket:     "neweralibrary-1a846.firebasestorage.app",
  messagingSenderId: "529645451276",
  appId:             "1:529645451276:web:65cb2bf8a707b7bd651629",
};

const app   = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);
export default app;

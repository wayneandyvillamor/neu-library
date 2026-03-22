// src/hooks/useFirestore.js
import { useState, useEffect } from 'react';
import {
  collection, query, where, orderBy, onSnapshot,
  doc, addDoc, updateDoc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export function toDate(val) {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (val.toDate) return val.toDate();
  return new Date(val);
}

// ── All visits or own visits ──────────────────────────────────────────────
export function useVisits(studentId = null) {
  const [visits, setVisits]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = studentId
      ? query(collection(db, 'visits'), where('studentId', '==', studentId), orderBy('timeIn', 'desc'))
      : query(collection(db, 'visits'), orderBy('timeIn', 'desc'));

    const unsub = onSnapshot(q, snap => {
      setVisits(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, [studentId]);

  return { visits, loading };
}

// ── All users ─────────────────────────────────────────────────────────────
export function useUsers(search = '') {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('displayName'));
    const unsub = onSnapshot(q, snap => {
      let docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (search) {
        const t = search.toLowerCase();
        docs = docs.filter(u =>
          u.displayName?.toLowerCase().includes(t) ||
          u.studentId?.toLowerCase().includes(t) ||
          u.email?.toLowerCase().includes(t) ||
          u.department?.toLowerCase().includes(t) ||
          u.program?.toLowerCase().includes(t)
        );
      }
      setUsers(docs);
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, [search]);

  return { users, loading };
}

// ── Visit operations ──────────────────────────────────────────────────────
export const visitOps = {
  async timeIn({ studentId, studentName, studentIdNumber, department, program, visitorType, purpose }) {
    return addDoc(collection(db, 'visits'), {
      studentId,
      studentName,
      studentIdNumber,
      department,
      program,
      visitorType: visitorType || 'Student',
      purpose,
      timeIn:    serverTimestamp(),
      timeOut:   null,
      status:    'active',
      createdAt: serverTimestamp(),
    });
  },
  async timeOut(visitId) {
    return updateDoc(doc(db, 'visits', visitId), {
      timeOut: serverTimestamp(),
      status:  'completed',
    });
  },
};

// ── User role ops ─────────────────────────────────────────────────────────
export const userOps = {
  async setRole(userId, role) {
    return updateDoc(doc(db, 'users', userId), { role, updatedAt: serverTimestamp() });
  },
  async updateProfile(userId, data) {
    return updateDoc(doc(db, 'users', userId), { ...data, updatedAt: serverTimestamp() });
  },
  async setBlocked(userId, blocked) {
    return updateDoc(doc(db, 'users', userId), { blocked, updatedAt: serverTimestamp() });
  },
};

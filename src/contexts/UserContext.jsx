import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useLocalStorage } from '../hooks/useLocalStorage';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(undefined); // undefined = loading
  const [user, setUser] = useLocalStorage('mutelearn-user', {
    name: '',
    gradeLevel: '',
    hasOnboarded: false,
  });
  const [firestoreLoaded, setFirestoreLoaded] = useState(false);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser || null);
      if (!fbUser) {
        setFirestoreLoaded(true);
      }
    });
    return unsubscribe;
  }, []);

  // When Firebase user signs in, load their profile from Firestore
  useEffect(() => {
    if (!firebaseUser) {
      setFirestoreLoaded(true);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (cancelled) return;

        if (userDoc.exists()) {
          const data = userDoc.data();
          setUser({
            name: data.name || firebaseUser.displayName || '',
            gradeLevel: data.gradeLevel || '',
            hasOnboarded: data.hasOnboarded || false,
          });
        } else {
          // New user — pre-fill from Google profile if available
          setUser({
            name: firebaseUser.displayName || '',
            gradeLevel: '',
            hasOnboarded: false,
          });
        }
      } catch {
        // Firestore unavailable — keep localStorage data
      }
      if (!cancelled) setFirestoreLoaded(true);
    })();

    return () => { cancelled = true; };
  }, [firebaseUser, setUser]);

  const updateUser = useCallback(
    (updates) => {
      setUser((prev) => ({ ...prev, ...updates }));

      // Sync to Firestore
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        updateDoc(userRef, updates).catch(() => {});
      }
    },
    [firebaseUser, setUser]
  );

  const completeOnboarding = useCallback(
    (name, gradeLevel) => {
      const updates = { name, gradeLevel, hasOnboarded: true };
      setUser((prev) => ({ ...prev, ...updates }));

      // Save to Firestore
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        setDoc(userRef, {
          ...updates,
          email: firebaseUser.email || '',
          createdAt: new Date().toISOString(),
        }, { merge: true }).catch(() => {});
      }
    },
    [firebaseUser, setUser]
  );

  const logout = useCallback(async () => {
    await signOut(auth);
    setUser({ name: '', gradeLevel: '', hasOnboarded: false });
    // Clear all mutelearn localStorage
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key?.startsWith('mutelearn-')) {
        localStorage.removeItem(key);
      }
    }
  }, [setUser]);

  // Auth state: undefined = loading, null = not signed in, object = signed in
  const authLoading = firebaseUser === undefined || !firestoreLoaded;
  const isSignedIn = firebaseUser !== undefined && firebaseUser !== null;

  return (
    <UserContext.Provider
      value={{
        user,
        firebaseUser,
        authLoading,
        isSignedIn,
        updateUser,
        completeOnboarding,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within UserProvider');
  return context;
}

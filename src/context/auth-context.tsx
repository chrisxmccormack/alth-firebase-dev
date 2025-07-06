"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, firestore, isFirebaseInitialized } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';
import type { UserData } from '@/types';

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseInitialized) {
      setLoading(false);
      return;
    }
    
    const unsubscribeAuth = onAuthStateChanged(auth!, (user) => {
      setUser(user);
      if (user) {
        const userDocRef = doc(firestore!, 'users', user.uid);
        const unsubscribeUser = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            setUserData(doc.data() as UserData);
          } else {
            setUserData(null);
          }
          setLoading(false);
        }, () => {
          setUserData(null);
          setLoading(false);
        });
        return () => unsubscribeUser();
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  if (!isFirebaseInitialized) {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-foreground p-4">
            <div className="rounded-lg border border-destructive bg-card p-8 text-center text-card-foreground shadow-lg max-w-lg">
                <h1 className="text-2xl font-bold text-destructive">Firebase Not Configured</h1>
                <p className="mt-4 text-muted-foreground">
                    Your Firebase environment variables are missing or invalid. Please copy the
                    <code className="mx-1.5 rounded bg-muted px-1 py-0.5 font-mono text-sm">.env.local.example</code>
                    file to
                    <code className="mx-1.5 rounded bg-muted px-1 py-0.5 font-mono text-sm">.env.local</code>
                    and fill in your Firebase project credentials.
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                    Refer to the <code className="mx-1 rounded bg-muted px-1 py-0.5 font-mono text-sm">README.md</code> for full setup instructions.
                </p>
            </div>
        </div>
    );
  }

  const value = { user, userData, loading };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

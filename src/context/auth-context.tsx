"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, isFirebaseInitialized } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseInitialized) {
      setLoading(false);
      return;
    }
    // `auth` is guaranteed to be non-null if `isFirebaseInitialized` is true.
    const unsubscribe = onAuthStateChanged(auth!, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
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

  const value = { user, loading };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="flex h-screen w-full items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

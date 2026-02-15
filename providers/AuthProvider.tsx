import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase'; // uses EXPO_PUBLIC_SUPABASE_* from .env

type AuthContextType = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
  isAuthenticated: false,
});

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value: AuthContextType = {
    session,
    user: session?.user ?? null,
    isLoading,
    isAuthenticated: !!session?.user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';

interface AuthContextType {
  sessionId: string | null;
  initializeSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [sessionId, setSessionId] = useState<string | null>(null);

  const initializeSession = () => {
    let currentSessionId = Cookies.get('sessionId');
    console.log('Current session ID from cookies:', currentSessionId);
    if (!currentSessionId) {
      currentSessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
      console.log('Creating new session ID:', currentSessionId);
      Cookies.set('sessionId', currentSessionId, { expires: 365 }); // Cookie expires in 1 year
    }
    setSessionId(currentSessionId);
  };

  useEffect(() => {
    initializeSession();
  }, []);

  return (
    <AuthContext.Provider value={{ sessionId, initializeSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 
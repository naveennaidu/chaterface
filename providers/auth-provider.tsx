'use client';

import { createContext, useContext, useState } from 'react';
import { auth, useAuth as useInstantAuth } from '@/lib/instant-client';
import { User } from '@instantdb/react';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: { message: string } | null;
  sendMagicCode: (email: string) => Promise<void>;
  signInWithMagicCode: (email: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoading, user, error } = useInstantAuth();
  
  const isAuthenticated = !!user;
  
  // Send magic code to user's email
  const sendMagicCode = async (email: string) => {
    try {
      await auth.sendMagicCode({ email });
      console.log('Magic code sent to:', email);
    } catch (error) {
      console.error('Error sending magic code:', error);
      throw error;
    }
  };
  
  // Sign in with the magic code
  const signInWithMagicCode = async (email: string, code: string) => {
    try {
      await auth.signInWithMagicCode({ email, code });
      console.log('User authenticated successfully');
    } catch (error) {
      console.error('Error signing in with magic code:', error);
      throw error;
    }
  };
  
  // Sign out the user
  const signOut = async () => {
    try {
      await auth.signOut();
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };
  
  return (
    <AuthContext.Provider value={{ 
      user: user || null, 
      isAuthenticated, 
      isLoading,
      error: error || null, 
      sendMagicCode, 
      signInWithMagicCode, 
      signOut 
    }}>
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
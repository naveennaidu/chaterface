'use client';

import { i, init } from "@instantdb/react";
import { createContext, useContext, useEffect, useState } from 'react';
import schema from "@/instant.schema";

const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID as string;

const db = init({ appId: APP_ID, schema });

interface DatabaseContextType {
  db: typeof db;
  isInitialized: boolean;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    init({
      appId: APP_ID,
      schema: schema,
    });
    setIsInitialized(true);
  }, []);

  return (
    <DatabaseContext.Provider value={{ db, isInitialized }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
} 
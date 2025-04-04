import { init } from '@instantdb/react';
import schema from '../instant.schema';

// Initialize InstantDB client
export const db = init({
  appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID || '',
  schema,
});

// Export InstantDB hooks and utilities
export const { useQuery, useAuth, auth } = db;

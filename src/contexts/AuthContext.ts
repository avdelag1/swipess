import { createContext } from 'react';
import { User, Session } from '@supabase/supabase-js';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
  signUp: (email: string, password: string, role?: 'client' | 'owner', name?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string, role?: 'client' | 'owner') => Promise<{ error: any }>;
  signInWithOAuth: (provider: 'google' | 'apple', role?: 'client' | 'owner') => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const authGlobal = globalThis as typeof globalThis & {
  __SWIPESS_AUTH_CONTEXT__?: ReturnType<typeof createContext<AuthContextType | undefined>>;
};

export const AuthContext = authGlobal.__SWIPESS_AUTH_CONTEXT__ ?? (
  authGlobal.__SWIPESS_AUTH_CONTEXT__ = createContext<AuthContextType | undefined>(undefined)
);

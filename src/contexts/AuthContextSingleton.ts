
import React from 'react';
import { Session } from '@supabase/supabase-js';

// Types for authentication context
interface User {
  id: string;
  name: string;
  type: 'cartorio' | 'admin';
  token?: string;
  jwtToken?: string;
  cartorio_id?: string;
  cartorio_name?: string;
  username?: string;
  email?: string;
}

interface CartorioLoginData {
  username: string;
  cartorio_id?: string;
  cartorio_name?: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  login: (token: string, type: 'cartorio' | 'admin', userData?: Partial<User>) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  authenticatedClient: any;
  isLoading: boolean;
  isAdmin: boolean;
}

// SINGLETON VERDADEIRO: Criação única do contexto
let authContextInstance: React.Context<AuthContextType | undefined> | null = null;
const CONTEXT_ID = `AuthContext_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Função para criar ou retornar o contexto singleton
export const getAuthContext = (): React.Context<AuthContextType | undefined> => {
  if (!authContextInstance) {
    console.log('🔐 [AuthContextSingleton] Creating SINGLE instance:', CONTEXT_ID);
    
    authContextInstance = React.createContext<AuthContextType | undefined>(undefined);
    authContextInstance.displayName = `AuthContextSingleton_${CONTEXT_ID}`;
  } else {
    console.log('🔐 [AuthContextSingleton] Returning existing instance:', CONTEXT_ID);
  }
  
  return authContextInstance;
};

// Export o contexto singleton
export const AuthContext = getAuthContext();

// Debug functions
export const getAuthContextId = () => CONTEXT_ID;

export const debugAuthContext = (location: string) => {
  console.log(`🔐 [${location}] Using AuthContext ID:`, CONTEXT_ID);
  console.log(`🔐 [${location}] Context reference:`, AuthContext);
  console.log(`🔐 [${location}] Context instance check:`, AuthContext === authContextInstance);
};

// Reset function (apenas para debug/testes)
export const resetAuthContextInstance = () => {
  console.log('🔐 [AuthContextSingleton] RESETTING INSTANCE');
  authContextInstance = null;
};

export type { User, CartorioLoginData, AuthContextType };

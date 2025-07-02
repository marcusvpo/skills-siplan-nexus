
import React from 'react';
import { Session } from '@supabase/supabase-js';

// Tipos para o contexto de autenticação
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

// Implementação Singleton do AuthContext
class AuthContextSingleton {
  private static instance: AuthContextSingleton;
  private context: React.Context<AuthContextType>;
  private contextId: string;

  private constructor() {
    // Gerar um ID único para esta instância do contexto
    this.contextId = `AuthContext_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('🔐 [AuthContextSingleton] Creating SINGLETON context instance:', this.contextId);
    
    // Criar o contexto React com valor padrão
    this.context = React.createContext<AuthContextType>({
      user: null,
      session: null,
      login: async () => {},
      logout: () => {},
      isAuthenticated: false,
      authenticatedClient: null,
      isLoading: false,
      isAdmin: false
    });

    // Adicionar nome para debug
    this.context.displayName = `AuthContextSingleton_${this.contextId}`;
  }

  public static getInstance(): AuthContextSingleton {
    if (!AuthContextSingleton.instance) {
      console.log('🔐 [AuthContextSingleton] First time access - creating new instance');
      AuthContextSingleton.instance = new AuthContextSingleton();
    } else {
      console.log('🔐 [AuthContextSingleton] Returning existing instance:', AuthContextSingleton.instance.contextId);
    }
    
    return AuthContextSingleton.instance;
  }

  public getContext(): React.Context<AuthContextType> {
    console.log('🔐 [AuthContextSingleton] Context accessed:', this.contextId);
    return this.context;
  }

  public getContextId(): string {
    return this.contextId;
  }

  // Método para forçar reset (útil para testes ou desenvolvimento)
  public static resetInstance(): void {
    console.log('🔐 [AuthContextSingleton] RESETTING SINGLETON INSTANCE');
    AuthContextSingleton.instance = null as any;
  }
}

// Exportar a instância singleton do contexto
const authContextSingleton = AuthContextSingleton.getInstance();
export const AuthContext = authContextSingleton.getContext();

// Exportar função para debug
export const getAuthContextId = () => authContextSingleton.getContextId();

// Função para verificar se estamos usando a mesma instância
export const debugAuthContext = (location: string) => {
  console.log(`🔐 [${location}] Using AuthContext ID:`, authContextSingleton.getContextId());
  console.log(`🔐 [${location}] Context reference:`, AuthContext);
};

export type { User, CartorioLoginData, AuthContextType };

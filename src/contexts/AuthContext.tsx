
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { useStableAuth } from '@/hooks/useStableAuth';
import { createAuthenticatedClient } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authenticatedClient, setAuthenticatedClient] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const stableAuth = useStableAuth();

  // Função para restaurar usuário do localStorage - executada apenas uma vez
  const restoreUserFromStorage = useCallback(() => {
    if (isInitialized) return null;
    
    const savedUser = localStorage.getItem('siplan-user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        if (userData.type === 'cartorio' && userData.jwtToken) {
          logger.info('🔐 [AuthContext] Restoring user from localStorage', {
            cartorio_id: userData.cartorio_id,
            username: userData.username
          });
          
          setCurrentUser(userData);
          const authClient = createAuthenticatedClient(userData.jwtToken);
          setAuthenticatedClient(authClient);
          
          return userData;
        }
      } catch (err) {
        logger.error('❌ [AuthContext] Error restoring saved user:', err);
        localStorage.removeItem('siplan-user');
      }
    }
    return null;
  }, [isInitialized]);

  // Inicialização única
  useEffect(() => {
    if (!isInitialized) {
      restoreUserFromStorage();
      setIsInitialized(true);
    }
  }, [isInitialized, restoreUserFromStorage]);

  // Gerenciar usuário admin - apenas quando há mudança real na sessão
  useEffect(() => {
    if (stableAuth.session?.user && stableAuth.isAdmin && currentUser?.type !== 'admin') {
      logger.info('🔐 [AuthContext] Setting admin user');
      
      const adminUser: User = {
        id: stableAuth.session.user.id,
        name: 'Administrador',
        type: 'admin',
        email: stableAuth.session.user.email || ''
      };
      
      setCurrentUser(adminUser);
      
      // Limpar dados de cartório se existirem
      if (currentUser?.type === 'cartorio') {
        localStorage.removeItem('siplan-user');
        setAuthenticatedClient(null);
      }
    } else if (!stableAuth.session && currentUser?.type === 'admin') {
      logger.info('🔐 [AuthContext] Clearing admin user - no session');
      setCurrentUser(null);
      setAuthenticatedClient(null);
    }
  }, [stableAuth.session?.user?.id, stableAuth.isAdmin, currentUser?.type]);

  const loginCartorio = useCallback(async (token: string, userData: CartorioLoginData): Promise<User> => {
    logger.info('🔐 [AuthContext] Starting cartorio login', { 
      username: userData.username,
      cartorio_id: userData.cartorio_id
    });

    try {
      const response = await fetch('https://bnulocsnxiffavvabfdj.supabase.co/functions/v1/login-cartorio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJudWxvY3NueGlmZmF2dmFiZmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NzM1NTMsImV4cCI6MjA2NjQ0OTU1M30.3QeKQtbvTN4KQboUKhqOov16HZvz-xVLxmhl70S2IAE`,
        },
        body: JSON.stringify({ 
          username: userData.username, 
          login_token: token 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to authenticate: ${response.status}`);
      }

      const authData = await response.json();
      
      if (!authData.success || !authData.token) {
        throw new Error('Invalid response from login service');
      }

      // Criar usuário com dados completos
      const newUser: User = {
        id: authData.usuario?.id || userData.username,
        name: authData.usuario?.username || userData.username,
        type: 'cartorio',
        token: token,
        jwtToken: authData.token,
        cartorio_id: authData.cartorio?.id,
        cartorio_name: authData.cartorio?.nome,
        username: authData.usuario?.username || userData.username,
        email: authData.usuario?.email
      };

      // Criar cliente autenticado
      const authClient = createAuthenticatedClient(authData.token);
      
      // Atualizar estados
      setCurrentUser(newUser);
      setAuthenticatedClient(authClient);
      
      // Salvar no localStorage
      localStorage.setItem('siplan-user', JSON.stringify(newUser));

      logger.info('✅ [AuthContext] Cartorio login successful', {
        cartorio_id: newUser.cartorio_id,
        cartorio_name: newUser.cartorio_name,
        username: newUser.username
      });

      return newUser;
    } catch (error) {
      logger.error('❌ [AuthContext] Cartorio login failed:', error);
      throw error;
    }
  }, []);

  const login = async (token: string, type: 'cartorio' | 'admin', userData?: Partial<User>) => {
    logger.info('🔐 [AuthContext] Login called:', { type, hasUserData: !!userData });
    
    if (type === 'cartorio') {
      if (!userData?.username) {
        throw new Error('Username é obrigatório para login de cartório');
      }
      
      await loginCartorio(token, {
        username: userData.username,
        cartorio_id: userData.cartorio_id,
        cartorio_name: userData.cartorio_name,
        email: userData.email
      });
    } else {
      // Para admin, usar o fluxo normal
      const newUser: User = {
        id: userData?.id || '1',
        name: userData?.name || 'Administrador',
        type,
        email: userData?.email
      };
      setCurrentUser(newUser);
    }
    
    logger.info('✅ [AuthContext] Login completed successfully');
  };

  const logout = async () => {
    logger.info('🔐 [AuthContext] Logout called');
    
    // Sign out from Supabase Auth if it's an admin
    if (currentUser?.type === 'admin') {
      await stableAuth.logout();
    }
    
    // Clear all auth state
    setCurrentUser(null);
    setAuthenticatedClient(null);
    localStorage.removeItem('siplan-user');
    
    logger.info('✅ [AuthContext] Logout completed');
  };

  // Determinar dados finais sem causar re-render
  const finalUser = currentUser || (stableAuth.session?.user && stableAuth.isAdmin ? {
    id: stableAuth.session.user.id,
    name: 'Administrador',
    type: 'admin' as const,
    email: stableAuth.session.user.email || ''
  } : null);

  const isAuthenticated = !!finalUser || !!stableAuth.session;

  const contextValue = {
    user: finalUser, 
    session: stableAuth.session, 
    login, 
    logout, 
    isAuthenticated, 
    authenticatedClient,
    isLoading: stableAuth.isLoading,
    isAdmin: stableAuth.isAdmin
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

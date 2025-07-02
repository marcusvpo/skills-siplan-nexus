
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { useStableAuth } from '@/hooks/useStableAuth';
import { useCartorioAuth } from '@/hooks/useCartorioAuth';
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
  
  const stableAuth = useStableAuth();
  const cartorioAuth = useCartorioAuth();

  // Inicialização
  useEffect(() => {
    // Primeiro, tentar restaurar usuário de cartório
    const savedCartorioUser = cartorioAuth.restoreSavedUser();
    if (savedCartorioUser) {
      setCurrentUser(savedCartorioUser);
    }
  }, [cartorioAuth]);

  // Gerenciar usuário admin
  useEffect(() => {
    if (stableAuth.session?.user && stableAuth.isAdmin) {
      logger.info('🔐 [AuthContext] Setting admin user');
      
      const adminUser: User = {
        id: stableAuth.session.user.id,
        name: 'Administrador',
        type: 'admin',
        email: stableAuth.session.user.email || ''
      };
      
      setCurrentUser(adminUser);
      
      // Limpar dados de cartório se existirem
      if (cartorioAuth.user?.type === 'cartorio') {
        cartorioAuth.clearCartorioAuth();
      }
    } else if (!stableAuth.session && currentUser?.type === 'admin') {
      logger.info('🔐 [AuthContext] Clearing admin user - no session');
      setCurrentUser(null);
    }
  }, [stableAuth.session, stableAuth.isAdmin, cartorioAuth, currentUser?.type]);

  const login = async (token: string, type: 'cartorio' | 'admin', userData?: Partial<User>) => {
    logger.info('🔐 [AuthContext] Login called:', { type, hasUserData: !!userData });
    
    if (type === 'cartorio') {
      if (!userData?.username) {
        throw new Error('Username é obrigatório para login de cartório');
      }
      
      const cartorioUser = await cartorioAuth.loginCartorio(token, {
        username: userData.username,
        cartorio_id: userData.cartorio_id,
        cartorio_name: userData.cartorio_name,
        email: userData.email
      });
      
      setCurrentUser(cartorioUser);
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
    
    // Clear cartorio auth
    if (currentUser?.type === 'cartorio') {
      cartorioAuth.clearCartorioAuth();
    }
    
    setCurrentUser(null);
    
    logger.info('✅ [AuthContext] Logout completed');
  };

  // Determinar dados finais
  const finalUser = currentUser || (stableAuth.session?.user && stableAuth.isAdmin ? {
    id: stableAuth.session.user.id,
    name: 'Administrador',
    type: 'admin' as const,
    email: stableAuth.session.user.email || ''
  } : null);

  const isAuthenticated = !!finalUser || !!stableAuth.session;
  const authenticatedClient = currentUser?.type === 'cartorio' ? cartorioAuth.authenticatedClient : null;

  return (
    <AuthContext.Provider value={{ 
      user: finalUser, 
      session: stableAuth.session, 
      login, 
      logout, 
      isAuthenticated, 
      authenticatedClient,
      isLoading: stableAuth.isLoading,
      isAdmin: stableAuth.isAdmin
    }}>
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

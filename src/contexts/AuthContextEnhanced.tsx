
import React, { createContext, useContext, useState, useEffect } from 'react';
import { createAuthenticatedClient, supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { useStableAuthEnhanced } from '@/hooks/useStableAuthEnhanced';
import { logger } from '@/utils/logger';

interface User {
  id: string;
  name: string;
  type: 'cartorio' | 'admin';
  token?: string;
  cartorio_id?: string;
  cartorio_name?: string;
  username?: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  login: (token: string, type: 'cartorio' | 'admin', userData?: Partial<User>) => void;
  logout: () => void;
  isAuthenticated: boolean;
  authenticatedClient: any;
  isLoading: boolean;
  isAdmin: boolean;
  refreshSession: () => Promise<void>;
  isInitialized: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProviderEnhanced: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authenticatedClient, setAuthenticatedClient] = useState<any>(null);
  
  const stableAuth = useStableAuthEnhanced();

  // Recuperar usuário de cartório do localStorage na inicialização
  useEffect(() => {
    const savedUser = localStorage.getItem('siplan-user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        if (userData.type === 'cartorio' && userData.token) {
          logger.info('🔄 [AuthProviderEnhanced] Recovering cartorio user from localStorage:', {
            username: userData.username,
            cartorio: userData.cartorio_name
          });
          
          setUser(userData);
          const authClient = createAuthenticatedClient(userData.token);
          setAuthenticatedClient(authClient);
        }
      } catch (err) {
        logger.error('❌ [AuthProviderEnhanced] Error parsing saved user:', err);
        localStorage.removeItem('siplan-user');
      }
    }
  }, []);

  // Sincronizar usuário admin com stableAuth
  useEffect(() => {
    if (stableAuth.session?.user && stableAuth.isAdmin && stableAuth.isInitialized) {
      const adminUser: User = {
        id: stableAuth.session.user.id,
        name: 'Administrador',
        type: 'admin',
        email: stableAuth.session.user.email || ''
      };
      
      logger.info('🔄 [AuthProviderEnhanced] Setting admin user:', {
        email: adminUser.email,
        id: adminUser.id
      });
      
      setUser(adminUser);
      setAuthenticatedClient(null); // Admin usa supabase client padrão
    } else if (!stableAuth.session && user?.type === 'admin' && stableAuth.isInitialized) {
      logger.info('🔄 [AuthProviderEnhanced] Clearing admin user (no session)');
      setUser(null);
      setAuthenticatedClient(null);
    }
  }, [stableAuth.session, stableAuth.isAdmin, stableAuth.isInitialized, user?.type]);

  const login = (token: string, type: 'cartorio' | 'admin', userData?: Partial<User>) => {
    const newUser: User = {
      id: userData?.id || '1',
      name: userData?.name || (type === 'cartorio' ? 'Cartório' : 'Administrador'),
      type,
      token: type === 'cartorio' ? token : undefined,
      cartorio_id: userData?.cartorio_id,
      cartorio_name: userData?.cartorio_name,
      username: userData?.username,
      email: userData?.email
    };
    
    logger.info('🔐 [AuthProviderEnhanced] User login:', {
      type,
      username: newUser.username || newUser.email,
      cartorio: newUser.cartorio_name
    });
    
    setUser(newUser);
    localStorage.setItem('siplan-user', JSON.stringify(newUser));
    
    // Criar cliente autenticado para cartórios
    if (type === 'cartorio') {
      const authClient = createAuthenticatedClient(token);
      setAuthenticatedClient(authClient);
    }
  };

  const logout = async () => {
    logger.info('🚪 [AuthProviderEnhanced] Logout initiated');
    
    // Sign out from Supabase Auth se for admin
    if (user?.type === 'admin') {
      await stableAuth.logout();
    }
    
    setUser(null);
    setAuthenticatedClient(null);
    localStorage.removeItem('siplan-user');
  };

  const refreshSession = async () => {
    logger.info('🔄 [AuthProviderEnhanced] Refreshing session');
    
    if (user?.type === 'admin') {
      await stableAuth.refreshSession();
    } else if (user?.type === 'cartorio' && user.token) {
      // Para cartórios, recriar o cliente autenticado
      const authClient = createAuthenticatedClient(user.token);
      setAuthenticatedClient(authClient);
    }
  };

  const isAuthenticated = !!user || !!stableAuth.session;
  const isLoading = stableAuth.isLoading && !stableAuth.isInitialized;

  return (
    <AuthContext.Provider value={{ 
      user, 
      session: stableAuth.session, 
      login, 
      logout, 
      isAuthenticated, 
      authenticatedClient,
      isLoading,
      isAdmin: stableAuth.isAdmin,
      refreshSession,
      isInitialized: stableAuth.isInitialized
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

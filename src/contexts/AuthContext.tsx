
import React, { createContext, useContext, useState, useEffect } from 'react';
import { createAuthenticatedClient, supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { useStableAuth } from '@/hooks/useStableAuth';
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authenticatedClient, setAuthenticatedClient] = useState<any>(null);
  
  const stableAuth = useStableAuth();

  useEffect(() => {
    // Verificar usuário de cartório salvo no localStorage
    const savedUser = localStorage.getItem('siplan-user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        logger.info('🔐 [AuthContext] Restored user from localStorage:', { 
          type: userData.type, 
          cartorio_id: userData.cartorio_id,
          hasToken: !!userData.token,
          tokenLength: userData.token ? userData.token.length : 0
        });
        
        if (userData.type === 'cartorio' && userData.token) {
          setUser(userData);
          
          // Validar e criar cliente autenticado
          if (userData.token && userData.token.trim() !== '') {
            const authClient = createAuthenticatedClient(userData.token);
            setAuthenticatedClient(authClient);
            
            logger.info('✅ [AuthContext] Authenticated client created for cartorio:', {
              cartorio_id: userData.cartorio_id,
              hasClient: !!authClient,
              tokenType: userData.token.startsWith('CART-') ? 'CART' : 'JWT'
            });
          } else {
            logger.error('❌ [AuthContext] Invalid token in saved user data');
            // Limpar dados inválidos
            localStorage.removeItem('siplan-user');
          }
        }
      } catch (err) {
        logger.error('❌ [AuthContext] Error parsing saved user:', err);
        localStorage.removeItem('siplan-user');
      }
    }
  }, []);

  useEffect(() => {
    // Atualizar usuário admin baseado no stableAuth
    if (stableAuth.session?.user && stableAuth.isAdmin) {
      logger.info('🔐 [AuthContext] Setting admin user from stableAuth');
      
      const adminUser: User = {
        id: stableAuth.session.user.id,
        name: 'Administrador',
        type: 'admin',
        email: stableAuth.session.user.email || ''
      };
      setUser(adminUser);
      
      // Para admins, usar o cliente supabase padrão com a sessão ativa
      setAuthenticatedClient(supabase);
      
      // Limpar dados de cartório se existirem
      const savedUser = localStorage.getItem('siplan-user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        if (userData.type === 'cartorio') {
          localStorage.removeItem('siplan-user');
        }
      }
    } else if (!stableAuth.session && user?.type === 'admin') {
      // Limpar usuário admin se não há sessão
      logger.info('🔐 [AuthContext] Clearing admin user - no session');
      setUser(null);
      setAuthenticatedClient(null);
    }
  }, [stableAuth.session, stableAuth.isAdmin, user?.type]);

  const login = (token: string, type: 'cartorio' | 'admin', userData?: Partial<User>) => {
    logger.info('🔐 [AuthContext] Login called:', { 
      type, 
      hasUserData: !!userData,
      cartorio_id: userData?.cartorio_id,
      hasToken: !!token,
      tokenLength: token ? token.length : 0
    });
    
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
    
    setUser(newUser);
    
    if (type === 'cartorio') {
      localStorage.setItem('siplan-user', JSON.stringify(newUser));
      
      // Validar token antes de criar cliente
      if (token && token.trim() !== '') {
        const authClient = createAuthenticatedClient(token);
        setAuthenticatedClient(authClient);
        
        logger.info('✅ [AuthContext] Cartorio login setup complete:', {
          cartorio_id: newUser.cartorio_id,
          hasAuthClient: !!authClient,
          tokenType: token.startsWith('CART-') ? 'CART' : 'JWT'
        });
      } else {
        logger.error('❌ [AuthContext] Invalid token provided for cartorio login');
        setAuthenticatedClient(null);
      }
    }
    
    logger.info('✅ [AuthContext] User logged in successfully:', { 
      type: newUser.type, 
      cartorio_id: newUser.cartorio_id 
    });
  };

  const logout = async () => {
    logger.info('🔐 [AuthContext] Logout called');
    
    // Sign out from Supabase Auth if it's an admin
    if (user?.type === 'admin') {
      await stableAuth.logout();
    }
    
    setUser(null);
    setAuthenticatedClient(null);
    localStorage.removeItem('siplan-user');
    
    logger.info('✅ [AuthContext] User logged out successfully');
  };

  const isAuthenticated = !!user || !!stableAuth.session;
  const isLoading = stableAuth.isLoading;

  // Debug log do estado atual
  useEffect(() => {
    logger.info('🔐 [AuthContext] Current auth state:', {
      hasUser: !!user,
      userType: user?.type,
      hasSession: !!stableAuth.session,
      isAdmin: stableAuth.isAdmin,
      isAuthenticated,
      isLoading,
      hasAuthClient: !!authenticatedClient
    });
  }, [user, stableAuth.session, stableAuth.isAdmin, isAuthenticated, isLoading, authenticatedClient]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      session: stableAuth.session, 
      login, 
      logout, 
      isAuthenticated, 
      authenticatedClient,
      isLoading,
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

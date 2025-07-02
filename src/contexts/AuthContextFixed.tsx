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
        logger.info('🔐 [AuthContextFixed] Restored user from localStorage:', { 
          type: userData.type, 
          cartorio_id: userData.cartorio_id,
          token: userData.token ? 'present' : 'missing'
        });
        
        if (userData.type === 'cartorio' && userData.token && userData.jwtToken) {
          setUser(userData);
          // Usar o JWT válido em vez do token CART-
          const authClient = createAuthenticatedClient(userData.jwtToken);
          setAuthenticatedClient(authClient);
          
          logger.info('🔐 [AuthContextFixed] Authenticated client created for cartorio with JWT:', {
            cartorio_id: userData.cartorio_id,
            hasClient: !!authClient,
            hasJWT: !!userData.jwtToken
          });
        }
      } catch (err) {
        logger.error('❌ [AuthContextFixed] Error parsing saved user:', err);
        localStorage.removeItem('siplan-user');
      }
    }
  }, []);

  useEffect(() => {
    // Atualizar usuário admin baseado no stableAuth
    if (stableAuth.session?.user && stableAuth.isAdmin) {
      logger.info('🔐 [AuthContextFixed] Setting admin user from stableAuth');
      
      const adminUser: User = {
        id: stableAuth.session.user.id,
        name: 'Administrador',
        type: 'admin',
        email: stableAuth.session.user.email || ''
      };
      setUser(adminUser);
      
      // Limpar dados de cartório se existirem
      const savedUser = localStorage.getItem('siplan-user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        if (userData.type === 'cartorio') {
          localStorage.removeItem('siplan-user');
          setAuthenticatedClient(null);
        }
      }
    } else if (!stableAuth.session && user?.type === 'admin') {
      // Limpar usuário admin se não há sessão
      logger.info('🔐 [AuthContextFixed] Clearing admin user - no session');
      setUser(null);
      setAuthenticatedClient(null);
    }
  }, [stableAuth.session, stableAuth.isAdmin, user?.type]);

  const login = async (token: string, type: 'cartorio' | 'admin', userData?: Partial<User>) => {
    logger.info('🔐 [AuthContextFixed] Login called:', { 
      type, 
      userData: !!userData,
      cartorio_id: userData?.cartorio_id,
      token: token ? 'present' : 'missing'
    });
    
    if (type === 'cartorio') {
      // Para cartórios, precisamos obter um JWT válido da edge function
      try {
        const response = await fetch('https://bnulocsnxiffavvabfdj.supabase.co/functions/v1/login-cartorio', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJudWxvY3NueGlmZmF2dmFiZmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NzM1NTMsImV4cCI6MjA2NjQ0OTU1M30.3QeKQtbvTN4KQboUKhqOov16HZvz-xVLxmhl70S2IAE`,
          },
          body: JSON.stringify({ 
            username: userData?.username, 
            login_token: token 
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to authenticate: ${response.status}`);
        }

        const authData = await response.json();
        
        if (authData.success && authData.token) {
          const newUser: User = {
            id: userData?.id || '1',
            name: userData?.name || 'Cartório',
            type,
            token: token, // Token original CART-
            jwtToken: authData.token, // JWT válido da edge function
            cartorio_id: userData?.cartorio_id,
            cartorio_name: userData?.cartorio_name,
            username: userData?.username,
            email: userData?.email
          };
          
          setUser(newUser);
          localStorage.setItem('siplan-user', JSON.stringify(newUser));
          
          // Usar o JWT válido para criar o cliente autenticado
          const authClient = createAuthenticatedClient(authData.token);
          setAuthenticatedClient(authClient);
          
          logger.info('🔐 [AuthContextFixed] Cartorio login setup complete with JWT:', {
            cartorio_id: newUser.cartorio_id,
            hasAuthClient: !!authClient,
            hasJWT: !!authData.token
          });
        } else {
          throw new Error('Invalid response from login service');
        }
      } catch (error) {
        logger.error('❌ [AuthContextFixed] Failed to obtain JWT for cartorio:', error);
        throw error;
      }
    } else {
      // Para admin, usar o fluxo normal
      const newUser: User = {
        id: userData?.id || '1',
        name: userData?.name || 'Administrador',
        type,
        email: userData?.email
      };
      setUser(newUser);
    }
    
    logger.info('✅ [AuthContextFixed] User logged in successfully:', { 
      type, 
      cartorio_id: userData?.cartorio_id 
    });
  };

  const logout = async () => {
    logger.info('🔐 [AuthContextFixed] Logout called');
    
    // Sign out from Supabase Auth if it's an admin
    if (user?.type === 'admin') {
      await stableAuth.logout();
    }
    
    setUser(null);
    setAuthenticatedClient(null);
    localStorage.removeItem('siplan-user');
    
    logger.info('✅ [AuthContextFixed] User logged out successfully');
  };

  const isAuthenticated = !!user || !!stableAuth.session;
  const isLoading = stableAuth.isLoading;

  // Debug log do estado atual
  useEffect(() => {
    logger.info('🔐 [AuthContextFixed] Current auth state:', {
      hasUser: !!user,
      userType: user?.type,
      hasSession: !!stableAuth.session,
      isAdmin: stableAuth.isAdmin,
      isAuthenticated,
      isLoading
    });
  }, [user, stableAuth.session, stableAuth.isAdmin, isAuthenticated, isLoading]);

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

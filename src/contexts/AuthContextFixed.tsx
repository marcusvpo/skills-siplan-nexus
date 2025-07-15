import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, setCartorioAuthContext, clearCartorioAuthContext } from '@/integrations/supabase/client';
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
  
  const stableAuth = useStableAuth();

  console.log('🔍 DEBUG: AuthProvider render - stableAuth state:', {
    hasUser: !!stableAuth.user,
    hasSession: !!stableAuth.session,
    isLoading: stableAuth.isLoading,
    isAdmin: stableAuth.isAdmin,
    error: stableAuth.error
  });

  useEffect(() => {
    console.log('🔍 DEBUG: AuthProvider localStorage check starting...');
    // Verificar usuário de cartório salvo no localStorage
    const savedUser = localStorage.getItem('siplan-user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        console.log('🔍 DEBUG: Found saved user in localStorage:', userData);
        logger.info('🔐 [AuthContextFixed] Restored user from localStorage:', { 
          type: userData.type, 
          cartorio_id: userData.cartorio_id,
          token: userData.token ? 'present' : 'missing'
        });
        
        if (userData.type === 'cartorio' && userData.token) {
          setUser(userData);
          
          // Configurar contexto de autenticação para cartório usando instância única
          try {
            setCartorioAuthContext(userData.token);
            
            logger.info('🔐 [AuthContextFixed] Cartorio auth context set:', {
              cartorio_id: userData.cartorio_id,
              tokenPrefix: userData.token.substring(0, 10)
            });
          } catch (err) {
            logger.error('❌ [AuthContextFixed] Error setting cartorio auth context:', err);
          }
        }
      } catch (err) {
        console.log('🔍 DEBUG: Error parsing saved user from localStorage:', err);
        logger.error('❌ [AuthContextFixed] Error parsing saved user:', err);
        localStorage.removeItem('siplan-user');
        
        // Se houver erro, configurar usuário demo
        const demoUser: User = {
          id: 'demo-user-id',
          name: 'Cartório de Demonstração',
          type: 'cartorio',
          token: 'DEMO-SIPLANSKILLS-CARTORIO',
          cartorio_id: '550e8400-e29b-41d4-a716-446655440000',
          cartorio_name: 'Cartório de Demonstração',
          username: 'demo',
          email: 'demo@siplan.com.br'
        };
        
        setUser(demoUser);
        localStorage.setItem('siplan-user', JSON.stringify(demoUser));
        setCartorioAuthContext(demoUser.token);
      }
    } else {
      // Configurar usuário demo padrão
      console.log('🔍 DEBUG: No saved user found in localStorage, setting up demo user');
      const demoUser: User = {
        id: 'demo-user-id',
        name: 'Cartório de Demonstração',
        type: 'cartorio',
        token: 'DEMO-SIPLANSKILLS-CARTORIO',
        cartorio_id: '550e8400-e29b-41d4-a716-446655440000',
        cartorio_name: 'Cartório de Demonstração',
        username: 'demo',
        email: 'demo@siplan.com.br'
      };
      
      console.log('🔍 DEBUG: Setting up demo user:', demoUser);
      setUser(demoUser);
      localStorage.setItem('siplan-user', JSON.stringify(demoUser));
      
      try {
        setCartorioAuthContext(demoUser.token);
        logger.info('🔐 [AuthContextFixed] Demo cartorio auth context set');
      } catch (err) {
        logger.error('❌ [AuthContextFixed] Error setting demo cartorio auth context:', err);
      }
    }
  }, []);

  useEffect(() => {
    console.log('🔍 DEBUG: AuthProvider stableAuth effect triggered with:', {
      hasSession: !!stableAuth.session,
      isAdmin: stableAuth.isAdmin,
      userType: user?.type,
      sessionUserEmail: stableAuth.session?.user?.email
    });

    // Atualizar usuário admin baseado no stableAuth
    if (stableAuth.session?.user && stableAuth.isAdmin) {
      console.log('🔍 DEBUG: Setting admin user from stableAuth');
      logger.info('🔐 [AuthContextFixed] Setting admin user from stableAuth');
      
      const adminUser: User = {
        id: stableAuth.session.user.id,
        name: 'Administrador',
        type: 'admin',
        email: stableAuth.session.user.email || ''
      };
      setUser(adminUser);
      
      // Limpar contexto de cartório se existir
      clearCartorioAuthContext();
      
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
      console.log('🔍 DEBUG: Clearing admin user - no session');
      logger.info('🔐 [AuthContextFixed] Clearing admin user - no session');
      setUser(null);
      clearCartorioAuthContext();
    }
  }, [stableAuth.session, stableAuth.isAdmin, user?.type]);

  const login = (token: string, type: 'cartorio' | 'admin', userData?: Partial<User>) => {
    logger.info('🔐 [AuthContextFixed] Login called:', { 
      type, 
      userData: !!userData,
      cartorio_id: userData?.cartorio_id,
      token: token ? 'present' : 'missing'
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
      
      try {
        setCartorioAuthContext(token);
        
        logger.info('🔐 [AuthContextFixed] Cartorio login setup complete:', {
          cartorio_id: newUser.cartorio_id,
          tokenLength: token.length
        });
      } catch (err) {
        logger.error('❌ [AuthContextFixed] Error setting cartorio auth context during login:', err);
      }
    } else {
      // Para admin, limpar qualquer contexto de cartório
      clearCartorioAuthContext();
    }
    
    logger.info('✅ [AuthContextFixed] User logged in successfully:', { 
      type: newUser.type, 
      cartorio_id: newUser.cartorio_id 
    });
  };

  const logout = async () => {
    logger.info('🔐 [AuthContextFixed] Logout called');
    
    // Sign out from Supabase Auth if it's an admin
    if (user?.type === 'admin') {
      await stableAuth.logout();
    }
    
    setUser(null);
    clearCartorioAuthContext();
    localStorage.removeItem('siplan-user');
    
    logger.info('✅ [AuthContextFixed] User logged out successfully');
  };

  const isAuthenticated = !!user || !!stableAuth.session;
  const isLoading = stableAuth.isLoading;

  // Sempre usar a instância única do Supabase
  const authenticatedClient = supabase;

  // Debug log do estado atual
  useEffect(() => {
    console.log('🔍 DEBUG: AuthContextFixed current state update:', {
      hasUser: !!user,
      userType: user?.type,
      hasSession: !!stableAuth.session,
      stableAuthIsAdmin: stableAuth.isAdmin,
      isAuthenticated,
      isLoading,
      usingSharedClient: true
    });

    logger.info('🔐 [AuthContextFixed] Current auth state:', {
      hasUser: !!user,
      userType: user?.type,
      hasSession: !!stableAuth.session,
      isAdmin: stableAuth.isAdmin,
      isAuthenticated,
      isLoading,
      usingSharedClient: true
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

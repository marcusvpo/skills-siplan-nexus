
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
  login: (token: string, type: 'cartorio' | 'admin', userData?: Partial<User>) => Promise<void>;
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
        
        if (userData.type === 'cartorio' && userData.token) {
          setUser(userData);
          
          // Criar cliente autenticado usando o novo método
          createAuthenticatedClient(userData.token).then(authClient => {
            setAuthenticatedClient(authClient);
            logger.info('🔐 [AuthContextFixed] Authenticated client created for cartorio:', {
              cartorio_id: userData.cartorio_id,
              hasClient: !!authClient
            });
          }).catch(err => {
            logger.error('❌ [AuthContextFixed] Error creating authenticated client:', err);
          });
        }
      } catch (err) {
        logger.error('❌ [AuthContextFixed] Error parsing saved user:', err);
        localStorage.removeItem('siplan-user');
      }
    }
  }, []);

  useEffect(() => {
    // Atualizar usuário admin baseado no stableAuth e configurar authenticatedClient
    if (stableAuth.session?.user && stableAuth.isAdmin) {
      logger.info('🔐 [AuthContextFixed] Setting admin user from stableAuth');
      
      const adminUser: User = {
        id: stableAuth.session.user.id,
        name: 'Administrador',
        type: 'admin',
        email: stableAuth.session.user.email || ''
      };
      setUser(adminUser);
      
      // Para admin, criar cliente autenticado usando a sessão ativa
      createAuthenticatedClient().then(authClient => {
        setAuthenticatedClient(authClient);
        logger.info('🔐 [AuthContextFixed] Authenticated client created for admin');
      }).catch(err => {
        logger.error('❌ [AuthContextFixed] Error creating authenticated client for admin:', err);
        // Fallback para cliente padrão se houver erro
        setAuthenticatedClient(supabase);
      });
      
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
        const authClient = await createAuthenticatedClient(token);
        setAuthenticatedClient(authClient);
        
        logger.info('🔐 [AuthContextFixed] Cartorio login setup complete:', {
          cartorio_id: newUser.cartorio_id,
          hasAuthClient: !!authClient
        });
      } catch (err) {
        logger.error('❌ [AuthContextFixed] Error creating authenticated client during login:', err);
      }
    } else {
      // Para admin, criar cliente autenticado
      try {
        const authClient = await createAuthenticatedClient();
        setAuthenticatedClient(authClient);
      } catch (err) {
        logger.error('❌ [AuthContextFixed] Error creating authenticated client for admin login:', err);
        setAuthenticatedClient(supabase);
      }
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

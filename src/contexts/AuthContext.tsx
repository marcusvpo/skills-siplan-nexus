
import React, { createContext, useContext, useState, useEffect } from 'react';
import { createAuthenticatedClient, supabase, getValidSession, isUserAuthenticated } from '@/integrations/supabase/client';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { useStableAuth } from '@/hooks/useStableAuth';

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
  validateSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authenticatedClient, setAuthenticatedClient] = useState<any>(null);
  
  const stableAuth = useStableAuth();

  console.log('🔍 DEBUG: AuthProvider render - auth state:', {
    hasSession: !!stableAuth.session,
    hasUser: !!stableAuth.user,
    loading: stableAuth.loading,
    isInitialized: stableAuth.isInitialized,
    isAdmin: stableAuth.isAdmin
  });

  // Função para validar sessão antes de operações críticas
  const validateSession = async (): Promise<boolean> => {
    try {
      console.log('🔍 [AuthContext] Validating session...');
      
      const validSession = await getValidSession();
      if (!validSession) {
        console.error('❌ [AuthContext] Sessão inválida ou expirada');
        return false;
      }
      
      console.log('✅ [AuthContext] Sessão válida confirmada');
      return true;
    } catch (error) {
      console.error('❌ [AuthContext] Erro ao validar sessão:', error);
      return false;
    }
  };

  useEffect(() => {
    // Verificar usuário de cartório salvo no localStorage
    const savedUser = localStorage.getItem('siplan-user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        if (userData.type === 'cartorio' && userData.token) {
          setUser(userData);
          const authClient = createAuthenticatedClient(userData.token);
          setAuthenticatedClient(authClient);
          
          // Configurar contexto do cartório para usuário restaurado
          if (userData.cartorio_id) {
            supabase.rpc('set_cartorio_context', {
              p_cartorio_id: userData.cartorio_id
            }).then(({ error }) => {
              if (error) {
                console.error('❌ [AuthContext] Erro ao restaurar contexto do cartório:', error);
              } else {
                console.log('✅ [AuthContext] Contexto do cartório restaurado:', userData.cartorio_id);
              }
            });
          }
        }
      } catch (err) {
        console.error('Error parsing saved user:', err);
        localStorage.removeItem('siplan-user');
      }
    }
  }, []);

  useEffect(() => {
    // Atualizar usuário admin baseado no stableAuth
    if (stableAuth.session?.user && stableAuth.isAdmin) {
      const adminUser: User = {
        id: stableAuth.session.user.id,
        name: 'Administrador',
        type: 'admin',
        email: stableAuth.session.user.email || ''
      };
      setUser(adminUser);
    } else if (!stableAuth.session && user?.type === 'admin') {
      // Limpar usuário admin se não há sessão
      setUser(null);
      setAuthenticatedClient(null);
    }
  }, [stableAuth.session, stableAuth.isAdmin, user?.type]);

  // Listener para verificar sessão quando o foco da janela retorna
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden && user?.type === 'admin') {
        console.log('👁️ [AuthContext] Tab focus returned, validating session...');
        
        const isValid = await validateSession();
        if (!isValid) {
          console.log('❌ [AuthContext] Sessão inválida detectada, fazendo logout');
          logout();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user?.type]);

  const login = async (token: string, type: 'cartorio' | 'admin', userData?: Partial<User>) => {
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
    localStorage.setItem('siplan-user', JSON.stringify(newUser));
    
    // Create authenticated client for cartorio users
    if (type === 'cartorio') {
      const authClient = createAuthenticatedClient(token);
      setAuthenticatedClient(authClient);
      
      // Configurar contexto do cartório para RLS
      if (userData?.cartorio_id) {
        try {
          const { error: contextError } = await supabase.rpc('set_cartorio_context', {
            p_cartorio_id: userData.cartorio_id
          });
          
          if (contextError) {
            console.error('❌ [AuthContext] Erro RPC ao setar contexto:', contextError);
          } else {
            console.log('✅ [AuthContext] Contexto do cartório configurado com sucesso:', userData.cartorio_id);
          }
        } catch (error) {
          console.error('❌ [AuthContext] Erro ao configurar contexto do cartório:', error);
        }
      }
    }
  };

  const logout = async () => {
    // Sign out from Supabase Auth if it's an admin
    if (user?.type === 'admin') {
      await stableAuth.logout();
    }
    
    setUser(null);
    setAuthenticatedClient(null);
    localStorage.removeItem('siplan-user');
    
    // Limpar cache relacionado
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('video_timer_')) {
        localStorage.removeItem(key);
      }
    });
  };

  const isAuthenticated = !!user || !!stableAuth.session;
  const isLoading = stableAuth.loading;

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
      validateSession
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


import React, { createContext, useContext, useState, useEffect } from 'react';
import { createAuthenticatedClient, supabase, setCartorioAuthContext, clearCartorioAuthContext } from '@/integrations/supabase/client';
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
  forceRefresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authenticatedClient, setAuthenticatedClient] = useState<any>(null);
  
  const stableAuth = useStableAuth();

  console.log('🔍 [AuthProvider] Estado atual:', {
    hasSession: !!stableAuth.session,
    hasUser: !!stableAuth.user,
    loading: stableAuth.loading,
    isInitialized: stableAuth.isInitialized,
    isAdmin: stableAuth.isAdmin,
    cartorioUser: !!user
  });

  // Restaurar usuário de cartório do localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('siplan-user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        if (userData.type === 'cartorio' && userData.token) {
          console.log('🔄 [AuthProvider] Restaurando usuário de cartório:', userData.cartorio_id);
          
          setUser(userData);
          const authClient = createAuthenticatedClient(userData.token);
          setAuthenticatedClient(authClient);
          
          // Configurar contexto do cartório
          setCartorioAuthContext(userData.token);
          
          if (userData.cartorio_id) {
            supabase.rpc('set_cartorio_context', {
              p_cartorio_id: userData.cartorio_id
            }).then(({ error }) => {
              if (error) {
                console.error('❌ [AuthProvider] Erro ao restaurar contexto:', error);
              } else {
                console.log('✅ [AuthProvider] Contexto restaurado:', userData.cartorio_id);
              }
            });
          }
        }
      } catch (err) {
        console.error('❌ [AuthProvider] Erro ao restaurar usuário:', err);
        localStorage.removeItem('siplan-user');
      }
    }
  }, []);

  // Atualizar usuário admin baseado no stableAuth
  useEffect(() => {
    if (stableAuth.session?.user && stableAuth.isAdmin) {
      const adminUser: User = {
        id: stableAuth.session.user.id,
        name: 'Administrador',
        type: 'admin',
        email: stableAuth.session.user.email || ''
      };
      
      console.log('✅ [AuthProvider] Configurando usuário admin:', adminUser.email);
      setUser(adminUser);
    } else if (!stableAuth.session && user?.type === 'admin') {
      console.log('🔄 [AuthProvider] Limpando usuário admin (sem sessão)');
      setUser(null);
      setAuthenticatedClient(null);
    }
  }, [stableAuth.session, stableAuth.isAdmin, user?.type]);

  const login = async (token: string, type: 'cartorio' | 'admin', userData?: Partial<User>) => {
    console.log('🔑 [AuthProvider] Login iniciado:', { type, userData });
    
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
    
    // Configurar cliente para usuários de cartório
    if (type === 'cartorio') {
      const authClient = createAuthenticatedClient(token);
      setAuthenticatedClient(authClient);
      
      // Configurar contexto do cartório
      setCartorioAuthContext(token);
      
      if (userData?.cartorio_id) {
        try {
          const { error: contextError } = await supabase.rpc('set_cartorio_context', {
            p_cartorio_id: userData.cartorio_id
          });
          
          if (contextError) {
            console.error('❌ [AuthProvider] Erro ao setar contexto RPC:', contextError);
          } else {
            console.log('✅ [AuthProvider] Contexto do cartório configurado:', userData.cartorio_id);
          }
        } catch (error) {
          console.error('❌ [AuthProvider] Erro ao configurar contexto:', error);
        }
      }
    }
    
    console.log('✅ [AuthProvider] Login concluído:', newUser);
  };

  const logout = async () => {
    console.log('🚪 [AuthProvider] Logout iniciado...');
    
    // Logout do Supabase Auth se for admin
    if (user?.type === 'admin') {
      await stableAuth.logout();
    }
    
    // Limpar estado local
    setUser(null);
    setAuthenticatedClient(null);
    clearCartorioAuthContext();
    localStorage.removeItem('siplan-user');
    
    // Limpar cache de timers
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('video_timer_')) {
        localStorage.removeItem(key);
      }
    });
    
    console.log('✅ [AuthProvider] Logout concluído');
  };

  const forceRefresh = async () => {
    console.log('🔄 [AuthProvider] Forçando refresh da autenticação...');
    await stableAuth.forceRefresh();
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
      forceRefresh
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

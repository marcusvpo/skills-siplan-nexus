
import React, { createContext, useContext, useState, useEffect } from 'react';
import { createAuthenticatedClient, supabase } from '@/integrations/supabase/client';
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
  login: (token: string, type: 'cartorio' | 'admin', userData?: Partial<User>, supabaseAccessToken?: string, supabaseRefreshToken?: string) => Promise<void>;
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
  const [hasInitializedOnce, setHasInitializedOnce] = useState(false);
  
  const stableAuth = useStableAuth();

  console.log('🔍 DEBUG: AuthProvider render - auth state:', {
    hasSession: !!stableAuth.session,
    hasUser: !!user,
    loading: stableAuth.loading,
    isInitialized: stableAuth.isInitialized,
    isAdmin: stableAuth.isAdmin,
    hasInitializedOnce
  });

  useEffect(() => {
    // Verificar usuário de cartório salvo no localStorage APENAS na primeira inicialização
    if (hasInitializedOnce) {
      console.log('⚡ [AuthContext] Pulando verificação localStorage - já inicializado');
      return;
    }

    console.log('🔍 [AuthContext] Primeira inicialização - verificando localStorage');
    
    const savedUser = localStorage.getItem('siplan-user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        if (userData.type === 'cartorio' && userData.token) {
          console.log('📦 [AuthContext] Restaurando usuário do localStorage:', userData.username);
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
    
    setHasInitializedOnce(true);
  }, [hasInitializedOnce]);

  useEffect(() => {
    // Atualizar usuário admin baseado no stableAuth - APENAS se necessário
    if (stableAuth.session?.user && stableAuth.isAdmin) {
      // Só atualizar se não há usuário atual OU se é diferente
      if (!user || user.type !== 'admin' || user.id !== stableAuth.session.user.id) {
        console.log('👤 [AuthContext] Configurando usuário admin');
        const adminUser: User = {
          id: stableAuth.session.user.id,
          name: 'Administrador',
          type: 'admin',
          email: stableAuth.session.user.email || ''
        };
        setUser(adminUser);
      }
    } else if (!stableAuth.session && user?.type === 'admin') {
      // Limpar usuário admin se não há sessão
      console.log('🗑️ [AuthContext] Limpando usuário admin - sem sessão');
      setUser(null);
      setAuthenticatedClient(null);
    }
  }, [stableAuth.session, stableAuth.isAdmin, user?.type, user?.id]);

  const login = async (
    token: string, 
    type: 'cartorio' | 'admin', 
    userData?: Partial<User>,
    supabaseAccessToken?: string,
    supabaseRefreshToken?: string
  ) => {
    console.log('🔐 [AuthContext] Login iniciado:', { type, hasUserData: !!userData });
    
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
      
      // ✅ CRÍTICO: Configurar sessão do Supabase com tokens REAIS
      if (supabaseAccessToken && supabaseRefreshToken) {
        try {
          console.log('🔑 [AuthContext] Configurando sessão do Supabase com tokens REAIS...');
          
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: supabaseAccessToken,
            refresh_token: supabaseRefreshToken,
          });
          
          if (sessionError) {
            console.error('❌ [AuthContext] ERRO CRÍTICO ao configurar sessão do Supabase com tokens reais:', sessionError);
          } else {
            console.log('✅ [AuthContext] Sessão do Supabase configurada com sucesso com tokens reais.');
          }
        } catch (error) {
          console.error('❌ [AuthContext] Erro inesperado ao tentar setar sessão Supabase:', error);
        }
      } else {
        console.warn('⚠️ [AuthContext] Tokens REAIS do Supabase (access_token/refresh_token) não foram fornecidos para setSession.');
      }
      
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
    
    console.log('✅ [AuthContext] Login concluído com sucesso');
  };

  const logout = async () => {
    console.log('🚪 [AuthContext] Logout iniciado');
    
    // Sign out from Supabase Auth if it's an admin
    if (user?.type === 'admin') {
      await stableAuth.logout();
    }
    
    setUser(null);
    setAuthenticatedClient(null);
    localStorage.removeItem('siplan-user');
    setHasInitializedOnce(false); // Reset para permitir nova inicialização
    
    console.log('✅ [AuthContext] Logout concluído');
  };

  const isAuthenticated = !!user || !!stableAuth.session;
  const isLoading = !hasInitializedOnce || stableAuth.loading;

  // ✅ LOGS ESPECÍFICOS PARA DEBUGGING
  console.log('🔐 [AuthContext] Estado de autenticação:', {
    hasUser: !!user,
    userType: user?.type,
    userId: user?.id,
    cartorioId: user?.cartorio_id,
    isAuthenticated,
    isLoading,
    hasInitializedOnce,
    stableAuthLoading: stableAuth.loading,
    stableAuthInitialized: stableAuth.isInitialized
  });

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

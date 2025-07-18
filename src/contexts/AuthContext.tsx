
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
  login: (username: string, login_token: string) => Promise<void>;
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
  const [session, setSession] = useState<Session | null>(null);
  
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
    // Sincronizar sessão local com stableAuth
    if (stableAuth.session) {
      setSession(stableAuth.session);
    } else {
      setSession(null);
    }
  }, [stableAuth.session]);

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

  const login = async (username: string, login_token: string) => {
    console.log('🔐 [AuthContext] Login iniciado para cartório:', { username });
    
    try {
      // Chamar Edge Function para autenticar
      const response = await fetch(`https://bnulocsnxiffavvabfdj.supabase.co/functions/v1/login-cartorio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJudWxvY3NueGlmZmF2dmFiZmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NzM1NTMsImV4cCI6MjA2NjQ0OTU1M30.3QeKQtbvTN4KQboUKhqOov16HZvz-xVLxmhl70S2IAE`
        },
        body: JSON.stringify({ username, login_token })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro na autenticação');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Erro na autenticação');
      }

      // Configurar sessão do Supabase
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });

      if (sessionError) {
        console.error('❌ [AuthContext] Erro ao configurar sessão:', sessionError);
        throw new Error('Erro ao configurar sessão');
      }

      // Criar objeto user
      const newUser: User = {
        id: data.user.id,
        name: data.cartorio?.nome || username,
        type: 'cartorio',
        token: login_token,
        cartorio_id: data.user.cartorio_id,
        cartorio_name: data.cartorio?.nome,
        username: data.user.username,
        email: data.user.email || `${username}@cartorio.local`
      };

      setUser(newUser);
      localStorage.setItem('siplan-user', JSON.stringify(newUser));

      // Configurar cliente autenticado
      const authClient = createAuthenticatedClient(login_token);
      setAuthenticatedClient(authClient);

      // Configurar contexto do cartório
      if (data.user.cartorio_id) {
        await supabase.rpc('set_cartorio_context', {
          p_cartorio_id: data.user.cartorio_id
        });
      }

      console.log('✅ [AuthContext] Login concluído com sucesso');
    } catch (error) {
      console.error('❌ [AuthContext] Erro no login:', error);
      throw error;
    }
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
      session: session || stableAuth.session, 
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

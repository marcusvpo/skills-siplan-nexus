import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, setCartorioAuthContext, clearCartorioAuthContext } from '@/integrations/supabase/client';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { useStableAuth } from '@/hooks/useStableAuth';
import { useNavigate } from 'react-router-dom';
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
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  authenticatedClient: any;
  isLoading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true); // Controla o carregamento geral do AuthProvider
  const [session, setSession] = useState<Session | null>(null); // Supabase session

  const stableAuth = useStableAuth(); // Hook para gerenciar o estado nativo do Supabase Auth
  const navigate = useNavigate();

  // Efeito para a verificação inicial de autenticação (localStorage e useStableAuth)
  useEffect(() => {
    let isMounted = true; // Flag para evitar atualizações de estado em componente desmontado

    const performInitialAuthCheck = async () => {
      setIsLoadingAuth(true); // Começa a verificação inicial

      // 1. Tenta restaurar usuário de cartório do localStorage
      const savedUser = localStorage.getItem('siplan-user');
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          if (userData.type === 'cartorio' && userData.token) {
            if (isMounted) {
              setUser(userData);
              setCartorioAuthContext(userData.token); // Configura o contexto customizado do cartório
              logger.info('📦 [AuthContextFixed] Usuário cartório restaurado do localStorage.');
              setIsLoadingAuth(false); // Verificação inicial completa
              return; // Sai, pois o usuário de cartório foi carregado
            }
          } else {
            localStorage.removeItem('siplan-user'); // Limpa se for inválido
          }
        } catch (err) {
          logger.error('❌ [AuthContextFixed] Erro ao parsear usuário do localStorage:', err);
          localStorage.removeItem('siplan-user');
        }
      }

      // 2. Se não restaurou do localStorage, verifica o stableAuth (para admins/autenticação nativa)
      // Espera até que stableAuth tenha completado sua própria inicialização
      if (!stableAuth.isInitialized) {
        logger.debug('⏳ [AuthContextFixed] Aguardando useStableAuth finalizar inicialização...');
        // Este useEffect será re-executado quando stableAuth.isInitialized mudar
        return; 
      }

      // Se stableAuth já inicializou, sincroniza o estado
      if (stableAuth.session?.user && stableAuth.isAdmin) {
        const adminUser: User = {
          id: stableAuth.session.user.id,
          name: 'Administrador', // Nome genérico para admin
          type: 'admin',
          email: stableAuth.session.user.email || ''
        };
        if (isMounted) {
          setUser(adminUser);
          setSession(stableAuth.session); // Sincroniza a sessão Supabase
          clearCartorioAuthContext(); // Limpa qualquer contexto de cartório existente
          logger.info('�� [AuthContextFixed] Usuário admin sincronizado do stableAuth.');
        }
      } else {
        // Nenhuma sessão Supabase ativa ou não é admin
        if (isMounted) {
          setUser(null);
          setSession(null);
          clearCartorioAuthContext();
          logger.info('🚫 [AuthContextFixed] Nenhuma sessão Supabase ativa para sincronizar.');
        }
      }
      
      if (isMounted) {
        setIsLoadingAuth(false); // Marca a verificação inicial como completa
      }
    };

    performInitialAuthCheck(); // Executa a verificação na montagem

    // Função de limpeza para o useEffect
    return () => {
      isMounted = false;
    };
  }, [stableAuth.isInitialized, stableAuth.session, stableAuth.isAdmin]); // Dependências

  // Efeito para gerenciar redirecionamento automático após autenticação
  useEffect(() => {
    // Só executa se a autenticação estiver inicializada e não estivermos carregando
    if (isLoadingAuth) return;

    logger.debug('🔍 DEBUG: AuthContextFixed - Verificando redirecionamento com:', {
      userPresent: !!user,
      userType: user?.type,
      currentPath: window.location.pathname
    });

    // Se temos um usuário e estamos na página de login/admin-login, redirecionar
    if (user && (window.location.pathname === '/login' || window.location.pathname === '/admin-login')) {
      logger.info('🔄 [AuthContextFixed] Redirecionando após login bem-sucedido...');
      if (user.type === 'admin') {
        navigate('/admin');
      } else if (user.type === 'cartorio') {
        navigate('/dashboard');
      }
    }
  }, [isLoadingAuth, user, navigate]);

  const login = async (usernameOrToken: string, type: 'cartorio' | 'admin', userData?: Partial<User>): Promise<void> => {
    setIsLoadingAuth(true); // Ativa o carregamento para a ação de login
    logger.info('🔐 [AuthContextFixed] Login chamado:', { type, usernameOrToken, userData: !!userData });

    try {
      if (type === 'cartorio') {
        // Chamada à Edge Function para autenticação de cartório
        const response = await fetch(`https://bnulocsnxiffavvabfdj.supabase.co/functions/v1/login-cartorio`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJudWxvY3NueGlmZmF2dmFiZmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NzM1NTMsImV4cCI6MjA2NjQ0OTU1M30.3QeKQtbvTN4KQboUKhqOov16HZvz-xVLxmhl70S2IAE`
          },
          body: JSON.stringify({ username: usernameOrToken, login_token: userData?.token || '' })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Erro HTTP' }));
          logger.error('❌ [AuthContextFixed] Erro na Edge Function de login:', errorData);
          throw new Error(errorData.error || 'Erro na autenticação');
        }

        const data = await response.json();
        if (!data.success) {
          logger.error('❌ [AuthContextFixed] Falha no login da Edge Function:', data.error);
          throw new Error(data.error || 'Erro na autenticação');
        }

        // Configura sessão Supabase com tokens da Edge Function
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });
        if (sessionError) {
          logger.error('❌ [AuthContextFixed] Erro ao configurar sessão Supabase:', sessionError);
          throw new Error('Erro ao configurar sessão');
        }

        // Configura contexto customizado do cartório (para RLS)
        setCartorioAuthContext(data.login_token);

        // Atualiza estado local do usuário e localStorage
        const newUser: User = {
          id: data.user.id,
          name: data.cartorio?.nome || data.user.username,
          type: 'cartorio',
          token: data.login_token, // O token customizado do cartório
          cartorio_id: data.user.cartorio_id,
          cartorio_name: data.cartorio?.nome,
          username: data.user.username,
          email: data.user.email
        };
        setUser(newUser);
        localStorage.setItem('siplan-user', JSON.stringify(newUser));

        logger.info('✅ [AuthContextFixed] Login de cartório concluído com sucesso.');
      } else {
        // Implementar login de admin aqui (se necessário, o stableAuth já lida com isso)
        // Para admin, apenas garantir que o stableAuth esteja sincronizado e o user é admin.
        logger.warn('⚠️ [AuthContextFixed] Login direto de admin chamado. Normalmente via Supabase nativo.');
        // Este caso pode ser mais simples, dependendo de como você gerencia o login do admin.
        // Se o admin loga via `supabase.auth.signInWithPassword` em `Login.tsx`,
        // o `useStableAuth` já lida com a sessão e o `useEffect` acima sincroniza.
        // A função `login` do AuthContextType é mais para o fluxo customizado do cartório.
      }
    } catch (error) {
      logger.error('❌ [AuthContextFixed] Erro durante o processo de login:', error);
      throw error; // Re-lança o erro para a UI poder lidar
    } finally {
      setIsLoadingAuth(false); // Garante que o estado de carregamento é desativado
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoadingAuth(true); // Ativa o carregamento para a ação de logout
    logger.info('🔐 [AuthContextFixed] Logout chamado.');

    try {
      if (user?.type === 'admin') {
        await stableAuth.logout(); // Desloga do Supabase Auth nativo
      } else {
        // Para usuário de cartório (token customizado), apenas limpa o contexto local
        clearCartorioAuthContext();
        localStorage.removeItem('siplan-user');
      }
      setUser(null); // Limpa o estado do usuário local
      setSession(null); // Limpa o estado da sessão Supabase
      logger.info('✅ [AuthContextFixed] Logout concluído com sucesso.');
    } catch (error) {
      logger.error('❌ [AuthContextFixed] Erro durante o logout:', error);
      throw error; // Re-lança o erro
    } finally {
      setIsLoadingAuth(false); // Garante que o estado de carregamento é desativado
    }
  };

  // Define o estado isAuthenticated baseado na presença de usuário ou sessão Supabase
  const isAuthenticated = !!user || !!stableAuth.session;
  // O estado isLoading é o flag principal do AuthProvider
  const isLoading = isLoadingAuth;

  // A instância do Supabase é sempre a mesma
  const authenticatedClient = supabase;

  // Logs para depuração do estado do contexto de autenticação
  useEffect(() => {
    logger.debug('🔍 DEBUG: AuthContextFixed estado atual:', {
      userPresent: !!user,
      userType: user?.type,
      hasSupabaseSession: !!stableAuth.session,
      isAdminFromStableAuth: stableAuth.isAdmin,
      isUserAuthenticated: isAuthenticated,
      isAuthLoading: isLoading,
      isLoadingAuthFlag: isLoadingAuth, // O flag interno
      stableAuthIsLoading: stableAuth.loading, // O flag do stableAuth
      stableAuthIsInitialized: stableAuth.isInitialized // O flag de inicialização do stableAuth
    });
  }, [user, stableAuth.session, stableAuth.isAdmin, isAuthenticated, isLoading, isLoadingAuth, stableAuth.loading, stableAuth.isInitialized]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      session: stableAuth.session, // Sempre usa a sessão do stableAuth como fonte da verdade
      login, 
      logout, 
      isAuthenticated, 
      authenticatedClient,
      isLoading, // Usa o flag principal de loading
      isAdmin: stableAuth.isAdmin // Usa o flag de admin do stableAuth
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
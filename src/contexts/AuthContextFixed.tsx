import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, setCartorioAuthContext, clearCartorioAuthContext } from '@/integrations/supabase/client';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { useStableAuth } from '@/hooks/useStableAuth';
import { logger } from '@/utils/logger';
import { useNavigate } from 'react-router-dom';

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
  login: (usernameOrToken: string, type: 'cartorio' | 'admin', userData?: Partial<User>) => Promise<void>;
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
  const navigate = useNavigate(); // Inicializar useNavigate

  // Efeito principal para sincronizar o estado de autenticação do AuthContextFixed
  // com base no stableAuth e no localStorage.
  useEffect(() => {
    let isMounted = true; 

    const synchronizeAuthState = async () => {
      logger.debug('🚀 [AuthContextFixed] Iniciando sincronização do estado de autenticação...');
      setIsLoadingAuth(true); // Garante que o estado de carregamento está ativo

      try {
        // 1. Tenta restaurar usuário de cartório do localStorage
        const savedUser = localStorage.getItem('siplan-user');
        if (savedUser) {
          try {
            const userData = JSON.parse(savedUser);
            if (userData.type === 'cartorio' && userData.token) {
              if (isMounted) {
                setUser(userData);
                setCartorioAuthContext(userData.token);
                logger.info('�� [AuthContextFixed] Usuário cartório restaurado do localStorage.');
              }
            } else {
              localStorage.removeItem('siplan-user'); 
              logger.debug('🗑️ [AuthContextFixed] Usuário inválido no localStorage, removendo.');
            }
          } catch (err) {
            logger.error('❌ [AuthContextFixed] Erro ao parsear usuário do localStorage:', err);
            localStorage.removeItem('siplan-user');
          }
        }

        // 2. Aguarda stableAuth finalizar sua própria inicialização
        if (!stableAuth.isInitialized) {
          logger.debug('⏳ [AuthContextFixed] Aguardando stableAuth inicializar para completar a sincronização...');
          return; 
        }

        // 3. Sincroniza com o estado do stableAuth (Supabase Auth)
        logger.debug('�� [AuthContextFixed] Sincronizando com stableAuth...');
        logger.debug('�� [AuthContextFixed] stableAuth state:', {
          session: stableAuth.session,
          isAdmin: stableAuth.isAdmin,
          user: stableAuth.user
        });

        if (stableAuth.session?.user) {
          // Tenta identificar se é um usuário cartório pelo JWT do stableAuth.session
          try {
            const payload = JSON.parse(atob(stableAuth.session.access_token.split('.')[1]));
            logger.debug('🔍 [AuthContextFixed] JWT payload decodificado do stableAuth:', payload);

            if (payload.cartorio_id && payload.username) {
              const cartorioUser: User = {
                id: stableAuth.session.user.id,
                name: payload.username,
                type: 'cartorio',
                token: payload.login_token || '', 
                cartorio_id: payload.cartorio_id,
                cartorio_name: payload.cartorio_name || '', 
                username: payload.username,
                email: stableAuth.session.user.email || ''
              };
              if (isMounted) {
                setUser(cartorioUser);
                setSession(stableAuth.session);
                setCartorioAuthContext(payload.login_token || ''); 
                localStorage.setItem('siplan-user', JSON.stringify(cartorioUser));
                logger.info('🎯 [AuthContextFixed] Usuário cartório configurado via stableAuth.');
              }
            } else if (stableAuth.isAdmin) { 
              const adminUser: User = {
                id: stableAuth.session.user.id,
                name: 'Administrador',
                type: 'admin',
                email: stableAuth.session.user.email || ''
              };
              if (isMounted) {
                setUser(adminUser);
                setSession(stableAuth.session);
                clearCartorioAuthContext();
                localStorage.removeItem('siplan-user'); 
                logger.info('👤 [AuthContextFixed] Usuário admin configurado via stableAuth.');
              }
            } else {
              logger.warn('⚠️ [AuthContextFixed] Sessão Supabase ativa, mas tipo de usuário não identificado (nem cartório, nem admin). Deslogando para evitar estado inconsistente.');
              if (isMounted) {
                setUser(null);
                setSession(null);
                clearCartorioAuthContext();
                localStorage.removeItem('siplan-user');
                await stableAuth.logout(); 
              }
            }
          } catch (e) {
            logger.error('❌ [AuthContextFixed] Erro ao decodificar JWT do stableAuth.session:', e);
            if (isMounted) {
              setUser(null);
              setSession(null);
              clearCartorioAuthContext();
              localStorage.removeItem('siplan-user');
              await stableAuth.logout(); 
            }
          }
        } else {
          if (isMounted) {
            setUser(null);
            setSession(null);
            clearCartorioAuthContext();
            localStorage.removeItem('siplan-user');
            logger.info('🚫 [AuthContextFixed] Nenhuma sessão Supabase ativa no stableAuth.');
          }
        }
      } catch (error) { 
        logger.error('❌ [AuthContextFixed] Erro inesperado durante a sincronização inicial de autenticação:', error);
      } finally { 
        if (isMounted && stableAuth.isInitialized) { 
          setIsLoadingAuth(false); 
          logger.debug('✅ [AuthContextFixed] Sincronização finalizada e isLoadingAuth setado para false.');
        } else if (isMounted) {
          logger.debug('⏳ [AuthContextFixed] Sincronização finalizada, mas stableAuth ainda não inicializado. isLoadingAuth permanece true.');
        }
      }
    };

    synchronizeAuthState(); 

    return () => {
      isMounted = false;
    };
  }, [stableAuth.isInitialized, stableAuth.session, stableAuth.isAdmin, stableAuth.logout]); 

  // Efeito para redirecionamento automático após autenticação
  useEffect(() => {
    if (isLoadingAuth || !user) {
      logger.debug('🚦 [AuthContextFixed] Redirecionamento: Condições não atendidas (isLoadingAuth ou sem user).', { isLoadingAuth, hasUser: !!user });
      return;
    }

    logger.debug('🚦 [AuthContextFixed] Redirecionamento: Verificando rota atual e tipo de usuário.', {
      userType: user?.type,
      currentPath: window.location.pathname
    });

    if (window.location.pathname === '/login' || window.location.pathname === '/admin-login') {
      logger.info('🔄 [AuthContextFixed] Redirecionando após login bem-sucedido...');
      if (user.type === 'admin') {
        logger.info('➡️ [AuthContextFixed] Redirecionando para /admin (usuário admin).');
        navigate('/admin');
      } else if (user.type === 'cartorio') {
        logger.info('➡️ [AuthContextFixed] Redirecionando para /dashboard (usuário cartório).');
        navigate('/dashboard');
      }
    }
  }, [isLoadingAuth, user, navigate]); 

  const login = async (usernameOrToken: string, type: 'cartorio' | 'admin', userData?: Partial<User>): Promise<void> => {
    setIsLoadingAuth(true); 
    logger.info('🔐 [AuthContextFixed] Login chamado:', { type, usernameOrToken, userData: !!userData });

    try {
      if (type === 'cartorio') {
        logger.debug('⚙️ [AuthContextFixed] Iniciando login de cartório (via Edge Function)...'); 
        
        let response: Response;
        try {
          response = await fetch(`https://bnulocsnxiffavvabfdj.supabase.co/functions/v1/login-cartorio`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJudWxvY3NueGlmZmF2dmFiZmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NzM1NTMsImV4cCI6MjA2NjQ0OTU1M30.3QeKQtbvTN4KQboUKhqOov16HZvz-xVLxmhl70S2IAE`
            },
            body: JSON.stringify({ username: usernameOrToken, login_token: userData?.token || '' })
          });
          logger.debug('⚙️ [AuthContextFixed] FETCH BEM-SUCEDIDO. Status:', { status: response.status, ok: response.ok });
        } catch (fetchError) {
          logger.error('❌ [AuthContextFixed] ERRO na chamada fetch para Edge Function:', fetchError);
          setIsLoadingAuth(false);
          throw new Error('Erro de rede na autenticação.');
        }

        if (!response.ok) {
          logger.error('❌ [AuthContextFixed] Resposta da Edge Function NÃO OK. Status:', response.status);
          const errorData = await response.json().catch(() => ({ error: 'Erro HTTP ou JSON não parseável' }));
          logger.error('❌ [AuthContextFixed] Detalhes do erro da Edge Function:', errorData);
          throw new Error(errorData.error || 'Erro na autenticação');
        }

        let data: any;
        try {
          data = await response.json();
          logger.debug('✅ [AuthContextFixed] JSON DA RESPOSTA PARSEADO COM SUCESSO:', data); 
        } catch (jsonError) {
          logger.error('❌ [AuthContextFixed] ERRO ao parsear JSON da resposta da Edge Function:', jsonError);
          setIsLoadingAuth(false);
          throw new Error('Formato de resposta inválido da autenticação.');
        }

        if (!data.success) {
          logger.error('❌ [AuthContextFixed] Falha de lógica no login da Edge Function (data.success é false):', data.error);
          throw new Error(data.error || 'Erro na autenticação');
        }

        logger.debug('⚙️ [AuthContextFixed] Preparando para chamar supabase.auth.setSession com tokens...');
        let sessionError = null;
        try {
            const { error } = await supabase.auth.setSession({
                access_token: data.access_token,
                refresh_token: data.refresh_token,
            });
            sessionError = error;
            logger.debug('✅ [AuthContextFixed] supabase.auth.setSession CONCLUÍDO. Erro retornado:', sessionError); 
        } catch (e) {
            logger.error('❌ [AuthContextFixed] EXCEÇÃO CAPTURADA ao chamar setSession:', e);
            sessionError = e; 
        }

        // NOVO LOG CRÍTICO AQUI, para verificar a sessão logo após o setSession
        try {
            const { data: { session: currentSupabaseSession } } = await supabase.auth.getSession();
            logger.debug('🔍 [AuthContextFixed] Sessão Supabase atual APÓS setSession (confirmado):', { hasSession: !!currentSupabaseSession, userEmail: currentSupabaseSession?.user?.email, user_id: currentSupabaseSession?.user?.id });
        } catch (getSessionError) {
            logger.error('❌ [AuthContextFixed] ERRO ao obter sessão Supabase após setSession:', getSessionError);
        }

        if (sessionError) {
          logger.error('❌ [AuthContextFixed] Erro ao configurar sessão Supabase (erro != null):', sessionError);
          throw new Error('Erro ao configurar sessão');
        }

        logger.info('✅ [AuthContextFixed] LOGIN DE CARTÓRIO CONCLUÍDO COM SUCESSO. O stableAuth e seus listeners irão atualizar o estado.');

      } else {
        logger.warn('⚠️ [AuthContextFixed] Login direto de admin chamado. Este contexto não lida diretamente com o login de admin, ele é gerenciado pelo fluxo padrão do Supabase Auth e useStableAuth.');
      }
    } catch (error) {
      logger.error('❌ [AuthContextFixed] ERRO GERAL durante o processo de login:', error);
      setIsLoadingAuth(false); 
      throw error; 
    } 
  };

  const logout = async (): Promise<void> => {
    setIsLoadingAuth(true); 
    logger.info('🚪 [AuthContextFixed] Logout chamado.');

    try {
      await stableAuth.logout(); 
      clearCartorioAuthContext(); 
      localStorage.removeItem('siplan-user'); 
      
      logger.info('✅ [AuthContextFixed] Logout concluído com sucesso.');
    } catch (error) {
      logger.error('❌ [AuthContextFixed] Erro durante o logout:', error);
      throw error; 
    } finally {
      setIsLoadingAuth(false); 
    }
  };

  const isAuthenticated = !!user; 
  const isLoading = isLoadingAuth;

  const authenticatedClient = supabase;

  useEffect(() => {
    logger.debug('�� [AuthContextFixed] Estado atual do contexto:', {
      userPresent: !!user,
      userType: user?.type,
      hasSupabaseSession: !!session, 
      stableAuthIsAdmin: stableAuth.isAdmin, 
      isUserAuthenticated: isAuthenticated,
      isAuthLoading: isLoading,
      stableAuthIsLoading: stableAuth.loading, 
      stableAuthIsInitialized: stableAuth.isInitialized 
    });
  }, [user, session, stableAuth.isAdmin, isAuthenticated, isLoading, stableAuth.loading, stableAuth.isInitialized]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      login, 
      logout, 
      isAuthenticated, 
      authenticatedClient,
      isLoading, 
      isAdmin: user?.type === 'admin' 
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
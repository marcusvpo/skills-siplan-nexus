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

  // Efeito para a verificação inicial de autenticação (localStorage e useStableAuth)
  useEffect(() => {
    let isMounted = true; 

    const performInitialAuthCheck = async () => {
      setIsLoadingAuth(true); 
      logger.debug('AuthContextFixed: Starting initial auth check...');

      try { // NOVO: Bloco try adicionado
        // 1. Tenta restaurar usuário de cartório do localStorage
        const savedUser = localStorage.getItem('siplan-user');
        if (savedUser) {
          try {
            const userData = JSON.parse(savedUser);
            if (userData.type === 'cartorio' && userData.token) {
              if (isMounted) {
                setUser(userData);
                setCartorioAuthContext(userData.token);
                logger.info('📦 [AuthContextFixed] Usuário cartório restaurado do localStorage.');
                // IMPORTANTE: NÃO FAZER setIsLoadingAuth(false) ou return AQUI.
                // O bloco finally vai garantir que seja desligado.
                // Isso permite que o stableAuth ainda seja inicializado no background.
                // O `return;` abaixo ainda é necessário para evitar o resto do check.
                return; 
              }
            } else {
              localStorage.removeItem('siplan-user'); 
            }
          } catch (err) {
            logger.error('❌ [AuthContextFixed] Erro ao parsear usuário do localStorage:', err);
            localStorage.removeItem('siplan-user');
          }
        }

        // 2. Aguarda stableAuth finalizar sua própria inicialização para fazer sua parte da verificação
        if (!stableAuth.isInitialized) {
          logger.debug('⏳ [AuthContextFixed] Aguardando stableAuth inicializar para completar a verificação...');
          return; // Sai cedo se stableAuth ainda não estiver pronto.
                      // O `finally` abaixo garantirá que isLoadingAuth seja false.
        }

        // 3. Verifica a sessão de admin via stableAuth
        if (stableAuth.session?.user && stableAuth.isAdmin) {
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
            logger.info('👤 [AuthContextFixed] Usuário admin sincronizado do stableAuth.');
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
      } catch (error) { // NOVO: Captura erros da verificação inicial
        logger.error('❌ [AuthContextFixed] Erro inesperado durante a verificação inicial de autenticação:', error);
      } finally { // NOVO: Bloco finally adicionado
        if (isMounted) {
          setIsLoadingAuth(false); // GARANTE que isLoadingAuth seja definido como false
          // O initializationComplete só precisa ser true quando a verificação inicial REALMENTE terminou
          // Para evitar race conditions, esta flag só é definida aqui
          logger.debug('AuthContextFixed: performInitialAuthCheck finalizado.');
        }
      }
    };

    performInitialAuthCheck(); // Executa a verificação na montagem

    return () => {
      isMounted = false;
    };
  }, [stableAuth.isInitialized, stableAuth.session, stableAuth.isAdmin]); 

  // NOVO: Efeito para sincronizar user/session/isLoadingAuth a partir do onAuthStateChange
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        logger.debug(`AuthContextFixed: onAuthStateChange event: ${event}`, { hasSession: !!session });

        // Sempre atualiza a sessão local baseada no evento
        setSession(session);

        if (session && session.user) {
          // Tenta identificar se é um usuário cartório pelo JWT
          try {
            const payload = JSON.parse(atob(session.access_token.split('.')[1]));
            logger.debug('AuthContextFixed: JWT payload decodificado:', payload);

            if (payload.cartorio_id && payload.username) {
              const cartorioUser: User = {
                id: session.user.id,
                name: payload.username,
                type: 'cartorio',
                token: payload.login_token || '', // Supondo que login_token possa estar no payload
                cartorio_id: payload.cartorio_id,
                cartorio_name: payload.cartorio_name || '', // Assumindo que o nome do cartório pode estar no payload
                username: payload.username,
                email: session.user.email || ''
              };
              setUser(cartorioUser);
              setCartorioAuthContext(payload.login_token || ''); // Configura o contexto RLS
              localStorage.setItem('siplan-user', JSON.stringify(cartorioUser));
              logger.info('🎯 AuthContextFixed: Usuário cartório configurado via onAuthStateChange.');
            } else {
              // É uma sessão, mas não é um cartório (provavelmente admin ou outro tipo)
              const adminUser: User = {
                id: session.user.id,
                name: 'Administrador',
                type: 'admin',
                email: session.user.email || ''
              };
              setUser(adminUser);
              clearCartorioAuthContext();
              localStorage.removeItem('siplan-user'); // Garante que não há info de cartório antiga
              logger.info('�� AuthContextFixed: Usuário admin configurado via onAuthStateChange.');
            }
          } catch (e) {
            logger.error('❌ AuthContextFixed: Erro ao decodificar JWT em onAuthStateChange:', e);
            // Se o JWT não puder ser decodificado, trata como sessão não-identificável, desloga.
            setUser(null);
            clearCartorioAuthContext();
            localStorage.removeItem('siplan-user');
          }
        } else {
          // Nenhuma sessão ativa
          setUser(null);
          clearCartorioAuthContext();
          localStorage.removeItem('siplan-user');
          logger.info('🚫 AuthContextFixed: Nenhuma sessão ativa ou usuário nulo em onAuthStateChange.');
        }

        // NOVO: Garantir que isLoadingAuth seja false após qualquer evento de authStateChange
        // Pois o estado da sessão já foi avaliado
        setIsLoadingAuth(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);


  const login = async (usernameOrToken: string, type: 'cartorio' | 'admin', userData?: Partial<User>): Promise<void> => {
    setIsLoadingAuth(true); 
    logger.info('🔐 [AuthContextFixed] Login chamado:', { type, usernameOrToken, userData: !!userData });

    try {
      if (type === 'cartorio') {
        logger.debug('AuthContextFixed: Iniciando login de cartório (via Edge Function)...'); 
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
        logger.debug('AuthContext: Resposta da Edge Function recebida:', data); 

        if (!data.success) {
          logger.error('❌ [AuthContextFixed] Falha no login da Edge Function:', data.error);
          throw new Error(data.error || 'Erro na autenticação');
        }

        // NOVO: Apenas seta a sessão Supabase. O listener onAuthStateChange é quem vai atualizar o estado do user/session local.
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });

        logger.debug('AuthContext: supabase.auth.setSession concluído. Erro:', sessionError); 

        if (sessionError) {
          logger.error('❌ [AuthContextFixed] Erro ao configurar sessão Supabase:', sessionError);
          throw new Error('Erro ao configurar sessão');
        }

        logger.info('✅ [AuthContextFixed] Login de cartório concluído com sucesso. onAuthStateChange irá atualizar o estado.');

      } else {
        logger.warn('⚠️ [AuthContextFixed] Login direto de admin chamado. (handle via stableAuth)');
      }
    } catch (error) {
      logger.error('❌ [AuthContextFixed] Erro durante o processo de login:', error);
      setIsLoadingAuth(false); // Garante que o carregamento é desativado em caso de erro
      throw error; 
    } 
    // O bloco finally não é mais estritamente necessário aqui, pois o onAuthStateChange
    // será acionado e definirá isLoadingAuth(false)
  };

  const logout = async (): Promise<void> => {
    setIsLoadingAuth(true); 
    logger.info('🔐 [AuthContextFixed] Logout chamado.');

    try {
      if (user?.type === 'admin') {
        await stableAuth.logout(); 
      } else {
        // Para usuário de cartório (token customizado), desloga explicitamente do Supabase Auth
        await supabase.auth.signOut(); // NOVO: Chama signOut para cartório também
        clearCartorioAuthContext();
        localStorage.removeItem('siplan-user');
      }
      // O restante do estado será limpo pelo onAuthStateChange
      logger.info('✅ [AuthContextFixed] Logout concluído com sucesso.');
    } catch (error) {
      logger.error('❌ [AuthContextFixed] Erro durante o logout:', error);
      throw error; 
    } finally {
      setIsLoadingAuth(false); 
    }
  };

  const isAuthenticated = !!user || !!session; // Usa o 'session' local que vem do onAuthStateChange
  const isLoading = isLoadingAuth;

  const authenticatedClient = supabase;

  useEffect(() => {
    logger.debug('🔍 DEBUG: AuthContextFixed estado atual:', {
      userPresent: !!user,
      userType: user?.type,
      hasSupabaseSession: !!session, // Usa o 'session' local aqui
      stableAuthIsAdmin: stableAuth.isAdmin, // Mantém para depuração
      isUserAuthenticated: isAuthenticated,
      isAuthLoading: isLoading,
      stableAuthIsLoading: stableAuth.loading, // Mantém para depuração
      stableAuthIsInitialized: stableAuth.isInitialized // Mantém para depuração
    });
  }, [user, session, stableAuth.isAdmin, isAuthenticated, isLoading, stableAuth.loading, stableAuth.isInitialized]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, // NOVO: Usa o 'session' local diretamente
      login, 
      logout, 
      isAuthenticated, 
      authenticatedClient,
      isLoading, 
      isAdmin: user?.type === 'admin' || stableAuth.isAdmin 
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
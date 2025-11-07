import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, setAuthToken, clearAuthToken } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { useStableAuth } from '@/hooks/useStableAuth';
import { logger } from '@/utils/logger';
import { isTokenExpired } from '@/utils/tokenUtils';
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
  authenticatedClient: typeof supabase;
  isLoading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const EDGE_FUNCTION_URL = 'https://bnulocsnxiffavvabfdj.supabase.co/functions/v1/login-cartorio';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartorioUser, setCartorioUser] = useState<User | null>(null);
  const [isLoadingCartorio, setIsLoadingCartorio] = useState(true);

  const stableAuth = useStableAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const restoreUser = () => {
      try {
        logger.info('[AuthContextFixed] Iniciando restauração de usuário...');
        const savedUserStr = localStorage.getItem('siplan-user');

        if (!savedUserStr) {
          logger.info('[AuthContextFixed] Nenhum usuário salvo no localStorage.');
          setCartorioUser(null);
          clearAuthToken();
          setIsLoadingCartorio(false); // Fim do fluxo (sem usuário)
          return;
        }

        const savedUser: User = JSON.parse(savedUserStr);

        if (savedUser.type !== 'cartorio' || !savedUser.token) {
          logger.warn('[AuthContextFixed] Usuário salvo inválido.');
          localStorage.removeItem('siplan-user');
          setCartorioUser(null);
          clearAuthToken();
          setIsLoadingCartorio(false); // Fim do fluxo (usuário inválido)
          return;
        }

        if (isTokenExpired(savedUser.token)) {
          logger.warn('[AuthContextFixed] Token expirado.');
          localStorage.removeItem('siplan-user');
          setCartorioUser(null);
          clearAuthToken();
          setIsLoadingCartorio(false); // Fim do fluxo (token expirado)
          return;
        }

        // SUCESSO: Token e usuário são válidos e do localStorage
        // NÃO FAZEMOS QUERY DE REDE. Confiamos no localStorage.
        
        setCartorioUser(savedUser);
        setAuthToken(savedUser.token);
        
        logger.info(`[AuthContextFixed] Usuário cartório restaurado do localStorage: ${savedUser.username}`);

        // SÓ AGORA é seguro dizer que o carregamento terminou
        setIsLoadingCartorio(false); // Fim do fluxo (sucesso)

      } catch (error) {
        logger.error('[AuthContextFixed] Erro catastrófico ao restaurar user:', error);
        localStorage.removeItem('siplan-user');
        setCartorioUser(null);
        clearAuthToken();
        setIsLoadingCartorio(false); // Fim do fluxo (erro geral)
      }
    };

    restoreUser();
  }, []);

  const user: User | null = cartorioUser || (stableAuth.session?.user ? {
    id: stableAuth.session.user.id,
    name: 'Administrador',
    type: 'admin',
    email: stableAuth.session.user.email || '',
  } : null);

  const isLoading = isLoadingCartorio || stableAuth.loading;

  // Redirecionamento pós-login
  useEffect(() => {
    if (isLoading || !user) return;
    const path = window.location.pathname;
    if (path === '/login' || path === '/admin-login') {
      if (user.type === 'admin') navigate('/admin');
      else if (user.type === 'cartorio') navigate('/dashboard');
    }
  }, [user, isLoading, navigate]);

  const login = async (usernameOrToken: string, type: 'cartorio' | 'admin', userData?: Partial<User>): Promise<void> => {
    if (type === 'cartorio') {
      setIsLoadingCartorio(true);
      logger.info(`[AuthContextFixed] Tentando login cartório: ${usernameOrToken}`);
      try {
        const response = await fetch(EDGE_FUNCTION_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer sb_publishable_Qf2Fc0CgFvljfVhk3v9IYg_PrDm9z4J` // Publishable Key
          },
          body: JSON.stringify({
            username: usernameOrToken,
            login_token: userData?.token || ''
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Erro na autenticação' }));
          throw new Error(errorData.error || 'Erro na autenticação');
        }

        const data = await response.json();

        if (!data.success || !data.user || !data.access_token) {
          throw new Error(data.error || 'Login falhou, resposta inválida');
        }

        // PASSO 1: AUTENTICAR O CLIENTE IMEDIATAMENTE
        logger.info('[AuthContextFixed] Token recebido. Definindo cliente Supabase...');
        setAuthToken(data.access_token);

        // PASSO 2: CONFIAR NOS DADOS DA EDGE FUNCTION (SEM SEGUNDA QUERY)
        logger.info(`[AuthContextFixed] Perfil recebido do backend`);

        // PASSO 3: CONFIGURAR O ESTADO DO USUÁRIO
        const newUser: User = {
          id: data.user.id,
          name: data.user.username,
          type: 'cartorio',
          token: data.access_token,
          cartorio_id: data.user.cartorio_id,
          cartorio_name: data.user.cartorio_name ?? '',
          username: data.user.username,
          email: data.user.email ?? ''
        };

        setCartorioUser(newUser);
        localStorage.setItem('siplan-user', JSON.stringify(newUser)); // Salva o usuário completo

        logger.info(`[AuthContextFixed] Login cartório efetuado com sucesso: ${newUser.username}`);
        setIsLoadingCartorio(false);

      } catch (error) {
        logger.error('[AuthContextFixed] Erro no login cartório:', error);
        setIsLoadingCartorio(false);
        throw error;
      }
    } else {
      logger.info('[AuthContextFixed] Login admin via Supabase Auth');
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Desativar a sessão do cartório se for um usuário cartório
      if (cartorioUser?.cartorio_id) {
        try {
          await supabase.rpc('deactivate_old_sessions');
          logger.info('[AuthContextFixed] Sessão do cartório desativada no logout');
        } catch (error) {
          logger.error('[AuthContextFixed] Erro ao desativar sessão:', error);
        }
      }
      
      if (stableAuth.session) await stableAuth.logout();
      setCartorioUser(null);
      clearAuthToken();
      localStorage.removeItem('siplan-user');
      logger.info('[AuthContextFixed] Logout realizado com sucesso');
    } catch (error) {
      logger.error('[AuthContextFixed] Erro no logout:', error);
      throw error;
    }
  };

  const contextValue: AuthContextType = {
    user,
    session: stableAuth.session,
    login,
    logout,
    isAuthenticated: !!user,
    authenticatedClient: supabase,
    isLoading,
    isAdmin: user?.type === 'admin',
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro do AuthProvider');
  return context;
};

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, setAuthToken, clearAuthToken } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
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
  authenticatedClient: typeof supabase;
  isLoading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ✅ Configurações da Edge Function
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJudWxvY3NueGlmZmF2dmFiZmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NzM1NTMsImV4cCI6MjA2NjQ0OTU1M30.3QeKQtbvTN4KQboUKhqOov16HZvz-xVLxmhl70S2IAE";
const EDGE_FUNCTION_URL = "https://bnulocsnxiffavvabfdj.supabase.co/functions/v1/login-cartorio";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartorioUser, setCartorioUser] = useState<User | null>(null);
  const [isLoadingCartorio, setIsLoadingCartorio] = useState(true);
  
  // ✅ Usa o hook para gerenciar admin
  const stableAuth = useStableAuth();
  const navigate = useNavigate();

  // ✅ Inicialização do usuário cartório
  useEffect(() => {
    const initCartorioUser = () => {
      logger.info('🏢 [AuthContextFixed] Inicializando usuário cartório...', {});
      
      try {
        const savedUser = localStorage.getItem('siplan-user');
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          if (userData.type === 'cartorio' && userData.token) {
            setCartorioUser(userData);
            setAuthToken(userData.token);
            logger.info('📦 [AuthContextFixed] Usuário cartório restaurado do localStorage', {
              username: userData.username,
              cartorioId: userData.cartorio_id
            });
          }
        }
      } catch (error) {
        logger.error('❌ [AuthContextFixed] Erro ao restaurar usuário cartório:', { error });
        localStorage.removeItem('siplan-user');
      } finally {
        setIsLoadingCartorio(false);
      }
    };

    initCartorioUser();
  }, []);

  // ✅ Usuário consolidado (cartório ou admin) 
  const user: User | null = cartorioUser || (stableAuth.session?.user ? {
    id: stableAuth.session.user.id,
    name: 'Administrador',
    type: 'admin',
    email: stableAuth.session.user.email || ''
  } : null);

  // ✅ Estado de loading consolidado
  const isLoading = isLoadingCartorio || stableAuth.loading;

  // ✅ Redirecionamento após login
  useEffect(() => {
    if (isLoading || !user) return;

    const currentPath = window.location.pathname;
    if (currentPath === '/login' || currentPath === '/admin-login') {
      logger.info('➡️ [AuthContextFixed] Redirecionando após login:', {
        userType: user.type,
        currentPath
      });
      
      if (user.type === 'admin') {
        navigate('/admin');
      } else if (user.type === 'cartorio') {
        navigate('/dashboard');
      }
    }
  }, [user, isLoading, navigate]);

  // ✅ Função de login
  const login = async (
    usernameOrToken: string, 
    type: 'cartorio' | 'admin', 
    userData?: Partial<User>
  ): Promise<void> => {
    if (type === 'cartorio') {
      setIsLoadingCartorio(true);
      logger.info('🔐 [AuthContextFixed] Iniciando login cartório:', {
        username: usernameOrToken
      });

      try {
        const response = await fetch(EDGE_FUNCTION_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({ 
            username: usernameOrToken, 
            login_token: userData?.token || '' 
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(
            () => ({ error: 'Erro de comunicação' })
          );
          logger.error('❌ [AuthContextFixed] Erro na resposta da Edge Function:', {
            status: response.status,
            error: errorData.error
          });
          throw new Error(errorData.error || 'Erro na autenticação');
        }

        const data = await response.json();
        if (!data.success) {
          logger.error('❌ [AuthContextFixed] Login rejeitado pela Edge Function:', {
            error: data.error
          });
          throw new Error(data.error || 'Erro na autenticação');
        }

        const newCartorioUser: User = {
          id: data.user.id,
          name: data.user.username,
          type: 'cartorio',
          token: data.access_token,
          cartorio_id: data.user.cartorio_id,
          cartorio_name: data.user.cartorio_name || '',
          username: data.user.username,
          email: data.user.email || ''
        };

        setCartorioUser(newCartorioUser);
        setAuthToken(data.access_token);
        localStorage.setItem('siplan-user', JSON.stringify(newCartorioUser));
        
        logger.info('✅ [AuthContextFixed] Login cartório bem-sucedido:', {
          username: newCartorioUser.username,
          cartorioId: newCartorioUser.cartorio_id,
          cartorioName: newCartorioUser.cartorio_name
        });
        
      } catch (error) {
        logger.error('❌ [AuthContextFixed] Erro no login cartório:', { error });
        throw error;
      } finally {
        setIsLoadingCartorio(false);
      }
    } else {
      logger.info('ℹ️ [AuthContextFixed] Login admin deve ser feito via Supabase Auth', {});
    }
  };

  // ✅ Função de logout
  const logout = async (): Promise<void> => {
    try {
      logger.info('🚪 [AuthContextFixed] Iniciando logout...', {
        hasCartorioUser: !!cartorioUser,
        hasStableAuthSession: !!stableAuth.session
      });
      
      // ✅ Logout admin se houver sessão
      if (stableAuth.session) {
        await stableAuth.logout();
      }
      
      // ✅ Limpar usuário cartório
      setCartorioUser(null);
      clearAuthToken();
      localStorage.removeItem('siplan-user');
      
      logger.info('✅ [AuthContextFixed] Logout concluído com sucesso', {});
      
    } catch (error) {
      logger.error('❌ [AuthContextFixed] Erro no logout:', { error });
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
    isAdmin: user?.type === 'admin'
  };

  return (
    <AuthContext.Provider value={contextValue}>
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

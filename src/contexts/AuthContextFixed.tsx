import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, setAuthToken, clearAuthToken } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';
import { useNavigate } from 'react-router-dom';

// ✅ Interface de usuário simplificada
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

// ✅ Configuração de Edge Function usando variável de ambiente
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJudWxvY3NueGlmZmF2dmFiZmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NzM1NTMsImV4cCI6MjA2NjQ0OTU1M30.3QeKQtbvTN4KQboUKhqOov16HZvz-xVLxmhl70S2IAE";
const EDGE_FUNCTION_URL = "https://bnulocsnxiffavvabfdj.supabase.co/functions/v1/login-cartorio";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // ✅ Inicialização simplificada
  useEffect(() => {
    const initializeAuth = async () => {
      logger.info('🚀 [AuthContextFixed] Inicializando autenticação...');
      
      try {
        // ✅ 1. Verificar usuário salvo no localStorage
        const savedUser = localStorage.getItem('siplan-user');
        if (savedUser) {
          try {
            const userData = JSON.parse(savedUser);
            if (userData.type === 'cartorio' && userData.token) {
              setUser(userData);
              setAuthToken(userData.token);
              logger.info('📦 [AuthContextFixed] Usuário cartório restaurado do localStorage');
            }
          } catch (err) {
            logger.error('❌ [AuthContextFixed] Erro ao restaurar usuário:', err);
            localStorage.removeItem('siplan-user');
          }
        }

        // ✅ 2. Verificar sessão Supabase para admin
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession?.user) {
          try {
            // ✅ Decodificar JWT para verificar se é admin
            const payload = JSON.parse(
              atob(currentSession.access_token.split('.')[1])
            );
            
            if (payload.role === 'authenticated' && currentSession.user.email) {
              // ✅ Assumir que é admin se tem sessão Supabase válida
              const adminUser: User = {
                id: currentSession.user.id,
                name: 'Administrador',
                type: 'admin',
                email: currentSession.user.email
              };
              
              setUser(adminUser);
              setSession(currentSession);
              clearAuthToken(); // ✅ Admin não usa JWT customizado
              logger.info('👤 [AuthContextFixed] Usuário admin configurado');
            }
          } catch (err) {
            logger.error('❌ [AuthContextFixed] Erro ao decodificar JWT admin:', err);
            await supabase.auth.signOut();
          }
        }

        // ✅ 3. Configurar listener para mudanças de auth
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            logger.info('🔄 [AuthContextFixed] Auth state changed:', event);
            
            if (event === 'SIGNED_OUT' || !newSession) {
              setUser(null);
              setSession(null);
              clearAuthToken();
              localStorage.removeItem('siplan-user');
            } else if (newSession?.user) {
              // ✅ Nova sessão admin
              const adminUser: User = {
                id: newSession.user.id,
                name: 'Administrador',
                type: 'admin',
                email: newSession.user.email || ''
              };
              
              setUser(adminUser);
              setSession(newSession);
              clearAuthToken();
            }
          }
        );

        return () => {
          subscription.unsubscribe();
        };
        
      } catch (error) {
        logger.error('❌ [AuthContextFixed] Erro na inicialização:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // ✅ Redirecionamento após login
  useEffect(() => {
    if (isLoading || !user) return;

    const currentPath = window.location.pathname;
    if (currentPath === '/login' || currentPath === '/admin-login') {
      if (user.type === 'admin') {
        navigate('/admin');
      } else if (user.type === 'cartorio') {
        navigate('/dashboard');
      }
    }
  }, [user, isLoading, navigate]);

  // ✅ Função de login simplificada
  const login = async (
    usernameOrToken: string, 
    type: 'cartorio' | 'admin', 
    userData?: Partial<User>
  ): Promise<void> => {
    setIsLoading(true);
    logger.info('🔐 [AuthContextFixed] Iniciando login:', { type });

    try {
      if (type === 'cartorio') {
        // ✅ Login cartório via Edge Function
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
          throw new Error(errorData.error || 'Erro na autenticação');
        }

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || 'Erro na autenticação');
        }

        // ✅ Configurar usuário cartório
        const cartorioUser: User = {
          id: data.user.id,
          name: data.user.username,
          type: 'cartorio',
          token: data.access_token,
          cartorio_id: data.user.cartorio_id,
          cartorio_name: data.user.cartorio_name || '',
          username: data.user.username,
          email: data.user.email || ''
        };

        setUser(cartorioUser);
        setSession(null);
        setAuthToken(data.access_token);
        localStorage.setItem('siplan-user', JSON.stringify(cartorioUser));
        
        logger.info('✅ [AuthContextFixed] Login cartório bem-sucedido');
        
      } else {
        // ✅ Login admin será gerenciado pelo Supabase Auth diretamente
        logger.info('ℹ️ [AuthContextFixed] Login admin deve ser feito via Supabase Auth');
      }
    } catch (error) {
      logger.error('❌ [AuthContextFixed] Erro no login:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Função de logout simplificada
  const logout = async (): Promise<void> => {
    setIsLoading(true);
    logger.info('🚪 [AuthContextFixed] Iniciando logout...');

    try {
      // ✅ Logout Supabase se houver sessão
      if (session) {
        await supabase.auth.signOut();
      }
      
      // ✅ Limpar estados
      setUser(null);
      setSession(null);
      clearAuthToken();
      localStorage.removeItem('siplan-user');
      
      logger.info('✅ [AuthContextFixed] Logout concluído');
    } catch (error) {
      logger.error('❌ [AuthContextFixed] Erro no logout:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const contextValue: AuthContextType = {
    user,
    session,
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

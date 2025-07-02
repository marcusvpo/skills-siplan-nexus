
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Session } from '@supabase/supabase-js';
import { AuthContext, debugAuthContext, getAuthContextId, User, CartorioLoginData, AuthContextType } from '@/contexts/AuthContextSingleton';
import { supabase, createAuthenticatedClient } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  console.log('🔐 [AuthProvider] Rendering with context ID:', getAuthContextId());
  debugAuthContext('AuthProvider');
  
  // Estados principais
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [authenticatedClient, setAuthenticatedClient] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Inicialização única
  useEffect(() => {
    console.log('🔐 [AuthProvider] Initialization effect running');
    
    if (isInitialized) {
      console.log('🔐 [AuthProvider] Already initialized, skipping');
      return;
    }

    let mounted = true;

    const initializeAuth = async () => {
      try {
        // 1. Primeiro, verificar se há usuário salvo no localStorage
        const savedUser = localStorage.getItem('siplan-user');
        if (savedUser && mounted) {
          try {
            const userData = JSON.parse(savedUser);
            console.log('🔐 [AuthProvider] Restoring user from localStorage:', {
              type: userData.type,
              cartorio_id: userData.cartorio_id,
              username: userData.username
            });
            
            if (userData.type === 'cartorio' && userData.jwtToken) {
              setCurrentUser(userData);
              const authClient = createAuthenticatedClient(userData.jwtToken);
              setAuthenticatedClient(authClient);
              console.log('🔐 [AuthProvider] User restored successfully');
            }
          } catch (err) {
            console.error('❌ [AuthProvider] Error restoring saved user:', err);
            localStorage.removeItem('siplan-user');
          }
        }

        // 2. Verificar sessão atual do Supabase
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (initialSession && mounted) {
          console.log('🔐 [AuthProvider] Found existing Supabase session');
          setCurrentSession(initialSession);
          
          // Se não há usuário do cartório, criar usuário admin
          if (!currentUser && initialSession.user) {
            const adminUser: User = {
              id: initialSession.user.id,
              name: 'Administrador',
              type: 'admin',
              email: initialSession.user.email || ''
            };
            setCurrentUser(adminUser);
          }
        }

        // 3. Configurar listener para mudanças de autenticação
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (!mounted) return;
            
            console.log('🔐 [AuthProvider] Auth state changed:', event, !!session);
            
            setCurrentSession(session);
            
            if (session?.user) {
              // Apenas atualizar se não há usuário de cartório
              if (!currentUser || currentUser.type !== 'cartorio') {
                const adminUser: User = {
                  id: session.user.id,
                  name: 'Administrador',
                  type: 'admin',
                  email: session.user.email || ''
                };
                setCurrentUser(adminUser);
              }
            } else if (!currentUser || currentUser.type === 'admin') {
              // Limpar apenas se era admin
              setCurrentUser(null);
              setAuthenticatedClient(null);
            }
            
            setIsLoading(false);
          }
        );

        setIsInitialized(true);
        setIsLoading(false);
        
        return () => {
          mounted = false;
          subscription.unsubscribe();
        };
        
      } catch (error) {
        console.error('❌ [AuthProvider] Initialization error:', error);
        if (mounted) {
          setIsLoading(false);
          setIsInitialized(true);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, []);

  // Função de login para cartório
  const loginCartorio = useCallback(async (token: string, userData: CartorioLoginData): Promise<User> => {
    console.log('🔐 [AuthProvider] Starting cartorio login');

    try {
      const response = await fetch('https://bnulocsnxiffavvabfdj.supabase.co/functions/v1/login-cartorio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJudWxvY3NueGlmZmF2dmFiZmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NzM1NTMsImV4cCI6MjA2NjQ0OTU1M30.3QeKQtbvTN4KQboUKhqOov16HZvz-xVLxmhl70S2IAE`,
        },
        body: JSON.stringify({ 
          username: userData.username, 
          login_token: token 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to authenticate: ${response.status}`);
      }

      const authData = await response.json();
      
      if (!authData.success || !authData.token) {
        throw new Error('Invalid response from login service');
      }

      const newUser: User = {
        id: authData.usuario?.id || userData.username,
        name: authData.usuario?.username || userData.username,
        type: 'cartorio',
        token: token,
        jwtToken: authData.token,
        cartorio_id: authData.cartorio?.id,
        cartorio_name: authData.cartorio?.nome,
        username: authData.usuario?.username || userData.username,
        email: authData.usuario?.email
      };

      const authClient = createAuthenticatedClient(authData.token);
      
      setCurrentUser(newUser);
      setAuthenticatedClient(authClient);
      
      localStorage.setItem('siplan-user', JSON.stringify(newUser));

      console.log('✅ [AuthProvider] Cartorio login successful');
      return newUser;
    } catch (error) {
      console.error('❌ [AuthProvider] Cartorio login failed:', error);
      throw error;
    }
  }, []);

  // Função de login principal
  const login = useCallback(async (token: string, type: 'cartorio' | 'admin', userData?: Partial<User>) => {
    console.log('🔐 [AuthProvider] Login called:', { type });
    
    if (type === 'cartorio') {
      if (!userData?.username) {
        throw new Error('Username é obrigatório para login de cartório');
      }
      
      await loginCartorio(token, {
        username: userData.username,
        cartorio_id: userData.cartorio_id,
        cartorio_name: userData.cartorio_name,
        email: userData.email
      });
    } else {
      const newUser: User = {
        id: userData?.id || '1',
        name: userData?.name || 'Administrador',
        type,
        email: userData?.email
      };
      setCurrentUser(newUser);
    }
    
    console.log('✅ [AuthProvider] Login completed');
  }, [loginCartorio]);

  // Função de logout
  const logout = useCallback(async () => {
    console.log('🔐 [AuthProvider] Logout called');
    
    if (currentUser?.type === 'admin') {
      await supabase.auth.signOut();
    }
    
    setCurrentUser(null);
    setAuthenticatedClient(null);
    setCurrentSession(null);
    localStorage.removeItem('siplan-user');
    
    console.log('✅ [AuthProvider] Logout completed');
  }, [currentUser?.type]);

  // Determinar usuário final e estado de autenticação
  const finalUser = currentUser || (currentSession?.user ? {
    id: currentSession.user.id,
    name: 'Administrador',
    type: 'admin' as const,
    email: currentSession.user.email || ''
  } : null);

  const isAuthenticated = !!finalUser;
  const isAdmin = currentSession?.user ? true : false;

  // Memoizar o valor do contexto
  const contextValue: AuthContextType = useMemo(() => ({
    user: finalUser, 
    session: currentSession, 
    login, 
    logout, 
    isAuthenticated, 
    authenticatedClient,
    isLoading,
    isAdmin
  }), [finalUser, currentSession, login, logout, isAuthenticated, authenticatedClient, isLoading, isAdmin]);

  console.log('🔐 [AuthProvider] Providing context value:', {
    contextId: getAuthContextId(),
    hasUser: !!contextValue.user,
    userType: contextValue.user?.type,
    isAuthenticated: contextValue.isAuthenticated,
    isLoading: contextValue.isLoading,
    isInitialized
  });

  // Não renderizar filhos até que esteja inicializado
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-white">Inicializando autenticação...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

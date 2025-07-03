import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client'; // Importa a instância principal do Supabase
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
  login: (token: string, type: 'cartorio' | 'admin', userData?: Partial<User>) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  supabaseClient: typeof supabase; // Agora fornece a instância principal do Supabase
  isLoading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  // O estado 'authenticatedClient' e seu setter não são mais necessários
  // const [authenticatedClient, setAuthenticatedClient] = useState<any>(null);
  
  const stableAuth = useStableAuth();

  // useEffect para restaurar usuário de cartório do localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('siplan-user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        logger.info('🔐 [AuthContextFixed] Restored user from localStorage:', { 
          type: userData.type, 
          cartorio_id: userData.cartorio_id,
          token: userData.token ? 'present' : 'missing'
        });
        
        if (userData.type === 'cartorio' && userData.token) {
          setUser(userData);
          // Não é necessário criar um cliente autenticado aqui.
          // A instância 'supabase' principal já gerencia a sessão com persistSession.
        }
      } catch (err) {
        logger.error('❌ [AuthContextFixed] Error parsing saved user:', err);
        localStorage.removeItem('siplan-user');
      }
    }
  }, []);

  // useEffect para sincronizar o usuário com o stableAuth (especialmente para admin)
  useEffect(() => {
    if (stableAuth.session?.user && stableAuth.isAdmin) {
      logger.info('🔐 [AuthContextFixed] Setting admin user from stableAuth');
      
      const adminUser: User = {
        id: stableAuth.session.user.id,
        name: 'Administrador',
        type: 'admin',
        email: stableAuth.session.user.email || ''
      };
      setUser(adminUser);
      
      // Limpar dados de cartório do localStorage se um admin logar
      if (localStorage.getItem('siplan-user')) {
        const stored = JSON.parse(localStorage.getItem('siplan-user') || '{}');
        if (stored.type === 'cartorio') {
            localStorage.removeItem('siplan-user');
        }
      }
    } else if (!stableAuth.session && user?.type === 'admin') {
      // Limpar usuário admin se não há sessão (admin deslogou)
      logger.info('🔐 [AuthContextFixed] Clearing admin user - no session');
      setUser(null);
      // setAuthenticatedClient(null); // Não mais necessário
    } else if (stableAuth.session && !stableAuth.isAdmin && user?.type !== 'cartorio') {
      // Caso haja uma sessão, mas não é admin e não é cartório do localStorage (pode ser um usuário genérico)
      logger.info('🔐 [AuthContextFixed] Setting generic authenticated user from stableAuth (not admin or specific cartorio)');
      const genericUser: User = {
        id: stableAuth.session.user.id,
        name: stableAuth.session.user.email || 'Usuário',
        type: 'cartorio', // Assumindo 'cartorio' para usuários autenticados não-admin
        email: stableAuth.session.user.email || ''
      };
      setUser(genericUser);
    } else if (!stableAuth.session && user) { // Se não há sessão e há um usuário no estado (ex: sessão expirou)
        logger.info('🔐 [AuthContextFixed] Clearing user state as no active session detected.');
        setUser(null);
        localStorage.removeItem('siplan-user'); // Garante que o localStorage também seja limpo
    }
  }, [stableAuth.session, stableAuth.isAdmin, user]); // Adicionado 'user' para garantir que o useEffect reage às mudanças no estado local

  const login = async (token: string, type: 'cartorio' | 'admin', userData?: Partial<User>) => {
    logger.info('�� [AuthContextFixed] Login called:', { 
      type, 
      userData: !!userData,
      cartorio_id: userData?.cartorio_id,
      token: token ? 'present' : 'missing'
    });
    
    const newUser: User = {
      id: userData?.id || 'default_id', // O ID real virá da sessão Supabase via stableAuth
      name: userData?.name || (type === 'cartorio' ? 'Cartório' : 'Administrador'),
      type,
      token: type === 'cartorio' ? token : undefined, // Mantém o token se for necessário para outras APIs
      cartorio_id: userData?.cartorio_id,
      cartorio_name: userData?.cartorio_name,
      username: userData?.username,
      email: userData?.email
    };
    
    setUser(newUser);
    
    if (type === 'cartorio') {
      localStorage.setItem('siplan-user', JSON.stringify(newUser));
      // Não é necessário criar/atualizar authenticatedClient aqui.
      // O 'supabase' de client.ts fará isso automaticamente.
    }
    // Para admin, 'stableAuth' e a instância 'supabase' gerenciam a autenticação
    
    logger.info('✅ [AuthContextFixed] User login state updated (relying on global supabase client for session)');
  };

  const logout = async () => {
    logger.info('🔐 [AuthContextFixed] Logout called');
    
    // Usa a instância 'supabase' principal para deslogar do Supabase Auth
    await supabase.auth.signOut();
    
    setUser(null);
    // setAuthenticatedClient(null); // Não mais necessário
    localStorage.removeItem('siplan-user'); // Limpa o localStorage personalizado

    logger.info('✅ [AuthContextFixed] User logged out successfully');
  };

  const isAuthenticated = !!user || !!stableAuth.session;
  const isLoading = stableAuth.isLoading;

  // Debug log do estado atual
  useEffect(() => {
    logger.info('🔐 [AuthContextFixed] Current auth state:', {
      hasUser: !!user,
      userType: user?.type,
      hasSession: !!stableAuth.session,
      isAdmin: stableAuth.isAdmin,
      isAuthenticated,
      isLoading,
      // hasAuthClient: !!authenticatedClient // Não mais necessário
    });
  }, [user, stableAuth.session, stableAuth.isAdmin, isAuthenticated, isLoading]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      session: stableAuth.session, 
      login, 
      logout, 
      isAuthenticated, 
      supabaseClient: supabase, // Passa a instância 'supabase' principal
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
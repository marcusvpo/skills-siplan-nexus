// src/contexts/AuthContextFixed.tsx

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, setCartorioAuthContext, clearCartorioAuthContext } from '@/integrations/supabase/client';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { useStableAuth } from '@/hooks/useStableAuth';
import { logger } from '@/utils/logger';

// Interface do Usuário, atualizada para incluir os tokens e campos da Edge Function
interface User {
  id: string; // ID do usuário na tabela 'usuarios'
  name: string; // Nome de exibição (username ou nome do cartório)
  type: 'cartorio' | 'admin';
  cartorio_id?: string;
  cartorio_name?: string;
  username: string; // Username do usuário
  email?: string; // Email do usuário (pode ser gerado)
  auth_user_id?: string; // ID do usuário no Supabase Auth
  access_token?: string; // Token de acesso retornado pela Edge Function
  refresh_token?: string; // Refresh token retornado pela Edge Function
  is_admin?: boolean; // Se o usuário é admin
}

// Interface do Contexto de Autenticação
interface AuthContextType {
  user: User | null;
  session: Session | null;
  // Assinatura da função login: agora recebe username e password
  login: (username: string, password: string) => Promise<void>; 
  logout: () => void;
  isAuthenticated: boolean;
  authenticatedClient: any; // Cliente Supabase autenticado
  isLoading: boolean; // Estado de carregamento geral
  isAdmin: boolean; // Se o usuário logado é admin
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true); // Estado de carregamento específico do AuthProvider
  
  const stableAuth = useStableAuth(); // Hook para gerenciar a sessão Supabase padrão

  // Log de debug para o estado inicial/renderização do AuthProvider
  useEffect(() => {
    console.log('🔍 DEBUG: AuthProvider render - stableAuth state:', {
      hasUser: !!stableAuth.user,
      hasSession: !!stableAuth.session,
      loading: stableAuth.loading,
      isAdmin: stableAuth.isAdmin,
      error: stableAuth.error
    });
  }, [stableAuth.user, stableAuth.session, stableAuth.loading, stableAuth.isAdmin, stableAuth.error]);


  // Efeito para carregar o usuário do localStorage e configurar usuário demo
  useEffect(() => {
    const loadUserFromLocalStorage = async () => {
      setAuthLoading(true); // Inicia carregamento
      console.log('🔍 DEBUG: AuthProvider localStorage check starting...');
      const savedUser = localStorage.getItem('siplan-user');

      if (savedUser) {
        try {
          const userData: User = JSON.parse(savedUser);
          console.log('🔍 DEBUG: Found saved user in localStorage:', userData);
          logger.info('🔐 [AuthContextFixed] Restored user from localStorage:', { 
            type: userData.type, 
            cartorio_id: userData.cartorio_id,
            username: userData.username,
            has_access_token: !!userData.access_token,
          });
          
          if (userData.type === 'cartorio' && userData.access_token) {
            setUser(userData);
            try {
              // Tenta setar a sessão Supabase com os tokens do localStorage
              await supabase.auth.setSession({
                  access_token: userData.access_token,
                  refresh_token: userData.refresh_token || '' // Garante que refresh_token não é undefined
              });
              // Configura o contexto de autenticação customizado do cartório
              setCartorioAuthContext(userData.access_token);
              logger.info('🔐 [AuthContextFixed] Cartorio auth context and Supabase session set from localStorage.');
            } catch (err) {
              logger.error('❌ [AuthContextFixed] Error setting cartorio auth context/Supabase session:', err);
              // Em caso de erro, limpa os dados corrompidos
              localStorage.removeItem('siplan-user');
              setUser(null);
            }
          } else {
             // Se os dados do usuário estão incompletos ou não são do tipo cartório, limpa o localStorage.
            localStorage.removeItem('siplan-user');
            setUser(null);
          }
        } catch (err) {
          console.log('🔍 DEBUG: Error parsing saved user from localStorage:', err);
          logger.error('❌ [AuthContextFixed] Error parsing saved user:', err);
          localStorage.removeItem('siplan-user');
          setUser(null);
        }
      } 
      
      // Se nenhum usuário foi encontrado ou parsing falhou, e não há uma sessão Supabase ativa, configura o usuário demo
      if (!user && !stableAuth.session) {
        console.log('🔍 DEBUG: No saved user or session found, setting up demo user...');
        const demoUser: User = {
          id: 'demo-user-id',
          name: 'Cartório de Demonstração',
          type: 'cartorio',
          username: 'demo',
          email: 'demo@siplan.com.br',
          access_token: 'DEMO-SIPLANSKILLS-ACCESS-TOKEN', // Token demo (placeholder)
          refresh_token: 'DEMO-SIPLANSKILLS-REFRESH-TOKEN', // Refresh token demo (placeholder)
          cartorio_id: '550e8400-e29b-41d4-a716-446655440000',
          cartorio_name: 'Cartório de Demonstração',
        };
        setUser(demoUser);
        localStorage.setItem('siplan-user', JSON.stringify(demoUser)); // Armazena usuário demo para persistência
        setCartorioAuthContext(demoUser.access_token);
        logger.info('�� [AuthContextFixed] Demo cartorio user and auth context set.');
      }
      setAuthLoading(false); // Finaliza carregamento
    };

    loadUserFromLocalStorage();
  }, [stableAuth.session]); // Executa novamente se a sessão Supabase mudar (ex: admin loga/desloga)


  // Efeito para gerenciar o estado do usuário admin com base no stableAuth
  useEffect(() => {
    console.log('🔍 DEBUG: AuthProvider stableAuth effect triggered with:', {
      stableAuthHasSession: !!stableAuth.session,
      stableAuthIsAdmin: stableAuth.isAdmin,
      currentUserType: user?.type,
      sessionUserEmail: stableAuth.session?.user?.email
    });

    if (stableAuth.session?.user && stableAuth.isAdmin) {
      // Se há uma sessão admin do Supabase, define o usuário como admin
      if (!user || user.type !== 'admin' || user.id !== stableAuth.session.user.id) {
        console.log('🔍 DEBUG: Setting admin user from stableAuth');
        logger.info('🔐 [AuthContextFixed] Setting admin user from stableAuth');
        
        const adminUser: User = {
          id: stableAuth.session.user.id,
          name: 'Administrador', 
          type: 'admin',
          username: stableAuth.session.user.user_metadata?.username || stableAuth.session.user.email || '',
          email: stableAuth.session.user.email || '',
        };
        setUser(adminUser);
        clearCartorioAuthContext(); // Limpa qualquer contexto de cartório existente
        localStorage.removeItem('siplan-user'); // Garante que o usuário cartório seja removido do localStorage
      }
    } else if (!stableAuth.session && user?.type === 'admin') {
      // Se não há sessão admin e o usuário atual é admin, limpa o usuário admin
      console.log('🔍 DEBUG: Clearing admin user - no session');
      logger.info('🔐 [AuthContextFixed] Clearing admin user - no session');
      setUser(null);
      clearCartorioAuthContext(); // Limpa qualquer contexto de cartório existente
    }
  }, [stableAuth.session, stableAuth.isAdmin, user]); // Depende de 'user' para evitar loops e condições erradas

  // Função principal de login para usuários de cartório (chamada pelo Login.tsx)
  const login = useCallback(async (username: string, password: string) => {
    logger.info('�� [AuthContextFixed] Attempting cartorio login via Edge Function...', { 
      username: username, 
      password_present: !!password 
    });

    try {
      setAuthLoading(true); // Inicia carregamento para esta tentativa de login

      // URL da Edge Function
      // Ajuste 'bnulocsnxiffavvabfdj.supabase.co' para a URL do seu projeto Supabase se for diferente.
      const baseUrl = window.location.origin.includes('lovable.app') 
        ? 'https://bnulocsnxiffavvabfdj.supabase.co' 
        : 'https://bnulocsnxiffavvabfdj.supabase.co'; 

      const response = await fetch(`${baseUrl}/functions/v1/login-cartorio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // O token de Autorização aqui é a chave anon (anon key) do seu projeto Supabase.
          // Ela permite chamar Edge Functions.
          // Substitua `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJudWxvY3NueGlmZmF2dmF...`
          // Pela sua própria chave anon do Supabase.
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJudWxvY3NueGlmZmF2dmFiZmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NzM1NTMsImV4cCI6MjA2NjQ0OTU1M30.3QeKQtbvTN4KQboUKhqOov16HZvz-xVLxmhl70S2IAE`,
        },
        body: JSON.stringify({ username, password }), // Envia username e password
      });

      console.log('🔍 [LOGIN] Edge Function response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json(); // Edge Function retorna erro em JSON
        console.error('❌ [LOGIN] Error from Edge Function:', errorData);
        throw new Error(errorData.error || `Erro do servidor: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ [LOGIN] Edge Function data received:', data);

      if (data.success && data.access_token && data.refresh_token) {
        console.log('✅ [LOGIN] Login bem-sucedido, configurando sessão...');

        // 1. Configura a sessão do Supabase Auth com os tokens da Edge Function
        await supabase.auth.setSession({
            access_token: data.access_token,
            refresh_token: data.refresh_token
        });
        console.log('✅ [LOGIN] Supabase session set.');

        // 2. Cria o objeto User interno para o contexto
        const newLoggedInUser: User = {
          id: data.user.id,
          name: data.user.username, // Ou data.cartorio?.nome se preferir exibir o nome do cartório
          type: 'cartorio',
          cartorio_id: data.user.cartorio_id,
          cartorio_name: data.cartorio?.nome,
          username: data.user.username,
          email: data.user.email,
          auth_user_id: data.user.auth_user_id,
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          is_admin: data.user.is_admin 
        };
        setUser(newLoggedInUser);
        localStorage.setItem('siplan-user', JSON.stringify(newLoggedInUser));
        
        // 3. Configura o contexto de autenticação customizado do cartório (se necessário para clientes customizados)
        setCartorioAuthContext(newLoggedInUser.access_token);

        logger.info('✅ [AuthContextFixed] Cartorio user logged in successfully and session set.', { 
          username: newLoggedInUser.username, 
          cartorio_id: newLoggedInUser.cartorio_id 
        });
      } else {
        console.error('❌ [LOGIN] Estrutura de resposta inválida da Edge Function:', data);
        throw new Error(data.error || 'Resposta inválida da Edge Function');
      }
    } catch (error: any) {
      console.error('💥 [AuthContextFixed] Login error:', error);
      logger.error('❌ [AuthContextFixed] Login failed:', error);
      // Re-lança o erro para ser tratado pelo componente que chamou (Login.tsx)
      throw error; 
    } finally {
      setAuthLoading(false);
    }
  }, []); // Sem dependências para garantir que a função seja estável

  // Função de logout
  const logout = useCallback(async () => {
    logger.info('🔐 [AuthContextFixed] Logout called');
    
    // Desloga do Supabase Auth se for um admin ou houver uma sessão Supabase ativa
    if (user?.type === 'admin' || stableAuth.session) {
      await supabase.auth.signOut(); // Usa signOut genérico para qualquer sessão Supabase Auth
    }
    
    setUser(null); // Limpa o estado do usuário
    clearCartorioAuthContext(); // Limpa o contexto customizado
    localStorage.removeItem('siplan-user'); // Remove do localStorage
    
    logger.info('✅ [AuthContextFixed] User logged out successfully');
  }, [user?.type, stableAuth.session]); // Depende de user.type e stableAuth.session

  const isAuthenticated = !!user || !!stableAuth.session; // O usuário está autenticado se houver um user no contexto OU uma sessão Supabase
  const isLoading = stableAuth.loading || authLoading; // O estado de carregamento é a combinação dos dois

  // O cliente Supabase autenticado é a instância única
  const authenticatedClient = supabase;

  // Log de debug do estado atual do AuthContext
  useEffect(() => {
    console.log('🔍 DEBUG: AuthContextFixed current state update:', {
      hasUser: !!user,
      userType: user?.type,
      hasSession: !!stableAuth.session,
      stableAuthIsAdmin: stableAuth.isAdmin,
      isAuthenticated,
      isLoading,
      usingSharedClient: true
    });

    logger.info('🔐 [AuthContextFixed] Current auth state:', {
      hasUser: !!user,
      userType: user?.type,
      hasSession: !!stableAuth.session,
      isAdmin: stableAuth.isAdmin,
      isAuthenticated,
      isLoading,
      usingSharedClient: true
    });
  }, [user, stableAuth.session, stableAuth.isAdmin, isAuthenticated, isLoading]);

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
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { supabase, createAuthenticatedClient } from '@/integrations/supabase/client'; 
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
// import { useStableAuth } from '@/hooks/useStableAuth'; // <-- COMENTADO: Mantenha o import por enquanto, mas não será usado diretamente
import { logger } from '@/utils/logger';

interface User {
  id: string;
  name: string;
  type: 'cartorio' | 'admin';
  token?: string; // Token customizado, se aplicável
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
  supabaseClient: typeof supabase; 
  authenticatedClient: any; // Add the missing property
  isLoading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // const stableAuth = useStableAuth(); // <-- COMENTADO: Esta linha deve ser comentada
  const [authenticatedClient, setAuthenticatedClient] = useState<any>(null);

  // NOVOS ESTADOS LOCAIS PARA O TESTE (SUBSTITUEM stableAuth)
  const [isLoadingState, setIsLoadingState] = useState(true); 
  const [sessionState, setSessionState] = useState<Session | null>(null); 
  const [userState, setUserState] = useState<User | null>(null); 
  const [isAdminState, setIsAdminState] = useState(false); 

  // NOVO useEffect para carregar a sessão inicial e监听 onAuthStateChange
  useEffect(() => {
    const loadInitialSession = async () => {
      try {
        logger.info('🔐 [AuthContextFixed] (TESTE) Carregando sessão inicial diretamente do supabase.auth...');
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          logger.error('❌ [AuthContextFixed] (TESTE) Erro ao carregar sessão inicial:', error);
        }
        setSessionState(session);
        // Adapte a lógica de `user` aqui se precisar de dados do usuário da sessão
        if (session) {
            // Exemplo simples de derivação de userState
            setUserState({ 
                id: session.user.id, 
                name: session.user.email || 'Usuário', 
                type: 'cartorio', // Ajuste conforme sua lógica para admin/cartorio
                email: session.user.email 
            });
            // Você pode verificar user_metadata para isAdminState aqui:
            setIsAdminState(session.user.user_metadata?.is_admin === true); 
        } else {
            setUserState(null);
        }
      } catch (e) {
        logger.error('❌ [AuthContextFixed] (TESTE) Erro inesperado ao carregar sessão inicial:', e);
      } finally {
        setIsLoadingState(false);
        logger.info('🔐 [AuthContextFixed] (TESTE) Sessão inicial carregada. isLoading agora é false.');
      }
    };

    loadInitialSession();

    // Listener para mudanças de estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        logger.info('🔐 [AuthContextFixed] (TESTE) Auth state change detectado:', event, session);
        setSessionState(session);
        if (session) {
            setUserState({ 
                id: session.user.id, 
                name: session.user.email || 'Usuário', 
                type: 'cartorio', // Ajuste conforme sua lógica
                email: session.user.email 
            });
            setIsAdminState(session.user.user_metadata?.is_admin === true); 
        } else {
            setUserState(null);
            setIsAdminState(false);
        }
        setIsLoadingState(false); // Garante que loading é falso após a mudança de estado
    });

    return () => {
        subscription.unsubscribe(); // Limpa o listener na desmontagem
    };
  }, []); // Executa apenas uma vez na montagem


  // useMemo para calcular o objeto 'user' com base nas informações dos novos estados locais
  const user = useMemo(() => {
    logger.info('�� [AuthContextFixed] (TESTE) Calculando estado do user (useMemo):', {
      sessionState: !!sessionState,
      isLoadingState: isLoadingState,
      isAdminState: isAdminState, 
      currentUserId: sessionState?.user?.id,
    });

    if (isLoadingState) { 
      return null;
    }

    if (sessionState) { 
        const supabaseUser = sessionState.user;
        let cartorioDataFromLocalStorage: Partial<User> = {};
        const savedUserJson = localStorage.getItem('siplan-user');
        
        if (savedUserJson) {
          try {
            const parsed = JSON.parse(savedUserJson);
            if (parsed.id === supabaseUser.id && parsed.type === 'cartorio') {
                cartorioDataFromLocalStorage = parsed;
                logger.info('🔐 [AuthContextFixed] (TESTE) Dados de cartório carregados do localStorage.');
            } else {
                localStorage.removeItem('siplan-user');
                logger.warn('🔐 [AuthContextFixed] (TESTE) Usuário do localStorage não corresponde à sessão ou tipo errado, limpando.');
            }
          } catch (e) {
            logger.error('❌ [AuthContextFixed] (TESTE) Erro ao analisar usuário salvo do localStorage:', e);
            localStorage.removeItem('siplan-user');
          }
        }
        
        // Se for admin, sobrescreve com dados de admin
        if (isAdminState) {
            return {
                id: supabaseUser.id,
                name: 'Administrador',
                type: 'admin' as const,
                email: supabaseUser.email || ''
            };
        } else {
            const currentUserDerived: User = {
                id: supabaseUser.id,
                name: cartorioDataFromLocalStorage.name || supabaseUser.email || 'Usuário Cartório',
                type: 'cartorio' as const,
                email: supabaseUser.email || '',
                cartorio_id: cartorioDataFromLocalStorage.cartorio_id,
                cartorio_name: cartorioDataFromLocalStorage.cartorio_name,
                username: cartorioDataFromLocalStorage.username,
                token: cartorioDataFromLocalStorage.token
            };
            
            if (!savedUserJson || JSON.stringify(cartorioDataFromLocalStorage) !== JSON.stringify(currentUserDerived)) {
                 localStorage.setItem('siplan-user', JSON.stringify(currentUserDerived));
                 logger.info('🔐 [AuthContextFixed] (TESTE) Atualizado o usuário do cartório no localStorage.');
            }
            return currentUserDerived;
        }
    } else {
      if (localStorage.getItem('siplan-user')) {
         localStorage.removeItem('siplan-user'); 
         logger.info('🔐 [AuthContextFixed] (TESTE) Nenhuma sessão ativa, limpando localStorage.');
      }
      return null;
    }
  }, [sessionState, isAdminState, isLoadingState]); // Dependências ajustadas


  // COMENTADO: Este useEffect deve ser comentado COMPLETAMENTE
  /*
  useEffect(() => {
    const updateAuthenticatedClient = async () => {
      if (user?.token && user.type === 'cartorio') {
        const authClient = await createAuthenticatedClient(user.token);
        setAuthenticatedClient(authClient);
      } else if (stableAuth.session) {
        const authClient = await createAuthenticatedClient();
        setAuthenticatedClient(authClient);
      } else {
        setAuthenticatedClient(null);
      }
    };

    updateAuthenticatedClient();
  }, [user, stableAuth.session]);
  */


  const login = async (customToken: string, type: 'cartorio' | 'admin', userData?: Partial<User>) => {
    logger.info('🔐 [AuthContextFixed] (TESTE) Função login chamada (frontend):', { 
      type, 
      userData: !!userData,
      cartorio_id: userData?.cartorio_id,
      customToken: customToken ? 'present' : 'missing'
    });
    
    if (type === 'cartorio' && userData) {
      const newUserForLocalStorage: User = {
        id: userData.id || '',
        name: userData.name || 'Cartório',
        type: 'cartorio',
        token: customToken,
        cartorio_id: userData.cartorio_id,
        cartorio_name: userData.cartorio_name,
        username: userData.username,
        email: userData.email || ''
      };
      localStorage.setItem('siplan-user', JSON.stringify(newUserForLocalStorage));
      logger.info('🔐 [AuthContextFixed] (TESTE) Dados de usuário do cartório salvos no localStorage para posterior derivação.');
    }
    
    logger.info('✅ [AuthContextFixed] (TESTE) Processo de login frontend iniciado. O estado do user será derivado da sessão inicial.');
  };

  const logout = async () => {
    logger.info('🔐 [AuthContextFixed] (TESTE) Função logout chamada');
    await supabase.auth.signOut();
    setAuthenticatedClient(null);
    // Atualize os estados locais após o logout
    setSessionState(null);
    setUserState(null);
    setIsAdminState(false);
    localStorage.removeItem('siplan-user');
    logger.info('✅ [AuthContextFixed] (TESTE) Logout do Supabase iniciado. Estados locais atualizados.');
  };

  // const isAuthenticated = !!stableAuth.session; // <-- COMENTADO: Use o novo estado local
  const isAuthenticated = !!sessionState; 

  // const isLoading = stableAuth.isLoading; // <-- COMENTADO: Use o novo estado local
  const isLoading = isLoadingState; 

  // const isAdmin = stableAuth.isAdmin; // <-- COMENTADO: Use o novo estado local
  const isAdmin = isAdminState; 

  useEffect(() => {
    logger.info('🔐 [AuthContextFixed] (TESTE) Estado atual da autenticação (debug):', {
      hasUser: !!user,
      userId: user?.id, 
      userType: user?.type,
      hasSession: !!sessionState, 
      sessionId: sessionState?.user?.id, 
      isAdmin: isAdminState, 
      isAuthenticated,
      isLoading,
      hasAuthenticatedClient: !!authenticatedClient,
    });
  }, [user, sessionState, isAdminState, isAuthenticated, isLoading, authenticatedClient]); // Dependências ajustadas

  return (
    <AuthContext.Provider value={{ 
      user,
      session: sessionState, 
      login, 
      logout, 
      isAuthenticated, 
      supabaseClient: supabase, 
      authenticatedClient, 
      isLoading,
      isAdmin 
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
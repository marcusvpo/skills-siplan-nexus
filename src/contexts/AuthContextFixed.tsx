import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client'; 
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
  supabaseClient: typeof supabase; 
  isLoading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const stableAuth = useStableAuth(); // stableAuth provides session, isAdmin, isLoading, logout

  // Efeito principal para sincronizar o estado 'user' com a sessão do Supabase (via stableAuth)
  // e gerenciar o localStorage para dados adicionais do cartório.
  useEffect(() => {
    logger.info('🔐 [AuthContextFixed] stableAuth state changed or user state changed:', {
      stableAuthSession: !!stableAuth.session,
      stableAuthIsLoading: stableAuth.isLoading,
      stableAuthIsAdmin: stableAuth.isAdmin,
      currentUserState: user ? { id: user.id, type: user.type } : null
    });

    if (stableAuth.isLoading) {
      // Se stableAuth ainda está carregando a sessão, não faça mudanças de estado para evitar flutuações.
      logger.info('🔐 [AuthContextFixed] stableAuth está carregando, aguardando atualização do estado.');
      return;
    }

    if (stableAuth.session) {
      // Há uma sessão ativa do Supabase (usuário autenticado)
      const supabaseUser = stableAuth.session.user;
      const isAdminSession = stableAuth.isAdmin;

      let currentUser: User;

      if (isAdminSession) {
        // Usuário admin (baseado na sessão do Supabase)
        currentUser = {
          id: supabaseUser.id,
          name: 'Administrador', // Nome padrão para admin
          type: 'admin',
          email: supabaseUser.email || ''
        };
        // Se o usuário atual no estado for um cartório, limpe o localStorage
        if (user?.type === 'cartorio') {
          localStorage.removeItem('siplan-user');
          logger.info('🔐 [AuthContextFixed] Admin logado, limpando localStorage do cartório.');
        }
      } else {
        // Usuário autenticado que NÃO é admin (assumimos que é um cartório)
        let cartorioDataFromLocalStorage: Partial<User> = {};
        const savedUserJson = localStorage.getItem('siplan-user');
        if (savedUserJson) {
          try {
            const parsed = JSON.parse(savedUserJson);
            // Use dados do localStorage SOMENTE se corresponderem ao usuário logado e forem do tipo cartório
            if (parsed.id === supabaseUser.id && parsed.type === 'cartorio') {
                cartorioDataFromLocalStorage = parsed;
                logger.info('🔐 [AuthContextFixed] Dados de cartório carregados do localStorage.');
            } else {
                // Mismatch ou tipo errado, limpe o localStorage
                localStorage.removeItem('siplan-user');
                logger.warn('🔐 [AuthContextFixed] Usuário do localStorage não corresponde à sessão ou tipo errado, limpando.');
            }
          } catch (e) {
            logger.error('❌ [AuthContextFixed] Erro ao analisar usuário salvo do localStorage:', e);
            localStorage.removeItem('siplan-user');
          }
        }

        currentUser = {
          id: supabaseUser.id,
          name: cartorioDataFromLocalStorage.name || supabaseUser.email || 'Usuário Cartório',
          type: 'cartorio',
          email: supabaseUser.email || '',
          cartorio_id: cartorioDataFromLocalStorage.cartorio_id,
          cartorio_name: cartorioDataFromLocalStorage.cartorio_name,
          username: cartorioDataFromLocalStorage.username,
          token: cartorioDataFromLocalStorage.token // Mantém o token customizado se existir
        };
        // Garante que o localStorage reflita o estado atual do usuário cartório logado
        if (cartorioDataFromLocalStorage.id !== supabaseUser.id || !savedUserJson) {
             localStorage.setItem('siplan-user', JSON.stringify(currentUser));
             logger.info('🔐 [AuthContextFixed] Atualizado o usuário do cartório no localStorage.');
        }
      }

      // Atualiza o estado 'user' APENAS se o objeto for diferente, para evitar re-renderizações desnecessárias
      if (JSON.stringify(user) !== JSON.stringify(currentUser)) {
        setUser(currentUser);
        logger.info('🔐 [AuthContextFixed] Estado do usuário atualizado pela sessão do stableAuth.');
      }
    } else {
      // Nenhuma sessão ativa do Supabase (stableAuth.session é null)
      // Limpa o estado 'user' local e o localStorage, APENAS se já não estiverem nulos.
      if (user !== null) {
        setUser(null);
        localStorage.removeItem('siplan-user'); 
        logger.info('🔐 [AuthContextFixed] Nenhuma sessão ativa, estado do usuário e localStorage limpos.');
      }
    }
  }, [stableAuth.session, stableAuth.isAdmin, stableAuth.isLoading]); // Dependências: apenas mudanças no stableAuth

  // A função 'login' agora é responsável por iniciar o processo de autenticação
  // (ex: chamar uma Edge Function de login que faz o signInWithPassword do Supabase)
  // e, para cartórios, salvar dados adicionais no localStorage.
  // O estado 'user' será atualizado pelo useEffect acima quando stableAuth.session mudar.
  const login = async (customToken: string, type: 'cartorio' | 'admin', userData?: Partial<User>) => {
    logger.info('🔐 [AuthContextFixed] Função login chamada (frontend):', { 
      type, 
      userData: !!userData,
      cartorio_id: userData?.cartorio_id,
      customToken: customToken ? 'present' : 'missing'
    });
    
    // Para usuários de cartório, salva seus dados específicos (cartorio_id, token) no localStorage.
    // O ID do usuário será definido posteriormente pelo `useEffect` quando a sessão do Supabase for estabelecida.
    if (type === 'cartorio' && userData) {
      const newUserForLocalStorage: User = {
        id: userData.id || '', // ID será preenchido pelo stableAuth, mas salva um placeholder.
        name: userData.name || 'Cartório',
        type: 'cartorio',
        token: customToken,
        cartorio_id: userData.cartorio_id,
        cartorio_name: userData.cartorio_name,
        username: userData.username,
        email: userData.email || ''
      };
      localStorage.setItem('siplan-user', JSON.stringify(newUserForLocalStorage));
      logger.info('🔐 [AuthContextFixed] Dados de usuário do cartório salvos no localStorage.');
    }
    
    logger.info('✅ [AuthContextFixed] Login frontend iniciado. O estado do usuário será sincronizado pelo stableAuth.');
  };

  const logout = async () => {
    logger.info('🔐 [AuthContextFixed] Função logout chamada');
    // Chama o signOut do Supabase para invalidar a sessão.
    await supabase.auth.signOut();
    // A limpeza do estado 'user' e do localStorage é feita pelo useEffect quando stableAuth.session se torna null.
    logger.info('✅ [AuthContextFixed] Logout do Supabase iniciado. O estado será sincronizado pelo stableAuth.');
  };

  // Determina se o usuário está autenticado. Considera o estado 'user' ou a sessão do stableAuth.
  const isAuthenticated = !!user || !!stableAuth.session; 
  const isLoading = stableAuth.isLoading; // Estado de carregamento do stableAuth

  // Log de depuração do estado atual do contexto de autenticação
  useEffect(() => {
    logger.info('🔐 [AuthContextFixed] Estado atual da autenticação (debug):', {
      hasUser: !!user,
      userId: user?.id, 
      userType: user?.type,
      hasSession: !!stableAuth.session,
      sessionId: stableAuth.session?.user.id, 
      isAdmin: stableAuth.isAdmin,
      isAuthenticated,
      isLoading,
    });
  }, [user, stableAuth.session, stableAuth.isAdmin, isAuthenticated, isLoading]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      session: stableAuth.session, 
      login, 
      logout, 
      isAuthenticated, 
      supabaseClient: supabase, 
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
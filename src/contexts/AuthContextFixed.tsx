import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client'; 
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { useStableAuth } from '@/hooks/useStableAuth';
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
  isLoading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // REMOVIDO: const [user, setUser] = useState<User | null>(null);
  // O estado 'user' agora será derivado diretamente do stableAuth.session
  const stableAuth = useStableAuth(); // stableAuth provides session, isAdmin, isLoading, logout

  // useMemo para calcular o objeto 'user' com base nas informações de stableAuth e localStorage
  const user = useMemo(() => {
    logger.info('🔐 [AuthContextFixed] Calculando estado do user (useMemo):', {
      stableAuthSession: !!stableAuth.session,
      stableAuthIsLoading: stableAuth.isLoading,
      stableAuthIsAdmin: stableAuth.isAdmin,
      currentUserId: stableAuth.session?.user?.id,
    });

    if (stableAuth.isLoading) {
      // Se stableAuth ainda está carregando a sessão, retorne null temporariamente.
      // O componente que usa 'user' deve lidar com 'isLoading' para não renderizar prematuramente.
      return null;
    }

    if (stableAuth.session) {
      // Há uma sessão ativa do Supabase (usuário autenticado)
      const supabaseUser = stableAuth.session.user;
      const isAdminSession = stableAuth.isAdmin;

      if (isAdminSession) {
        // Usuário admin (baseado na sessão do Supabase)
        // Limpa o localStorage de cartório se um admin logar (garante que não haja dados misturados)
        if (localStorage.getItem('siplan-user')) {
          try {
            const stored = JSON.parse(localStorage.getItem('siplan-user') || '{}');
            // Limpa se era cartório OU se o admin logado é um usuário diferente do localStorage anterior
            if (stored.type === 'cartorio' || stored.id !== supabaseUser.id) {
              localStorage.removeItem('siplan-user');
              logger.info('🔐 [AuthContextFixed] Admin logado, limpando localStorage do cartório.');
            }
          } catch (e) {
            logger.error('❌ [AuthContextFixed] Erro ao analisar localStorage para admin, limpando.', e);
            localStorage.removeItem('siplan-user');
          }
        }
        return {
          id: supabaseUser.id,
          name: 'Administrador', // Nome padrão para admin
          type: 'admin',
          email: supabaseUser.email || ''
        };
      } else {
        // Usuário autenticado que NÃO é admin (assumimos que é um cartório)
        let cartorioDataFromLocalStorage: Partial<User> = {};
        const savedUserJson = localStorage.getItem('siplan-user');
        
        if (savedUserJson) {
          try {
            const parsed = JSON.parse(savedUserJson);
            // Usa dados do localStorage SOMENTE se corresponderem ao usuário logado e forem do tipo cartório
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

        const currentUserDerived: User = {
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
        // Isso é importante para que os dados adicionais do cartório persistam entre recargas
        if (!savedUserJson || JSON.stringify(cartorioDataFromLocalStorage) !== JSON.stringify(currentUserDerived)) {
             localStorage.setItem('siplan-user', JSON.stringify(currentUserDerived));
             logger.info('🔐 [AuthContextFixed] Atualizado o usuário do cartório no localStorage.');
        }
        return currentUserDerived;
      }
    } else {
      // Nenhuma sessão ativa do Supabase (stableAuth.session é null)
      // Neste caso, não há usuário logado. Limpe o localStorage para refletir isso.
      if (localStorage.getItem('siplan-user')) { // Só limpa se houver algo para limpar
         localStorage.removeItem('siplan-user'); 
         logger.info('🔐 [AuthContextFixed] Nenhuma sessão ativa, limpando localStorage.');
      }
      return null;
    }
  }, [stableAuth.session, stableAuth.isAdmin, stableAuth.isLoading]); // user é REMOVIDO das dependências

  // A função 'login' agora é responsável por iniciar o processo de autenticação (ex: chamar uma Edge Function)
  // e, para cartórios, salvar dados adicionais no localStorage ANTES da autenticação ser confirmada.
  // O estado 'user' REAL no contexto será DERIVADO do stableAuth.session APÓS a autenticação.
  const login = async (customToken: string, type: 'cartorio' | 'admin', userData?: Partial<User>) => {
    logger.info('�� [AuthContextFixed] Função login chamada (frontend):', { 
      type, 
      userData: !!userData,
      cartorio_id: userData?.cartorio_id,
      customToken: customToken ? 'present' : 'missing'
    });
    
    // Para usuários de cartório, salva seus dados específicos (cartorio_id, token) no localStorage.
    // Isso é feito aqui porque esses dados não vêm da sessão padrão do Supabase,
    // e precisam estar disponíveis para o useMemo que calcula o 'user' após a sessão ser estabelecida.
    if (type === 'cartorio' && userData) {
      const newUserForLocalStorage: User = {
        id: userData.id || '', // Placeholder. O ID real virá da sessão Supabase
        name: userData.name || 'Cartório',
        type: 'cartorio',
        token: customToken,
        cartorio_id: userData.cartorio_id,
        cartorio_name: userData.cartorio_name,
        username: userData.username,
        email: userData.email || ''
      };
      localStorage.setItem('siplan-user', JSON.stringify(newUserForLocalStorage));
      logger.info('🔐 [AuthContextFixed] Dados de usuário do cartório salvos no localStorage para posterior derivação.');
    }
    
    // IMPORTANTE: A ação de login REAL no Supabase (ex: supabase.auth.signInWithPassword)
    // ou a chamada para uma Edge Function que faz isso, DEVE ser acionada externamente a esta função.
    // Esta função do contexto 'login' apenas prepara o terreno (localStorage) para a futura sessão.
    
    logger.info('✅ [AuthContextFixed] Processo de login frontend iniciado. O estado do user será derivado do stableAuth.');
  };

  const logout = async () => {
    logger.info('🔐 [AuthContextFixed] Função logout chamada');
    // Chama o signOut do Supabase para invalidar a sessão.
    await supabase.auth.signOut();
    // A limpeza do 'user' derivado e do localStorage é implicitamente tratada pelo useMemo quando stableAuth.session se torna null.
    logger.info('✅ [AuthContextFixed] Logout do Supabase iniciado. O estado será sincronizado pelo useMemo.');
  };

  // isAuthenticated deve ser baseado diretamente na existência de uma sessão Supabase
  const isAuthenticated = !!stableAuth.session; 
  const isLoading = stableAuth.isLoading;

  // Log de depuração do estado atual do contexto de autenticação
  useEffect(() => {
    logger.info('�� [AuthContextFixed] Estado atual da autenticação (debug):', {
      hasUser: !!user, // 'user' agora é o valor derivado do useMemo
      userId: user?.id, 
      userType: user?.type,
      hasSession: !!stableAuth.session,
      sessionId: stableAuth.session?.user?.id, 
      isAdmin: stableAuth.isAdmin,
      isAuthenticated,
      isLoading,
    });
  }, [user, stableAuth.session, stableAuth.isAdmin, isAuthenticated, isLoading]);

  return (
    <AuthContext.Provider value={{ 
      user, // Passa o 'user' derivado
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
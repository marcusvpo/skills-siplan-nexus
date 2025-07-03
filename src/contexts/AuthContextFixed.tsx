
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
  const stableAuth = useStableAuth();

  // useMemo para calcular o objeto 'user' com base nas informações de stableAuth e localStorage
  const user = useMemo((): User | null => {
    logger.info('🔐 [AuthContextFixed] Calculando estado do user (useMemo):', {
      stableAuthSession: !!stableAuth.session,
      stableAuthIsLoading: stableAuth.isLoading,
      stableAuthIsAdmin: stableAuth.isAdmin,
      currentUserId: stableAuth.session?.user?.id,
    });

    if (stableAuth.isLoading) {
      return null;
    }

    if (stableAuth.session) {
      const supabaseUser = stableAuth.session.user;
      const isAdminSession = stableAuth.isAdmin;

      if (isAdminSession) {
        if (localStorage.getItem('siplan-user')) {
          try {
            const stored = JSON.parse(localStorage.getItem('siplan-user') || '{}');
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
          name: 'Administrador',
          type: 'admin',
          email: supabaseUser.email || ''
        };
      } else {
        let cartorioDataFromLocalStorage: Partial<User> = {};
        const savedUserJson = localStorage.getItem('siplan-user');
        
        if (savedUserJson) {
          try {
            const parsed = JSON.parse(savedUserJson);
            if (parsed.id === supabaseUser.id && parsed.type === 'cartorio') {
                cartorioDataFromLocalStorage = parsed;
                logger.info('🔐 [AuthContextFixed] Dados de cartório carregados do localStorage.');
            } else {
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
          token: cartorioDataFromLocalStorage.token
        };

        if (!savedUserJson || JSON.stringify(cartorioDataFromLocalStorage) !== JSON.stringify(currentUserDerived)) {
             localStorage.setItem('siplan-user', JSON.stringify(currentUserDerived));
             logger.info('🔐 [AuthContextFixed] Atualizado o usuário do cartório no localStorage.');
        }
        return currentUserDerived;
      }
    } else {
      if (localStorage.getItem('siplan-user')) {
         localStorage.removeItem('siplan-user'); 
         logger.info('🔐 [AuthContextFixed] Nenhuma sessão ativa, limpando localStorage.');
      }
      return null;
    }
  }, [stableAuth.session, stableAuth.isAdmin, stableAuth.isLoading]);

  const login = async (customToken: string, type: 'cartorio' | 'admin', userData?: Partial<User>) => {
    logger.info('🔐 [AuthContextFixed] Função login chamada (frontend):', { 
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
      logger.info('🔐 [AuthContextFixed] Dados de usuário do cartório salvos no localStorage para posterior derivação.');
    }
    
    logger.info('✅ [AuthContextFixed] Processo de login frontend iniciado. O estado do user será derivado do stableAuth.');
  };

  const logout = async () => {
    logger.info('🔐 [AuthContextFixed] Função logout chamada');
    await supabase.auth.signOut();
    logger.info('✅ [AuthContextFixed] Logout do Supabase iniciado. O estado será sincronizado pelo useMemo.');
  };

  const isAuthenticated = !!stableAuth.session; 
  const isLoading = stableAuth.isLoading;

  useEffect(() => {
    logger.info('🔐 [AuthContextFixed] Estado atual da autenticação (debug):', {
      hasUser: !!user,
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

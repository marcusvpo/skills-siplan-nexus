
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';
import { useSessionPersistence } from './useSessionPersistence';

interface StableAuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  error: string | null;
  isInitialized: boolean;
}

export const useStableAuthEnhanced = () => {
  const [authState, setAuthState] = useState<StableAuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAdmin: false,
    error: null,
    isInitialized: false
  });

  const initializationAttempted = useRef(false);
  const authSubscription = useRef<any>(null);

  const checkAdminStatus = useCallback(async (user: User | null): Promise<boolean> => {
    if (!user?.email) return false;

    try {
      const { data: adminData, error } = await supabase
        .from('admins')
        .select('id')
        .eq('email', user.email)
        .single();

      if (error && error.code !== 'PGRST116') {
        logger.error('❌ [useStableAuthEnhanced] Error checking admin status:', { error });
        return false;
      }

      const isAdmin = !!adminData;
      logger.info('🔐 [useStableAuthEnhanced] Admin status checked:', { 
        email: user.email, 
        isAdmin,
        adminId: adminData?.id 
      });

      return isAdmin;
    } catch (err) {
      logger.error('❌ [useStableAuthEnhanced] Unexpected error checking admin:', { error: err });
      return false;
    }
  }, []);

  const updateAuthState = useCallback(async (session: Session | null, skipAdminCheck = false) => {
    logger.info('🔄 [useStableAuthEnhanced] Updating auth state:', { 
      hasSession: !!session,
      email: session?.user?.email,
      skipAdminCheck
    });

    try {
      const isAdmin = skipAdminCheck ? false : (session?.user ? await checkAdminStatus(session.user) : false);

      setAuthState(prev => ({
        ...prev,
        user: session?.user || null,
        session,
        isLoading: false,
        isAdmin,
        error: null,
        isInitialized: true
      }));
    } catch (err) {
      logger.error('❌ [useStableAuthEnhanced] Error updating auth state:', err);
      setAuthState(prev => ({
        ...prev,
        user: null,
        session: null,
        isLoading: false,
        isAdmin: false,
        error: err instanceof Error ? err.message : 'Erro de autenticação',
        isInitialized: true
      }));
    }
  }, [checkAdminStatus]);

  const handleSessionLost = useCallback(() => {
    logger.warn('⚠️ [useStableAuthEnhanced] Session lost - clearing auth state');
    setAuthState(prev => ({
      ...prev,
      user: null,
      session: null,
      isLoading: false,
      isAdmin: false,
      error: 'Sessão expirada',
      isInitialized: true
    }));
  }, []);

  const { validateSession, forceSessionRefresh } = useSessionPersistence({
    onSessionUpdate: (session) => updateAuthState(session),
    onSessionLost: handleSessionLost
  });

  useEffect(() => {
    if (initializationAttempted.current) return;
    initializationAttempted.current = true;

    const initializeAuth = async () => {
      logger.info('🚀 [useStableAuthEnhanced] Initializing authentication');

      try {
        // Configurar listener de mudanças de estado
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            logger.info('🔐 [useStableAuthEnhanced] Auth state changed:', { 
              event, 
              hasSession: !!session,
              email: session?.user?.email 
            });

            await updateAuthState(session);
          }
        );

        authSubscription.current = subscription;

        // Verificar sessão inicial
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          logger.error('❌ [useStableAuthEnhanced] Error getting initial session:', { error });
          handleSessionLost();
          return;
        }

        await updateAuthState(session);

      } catch (err) {
        logger.error('❌ [useStableAuthEnhanced] Error in initializeAuth:', { error: err });
        handleSessionLost();
      }
    };

    initializeAuth();

    return () => {
      if (authSubscription.current) {
        authSubscription.current.unsubscribe();
        authSubscription.current = null;
      }
    };
  }, [updateAuthState, handleSessionLost]);

  const logout = useCallback(async () => {
    try {
      logger.info('🚪 [useStableAuthEnhanced] Logging out');
      await supabase.auth.signOut();
      
      setAuthState({
        user: null,
        session: null,
        isLoading: false,
        isAdmin: false,
        error: null,
        isInitialized: true
      });
    } catch (err) {
      logger.error('❌ [useStableAuthEnhanced] Error during logout:', { error: err });
    }
  }, []);

  const refreshSession = useCallback(async () => {
    logger.info('🔄 [useStableAuthEnhanced] Manually refreshing session');
    setAuthState(prev => ({ ...prev, isLoading: true }));
    await forceSessionRefresh();
  }, [forceSessionRefresh]);

  return {
    ...authState,
    logout,
    refreshSession,
    validateSession
  };
};

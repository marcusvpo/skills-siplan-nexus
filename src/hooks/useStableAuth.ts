
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';

interface StableAuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  error: string | null;
}

export const useStableAuth = () => {
  const [authState, setAuthState] = useState<StableAuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAdmin: false,
    error: null
  });

  const checkAdminStatus = useCallback(async (user: User | null): Promise<boolean> => {
    if (!user?.email) return false;

    try {
      const { data: adminData, error } = await supabase
        .from('admins')
        .select('id')
        .eq('email', user.email)
        .single();

      if (error && error.code !== 'PGRST116') {
        logger.error('❌ [useStableAuth] Error checking admin status:', { error });
        return false;
      }

      return !!adminData;
    } catch (err) {
      logger.error('❌ [useStableAuth] Unexpected error checking admin:', { error: err });
      return false;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const handleAuthStateChange = async (event: string, session: Session | null) => {
      if (!mounted) return;

      logger.info('🔐 [useStableAuth] Auth state changed:', { 
        event, 
        hasSession: !!session,
        email: session?.user?.email 
      });

      try {
        const isAdmin = session?.user ? await checkAdminStatus(session.user) : false;

        if (mounted) {
          setAuthState({
            user: session?.user || null,
            session,
            isLoading: false,
            isAdmin,
            error: null
          });
        }
      } catch (err) {
        if (mounted) {
          setAuthState(prev => ({
            ...prev,
            isLoading: false,
            error: err instanceof Error ? err.message : 'Erro de autenticação'
          }));
        }
      }
    };

    // Configurar listener - usando a instância única
    logger.info('🔐 [useStableAuth] Setting up auth state listener on shared instance');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    // Verificar sessão inicial
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          logger.error('❌ [useStableAuth] Error getting session:', { error });
          if (mounted) {
            setAuthState(prev => ({
              ...prev,
              isLoading: false,
              error: error.message
            }));
          }
          return;
        }

        await handleAuthStateChange('initial', session);
      } catch (err) {
        logger.error('❌ [useStableAuth] Error in initAuth:', { error: err });
        if (mounted) {
          setAuthState(prev => ({
            ...prev,
            isLoading: false,
            error: err instanceof Error ? err.message : 'Erro de inicialização'
          }));
        }
      }
    };

    initAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [checkAdminStatus]);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      logger.error('❌ [useStableAuth] Error during logout:', { error: err });
    }
  }, []);

  return {
    ...authState,
    logout
  };
};

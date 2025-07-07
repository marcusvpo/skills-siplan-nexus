
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
    console.log('🔍 DEBUG: checkAdminStatus called for email:', user?.email);
    console.log('🔍 DEBUG: User object:', user);
    
    if (!user?.email) {
      console.log('🔍 DEBUG: No user email found, returning false');
      return false;
    }

    console.log('🔍 DEBUG: Supabase client in checkAdminStatus:', supabase);
    console.log('🔍 DEBUG: Attempting Supabase query for admin status...');
    
    try {
      const { data: adminData, error } = await supabase
        .from('admins')
        .select('id')
        .eq('email', user.email)
        .single();

      console.log('🔍 DEBUG: Supabase query result for admin:', { adminData, error });

      if (error && error.code !== 'PGRST116') {
        console.log('🔍 DEBUG: Admin query error (not PGRST116):', error);
        logger.error('❌ [useStableAuth] Error checking admin status:', { error });
        return false;
      }

      const isAdminResult = !!adminData;
      console.log('🔍 DEBUG: Admin status determined as:', isAdminResult);
      
      return isAdminResult;
    } catch (err) {
      console.log('🔍 DEBUG: Error in checkAdminStatus catch block:', err);
      logger.error('❌ [useStableAuth] Unexpected error checking admin:', { error: err });
      return false;
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    console.log('🔍 DEBUG: useStableAuth useEffect initializing...');

    const handleAuthStateChange = async (event: string, session: Session | null) => {
      if (!mounted) {
        console.log('🔍 DEBUG: Component unmounted, skipping auth state change');
        return;
      }

      console.log('🔍 DEBUG: handleAuthStateChange called with event:', event);
      console.log('🔍 DEBUG: Session in handleAuthStateChange:', { 
        hasSession: !!session,
        email: session?.user?.email,
        userId: session?.user?.id 
      });

      logger.info('🔐 [useStableAuth] Auth state changed:', { 
        event, 
        hasSession: !!session,
        email: session?.user?.email 
      });

      try {
        console.log('🔍 DEBUG: Starting admin status check...');
        const isAdmin = session?.user ? await checkAdminStatus(session.user) : false;
        console.log('🔍 DEBUG: Admin status check completed, result:', isAdmin);

        if (mounted) {
          console.log('🔍 DEBUG: Setting auth state with isAdmin:', isAdmin);
          setAuthState({
            user: session?.user || null,
            session,
            isLoading: false,
            isAdmin,
            error: null
          });
          console.log('🔍 DEBUG: Auth state set successfully');
        }
      } catch (err) {
        console.log('🔍 DEBUG: Error in handleAuthStateChange:', err);
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
    console.log('🔍 DEBUG: Setting up auth state listener on shared instance');
    logger.info('🔐 [useStableAuth] Setting up auth state listener on shared instance');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    // Verificar sessão inicial
    const initAuth = async () => {
      console.log('🔍 DEBUG: initAuth starting...');
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('🔍 DEBUG: getSession result:', { hasSession: !!session, error });
        
        if (error) {
          console.log('🔍 DEBUG: Error in getSession:', error);
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

        console.log('🔍 DEBUG: Calling handleAuthStateChange from initAuth...');
        await handleAuthStateChange('initial', session);
        console.log('🔍 DEBUG: initAuth completed');
      } catch (err) {
        console.log('🔍 DEBUG: Error in initAuth:', err);
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
      console.log('🔍 DEBUG: useStableAuth cleanup completed');
    };
  }, [checkAdminStatus]);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      logger.error('❌ [useStableAuth] Error during logout:', { error: err });
    }
  }, []);

  console.log('🔍 DEBUG: useStableAuth returning state:', {
    hasUser: !!authState.user,
    hasSession: !!authState.session,
    isLoading: authState.isLoading,
    isAdmin: authState.isAdmin,
    error: authState.error
  });

  return {
    ...authState,
    logout
  };
};

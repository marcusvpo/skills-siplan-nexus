import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';

interface StableAuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  error: string | null; // Mantendo o estado de erro, é útil
}

export const useStableAuth = () => {
  const [authState, setAuthState] = useState<StableAuthState>({ // Usando o StableAuthState aqui
    user: null,
    session: null,
    isLoading: true,
    isAdmin: false,
    error: null // Inicializando o erro
  });

  // Corrigindo o tipo de retorno para Promise<boolean>
  const checkAdminStatus = useCallback(async (user: User | null): Promise<boolean> => {
    if (!user?.email) return false;

    try {
      const { data: adminData, error } = await supabase
        .from('admins')
        .select('id')
        .eq('email', user.email)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 é "no rows found"
        logger.error('❌ [useStableAuth] Error checking admin status:', { error });
        return false;
      }

      return !!adminData; // Retorna true se encontrou o admin, false caso contrário
    } catch (err) {
      logger.error('❌ [useStableAuth] Unexpected error checking admin:', { error: err });
      return false;
    }
  }, []); // Dependência vazia, pois supabase é global

  useEffect(() => {
    let mounted = true;
    let initializationComplete = false;

    logger.info('🔐 [useStableAuth] Initializing auth state listener');

    const handleAuthStateChange = async (event: string, session: Session | null) => {
      if (!mounted) return;

      logger.info('🔐 [useStableAuth] Auth state change event:', { 
        event, 
        hasSession: !!session,
        sessionId: session?.user?.id,
        email: session?.user?.email 
      });

      // Prevenir processamento múltiplo do mesmo evento durante inicialização
      if (event === 'INITIAL_SESSION' && initializationComplete) {
        logger.info('🔐 [useStableAuth] Skipping duplicate INITIAL_SESSION event');
        return;
      }

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

          if (event === 'INITIAL_SESSION') {
            initializationComplete = true;
          }

          logger.info('✅ [useStableAuth] Auth state updated:', {
            hasUser: !!session?.user,
            isAdmin,
            isLoading: false
          });
        }
      } catch (err) {
        logger.error('❌ [useStableAuth] Error processing auth state change:', err);
        if (mounted) {
          setAuthState(prev => ({
            ...prev,
            isLoading: false,
            error: err instanceof Error ? err.message : 'Erro de autenticação'
          }));
        }
      }
    };

    // Configurar listener ANTES de verificar sessão inicial
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    // Verificar sessão inicial APENAS uma vez
    const initAuth = async () => {
      try {
        logger.info('🔐 [useStableAuth] Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          logger.error('❌ [useStableAuth] Error getting initial session:', { error });
          if (mounted) {
            setAuthState(prev => ({
              ...prev,
              isLoading: false,
              error: error.message
            }));
          }
          return;
        }

        logger.info('🔐 [useStableAuth] Initial session retrieved:', { 
          hasSession: !!session,
          sessionId: session?.user?.id 
        });

        // Processar sessão inicial
        // Não usar 'INITIAL_SESSION' aqui para evitar duplicidade de chamada do listener,
        // o `onAuthStateChange` já vai emitir o 'INITIAL_SESSION'
        if (session) { // Se houver sessão na resposta, o listener já deve ter sido disparado
             // Apenas atualiza o estado de carregamento se o listener ainda não o fez
             if (mounted && authState.isLoading) {
                 setAuthState(prev => ({
                     ...prev,
                     isLoading: false // Já temos a sessão inicial, não está mais carregando
                 }));
             }
        } else { // Não há sessão inicial, então não está autenticado
            if (mounted && authState.isLoading) {
                setAuthState(prev => ({
                    ...prev,
                    isLoading: false,
                    user: null,
                    session: null,
                    isAdmin: false
                }));
            }
        }
        
      } catch (err) {
        logger.error('❌ [useStableAuth] Error in initial auth check:', { error: err });
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
      logger.info('🔐 [useStableAuth] Cleanup completed');
    };
  }, [checkAdminStatus, authState.isLoading]); // Adicionado authState.isLoading como dependência

  const logout = useCallback(async () => {
    try {
      logger.info('🚪 [useStableAuth] Starting logout...');
      await supabase.auth.signOut();
      logger.info('✅ [useStableAuth] Logout completed');
    } catch (err) {
      logger.error('❌ [useStableAuth] Error during logout:', { error: err });
    }
  }, []);

  return {
    ...authState,
    logout
  };
};
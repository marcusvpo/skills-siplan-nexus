
import { useState, useEffect, useCallback, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isInitialized: boolean;
  isAdmin: boolean;
  error: string | null;
}

export const useStableAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    session: null,
    user: null,
    loading: true,
    isInitialized: false,
    isAdmin: false,
    error: null
  });

  const listenerRef = useRef<any>(null);
  const isInitializedRef = useRef(false);

  // Função para verificar status de admin
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

  // Função para atualizar estado de autenticação
  const updateAuthState = useCallback(async (session: Session | null) => {
    console.log('🔄 [useStableAuth] Atualizando estado de auth:', session ? 'com sessão' : 'sem sessão');

    if (session?.access_token) {
      try {
        // Validar JWT
        const jwtPayload = JSON.parse(atob(session.access_token.split('.')[1]));
        
        if (jwtPayload.role !== 'authenticated') {
          console.error('❌ [useStableAuth] Token não é authenticated:', jwtPayload.role);
          await supabase.auth.signOut();
          setAuthState({
            session: null,
            user: null,
            loading: false,
            isInitialized: true,
            isAdmin: false,
            error: 'Token inválido'
          });
          return;
        }

        const isAdmin = await checkAdminStatus(session.user);
        
        setAuthState({
          session,
          user: session.user,
          loading: false,
          isInitialized: true,
          isAdmin,
          error: null
        });
        
        console.log('✅ [useStableAuth] Estado atualizado com sessão válida:', {
          userId: session.user?.id,
          email: session.user?.email,
          isAdmin,
          role: jwtPayload.role
        });
      } catch (error) {
        console.error('❌ [useStableAuth] Erro ao validar JWT:', error);
        await supabase.auth.signOut();
        setAuthState({
          session: null,
          user: null,
          loading: false,
          isInitialized: true,
          isAdmin: false,
          error: 'Erro na validação do token'
        });
      }
    } else {
      setAuthState({
        session: null,
        user: null,
        loading: false,
        isInitialized: true,
        isAdmin: false,
        error: null
      });
      
      console.log('✅ [useStableAuth] Estado atualizado sem sessão');
    }
  }, [checkAdminStatus]);

  // Inicialização única com hidratação imediata
  useEffect(() => {
    if (isInitializedRef.current) return;
    
    console.log('🚀 [useStableAuth] Inicializando autenticação única...');
    isInitializedRef.current = true;

    const initializeAuth = async () => {
      try {
        // 1. Configurar listener PRIMEIRO
        console.log('👂 [useStableAuth] Configurando listener de auth...');
        
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log(`🔔 [useStableAuth] Auth event: ${event}`, session ? 'with session' : 'without session');
            
            // Para INITIAL_SESSION, usar a sessão diretamente do evento
            if (event === 'INITIAL_SESSION') {
              await updateAuthState(session);
            } else {
              // Para outros eventos, aguardar um pouco e atualizar
              setTimeout(async () => {
                await updateAuthState(session);
              }, 100);
            }
          }
        );

        listenerRef.current = subscription;

        // 2. Buscar sessão atual como fallback se INITIAL_SESSION não disparar
        setTimeout(async () => {
          if (!isInitializedRef.current) return;
          
          try {
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) {
              console.error('❌ [useStableAuth] Erro ao obter sessão fallback:', error);
              await updateAuthState(null);
              return;
            }
            
            // Só atualizar se ainda estiver em loading
            if (authState.loading) {
              console.log('🔄 [useStableAuth] Aplicando sessão fallback...');
              await updateAuthState(session);
            }
          } catch (err) {
            console.error('❌ [useStableAuth] Erro na inicialização fallback:', err);
            await updateAuthState(null);
          }
        }, 200);

      } catch (error) {
        console.error('❌ [useStableAuth] Erro na inicialização:', error);
        setAuthState({
          session: null,
          user: null,
          loading: false,
          isInitialized: true,
          isAdmin: false,
          error: 'Erro na inicialização'
        });
      }
    };

    initializeAuth();

    // Cleanup na desmontagem
    return () => {
      console.log('🧹 [useStableAuth] Limpando listener na desmontagem');
      if (listenerRef.current) {
        listenerRef.current.unsubscribe();
        listenerRef.current = null;
      }
      isInitializedRef.current = false;
    };
  }, []); // Sem dependências para executar apenas uma vez

  const logout = useCallback(async () => {
    try {
      console.log('🚪 [useStableAuth] Executando logout...');
      
      await supabase.auth.signOut();
      
      // Limpar timers de vídeo
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('video_timer_')) {
          localStorage.removeItem(key);
        }
      });
      
      console.log('✅ [useStableAuth] Logout concluído');
    } catch (err) {
      logger.error('❌ [useStableAuth] Erro durante logout:', { error: err });
    }
  }, []);

  const forceRefresh = useCallback(async () => {
    console.log('🔄 [useStableAuth] Forçando refresh da sessão...');
    
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('❌ [useStableAuth] Erro no refresh:', error);
        await updateAuthState(null);
      } else {
        await updateAuthState(session);
      }
    } catch (error) {
      console.error('❌ [useStableAuth] Erro inesperado no refresh:', error);
      await updateAuthState(null);
    }
  }, [updateAuthState]);

  return {
    ...authState,
    logout,
    forceRefresh
  };
};

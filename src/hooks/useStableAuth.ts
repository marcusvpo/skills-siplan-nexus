
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
  const mountedRef = useRef(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Função simples para verificar admin
  const checkAdminStatus = useCallback(async (user: User | null): Promise<boolean> => {
    if (!user?.email) return false;
    try {
      const { data } = await supabase
        .from('admins')
        .select('id')
        .eq('email', user.email)
        .single();
      return !!data;
    } catch {
      return false;
    }
  }, []);

  // Função simplificada para atualizar estado
  const updateAuthState = useCallback(async (session: Session | null) => {
    if (!mountedRef.current) return;

    console.log('🔄 [useStableAuth] Atualizando estado:', !!session);

    if (session?.user) {
      const isAdmin = await checkAdminStatus(session.user);
      
      if (mountedRef.current) {
        setAuthState({
          session,
          user: session.user,
          loading: false,
          isInitialized: true,
          isAdmin,
          error: null
        });
      }
      
      console.log('✅ [useStableAuth] Usuário autenticado:', session.user.id);
    } else {
      if (mountedRef.current) {
        setAuthState({
          session: null,
          user: null,
          loading: false,
          isInitialized: true,
          isAdmin: false,
          error: null
        });
      }
      
      console.log('⚠️ [useStableAuth] Sem sessão');
    }
  }, [checkAdminStatus]);

  // Inicialização SIMPLIFICADA
  useEffect(() => {
    if (isInitializedRef.current) return;
    
    console.log('🚀 [useStableAuth] Inicializando...');
    isInitializedRef.current = true;
    mountedRef.current = true;

    const initAuth = async () => {
      try {
        // Timeout de segurança - SEMPRE define loading como false
        timeoutRef.current = setTimeout(() => {
          console.log('⏰ [useStableAuth] Timeout - forçando fim do loading');
          if (mountedRef.current) {
            setAuthState(prev => ({ ...prev, loading: false, isInitialized: true }));
          }
        }, 3000);

        // Configurar listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            if (!mountedRef.current) return;
            console.log(`🔔 [useStableAuth] Event: ${event}`);
            
            if (event !== 'INITIAL_SESSION') {
              updateAuthState(session);
            }
          }
        );
        listenerRef.current = subscription;

        // Buscar sessão atual
        const { data: { session } } = await supabase.auth.getSession();
        await updateAuthState(session);

        // Limpar timeout se chegou até aqui
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

      } catch (error) {
        console.error('❌ [useStableAuth] Erro:', error);
        if (mountedRef.current) {
          setAuthState({
            session: null,
            user: null,
            loading: false,
            isInitialized: true,
            isAdmin: false,
            error: error instanceof Error ? error.message : 'Erro desconhecido'
          });
        }
      }
    };

    initAuth();

    return () => {
      console.log('🧹 [useStableAuth] Cleanup');
      mountedRef.current = false;
      if (listenerRef.current) {
        listenerRef.current.unsubscribe();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      isInitializedRef.current = false;
    };
  }, []);

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
        console.log('✅ [useStableAuth] Refresh realizado com sucesso');
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

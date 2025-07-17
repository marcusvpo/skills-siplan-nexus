
import { useState, useEffect, useCallback, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, ensureSessionHydration, syncTokensToCustomKey } from '@/integrations/supabase/client';
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
  const hydrationAttemptedRef = useRef(false);

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
    console.log('🔄 [useStableAuth] Atualizando estado de auth:', session ? 'com sessão VÁLIDA' : 'sem sessão');

    if (session?.access_token) {
      try {
        // Validar JWT
        const jwtPayload = JSON.parse(atob(session.access_token.split('.')[1]));
        
        console.log('🔍 [useStableAuth] Validando JWT:', {
          role: jwtPayload.role,
          userId: jwtPayload.sub,
          email: jwtPayload.email,
          exp: new Date(jwtPayload.exp * 1000).toISOString()
        });
        
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
        
        console.log('✅ [useStableAuth] Estado atualizado com sessão VÁLIDA:', {
          userId: session.user?.id,
          email: session.user?.email,
          isAdmin,
          role: jwtPayload.role,
          tokenExpires: new Date(jwtPayload.exp * 1000).toISOString()
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

  // Inicialização robusta com hidratação garantida
  useEffect(() => {
    if (isInitializedRef.current) return;
    
    console.log('🚀 [useStableAuth] Inicializando autenticação com hidratação robusta...');
    isInitializedRef.current = true;

    const initializeAuth = async () => {
      try {
        // ETAPA 0: Sincronizar tokens das chaves padrão para customizada
        console.log('🔄 [useStableAuth] ETAPA 0: Sincronizando tokens para chave customizada...');
        await syncTokensToCustomKey();
        
        // ETAPA 1: Garantir hidratação imediata da sessão
        console.log('🔄 [useStableAuth] ETAPA 1: Garantindo hidratação da sessão...');
        
        if (!hydrationAttemptedRef.current) {
          hydrationAttemptedRef.current = true;
          const sessionHydrated = await ensureSessionHydration();
          console.log('🔍 [useStableAuth] Resultado da hidratação:', sessionHydrated);
        }

         // ETAPA 2: Configurar listener APÓS hidratação
         console.log('🔄 [useStableAuth] ETAPA 2: Configurando listener de auth...');
        
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log(`🔔 [useStableAuth] Auth event: ${event}`, {
              hasSession: !!session,
              sessionUserId: session?.user?.id,
              tokenPresent: !!session?.access_token
            });
            
            // Processar mudanças de estado imediatamente
            await updateAuthState(session);
          }
        );

        listenerRef.current = subscription;

         // ETAPA 3: Buscar sessão atual após configurar listener
         console.log('🔄 [useStableAuth] ETAPA 3: Buscando sessão atual...');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ [useStableAuth] Erro ao obter sessão inicial:', error);
          await updateAuthState(null);
          return;
        }
        
        if (session) {
          console.log('✅ [useStableAuth] Sessão inicial encontrada:', {
            userId: session.user?.id,
            email: session.user?.email,
            hasToken: !!session.access_token
          });
        } else {
          console.log('⚠️ [useStableAuth] Nenhuma sessão inicial encontrada');
        }
        
        await updateAuthState(session);

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
      hydrationAttemptedRef.current = false;
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

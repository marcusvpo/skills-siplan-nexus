
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
    if (!mountedRef.current) return;

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
        
        // Verificar se o token não está expirado
        const now = Math.floor(Date.now() / 1000);
        if (jwtPayload.exp <= now) {
          console.warn('⚠️ [useStableAuth] Token expirado, tentando renovar...');
          
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError || !refreshData.session) {
            console.error('❌ [useStableAuth] Erro no refresh, fazendo logout:', refreshError);
            await supabase.auth.signOut();
            if (mountedRef.current) {
              setAuthState({
                session: null,
                user: null,
                loading: false,
                isInitialized: true,
                isAdmin: false,
                error: 'Sessão expirada'
              });
            }
            return;
          }
          
          // Usar a nova sessão renovada
          session = refreshData.session;
        }
        
        if (jwtPayload.role !== 'authenticated') {
          console.error('❌ [useStableAuth] Token não é authenticated:', jwtPayload.role);
          await supabase.auth.signOut();
          if (mountedRef.current) {
            setAuthState({
              session: null,
              user: null,
              loading: false,
              isInitialized: true,
              isAdmin: false,
              error: 'Token inválido'
            });
          }
          return;
        }

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
        if (mountedRef.current) {
          setAuthState({
            session: null,
            user: null,
            loading: false,
            isInitialized: true,
            isAdmin: false,
            error: 'Erro na validação do token'
          });
        }
      }
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
      
      console.log('✅ [useStableAuth] Estado atualizado sem sessão');
    }
  }, [checkAdminStatus]);

  // Inicialização controlada
  useEffect(() => {
    if (isInitializedRef.current) return;
    
    console.log('🚀 [useStableAuth] Inicializando autenticação...');
    isInitializedRef.current = true;
    mountedRef.current = true;

    const initializeAuth = async () => {
      try {
        // ETAPA 1: Configurar listener PRIMEIRO
        console.log('🔄 [useStableAuth] ETAPA 1: Configurando listener de auth...');
        
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (!mountedRef.current) return;
            
            console.log(`🔔 [useStableAuth] Auth event: ${event}`, {
              hasSession: !!session,
              sessionUserId: session?.user?.id,
              tokenPresent: !!session?.access_token
            });
            
            // Evitar processar eventos duplicados ou desnecessários
            if (event === 'INITIAL_SESSION') {
              return; // Vamos buscar a sessão manualmente
            }
            
            // Processar mudanças de estado
            await updateAuthState(session);
          }
        );

        listenerRef.current = subscription;

        // ETAPA 2: Buscar sessão atual APÓS configurar listener
        console.log('🔄 [useStableAuth] ETAPA 2: Buscando sessão atual...');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ [useStableAuth] Erro ao obter sessão inicial:', error);
          if (mountedRef.current) {
            setAuthState({
              session: null,
              user: null,
              loading: false,
              isInitialized: true,
              isAdmin: false,
              error: 'Erro ao verificar autenticação'
            });
          }
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
        if (mountedRef.current) {
          setAuthState({
            session: null,
            user: null,
            loading: false,
            isInitialized: true,
            isAdmin: false,
            error: 'Erro na inicialização'
          });
        }
      }
    };

    initializeAuth();

    // Cleanup na desmontagem
    return () => {
      console.log('🧹 [useStableAuth] Limpando listener na desmontagem');
      mountedRef.current = false;
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

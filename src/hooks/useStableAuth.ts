
import { useState, useEffect, useCallback, useRef } from 'react';
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { SupabaseWithRetry } from '@/utils/supabaseWithRetry';
import { logger } from '@/utils/logger';

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isInitialized: boolean;
  isAdmin: boolean;
  error: string | null;
  retryCount: number;
}

const STORAGE_KEY = 'supabase.auth.token';
const MAX_RETRIES = 3;

export const useStableAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    session: null,
    user: null,
    loading: true,
    isInitialized: false,
    isAdmin: false,
    error: null,
    retryCount: 0
  });

  const initializationRef = useRef(false);
  const listenerRef = useRef<any>(null);
  const sessionCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Função para recuperar sessão do localStorage
  const getStoredSession = useCallback(async () => {
    try {
      const storedSession = localStorage.getItem(STORAGE_KEY);
      if (storedSession) {
        const parsedSession = JSON.parse(storedSession);
        console.log('🔍 DEBUG: Found stored session:', parsedSession);
        return parsedSession;
      }
    } catch (error) {
      console.error('❌ Error parsing stored session:', error);
      localStorage.removeItem(STORAGE_KEY);
    }
    return null;
  }, []);

  // Função para salvar sessão no localStorage
  const saveSession = useCallback((session: Session | null) => {
    try {
      if (session) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        console.log('💾 Session saved to localStorage');
      } else {
        localStorage.removeItem(STORAGE_KEY);
        console.log('🗑️ Session removed from localStorage');
      }
    } catch (error) {
      console.error('❌ Error saving session:', error);
    }
  }, []);

  // Função para verificar status de admin
  const checkAdminStatus = useCallback(async (user: User | null): Promise<boolean> => {
    if (!user?.email) {
      return false;
    }

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

  // Função para validar se a sessão ainda é válida
  const isSessionValid = useCallback((session: Session | null): boolean => {
    if (!session) return false;
    
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = session.expires_at || 0;
    
    // Considerar sessão inválida se expira em menos de 5 minutos
    return expiresAt > (now + 300);
  }, []);

  // Função para tentar refresh da sessão
  const refreshSession = useCallback(async (): Promise<Session | null> => {
    try {
      console.log('🔄 [useStableAuth] Tentando refresh da sessão...');
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('❌ [useStableAuth] Erro no refresh:', error);
        return null;
      }
      
      if (data.session) {
        console.log('✅ [useStableAuth] Sessão renovada com sucesso');
        return data.session;
      }
      
      return null;
    } catch (error) {
      console.error('❌ [useStableAuth] Erro inesperado no refresh:', error);
      return null;
    }
  }, []);

  // Função para retry da autenticação
  const retryAuth = useCallback(async (attempt: number = 1): Promise<void> => {
    if (attempt > MAX_RETRIES) {
      console.error('❌ [useStableAuth] Máximo de tentativas excedido');
      setAuthState(prev => ({ 
        ...prev, 
        error: 'Falha na autenticação após múltiplas tentativas',
        loading: false,
        retryCount: attempt - 1
      }));
      return;
    }

    try {
      console.log(`🔄 [useStableAuth] Tentativa ${attempt} de autenticação`);
      
      const { data, error } = await SupabaseWithRetry.getSessionWithRetry(1);
      
      if (error) {
        throw error;
      }
      
      const session = data?.session;
      const isAdmin = session?.user ? await checkAdminStatus(session.user) : false;
      
      setAuthState({
        session,
        user: session?.user || null,
        loading: false,
        isInitialized: true,
        isAdmin,
        error: null,
        retryCount: attempt
      });
      
      saveSession(session);
      
    } catch (error) {
      console.error(`❌ [useStableAuth] Tentativa ${attempt} falhou:`, error);
      
      if (attempt < MAX_RETRIES) {
        const delay = 1000 * Math.pow(2, attempt - 1); // Backoff exponencial
        setTimeout(() => retryAuth(attempt + 1), delay);
      } else {
        setAuthState(prev => ({ 
          ...prev, 
          error: 'Falha na autenticação',
          loading: false,
          retryCount: attempt
        }));
      }
    }
  }, [checkAdminStatus, saveSession]);

  // Função para atualizar estado de auth
  const updateAuthState = useCallback(async (session: Session | null) => {
    console.log('🔄 Updating auth state:', session ? 'with session' : 'without session');
    
    // Validar sessão antes de usar
    if (session && !isSessionValid(session)) {
      console.log('⚠️ Session expired, tentando refresh...');
      
      const refreshedSession = await refreshSession();
      if (refreshedSession) {
        session = refreshedSession;
        console.log('✅ Session refreshed successfully');
      } else {
        console.log('❌ Refresh failed, clearing session');
        session = null;
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    
    const isAdmin = session?.user ? await checkAdminStatus(session.user) : false;
    
    setAuthState(prevState => {
      const newState = {
        session,
        user: session?.user || null,
        loading: false,
        isInitialized: true,
        isAdmin,
        error: null,
        retryCount: 0
      };
      
      // Só atualiza se realmente mudou
      if (
        prevState.session?.access_token !== newState.session?.access_token ||
        prevState.loading !== newState.loading ||
        prevState.isInitialized !== newState.isInitialized ||
        prevState.isAdmin !== newState.isAdmin
      ) {
        return newState;
      }
      
      return prevState;
    });

    saveSession(session);
  }, [saveSession, checkAdminStatus, isSessionValid, refreshSession]);

  // Inicialização única
  useEffect(() => {
    if (initializationRef.current) return;
    
    initializationRef.current = true;
    console.log('🚀 Initializing auth...');

    const initAuth = async () => {
      try {
        // 1. Tentar recuperar sessão do localStorage primeiro
        const storedSession = await getStoredSession();
        if (storedSession && isSessionValid(storedSession)) {
          console.log('📦 Using stored session');
          await updateAuthState(storedSession);
          return;
        }

        // 2. Se não há sessão armazenada válida, tentar com retry
        console.log('🔍 Getting session from Supabase with retry...');
        await retryAuth(1);

      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        await updateAuthState(null);
      }
    };

    initAuth();
  }, [getStoredSession, updateAuthState, isSessionValid, retryAuth]);

  // Configurar listener de mudanças de auth
  useEffect(() => {
    if (!initializationRef.current || listenerRef.current) return;

    console.log('👂 Setting up auth state listener...');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log(`🔔 Auth event: ${event}`, session ? 'with session' : 'without session');
        
        // Limpar timeout anterior
        if (sessionCheckTimeoutRef.current) {
          clearTimeout(sessionCheckTimeoutRef.current);
        }
        
        switch (event) {
          case 'SIGNED_IN':
          case 'TOKEN_REFRESHED':
            await updateAuthState(session);
            break;
          case 'SIGNED_OUT':
            await updateAuthState(null);
            break;
          default:
            // Para outros eventos, manter estado atual se não há mudança significativa
            if (session) {
              await updateAuthState(session);
            }
        }
      }
    );

    listenerRef.current = subscription;

    // Verificar periodicamente se a sessão ainda é válida
    const checkSessionPeriodically = () => {
      sessionCheckTimeoutRef.current = setTimeout(async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session && !isSessionValid(session)) {
            console.log('⏰ Session expired during periodic check, signing out');
            await supabase.auth.signOut();
          }
        } catch (error) {
          console.error('❌ Error during periodic session check:', error);
        }
        checkSessionPeriodically();
      }, 60000); // Verificar a cada minuto
    };

    checkSessionPeriodically();

    return () => {
      console.log('🧹 Cleaning up auth listener');
      subscription.unsubscribe();
      listenerRef.current = null;
      
      if (sessionCheckTimeoutRef.current) {
        clearTimeout(sessionCheckTimeoutRef.current);
      }
    };
  }, [updateAuthState, isSessionValid]);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      logger.error('❌ [useStableAuth] Error during logout:', { error: err });
    }
  }, []);

  const clearCacheAndRetry = useCallback(() => {
    console.log('🧹 [useStableAuth] Clearing cache and retrying auth');
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    // Limpar cache
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('supabase.') || key.startsWith('sb-')) {
        localStorage.removeItem(key);
      }
    });
    
    // Retry auth
    retryAuth(1);
  }, [retryAuth]);

  return {
    ...authState,
    logout,
    clearCacheAndRetry
  };
};

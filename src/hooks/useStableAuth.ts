
import { useState, useEffect, useCallback, useRef } from 'react';
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
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

const STORAGE_KEY = 'supabase.auth.token';

export const useStableAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    session: null,
    user: null,
    loading: true,
    isInitialized: false,
    isAdmin: false,
    error: null
  });

  const initializationRef = useRef(false);
  const listenerRef = useRef<any>(null);
  const stableStateRef = useRef<AuthState | null>(null);

  // Função para verificar status de admin com cache
  const checkAdminStatus = useCallback(async (user: User | null): Promise<boolean> => {
    if (!user?.email) {
      return false;
    }

    // Cache simples para evitar múltiplas consultas
    const cacheKey = `admin_status_${user.email}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached !== null) {
      return cached === 'true';
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

      const isAdmin = !!adminData;
      sessionStorage.setItem(cacheKey, isAdmin.toString());
      return isAdmin;
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
    
    return expiresAt > (now + 300); // 5 minutos de margem
  }, []);

  // Função para atualizar estado de auth de forma estável
  const updateAuthState = useCallback(async (session: Session | null, force = false) => {
    console.log('🔄 [useStableAuth] Updating auth state:', session ? 'with session' : 'without session');
    
    // Validar sessão antes de usar
    if (session && !isSessionValid(session)) {
      console.log('⚠️ [useStableAuth] Session expired, attempting refresh...');
      try {
        const { data, error } = await supabase.auth.refreshSession();
        if (!error && data.session) {
          session = data.session;
          console.log('✅ [useStableAuth] Session refreshed successfully');
        } else {
          console.log('❌ [useStableAuth] Failed to refresh session');
          session = null;
        }
      } catch (err) {
        console.error('❌ [useStableAuth] Error refreshing session:', err);
        session = null;
      }
    }
    
    const isAdmin = session?.user ? await checkAdminStatus(session.user) : false;
    
    const newState: AuthState = {
      session,
      user: session?.user || null,
      loading: false,
      isInitialized: true,
      isAdmin,
      error: null
    };

    // Comparar com estado anterior para evitar updates desnecessários
    const previousState = stableStateRef.current;
    
    if (!force && previousState && 
        previousState.session?.access_token === newState.session?.access_token &&
        previousState.loading === newState.loading &&
        previousState.isInitialized === newState.isInitialized &&
        previousState.isAdmin === newState.isAdmin) {
      console.log('🔒 [useStableAuth] State unchanged, skipping update');
      return;
    }

    console.log('📝 [useStableAuth] State changed, updating:', {
      hadSession: !!previousState?.session,
      hasSession: !!newState.session,
      wasAdmin: previousState?.isAdmin,
      isAdmin: newState.isAdmin
    });

    stableStateRef.current = newState;
    setAuthState(newState);

    // Salvar sessão apenas se válida
    if (session && isSessionValid(session)) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        console.log('💾 [useStableAuth] Session saved to localStorage');
      } catch (error) {
        console.error('❌ [useStableAuth] Error saving session:', error);
      }
    } else {
      localStorage.removeItem(STORAGE_KEY);
      console.log('🗑️ [useStableAuth] Session removed from localStorage');
    }
  }, [checkAdminStatus, isSessionValid]);

  // Inicialização única e estável
  useEffect(() => {
    if (initializationRef.current) return;
    
    initializationRef.current = true;
    console.log('🚀 [useStableAuth] Initializing auth...');

    const initAuth = async () => {
      try {
        // 1. Tentar buscar sessão do Supabase primeiro
        console.log('🔍 [useStableAuth] Getting session from Supabase...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ [useStableAuth] Error getting session:', error);
          await updateAuthState(null);
          return;
        }

        console.log('✅ [useStableAuth] Session retrieved:', session ? 'found' : 'not found');
        await updateAuthState(session, true); // Force initial update

      } catch (error) {
        console.error('❌ [useStableAuth] Auth initialization error:', error);
        await updateAuthState(null);
      }
    };

    initAuth();
  }, [updateAuthState]);

  // Configurar listener de mudanças de auth (apenas uma vez)
  useEffect(() => {
    if (!initializationRef.current || listenerRef.current) return;

    console.log('👂 [useStableAuth] Setting up auth state listener...');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log(`🔔 [useStableAuth] Auth event: ${event}`, session ? 'with session' : 'without session');
        
        switch (event) {
          case 'SIGNED_IN':
          case 'TOKEN_REFRESHED':
            await updateAuthState(session);
            break;
          case 'SIGNED_OUT':
            await updateAuthState(null);
            break;
          case 'INITIAL_SESSION':
            // Para sessão inicial, só atualizar se realmente mudou
            if (session !== stableStateRef.current?.session) {
              await updateAuthState(session);
            }
            break;
          default:
            // Para outros eventos, verificar se há mudança real
            if (session !== stableStateRef.current?.session) {
              await updateAuthState(session);
            }
        }
      }
    );

    listenerRef.current = subscription;

    return () => {
      console.log('🧹 [useStableAuth] Cleaning up auth listener');
      subscription.unsubscribe();
      listenerRef.current = null;
    };
  }, [updateAuthState]);

  const logout = useCallback(async () => {
    try {
      console.log('🚪 [useStableAuth] Logging out...');
      await supabase.auth.signOut();
      sessionStorage.clear(); // Limpar cache de admin
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      logger.error('❌ [useStableAuth] Error during logout:', { error: err });
    }
  }, []);

  return {
    ...authState,
    logout
  };
};

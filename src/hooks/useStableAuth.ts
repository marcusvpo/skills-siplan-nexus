
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

  // Função para atualizar estado de auth
  const updateAuthState = useCallback(async (session: Session | null) => {
    console.log('🔄 Updating auth state:', session ? 'with session' : 'without session');
    
    const isAdmin = session?.user ? await checkAdminStatus(session.user) : false;
    
    setAuthState(prevState => {
      const newState = {
        session,
        user: session?.user || null,
        loading: false,
        isInitialized: true,
        isAdmin,
        error: null
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
  }, [saveSession, checkAdminStatus]);

  // Inicialização única
  useEffect(() => {
    if (initializationRef.current) return;
    
    initializationRef.current = true;
    console.log('🚀 Initializing auth...');

    const initAuth = async () => {
      try {
        // 1. Tentar recuperar sessão do localStorage primeiro
        const storedSession = await getStoredSession();
        if (storedSession) {
          console.log('📦 Using stored session');
          await updateAuthState(storedSession);
          return;
        }

        // 2. Se não há sessão armazenada, buscar do Supabase
        console.log('🔍 Getting session from Supabase...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting session:', error);
          await updateAuthState(null);
          return;
        }

        console.log('✅ Session retrieved:', session ? 'found' : 'not found');
        await updateAuthState(session);

      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        await updateAuthState(null);
      }
    };

    initAuth();
  }, [getStoredSession, updateAuthState]);

  // Configurar listener de mudanças de auth (apenas uma vez)
  useEffect(() => {
    if (!initializationRef.current || listenerRef.current) return;

    console.log('👂 Setting up auth state listener...');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log(`🔔 Auth event: ${event}`, session ? 'with session' : 'without session');
        
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

    return () => {
      console.log('🧹 Cleaning up auth listener');
      subscription.unsubscribe();
      listenerRef.current = null;
    };
  }, [updateAuthState]);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
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


import { useState, useEffect, useCallback, useRef } from 'react';
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase, getValidSession } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isInitialized: boolean;
  isAdmin: boolean;
  error: string | null;
  lastValidation: number;
}

const VALIDATION_INTERVAL = 30000; // Validar a cada 30 segundos
const STORAGE_KEY = 'supabase.auth.token';

export const useStableAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    session: null,
    user: null,
    loading: true,
    isInitialized: false,
    isAdmin: false,
    error: null,
    lastValidation: 0
  });

  const validationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const listenerRef = useRef<any>(null);

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

  // Função para validar e atualizar estado de auth
  const validateAndUpdateAuth = useCallback(async (forceCheck: boolean = false) => {
    const now = Date.now();
    
    // Evitar validações muito frequentes, exceto se forçado
    if (!forceCheck && (now - authState.lastValidation < 5000)) {
      return;
    }

    try {
      console.log('🔄 [useStableAuth] Validando sessão...');
      
      const validSession = await getValidSession();
      
      if (validSession) {
        const isAdmin = await checkAdminStatus(validSession.user);
        
        setAuthState({
          session: validSession,
          user: validSession.user,
          loading: false,
          isInitialized: true,
          isAdmin,
          error: null,
          lastValidation: now
        });
        
        console.log('✅ [useStableAuth] Sessão válida confirmada:', {
          userId: validSession.user?.id,
          email: validSession.user?.email,
          isAdmin
        });
      } else {
        console.log('⚠️ [useStableAuth] Sessão inválida ou expirada');
        
        setAuthState({
          session: null,
          user: null,
          loading: false,
          isInitialized: true,
          isAdmin: false,
          error: null,
          lastValidation: now
        });
      }
    } catch (error) {
      console.error('❌ [useStableAuth] Erro na validação:', error);
      
      setAuthState(prev => ({
        ...prev,
        error: 'Erro na validação de sessão',
        loading: false,
        lastValidation: now
      }));
    }
  }, [authState.lastValidation, checkAdminStatus]);

  // Inicialização única e robusta
  useEffect(() => {
    console.log('🚀 [useStableAuth] Inicializando autenticação...');
    
    const initAuth = async () => {
      await validateAndUpdateAuth(true);
    };

    initAuth();
  }, []);

  // Configurar listener de mudanças de auth
  useEffect(() => {
    if (listenerRef.current) return;

    console.log('👂 [useStableAuth] Configurando listener de auth...');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log(`🔔 [useStableAuth] Auth event: ${event}`, session ? 'with session' : 'without session');
        
        // Para evitar loops, usar setTimeout
        setTimeout(async () => {
          await validateAndUpdateAuth(true);
        }, 100);
      }
    );

    listenerRef.current = subscription;

    return () => {
      console.log('🧹 [useStableAuth] Limpando listener');
      subscription.unsubscribe();
      listenerRef.current = null;
    };
  }, [validateAndUpdateAuth]);

  // Validação periódica
  useEffect(() => {
    if (!authState.isInitialized) return;

    // Limpar interval anterior se existir
    if (validationIntervalRef.current) {
      clearInterval(validationIntervalRef.current);
    }

    // Configurar validação periódica apenas se há sessão ativa
    if (authState.session) {
      validationIntervalRef.current = setInterval(() => {
        console.log('⏰ [useStableAuth] Validação periódica...');
        validateAndUpdateAuth(false);
      }, VALIDATION_INTERVAL);
    }

    return () => {
      if (validationIntervalRef.current) {
        clearInterval(validationIntervalRef.current);
        validationIntervalRef.current = null;
      }
    };
  }, [authState.isInitialized, authState.session, validateAndUpdateAuth]);

  const logout = useCallback(async () => {
    try {
      console.log('🚪 [useStableAuth] Executando logout...');
      
      await supabase.auth.signOut();
      localStorage.removeItem(STORAGE_KEY);
      
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
    await validateAndUpdateAuth(true);
  }, [validateAndUpdateAuth]);

  return {
    ...authState,
    logout,
    forceRefresh
  };
};

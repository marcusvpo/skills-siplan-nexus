
import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';

interface UseSessionPersistenceProps {
  onSessionUpdate: (session: Session | null) => void;
  onSessionLost: () => void;
}

export const useSessionPersistence = ({ 
  onSessionUpdate, 
  onSessionLost 
}: UseSessionPersistenceProps) => {
  const lastActiveTime = useRef<number>(Date.now());
  const sessionCheckTimeout = useRef<NodeJS.Timeout | null>(null);
  const isCheckingSession = useRef<boolean>(false);

  const validateSession = useCallback(async (forceRefresh = false) => {
    if (isCheckingSession.current) {
      logger.info('🔄 [useSessionPersistence] Session check already in progress, skipping');
      return;
    }

    isCheckingSession.current = true;
    logger.info('🔐 [useSessionPersistence] Validating session', { forceRefresh });

    try {
      // Se forçar refresh, tentar renovar o token
      if (forceRefresh) {
        const { data, error } = await supabase.auth.refreshSession();
        
        if (error) {
          logger.error('❌ [useSessionPersistence] Error refreshing session:', error);
          onSessionLost();
          return;
        }

        if (data.session) {
          logger.info('✅ [useSessionPersistence] Session refreshed successfully');
          onSessionUpdate(data.session);
          return;
        }
      }

      // Verificar sessão atual
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        logger.error('❌ [useSessionPersistence] Error getting session:', error);
        onSessionLost();
        return;
      }

      if (session) {
        logger.info('✅ [useSessionPersistence] Session validated successfully');
        onSessionUpdate(session);
      } else {
        logger.warn('⚠️ [useSessionPersistence] No active session found');
        onSessionLost();
      }
    } catch (err) {
      logger.error('❌ [useSessionPersistence] Unexpected error during session validation:', err);
      onSessionLost();
    } finally {
      isCheckingSession.current = false;
    }
  }, [onSessionUpdate, onSessionLost]);

  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === 'visible') {
      const timeAway = Date.now() - lastActiveTime.current;
      const shouldRefresh = timeAway > 30000; // 30 segundos
      
      logger.info('👁️ [useSessionPersistence] Page became visible', { 
        timeAway: Math.round(timeAway / 1000) + 's',
        shouldRefresh 
      });

      // Validar sessão quando a página se torna visível novamente
      validateSession(shouldRefresh);
    } else {
      lastActiveTime.current = Date.now();
      logger.info('👁️ [useSessionPersistence] Page became hidden');
    }
  }, [validateSession]);

  const handleFocus = useCallback(() => {
    const timeAway = Date.now() - lastActiveTime.current;
    const shouldRefresh = timeAway > 60000; // 1 minuto
    
    logger.info('🎯 [useSessionPersistence] Window focused', { 
      timeAway: Math.round(timeAway / 1000) + 's',
      shouldRefresh 
    });

    validateSession(shouldRefresh);
  }, [validateSession]);

  const handleBlur = useCallback(() => {
    lastActiveTime.current = Date.now();
    logger.info('🎯 [useSessionPersistence] Window blurred');
  }, []);

  const schedulePeriodicCheck = useCallback(() => {
    if (sessionCheckTimeout.current) {
      clearTimeout(sessionCheckTimeout.current);
    }

    sessionCheckTimeout.current = setTimeout(() => {
      if (document.visibilityState === 'visible') {
        logger.info('⏰ [useSessionPersistence] Periodic session check');
        validateSession(false);
      }
      schedulePeriodicCheck();
    }, 5 * 60 * 1000); // 5 minutos
  }, [validateSession]);

  useEffect(() => {
    // Adicionar listeners de eventos
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    // Iniciar verificações periódicas
    schedulePeriodicCheck();

    // Validação inicial
    validateSession(false);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      
      if (sessionCheckTimeout.current) {
        clearTimeout(sessionCheckTimeout.current);
      }
    };
  }, [handleVisibilityChange, handleFocus, handleBlur, schedulePeriodicCheck, validateSession]);

  return {
    validateSession,
    forceSessionRefresh: () => validateSession(true)
  };
};

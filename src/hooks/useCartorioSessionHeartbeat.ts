import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

/**
 * Hook para manter a sessão do cartório ativa através de heartbeats
 * Envia um heartbeat a cada 60 segundos enquanto o usuário está ativo
 */
export const useCartorioSessionHeartbeat = (cartorioId: string | null) => {
  useEffect(() => {
    if (!cartorioId) return;

    const sendHeartbeat = async () => {
      try {
        const { error } = await supabase.rpc('upsert_cartorio_session', {
          p_cartorio_id: cartorioId
        });

        if (error) {
          logger.error('❌ [Heartbeat] Error updating session:', error);
        } else {
          logger.info('💓 [Heartbeat] Session updated successfully');
        }
      } catch (err) {
        logger.error('❌ [Heartbeat] Unexpected error:', err);
      }
    };

    // Enviar heartbeat imediatamente
    sendHeartbeat();

    // Configurar intervalo de 60 segundos
    const interval = setInterval(sendHeartbeat, 60000);

    // Enviar heartbeat quando a janela receber foco
    const handleFocus = () => sendHeartbeat();
    window.addEventListener('focus', handleFocus);

    // Cleanup
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [cartorioId]);
};

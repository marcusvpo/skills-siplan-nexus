import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface CartorioSession {
  id: string;
  cartorio_id: string;
  last_activity: string;
  is_active: boolean;
  created_at: string;
}

export const useCartorioSessions = () => {
  const [sessions, setSessions] = useState<Map<string, CartorioSession>>(new Map());
  // "tick" força re-render periódico para recalcular tempo relativo/online
  const [, setTick] = useState(0);

  useEffect(() => {
    let mounted = true;
    // Buscar sessões iniciais
    const fetchSessions = async () => {
      const { data, error } = await supabase
        .from('cartorio_sessions')
        .select('*');

      if (error) {
        logger.error('❌ [Sessions] Error fetching sessions:', error);
        return;
      }

      if (data && mounted) {
        const sessionMap = new Map(data.map(session => [session.cartorio_id, session]));
        setSessions(sessionMap);
        logger.info('✅ [Sessions] Loaded sessions:', { count: data.length });
      }
    };

    fetchSessions();

    // Marcar sessões antigas como inativas + re-sincronizar (fallback ao realtime)
    const cleanupInterval = setInterval(async () => {
      await supabase.rpc('deactivate_old_sessions');
      await fetchSessions();
    }, 30000); // A cada 30 segundos

    // Atualizar o "farol" e o tempo relativo a cada 15s
    const tickInterval = setInterval(() => setTick(t => t + 1), 15000);

    // Inscrever para atualizações em tempo real
    const channel = supabase
      .channel('cartorio-sessions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cartorio_sessions'
        },
        (payload) => {
          logger.info('🔄 [Sessions] Realtime update:', payload);

          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const session = payload.new as CartorioSession;
            setSessions(prev => new Map(prev).set(session.cartorio_id, session));
          } else if (payload.eventType === 'DELETE') {
            const session = payload.old as CartorioSession;
            setSessions(prev => {
              const newMap = new Map(prev);
              newMap.delete(session.cartorio_id);
              return newMap;
            });
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      clearInterval(cleanupInterval);
      clearInterval(tickInterval);
      supabase.removeChannel(channel);
    };
  }, []);

  return sessions;
};

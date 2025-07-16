import { useEffect, useCallback } from 'react';
import { useProgressoReativo } from './useProgressoReativo';

interface ProgressoEventDetail {
  videoAulaId: string;
  produtoId?: string;
  completo: boolean;
  timestamp: number;
}

/**
 * Hook que estende useProgressoReativo com sincronização global
 * Escuta eventos personalizados para invalidar cache quando necessário
 */
export const useProgressoSincronizado = (produtoId?: string, refreshKey: number = 0) => {
  const progressoHook = useProgressoReativo(produtoId, refreshKey);
  
  // Escutar eventos globais de progresso atualizado
  useEffect(() => {
    const handleProgressoAtualizado = (event: CustomEvent<ProgressoEventDetail>) => {
      const { produtoId: eventProdutoId, videoAulaId, completo, timestamp } = event.detail;
      
      console.log('🔔 [useProgressoSincronizado] Evento de progresso detectado:', {
        produtoId: eventProdutoId,
        videoAulaId,
        completo,
        timestamp,
        currentProdutoId: produtoId
      });
      
      // Se o evento é para o produto atual, invalidar cache
      if (eventProdutoId === produtoId) {
        console.log('✅ [useProgressoSincronizado] Invalidando cache para produto atual');
        progressoHook.invalidarCache();
      }
    };

    // Listener para eventos personalizados
    window.addEventListener('progressoAtualizado', handleProgressoAtualizado as EventListener);
    
    return () => {
      window.removeEventListener('progressoAtualizado', handleProgressoAtualizado as EventListener);
    };
  }, [produtoId, progressoHook.invalidarCache]);

  // Escutar mudanças de visibilidade da página para refresh
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && produtoId) {
        console.log('🔄 [useProgressoSincronizado] Página ficou visível, atualizando progresso');
        setTimeout(() => {
          progressoHook.invalidarCache();
        }, 500);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [produtoId, progressoHook.invalidarCache]);

  // Função para forçar refresh manual
  const forcarRefresh = useCallback(() => {
    console.log('🔄 [useProgressoSincronizado] Forçando refresh manual');
    progressoHook.invalidarCache();
  }, [progressoHook.invalidarCache]);

  return {
    ...progressoHook,
    forcarRefresh
  };
};
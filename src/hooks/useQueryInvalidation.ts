
import { useQueryClient } from '@tanstack/react-query';
import { logger } from '@/utils/logger';

export const useQueryInvalidation = () => {
  const queryClient = useQueryClient();

  const invalidateVideoAulaQueries = (produtoId?: string) => {
    logger.info('🔄 [useQueryInvalidation] Invalidating video aula queries', { produtoId });
    
    // Invalidar queries principais
    queryClient.invalidateQueries({ queryKey: ['video-aulas'] });
    queryClient.invalidateQueries({ queryKey: ['sistemas-with-video-aulas'] });
    queryClient.invalidateQueries({ queryKey: ['sistemas-cartorio'] });
    queryClient.invalidateQueries({ queryKey: ['sistemas-fixed'] });
    
    // Se temos um produtoId específico, invalidar também
    if (produtoId) {
      queryClient.invalidateQueries({ queryKey: ['produto', produtoId] });
    }
    
    // Forçar re-fetch imediato das queries ativas
    queryClient.refetchQueries({ 
      queryKey: ['sistemas-with-video-aulas'],
      type: 'active'
    });
    
    queryClient.refetchQueries({ 
      queryKey: ['sistemas-cartorio'],
      type: 'active'
    });
    
    logger.info('✅ [useQueryInvalidation] All queries invalidated and refetched');
  };

  const invalidateSystemQueries = () => {
    logger.info('🔄 [useQueryInvalidation] Invalidating system queries');
    
    queryClient.invalidateQueries({ queryKey: ['sistemas-with-video-aulas'] });
    queryClient.invalidateQueries({ queryKey: ['sistemas-cartorio'] });
    queryClient.invalidateQueries({ queryKey: ['sistemas-fixed'] });
    
    // Forçar re-fetch imediato
    queryClient.refetchQueries({ 
      queryKey: ['sistemas-with-video-aulas'],
      type: 'active'
    });
  };

  const invalidateProductQueries = () => {
    logger.info('🔄 [useQueryInvalidation] Invalidating product queries');
    
    queryClient.invalidateQueries({ queryKey: ['sistemas-with-video-aulas'] });
    queryClient.invalidateQueries({ queryKey: ['sistemas-cartorio'] });
    queryClient.invalidateQueries({ queryKey: ['produtos'] });
    
    // Forçar re-fetch imediato
    queryClient.refetchQueries({ 
      queryKey: ['sistemas-with-video-aulas'],
      type: 'active'
    });
  };

  return {
    invalidateVideoAulaQueries,
    invalidateSystemQueries,
    invalidateProductQueries
  };
};

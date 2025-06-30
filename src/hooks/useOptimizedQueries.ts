
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

// Hook otimizado para sistemas com produtos e videoaulas
export const useOptimizedSistemas = () => {
  return useQuery({
    queryKey: ['sistemas-optimized'],
    queryFn: async () => {
      logger.info('🚀 [useOptimizedSistemas] Carregando sistemas otimizados');
      
      const { data, error } = await supabase
        .from('sistemas')
        .select(`
          id,
          nome,
          descricao,
          ordem,
          produtos!produtos_sistema_fk (
            id,
            nome,
            descricao,
            ordem,
            video_aulas!video_aulas_produto_fk (
              id,
              titulo,
              ordem
            )
          )
        `)
        .order('ordem')
        .order('ordem', { referencedTable: 'produtos' })
        .order('ordem', { referencedTable: 'produtos.video_aulas' });

      if (error) {
        logger.error('❌ [useOptimizedSistemas] Erro ao carregar sistemas:', error);
        throw error;
      }

      logger.info('✅ [useOptimizedSistemas] Sistemas carregados:', { count: data?.length || 0 });
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

// Hook otimizado para produtos de um sistema específico
export const useOptimizedProdutos = (sistemaId: string) => {
  return useQuery({
    queryKey: ['produtos-optimized', sistemaId],
    queryFn: async () => {
      if (!sistemaId) return [];
      
      logger.info('🚀 [useOptimizedProdutos] Carregando produtos otimizados:', { sistemaId });
      
      const { data, error } = await supabase
        .from('produtos')
        .select(`
          id,
          nome,
          descricao,
          ordem,
          sistema_id,
          video_aulas!video_aulas_produto_fk (
            id,
            titulo,
            descricao,
            ordem,
            url_thumbnail
          )
        `)
        .eq('sistema_id', sistemaId)
        .order('ordem')
        .order('ordem', { referencedTable: 'video_aulas' });

      if (error) {
        logger.error('❌ [useOptimizedProdutos] Erro ao carregar produtos:', error);
        throw error;
      }

      logger.info('✅ [useOptimizedProdutos] Produtos carregados:', { count: data?.length || 0 });
      return data || [];
    },
    enabled: !!sistemaId,
    staleTime: 5 * 60 * 1000,
    retry: 3,
  });
};

// Hook otimizado para videoaulas de um produto específico
export const useOptimizedVideoAulas = (produtoId: string) => {
  return useQuery({
    queryKey: ['video-aulas-optimized', produtoId],
    queryFn: async () => {
      if (!produtoId) return [];
      
      logger.info('🚀 [useOptimizedVideoAulas] Carregando videoaulas otimizadas:', { produtoId });
      
      const { data, error } = await supabase
        .from('video_aulas')
        .select('*')
        .eq('produto_id', produtoId)
        .order('ordem');

      if (error) {
        logger.error('❌ [useOptimizedVideoAulas] Erro ao carregar videoaulas:', error);
        throw error;
      }

      logger.info('✅ [useOptimizedVideoAulas] Videoaulas carregadas:', { count: data?.length || 0 });
      return data || [];
    },
    enabled: !!produtoId,
    staleTime: 5 * 60 * 1000,
    retry: 3,
  });
};

// Hook para monitoramento de performance (se disponível)
export const usePerformanceMonitoring = () => {
  return useQuery({
    queryKey: ['performance-monitoring'],
    queryFn: async () => {
      logger.info('📊 [usePerformanceMonitoring] Verificando performance do banco');
      
      try {
        const { data, error } = await supabase.rpc('relatorio_performance_queries');
        
        if (error) {
          logger.warn('⚠️ [usePerformanceMonitoring] Função de performance não disponível:', error);
          return null;
        }

        logger.info('✅ [usePerformanceMonitoring] Relatório de performance obtido:', { queries: data?.length || 0 });
        return data;
      } catch (error) {
        logger.warn('⚠️ [usePerformanceMonitoring] Monitoramento não disponível:', error);
        return null;
      }
    },
    enabled: false, // Só executa quando chamado manualmente
    retry: false,
  });
};

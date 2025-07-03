
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

// Hook simplificado que confia inteiramente no RLS do Supabase
export const useSistemasCartorio = () => {
  return useQuery({
    queryKey: ['sistemas-cartorio-rls'],
    queryFn: async () => {
      logger.info('🏢 [useSistemasCartorio] Fetching sistemas via RLS');

      const { data: sistemas, error } = await supabase
        .from('sistemas')
        .select(`
          *,
          produtos (
            *,
            video_aulas (*)
          )
        `)
        .order('ordem', { ascending: true });

      if (error) {
        logger.error('❌ [useSistemasCartorio] Error:', { error });
        throw new Error(`Erro ao carregar sistemas: ${error.message}`);
      }

      logger.info('✅ [useSistemasCartorio] Sistemas loaded:', { 
        count: sistemas?.length || 0 
      });
      return sistemas || [];
    },
    retry: 1,
    staleTime: 30000,
  });
};

// Export alias for compatibility
export const useSistemasData = useSistemasCartorio;

// Hook para dados de sistema específico
export const useSystemData = (systemId: string) => {
  return useQuery({
    queryKey: ['system-data', systemId],
    queryFn: async () => {
      logger.info('🏗️ [useSystemData] Fetching system:', { systemId });

      const { data: sistema, error } = await supabase
        .from('sistemas')
        .select(`
          *,
          produtos (
            *,
            video_aulas (*)
          )
        `)
        .eq('id', systemId)
        .single();

      if (error) {
        logger.error('❌ [useSystemData] Error:', { error });
        throw new Error(`Erro ao carregar sistema: ${error.message}`);
      }

      logger.info('✅ [useSystemData] System loaded:', { 
        nome: sistema?.nome 
      });
      return sistema;
    },
    enabled: !!systemId,
    retry: 1,
  });
};

// Hook para dados de produto específico
export const useProductData = (productId: string) => {
  return useQuery({
    queryKey: ['product-data', productId],
    queryFn: async () => {
      logger.info('📦 [useProductData] Fetching product:', { productId });

      const { data: produto, error } = await supabase
        .from('produtos')
        .select(`
          *,
          sistemas (*),
          video_aulas (*)
        `)
        .eq('id', productId)
        .single();

      if (error) {
        logger.error('❌ [useProductData] Error:', { error });
        throw new Error(`Erro ao carregar produto: ${error.message}`);
      }

      logger.info('✅ [useProductData] Product loaded:', { 
        nome: produto?.nome 
      });
      return produto;
    },
    enabled: !!productId,
    retry: 1,
  });
};

// Hook para dados de videoaula específica
export const useVideoAulaData = (videoAulaId: string) => {
  return useQuery({
    queryKey: ['video-aula-data', videoAulaId],
    queryFn: async () => {
      logger.info('🎥 [useVideoAulaData] Fetching video aula:', { videoId: videoAulaId });

      const { data: videoAula, error } = await supabase
        .from('video_aulas')
        .select(`
          *,
          produtos (
            *,
            sistemas (*)
          )
        `)
        .eq('id', videoAulaId)
        .single();

      if (error) {
        logger.error('❌ [useVideoAulaData] Error:', { error });
        throw new Error(`Erro ao carregar videoaula: ${error.message}`);
      }

      logger.info('✅ [useVideoAulaData] Video aula loaded:', { 
        titulo: videoAula?.titulo 
      });
      return videoAula;
    },
    enabled: !!videoAulaId,
    retry: 1,
  });
};

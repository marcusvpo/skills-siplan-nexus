
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

// Hook simplificado que confia inteiramente no RLS do Supabase
// Agora usando a instância única global
export const useSistemasCartorio = () => {
  return useQuery({
    queryKey: ['sistemas-cartorio-rls'],
    queryFn: async () => {
      logger.info('🏢 [useSistemasCartorio] Fetching sistemas via RLS using shared instance');

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

// Hook para dados de videoaula específica
export const useVideoAulaData = (videoAulaId: string) => {
  return useQuery({
    queryKey: ['video-aula-data', videoAulaId],
    queryFn: async () => {
      logger.info('🎥 [useVideoAulaData] Fetching video aula using shared instance:', { videoId: videoAulaId });

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

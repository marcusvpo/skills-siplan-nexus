import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { Sistema, Produto, VideoAulaDetalhada } from '@/types/database';

// ✅ Configurações do React Query
const QUERY_CONFIG = {
  retry: 2,
  staleTime: 5 * 60 * 1000, // 5 minutos
  gcTime: 10 * 60 * 1000, // 10 minutos
  refetchOnWindowFocus: false,
} as const;

// ✅ Hook para sistemas - usando apenas campos que existem
export const useSistemasCartorio = () => {
  return useQuery({
    queryKey: ['sistemas-cartorio-rls'],
    queryFn: async (): Promise<Sistema[]> => {
      logger.info('🏢 [useSistemasCartorio] Iniciando busca de sistemas via RLS', {});

      try {
        const { data: sistemas, error } = await supabase
          .from('sistemas')
          .select(`
            id,
            nome,
            descricao,
            ordem,
            produtos (
              id,
              sistema_id,
              nome,
              descricao,
              ordem,
              video_aulas (
                id,
                titulo,
                descricao,
                ordem,
                id_video_bunny,
                url_video,
                url_thumbnail,
                produto_id,
                transcricao_completa_texto
              )
            )
          `)
          .order('ordem', { ascending: true });

        if (error) {
          logger.error('❌ [useSistemasCartorio] Erro na query:', { 
            error: error.message,
            code: error.code,
            details: error.details 
          });
          throw new Error(`Erro ao carregar sistemas: ${error.message}`);
        }

        const sistemasList = sistemas || [];
        
        logger.info('✅ [useSistemasCartorio] Sistemas carregados com sucesso:', { 
          totalSistemas: sistemasList.length,
          sistemasComProdutos: sistemasList.filter(s => s.produtos && s.produtos.length > 0).length,
          totalProdutos: sistemasList.reduce((acc, s) => acc + (s.produtos?.length || 0), 0),
          totalVideoAulas: sistemasList.reduce((acc, s) => 
            acc + (s.produtos?.reduce((prodAcc, p) => 
              prodAcc + (p.video_aulas?.length || 0), 0) || 0), 0)
        });

        return sistemasList;

      } catch (error) {
        logger.error('❌ [useSistemasCartorio] Erro inesperado:', { error });
        throw error;
      }
    },
    ...QUERY_CONFIG,
  });
};

// ✅ Hook para videoaula específica - usando campos reais
export const useVideoAulaData = (videoAulaId?: string) => {
  return useQuery({
    queryKey: ['video-aula-data', videoAulaId],
    queryFn: async (): Promise<VideoAulaDetalhada> => {
      if (!videoAulaId) {
        throw new Error('ID da videoaula é obrigatório');
      }

      logger.info('🎥 [useVideoAulaData] Iniciando busca da videoaula:', { 
        videoId: videoAulaId 
      });

      try {
        const { data: videoAula, error } = await supabase
          .from('video_aulas')
          .select(`
            id,
            titulo,
            descricao,
            ordem,
            id_video_bunny,
            url_video,
            url_thumbnail,
            produto_id,
            transcricao_completa_texto,
            produtos (
              id,
              sistema_id,
              nome,
              descricao,
              ordem,
              sistemas (
                id,
                nome,
                descricao,
                ordem
              )
            )
          `)
          .eq('id', videoAulaId)
          .single();

        if (error) {
          logger.error('❌ [useVideoAulaData] Erro na query:', { 
            error: error.message,
            code: error.code,
            videoId: videoAulaId 
          });
          
          if (error.code === 'PGRST116') {
            throw new Error('Videoaula não encontrada');
          }
          
          throw new Error(`Erro ao carregar videoaula: ${error.message}`);
        }

        if (!videoAula) {
          logger.warn('⚠️ [useVideoAulaData] Videoaula não encontrada:', { videoId: videoAulaId });
          throw new Error('Videoaula não encontrada');
        }

        logger.info('✅ [useVideoAulaData] Videoaula carregada com sucesso:', { 
          videoId: videoAulaId,
          titulo: videoAula.titulo,
          produto: videoAula.produtos?.nome,
          sistema: videoAula.produtos?.sistemas?.nome
        });

        return videoAula as VideoAulaDetalhada;

      } catch (error) {
        logger.error('❌ [useVideoAulaData] Erro inesperado:', { error, videoId: videoAulaId });
        throw error;
      }
    },
    enabled: !!videoAulaId,
    ...QUERY_CONFIG,
  });
};

// ✅ Hook para produtos por sistema
export const useProdutosPorSistema = (sistemaId?: string) => {
  return useQuery({
    queryKey: ['produtos-por-sistema', sistemaId],
    queryFn: async (): Promise<Produto[]> => {
      if (!sistemaId) {
        throw new Error('ID do sistema é obrigatório');
      }

      logger.info('📦 [useProdutosPorSistema] Buscando produtos do sistema:', { sistemaId });

      try {
        const { data: produtos, error } = await supabase
          .from('produtos')
          .select(`
            id,
            sistema_id,
            nome,
            descricao,
            ordem,
            video_aulas (
              id,
              titulo,
              descricao,
              ordem,
              id_video_bunny,
              url_video,
              url_thumbnail,
              produto_id,
              transcricao_completa_texto
            )
          `)
          .eq('sistema_id', sistemaId)
          .order('ordem', { ascending: true });

        if (error) {
          logger.error('❌ [useProdutosPorSistema] Erro na query:', { 
            error: error.message,
            sistemaId 
          });
          throw new Error(`Erro ao carregar produtos: ${error.message}`);
        }

        const produtosList = produtos || [];

        logger.info('✅ [useProdutosPorSistema] Produtos carregados:', { 
          sistemaId,
          totalProdutos: produtosList.length,
          totalVideoAulas: produtosList.reduce((acc, p) => acc + (p.video_aulas?.length || 0), 0)
        });

        return produtosList;

      } catch (error) {
        logger.error('❌ [useProdutosPorSistema] Erro inesperado:', { error, sistemaId });
        throw error;
      }
    },
    enabled: !!sistemaId,
    ...QUERY_CONFIG,
  });
};

// ✅ Hook para invalidar cache - API correta
export const useInvalidateData = () => {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['sistemas-cartorio-rls'] });
    queryClient.invalidateQueries({ queryKey: ['video-aula-data'] });
    queryClient.invalidateQueries({ queryKey: ['produtos-por-sistema'] });
    logger.info('🔄 [useInvalidateData] Todas as queries invalidadas', {});
  };

  const invalidateSistemas = () => {
    queryClient.invalidateQueries({ queryKey: ['sistemas-cartorio-rls'] });
    logger.info('🔄 [useInvalidateData] Query de sistemas invalidada', {});
  };

  return {
    invalidateAll,
    invalidateSistemas,
  };
};

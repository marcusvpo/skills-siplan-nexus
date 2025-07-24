import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

// ✅ Tipos específicos para melhor type safety
export interface VideoAula {
  id: string;
  titulo: string;
  descricao?: string;
  url_video?: string;
  duracao?: string;
  ordem: number;
  produto_id: string;
  created_at: string;
  updated_at: string;
}

export interface Produto {
  id: string;
  nome: string;
  descricao?: string;
  sistema_id: string;
  ordem: number;
  created_at: string;
  updated_at: string;
  video_aulas?: VideoAula[];
}

export interface Sistema {
  id: string;
  nome: string;
  descricao?: string;
  ordem: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  produtos?: Produto[];
}

export interface VideoAulaDetalhada extends VideoAula {
  produtos?: (Produto & {
    sistemas?: Sistema;
  });
}

// ✅ Configurações padrão do React Query para este módulo
const QUERY_CONFIG = {
  retry: 2, // Aumentado para 2 tentativas
  staleTime: 5 * 60 * 1000, // 5 minutos
  gcTime: 10 * 60 * 1000, // 10 minutos (era cacheTime)
  refetchOnWindowFocus: false, // Evita refetch desnecessário
} as const;

// Hook simplificado que confia inteiramente no RLS do Supabase
export const useSistemasCartorio = () => {
  return useQuery({
    queryKey: ['sistemas-cartorio-rls'],
    queryFn: async (): Promise<Sistema[]> => {
      logger.info('🏢 [useSistemasCartorio] Iniciando busca de sistemas via RLS');

      try {
        const { data: sistemas, error } = await supabase
          .from('sistemas')
          .select(`
            id,
            nome,
            descricao,
            ordem,
            ativo,
            created_at,
            updated_at,
            produtos (
              id,
              nome,
              descricao,
              sistema_id,
              ordem,
              created_at,
              updated_at,
              video_aulas (
                id,
                titulo,
                descricao,
                url_video,
                duracao,
                ordem,
                produto_id,
                created_at,
                updated_at
              )
            )
          `)
          .eq('ativo', true) // ✅ Apenas sistemas ativos
          .order('ordem', { ascending: true });

        if (error) {
          logger.error('❌ [useSistemasCartorio] Erro na query:', { 
            error: error.message,
            code: error.code,
            details: error.details 
          });
          throw new Error(`Erro ao carregar sistemas: ${error.message}`);
        }

        const sistemasAtivos = sistemas || [];
        
        logger.info('✅ [useSistemasCartorio] Sistemas carregados com sucesso:', { 
          totalSistemas: sistemasAtivos.length,
          sistemasComProdutos: sistemasAtivos.filter(s => s.produtos && s.produtos.length > 0).length,
          totalProdutos: sistemasAtivos.reduce((acc, s) => acc + (s.produtos?.length || 0), 0),
          totalVideoAulas: sistemasAtivos.reduce((acc, s) => 
            acc + (s.produtos?.reduce((prodAcc, p) => 
              prodAcc + (p.video_aulas?.length || 0), 0) || 0), 0)
        });

        return sistemasAtivos as Sistema[];

      } catch (error) {
        logger.error('❌ [useSistemasCartorio] Erro inesperado:', { error });
        throw error;
      }
    },
    ...QUERY_CONFIG,
  });
};

// Hook para dados de videoaula específica
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
            url_video,
            duracao,
            ordem,
            produto_id,
            created_at,
            updated_at,
            produtos (
              id,
              nome,
              descricao,
              sistema_id,
              ordem,
              created_at,
              updated_at,
              sistemas (
                id,
                nome,
                descricao,
                ordem,
                ativo,
                created_at,
                updated_at
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
    enabled: !!videoAulaId, // ✅ Só executa se tiver ID
    ...QUERY_CONFIG,
  });
};

// ✅ Hook adicional para buscar apenas produtos de um sistema específico
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
            nome,
            descricao,
            sistema_id,
            ordem,
            created_at,
            updated_at,
            video_aulas (
              id,
              titulo,
              descricao,
              url_video,
              duracao,
              ordem,
              produto_id,
              created_at,
              updated_at
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

        return produtosList as Produto[];

      } catch (error) {
        logger.error('❌ [useProdutosPorSistema] Erro inesperado:', { error, sistemaId });
        throw error;
      }
    },
    enabled: !!sistemaId,
    ...QUERY_CONFIG,
  });
};

// ✅ Hook para invalidar todas as queries relacionadas aos dados
export const useInvalidateData = () => {
  const queryClient = useQuery.getQueryClient?.() || null;

  const invalidateAll = () => {
    if (queryClient) {
      queryClient.invalidateQueries({ queryKey: ['sistemas-cartorio-rls'] });
      queryClient.invalidateQueries({ queryKey: ['video-aula-data'] });
      queryClient.invalidateQueries({ queryKey: ['produtos-por-sistema'] });
      logger.info('🔄 [useInvalidateData] Todas as queries invalidadas');
    }
  };

  const invalidateSistemas = () => {
    if (queryClient) {
      queryClient.invalidateQueries({ queryKey: ['sistemas-cartorio-rls'] });
      logger.info('🔄 [useInvalidateData] Query de sistemas invalidada');
    }
  };

  return {
    invalidateAll,
    invalidateSistemas,
  };
};

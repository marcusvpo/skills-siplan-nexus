import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

// Interface para criar videoaula
interface CreateVideoAulaData {
  titulo: string;
  descricao?: string;
  url_video: string;
  id_video_bunny?: string;
  url_thumbnail?: string;
  ordem: number;
  produto_id: string;
}

// Interface para atualizar videoaula
interface UpdateVideoAulaData extends CreateVideoAulaData {
  id: string;
}

// Interface para progresso
interface UpdateProgressData {
  videoAulaId: string;
  progressoSegundos: number;
  completo: boolean;
  cartorioId: string;
}

// Hook para buscar sistemas com produtos e videoaulas para admin
export const useSistemasFixed = () => {
  return useQuery({
    queryKey: ['sistemas-with-video-aulas'],
    queryFn: async () => {
      logger.info('🔧 [useSistemasFixed] Fetching sistemas with full hierarchy');

      try {
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
          logger.error('❌ [useSistemasFixed] Error fetching sistemas:', { error });
          throw new Error(`Erro ao carregar sistemas: ${error.message}`);
        }

        logger.info('✅ [useSistemasFixed] Successfully fetched sistemas:', { 
          count: sistemas?.length || 0 
        });

        return sistemas || [];
      } catch (error) {
        logger.error('❌ [useSistemasFixed] Unexpected error:', { error });
        throw error;
      }
    },
    retry: 1, // Reduzir retry para evitar loops
    retryDelay: 2000,
    staleTime: 30000, // Cache por 30 segundos
    gcTime: 300000, // Manter em cache por 5 minutos
  });
};

// Hook para buscar sistemas para usuários de cartório
export const useSistemasCartorio = () => {
  return useQuery({
    queryKey: ['sistemas-cartorio'],
    queryFn: async () => {
      logger.info('🏢 [useSistemasCartorio] Fetching sistemas for cartorio user');

      try {
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
          logger.error('❌ [useSistemasCartorio] Error fetching sistemas:', { error });
          throw new Error(`Erro ao carregar sistemas: ${error.message}`);
        }

        logger.info('✅ [useSistemasCartorio] Successfully fetched sistemas:', { 
          count: sistemas?.length || 0 
        });

        return sistemas || [];
      } catch (error) {
        logger.error('❌ [useSistemasCartorio] Unexpected error:', { error });
        throw error;
      }
    },
    retry: 1, // Reduzir retry para evitar loops
    retryDelay: 2000,
    staleTime: 30000, // Cache por 30 segundos
    gcTime: 300000, // Manter em cache por 5 minutos
  });
};

// Hook para visualizações
export const useVisualizacoes = () => {
  return useQuery({
    queryKey: ['visualizacoes'],
    queryFn: async () => {
      logger.info('👁️ [useVisualizacoes] Fetching visualizacoes');

      try {
        const { data, error } = await supabase
          .from('visualizacoes_cartorio')
          .select(`
            *,
            video_aulas (
              *,
              produtos (
                *,
                sistemas (*)
              )
            )
          `)
          .order('ultima_visualizacao', { ascending: false });

        if (error) {
          logger.error('❌ [useVisualizacoes] Error fetching visualizacoes:', { error });
          throw new Error(`Erro ao carregar visualizações: ${error.message}`);
        }

        return data || [];
      } catch (error) {
        logger.error('❌ [useVisualizacoes] Unexpected error:', error);
        throw error;
      }
    },
  });
};

// Hook para favoritos
export const useFavoritos = (cartorioId: string) => {
  return useQuery({
    queryKey: ['favoritos', cartorioId],
    queryFn: async () => {
      if (!cartorioId) return [];

      logger.info('⭐ [useFavoritos] Fetching favoritos for cartorio:', { cartorioId });

      try {
        const { data, error } = await supabase
          .from('favoritos_cartorio')
          .select(`
            *,
            video_aulas (
              *,
              produtos (
                *,
                sistemas (*)
              )
            )
          `)
          .eq('cartorio_id', cartorioId)
          .order('data_favoritado', { ascending: false });

        if (error) {
          logger.error('❌ [useFavoritos] Error fetching favoritos:', { error });
          throw new Error(`Erro ao carregar favoritos: ${error.message}`);
        }

        return data || [];
      } catch (error) {
        logger.error('❌ [useFavoritos] Unexpected error:', error);
        throw error;
      }
    },
    enabled: !!cartorioId,
  });
};

// Hook para atualizar progresso
export const useUpdateProgress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateProgressData) => {
      logger.info('📊 [useUpdateProgress] Updating progress:', data);

      try {
        const { data: result, error } = await supabase
          .from('visualizacoes_cartorio')
          .upsert({
            video_aula_id: data.videoAulaId,
            cartorio_id: data.cartorioId,
            progresso_segundos: data.progressoSegundos,
            completo: data.completo,
          })
          .select()
          .single();

        if (error) {
          logger.error('❌ [useUpdateProgress] Database error:', { error });
          throw new Error(`Erro ao atualizar progresso: ${error.message}`);
        }

        return result;
      } catch (error) {
        logger.error('❌ [useUpdateProgress] Unexpected error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visualizacoes'] });
    },
  });
};

// Hooks para sistemas
export const useCreateSistema = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { nome: string; descricao?: string; ordem: number }) => {
      logger.info('🔧 [useCreateSistema] Creating sistema:', { nome: data.nome });
      
      const { data: result, error } = await supabase
        .from('sistemas')
        .insert(data)
        .select()
        .single();

      if (error) {
        logger.error('❌ [useCreateSistema] Database error:', { error });
        throw new Error(`Erro ao criar sistema: ${error.message}`);
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sistemas-with-video-aulas'] });
      queryClient.invalidateQueries({ queryKey: ['sistemas-cartorio'] });
      logger.info('✅ [useCreateSistema] Sistema created successfully');
    },
    onError: (error) => {
      logger.error('❌ [useCreateSistema] Mutation failed:', { error });
    }
  });
};

export const useUpdateSistema = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string; nome: string; descricao?: string; ordem: number }) => {
      const { data: result, error } = await supabase
        .from('sistemas')
        .update(data)
        .eq('id', data.id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sistemas-with-video-aulas'] });
      toast({ title: "Sistema atualizado com sucesso!" });
    },
  });
};

export const useDeleteSistema = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('sistemas')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sistemas-with-video-aulas'] });
      toast({ title: "Sistema deletado com sucesso!" });
    },
  });
};

// Hooks para produtos
export const useCreateProduto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { nome: string; descricao?: string; sistema_id: string; ordem: number }) => {
      logger.info('🔧 [useCreateProduto] Creating produto:', { nome: data.nome });
      
      const { data: result, error } = await supabase
        .from('produtos')
        .insert(data)
        .select()
        .single();

      if (error) {
        logger.error('❌ [useCreateProduto] Database error:', { error });
        throw new Error(`Erro ao criar produto: ${error.message}`);
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sistemas-with-video-aulas'] });
      queryClient.invalidateQueries({ queryKey: ['sistemas-cartorio'] });
      logger.info('✅ [useCreateProduto] Produto created successfully');
    },
    onError: (error) => {
      logger.error('❌ [useCreateProduto] Mutation failed:', { error });
    }
  });
};

export const useUpdateProduto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string; nome: string; descricao?: string; ordem: number }) => {
      const { data: result, error } = await supabase
        .from('produtos')
        .update(data)
        .eq('id', data.id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sistemas-with-video-aulas'] });
      toast({ title: "Produto atualizado com sucesso!" });
    },
  });
};

export const useDeleteProduto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('produtos')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sistemas-with-video-aulas'] });
      toast({ title: "Produto deletado com sucesso!" });
    },
  });
};

// Hook para criar videoaula com tratamento robusto de erros
export const useCreateVideoAula = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateVideoAulaData) => {
      logger.info('📹 [useCreateVideoAula] Starting video aula creation:', { titulo: data.titulo });

      try {
        const { data: result, error } = await supabase
          .from('video_aulas')
          .insert({
            titulo: data.titulo,
            descricao: data.descricao || null,
            url_video: data.url_video,
            id_video_bunny: data.id_video_bunny || null,
            url_thumbnail: data.url_thumbnail || null,
            ordem: data.ordem,
            produto_id: data.produto_id
          })
          .select()
          .single();

        if (error) {
          logger.error('❌ [useCreateVideoAula] Database error:', { error });
          throw new Error(`Erro ao criar videoaula: ${error.message}`);
        }

        logger.info('✅ [useCreateVideoAula] Video aula created successfully:', { id: result.id });
        return result;
      } catch (error) {
        logger.error('❌ [useCreateVideoAula] Unexpected error:', { error });
        throw error;
      }
    },
    onSuccess: (data) => {
      // Invalidar queries de forma mais específica
      queryClient.invalidateQueries({ queryKey: ['sistemas-with-video-aulas'] });
      queryClient.invalidateQueries({ queryKey: ['sistemas-cartorio'] });
      
      // Invalidar queries específicas do produto
      queryClient.invalidateQueries({ queryKey: ['produto', data.produto_id] });
      
      logger.info('✅ [useCreateVideoAula] Queries invalidated successfully');
    },
    onError: (error) => {
      logger.error('❌ [useCreateVideoAula] Mutation failed:', { error });
    }
  });
};

// Hook para atualizar videoaula
export const useUpdateVideoAula = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateVideoAulaData) => {
      logger.info('📹 [useUpdateVideoAula] Starting video aula update:', { id: data.id, titulo: data.titulo });

      try {
        const { data: result, error } = await supabase
          .from('video_aulas')
          .update({
            titulo: data.titulo,
            descricao: data.descricao || null,
            url_video: data.url_video,
            id_video_bunny: data.id_video_bunny || null,
            url_thumbnail: data.url_thumbnail || null,
            ordem: data.ordem,
            produto_id: data.produto_id
          })
          .eq('id', data.id)
          .select()
          .single();

        if (error) {
          logger.error('❌ [useUpdateVideoAula] Database error:', { error });
          throw new Error(`Erro ao atualizar videoaula: ${error.message}`);
        }

        logger.info('✅ [useUpdateVideoAula] Video aula updated successfully:', { id: result.id });
        return result;
      } catch (error) {
        logger.error('❌ [useUpdateVideoAula] Unexpected error:', { error });
        throw error;
      }
    },
    onSuccess: (data) => {
      // Invalidar queries de forma mais específica
      queryClient.invalidateQueries({ queryKey: ['sistemas-with-video-aulas'] });
      queryClient.invalidateQueries({ queryKey: ['sistemas-cartorio'] });
      
      // Invalidar queries específicas do produto
      queryClient.invalidateQueries({ queryKey: ['produto', data.produto_id] });
      
      logger.info('✅ [useUpdateVideoAula] Queries invalidated successfully');
    },
    onError: (error) => {
      logger.error('❌ [useUpdateVideoAula] Mutation failed:', { error });
    }
  });
};

// Hook para deletar videoaula
export const useDeleteVideoAula = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      logger.info('📹 [useDeleteVideoAula] Starting video aula deletion:', { id });

      try {
        const { error } = await supabase
          .from('video_aulas')
          .delete()
          .eq('id', id);

        if (error) {
          logger.error('❌ [useDeleteVideoAula] Database error:', { error });
          throw new Error(`Erro ao deletar videoaula: ${error.message}`);
        }

        logger.info('✅ [useDeleteVideoAula] Video aula deleted successfully:', { id });
        return { id };
      } catch (error) {
        logger.error('❌ [useDeleteVideoAula] Unexpected error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-aulas'] });
      queryClient.invalidateQueries({ queryKey: ['sistemas-with-video-aulas'] });
      
      toast({
        title: "Videoaula deletada!",
        description: "A videoaula foi deletada com sucesso.",
      });
    },
    onError: (error) => {
      logger.error('❌ [useDeleteVideoAula] Mutation failed:', error);
      
      toast({
        title: "Erro ao deletar videoaula",
        description: error instanceof Error ? error.message : "Erro desconhecido ao deletar videoaula",
        variant: "destructive",
      });
    }
  });
};


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
        logger.error('❌ [useCreateVideoAula] Unexpected error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-aulas'] });
      queryClient.invalidateQueries({ queryKey: ['sistemas-with-video-aulas'] });
      
      toast({
        title: "Videoaula criada!",
        description: "A videoaula foi criada com sucesso.",
      });
    },
    onError: (error) => {
      logger.error('❌ [useCreateVideoAula] Mutation failed:', error);
      
      toast({
        title: "Erro ao criar videoaula",
        description: error instanceof Error ? error.message : "Erro desconhecido ao criar videoaula",
        variant: "destructive",
      });
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
        logger.error('❌ [useUpdateVideoAula] Unexpected error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-aulas'] });
      queryClient.invalidateQueries({ queryKey: ['sistemas-with-video-aulas'] });
      
      toast({
        title: "Videoaula atualizada!",
        description: "A videoaula foi atualizada com sucesso.",
      });
    },
    onError: (error) => {
      logger.error('❌ [useUpdateVideoAula] Mutation failed:', error);
      
      toast({
        title: "Erro ao atualizar videoaula",
        description: error instanceof Error ? error.message : "Erro desconhecido ao atualizar videoaula",
        variant: "destructive",
      });
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
        logger.error('❌ [useSistemasCartorio] Unexpected error:', error);
        throw error;
      }
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
};

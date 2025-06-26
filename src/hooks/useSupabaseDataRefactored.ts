
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useSistemasWithVideoAulas = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['sistemas-with-videoaulas'],
    queryFn: async () => {
      console.log('Fetching sistemas with videoaulas - user type:', user?.type);
      
      // Buscar sistemas com produtos e suas videoaulas
      const { data, error } = await supabase
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
        console.error('Error fetching sistemas with videoaulas:', error);
        throw error;
      }
      
      console.log('Sistemas with videoaulas fetched successfully:', data);
      return data || [];
    },
    retry: 3,
    retryDelay: 1000
  });
};

export const useVideoAulasByProduto = (produtoId: string) => {
  return useQuery({
    queryKey: ['video-aulas-by-produto', produtoId],
    queryFn: async () => {
      if (!produtoId) return [];
      
      const { data, error } = await supabase
        .from('video_aulas')
        .select('*')
        .eq('produto_id', produtoId)
        .order('ordem', { ascending: true });
      
      if (error) {
        console.error('Error fetching video aulas by produto:', error);
        throw error;
      }
      return data || [];
    },
    enabled: !!produtoId
  });
};

export const useCreateVideoAula = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (videoAulaData: { 
      titulo: string; 
      descricao?: string; 
      produto_id: string; 
      ordem: number;
      url_video?: string;
      id_video_bunny?: string;
      url_thumbnail?: string;
    }) => {
      // Garantir que url_video tenha um valor padrão se não fornecido
      const dataToInsert = {
        ...videoAulaData,
        url_video: videoAulaData.url_video || ''
      };

      const { data, error } = await supabase
        .from('video_aulas')
        .insert(dataToInsert)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sistemas-with-videoaulas'] });
      queryClient.invalidateQueries({ queryKey: ['video-aulas-by-produto'] });
    }
  });
};

export const useUpdateVideoAula = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { 
      id: string; 
      titulo?: string; 
      descricao?: string; 
      ordem?: number;
      url_video?: string;
      id_video_bunny?: string;
      url_thumbnail?: string;
    }) => {
      const { data, error } = await supabase
        .from('video_aulas')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sistemas-with-videoaulas'] });
      queryClient.invalidateQueries({ queryKey: ['video-aulas-by-produto'] });
    }
  });
};

export const useDeleteVideoAula = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('video_aulas')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sistemas-with-videoaulas'] });
      queryClient.invalidateQueries({ queryKey: ['video-aulas-by-produto'] });
    }
  });
};

export const useVisualizacoesRefactored = (cartorioId?: string) => {
  const { authenticatedClient, user } = useAuth();
  const client = user?.type === 'cartorio' ? authenticatedClient : supabase;
  
  return useQuery({
    queryKey: ['visualizacoes-refactored', cartorioId],
    queryFn: async () => {
      if (!client) return [];
      
      let query = client
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

      if (cartorioId && user?.type === 'admin') {
        query = query.eq('cartorio_id', cartorioId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching visualizacoes:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!client
  });
};

export const useUpdateProgressRefactored = () => {
  const queryClient = useQueryClient();
  const { authenticatedClient, user } = useAuth();
  const client = user?.type === 'cartorio' ? authenticatedClient : supabase;

  return useMutation({
    mutationFn: async ({ videoAulaId, progressoSegundos, completo, cartorioId }: {
      videoAulaId: string;
      progressoSegundos: number;
      completo: boolean;
      cartorioId: string;
    }) => {
      if (!client) throw new Error('Client not available');

      console.log('Updating progress (refactored):', { videoAulaId, progressoSegundos, completo, cartorioId });

      const { data, error } = await client
        .from('visualizacoes_cartorio')
        .upsert({
          video_aula_id: videoAulaId,
          cartorio_id: cartorioId,
          progresso_segundos: progressoSegundos,
          completo,
          ultima_visualizacao: new Date().toISOString()
        }, {
          onConflict: 'video_aula_id,cartorio_id'
        })
        .select();

      if (error) {
        console.error('Error updating progress (refactored):', error);
        throw error;
      }
      
      console.log('Progress updated successfully (refactored):', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visualizacoes-refactored'] });
    }
  });
};

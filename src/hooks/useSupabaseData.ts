import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
// Importa useAuth da versão FIXA
import { useAuth } from '@/contexts/AuthContextFixed'; 

export const useSistemas = () => {
  const { authenticatedClient, user } = useAuth();
  const client = user?.type === 'cartorio' ? authenticatedClient : supabase;
  
  return useQuery({
    queryKey: ['sistemas'],
    queryFn: async () => {
      if (!client) return [];
      
      console.log('Fetching sistemas with client type:', user?.type);
      
      const { data, error } = await client
        .from('sistemas')
        .select(`
          *,
          produtos (
            *,
            modulos (
              *,
              video_aulas (*)
            )
          )
        `)
        .order('ordem', { ascending: true });
      
      if (error) {
        console.error('Error fetching sistemas:', error);
        throw error;
      }
      
      console.log('Sistemas fetched successfully:', data);
      return data || [];
    },
    enabled: !!client,
    retry: 3,
    retryDelay: 1000
  });
};

export const useVideoAulas = (moduloId: string) => {
  const { authenticatedClient, user } = useAuth();
  const client = user?.type === 'cartorio' ? authenticatedClient : supabase;
  
  return useQuery({
    queryKey: ['video_aulas', moduloId],
    queryFn: async () => {
      if (!client) return [];
      
      const { data, error } = await client
        .from('video_aulas')
        .select('*')
        .eq('modulo_id', moduloId)
        .order('ordem', { ascending: true });
      
      if (error) {
        console.error('Error fetching video aulas:', error);
        throw error;
      }
      return data || [];
    },
    enabled: !!client && !!moduloId
  });
};

export const useVisualizacoes = (cartorioUsuarioId?: string) => {
  const { authenticatedClient, user } = useAuth();
  const client = user?.type === 'cartorio' ? authenticatedClient : supabase;
  
  return useQuery({
    queryKey: ['visualizacoes', cartorioUsuarioId],
    queryFn: async () => {
      if (!client) return [];
      
      let query = client
        .from('visualizacoes_cartorio')
        .select(`
          *,
          video_aulas (
            *,
            modulos (
              *,
              produtos (
                *,
                sistemas (*)
              )
            )
          )
        `)
        .order('ultima_visualizacao', { ascending: false });

      if (cartorioUsuarioId && user?.type === 'admin') {
        query = query.eq('cartorio_usuario_id', cartorioUsuarioId);
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

export const useFavoritos = (cartorioId: string) => {
  const { authenticatedClient, user } = useAuth();
  const client = user?.type === 'cartorio' ? authenticatedClient : supabase;
  
  return useQuery({
    queryKey: ['favoritos', cartorioId],
    queryFn: async () => {
      if (!client || !cartorioId) return [];
      
      const { data, error } = await client
        .from('favoritos_cartorio')
        .select(`
          *,
          video_aulas (
            *,
            modulos (
              *,
              produtos (
                *,
                sistemas (*)
              )
            )
          )
        `)
        .eq('cartorio_id', cartorioId)
        .order('data_favoritado', { ascending: false });
      
      if (error) {
        console.error('Error fetching favoritos:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!client && !!cartorioId
  });
};

export const useUpdateProgress = () => {
  const queryClient = useQueryClient();
  const { authenticatedClient, user } = useAuth();
  const client = user?.type === 'cartorio' ? authenticatedClient : supabase;

  return useMutation({
    mutationFn: async ({ videoAulaId, progressoSegundos, completo, cartorioUsuarioId }: {
      videoAulaId: string;
      progressoSegundos: number;
      completo: boolean;
      cartorioUsuarioId: string;
    }) => {
      if (!client) throw new Error('Client not available');

      const { data, error } = await client
        .from('visualizacoes_cartorio')
        .upsert({
          video_aula_id: videoAulaId,
          cartorio_usuario_id: cartorioUsuarioId,
          progresso_segundos: progressoSegundos,
          completo,
          ultima_visualizacao: new Date().toISOString()
        }, {
          onConflict: 'video_aula_id,cartorio_usuario_id'
        })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visualizacoes'] });
    }
  });
};
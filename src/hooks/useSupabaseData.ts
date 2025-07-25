import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContextFixed';
import type { Database } from '@/types/database';

type Sistema = Database['public']['Tables']['sistemas']['Row'] & {
  produtos?: Produto[];
};
type Produto = Database['public']['Tables']['produtos']['Row'] & {
  video_aulas?: VideoAula[];
};
type VideoAula = Database['public']['Tables']['video_aulas']['Row'];
type VisualizacaoCartorio = Database['public']['Tables']['visualizacoes_cartorio']['Row'];
type Favorito = Database['public']['Tables']['favoritos_cartorio']['Row'];

// Hook para sistemas
export const useSistemas = () => {
  const { authenticatedClient, user } = useAuth();
  const client = user?.type === 'cartorio' ? authenticatedClient : supabase;

  return useQuery<Sistema[]>({
    queryKey: ['sistemas'],
    queryFn: async () => {
      if (!client) return [];

      const { data, error } = await client
        .from('sistemas')
        .select(`
          *,
          produtos (
            *,
            video_aulas (*)
          )
        `)
        .order('ordem', { ascending: true });

      if (error) throw error;

      return data || [];
    },
    enabled: !!client,
    retry: 3,
    retryDelay: 1000,
  });
};

// Hook para video aulas de um produto
export const useVideoAulas = (produtoId?: string) => {
  const { authenticatedClient, user } = useAuth();
  const client = user?.type === 'cartorio' ? authenticatedClient : supabase;

  return useQuery<VideoAula[]>({
    queryKey: ['video_aulas', produtoId],
    queryFn: async () => {
      if (!client || !produtoId) return [];

      const { data, error } = await client
        .from('video_aulas')
        .select('*')
        .eq('produto_id', produtoId)
        .order('ordem', { ascending: true });

      if (error) throw error;

      return data || [];
    },
    enabled: !!client && !!produtoId,
  });
};

// Hook para visualizações
export const useVisualizacoes = (cartorioId?: string) => {
  const { authenticatedClient, user } = useAuth();
  const client = user?.type === 'cartorio' ? authenticatedClient : supabase;

  return useQuery<VisualizacaoCartorio[]>({
    queryKey: ['visualizacoes', cartorioId],
    queryFn: async () => {
      if (!client || !cartorioId) return [];

      const { data, error } = await client
        .from('visualizacoes_cartorio')
        .select('*')
        .eq('cartorio_id', cartorioId)
        .order('id', { ascending: false });

      if (error) throw error;

      return data || [];
    },
    enabled: !!client && !!cartorioId,
  });
};

// Hook para favoritos
export const useFavoritos = (cartorioId?: string) => {
  const { authenticatedClient, user } = useAuth();
  const client = user?.type === 'cartorio' ? authenticatedClient : supabase;

  return useQuery<Favorito[]>({
    queryKey: ['favoritos', cartorioId],
    queryFn: async () => {
      if (!client || !cartorioId) return [];

      const { data, error } = await client
        .from('favoritos_cartorio')
        .select('*')
        .eq('cartorio_id', cartorioId)
        .order('data_favoritado', { ascending: false });

      if (error) throw error;

      return data || [];
    },
    enabled: !!client && !!cartorioId,
  });
};

// Hook para atualizar progresso
export const useUpdateProgress = () => {
  const queryClient = useQueryClient();
  const { authenticatedClient, user } = useAuth();
  const client = user?.type === 'cartorio' ? authenticatedClient : supabase;

  return useMutation({
    mutationFn: async ({
      videoAulaId,
      completo,
      cartorioId,
      userId,
    }: {
      videoAulaId: string;
      completo: boolean;
      cartorioId: string;
      userId: string;
    }) => {
      if (!client) throw new Error('Client not available');

      const { data, error } = await client
        .from('visualizacoes_cartorio')
        .upsert(
          {
            video_aula_id: videoAulaId,
            cartorio_id: cartorioId,
            user_id: userId,
            completo,
          },
          { onConflict: 'video_aula_id,cartorio_id,user_id' }
        )
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visualizacoes'] });
    },
  });
};
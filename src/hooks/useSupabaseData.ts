
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useSistemas = () => {
  const { authenticatedClient, user } = useAuth();
  const client = user?.type === 'cartorio' ? authenticatedClient : supabase;
  
  return useQuery({
    queryKey: ['sistemas'],
    queryFn: async () => {
      if (!client) return [];
      
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
      return data || [];
    },
    enabled: !!client
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

export const useVisualizacoes = (cartorioId: string) => {
  const { authenticatedClient, user } = useAuth();
  const client = user?.type === 'cartorio' ? authenticatedClient : supabase;
  
  return useQuery({
    queryKey: ['visualizacoes', cartorioId],
    queryFn: async () => {
      if (!client || !cartorioId) return [];
      
      const { data, error } = await client
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
        .eq('cartorio_id', cartorioId)
        .order('ultima_visualizacao', { ascending: false });
      
      if (error) {
        console.error('Error fetching visualizacoes:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!client && !!cartorioId
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

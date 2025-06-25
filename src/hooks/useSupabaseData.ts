
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useSistemas = () => {
  return useQuery({
    queryKey: ['sistemas'],
    queryFn: async () => {
      const { data, error } = await supabase
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
      
      if (error) throw error;
      return data;
    }
  });
};

export const useVideoAulas = (moduloId: string) => {
  return useQuery({
    queryKey: ['video_aulas', moduloId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('video_aulas')
        .select('*')
        .eq('modulo_id', moduloId)
        .order('ordem', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });
};

export const useVisualizacoes = (cartorioId: string) => {
  return useQuery({
    queryKey: ['visualizacoes', cartorioId],
    queryFn: async () => {
      const { data, error } = await supabase
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
      
      if (error) throw error;
      return data;
    }
  });
};

export const useFavoritos = (cartorioId: string) => {
  return useQuery({
    queryKey: ['favoritos', cartorioId],
    queryFn: async () => {
      const { data, error } = await supabase
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
      
      if (error) throw error;
      return data;
    }
  });
};

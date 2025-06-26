
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useSistemasFixed = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['sistemas-fixed'],
    queryFn: async () => {
      console.log('Fetching sistemas - user type:', user?.type);
      
      // Sempre usar o client padrão para buscar sistemas
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
      
      if (error) {
        console.error('Error fetching sistemas:', error);
        throw error;
      }
      
      console.log('Sistemas fetched successfully:', data);
      return data || [];
    },
    retry: 3,
    retryDelay: 1000
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

export const useCreateSistema = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sistemaData: { nome: string; descricao?: string; ordem: number }) => {
      const { data, error } = await supabase
        .from('sistemas')
        .insert(sistemaData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sistemas-fixed'] });
    }
  });
};

export const useUpdateSistema = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; nome?: string; descricao?: string; ordem?: number }) => {
      const { data, error } = await supabase
        .from('sistemas')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sistemas-fixed'] });
    }
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
      queryClient.invalidateQueries({ queryKey: ['sistemas-fixed'] });
    }
  });
};

export const useCreateProduto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (produtoData: { nome: string; descricao?: string; sistema_id: string; ordem: number }) => {
      // Criar produto
      const { data: produto, error: produtoError } = await supabase
        .from('produtos')
        .insert(produtoData)
        .select()
        .single();

      if (produtoError) throw produtoError;

      // Criar módulo padrão para o produto
      const { error: moduloError } = await supabase
        .from('modulos')
        .insert({
          titulo: `Módulo ${produto.nome}`,
          descricao: `Módulo principal do produto ${produto.nome}`,
          produto_id: produto.id,
          ordem: 1
        });

      if (moduloError) throw moduloError;

      return produto;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sistemas-fixed'] });
    }
  });
};

export const useUpdateProduto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; nome?: string; descricao?: string; ordem?: number }) => {
      const { data, error } = await supabase
        .from('produtos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sistemas-fixed'] });
    }
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
      queryClient.invalidateQueries({ queryKey: ['sistemas-fixed'] });
    }
  });
};

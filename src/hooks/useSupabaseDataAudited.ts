import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
// Importa useAuth da versão FIXA
import { useAuth } from '@/contexts/AuthContextFixed'; 
import { toast } from '@/hooks/use-toast';

// Interfaces padronizadas
interface Sistema {
  id: string;
  nome: string;
  descricao?: string;
  ordem: number;
}

interface Produto {
  id: string;
  nome: string;
  descricao?: string;
  sistema_id: string;
  ordem: number;
}

interface VideoAula {
  id: string;
  titulo: string;
  descricao?: string;
  url_video: string;
  id_video_bunny?: string;
  ordem: number;
  produto_id?: string;
  url_thumbnail?: string;
}

interface SistemaComplete extends Sistema {
  produtos: (Produto & {
    video_aulas: VideoAula[];
  })[];
}

// Hook principal para sistemas com dados completos
export const useSistemasAudited = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['sistemas-audited'],
    queryFn: async () => {
      console.log('🔍 [useSistemasAudited] Starting fetch - user type:', user?.type);
      
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
              nome,
              descricao,
              sistema_id,
              ordem,
              video_aulas (
                id,
                titulo,
                descricao,
                url_video,
                id_video_bunny,
                ordem,
                produto_id,
                url_thumbnail
              )
            )
          `)
          .order('ordem', { ascending: true });

        if (error) {
          console.error('❌ [useSistemasAudited] Error fetching sistemas:', error);
          throw error;
        }

        // Ordenar produtos e videoaulas
        const sistemasOrdenados = sistemas?.map(sistema => ({
          ...sistema,
          produtos: sistema.produtos
            ?.sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
            .map(produto => ({
              ...produto,
              video_aulas: produto.video_aulas
                ?.sort((a, b) => (a.ordem || 0) - (b.ordem || 0)) || []
            })) || []
        })) || [];

        console.log('✅ [useSistemasAudited] Successfully fetched', sistemasOrdenados.length, 'sistemas');
        console.log('📊 [useSistemasAudited] Data summary:', {
          totalSistemas: sistemasOrdenados.length,
          totalProdutos: sistemasOrdenados.reduce((acc, s) => acc + s.produtos.length, 0),
          totalVideoAulas: sistemasOrdenados.reduce((acc, s) => 
            acc + s.produtos.reduce((acc2, p) => acc2 + p.video_aulas.length, 0), 0
          )
        });

        return sistemasOrdenados as SistemaComplete[];
      } catch (error) {
        console.error('💥 [useSistemasAudited] Fatal error:', error);
        throw error;
      }
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
};

// Hook específico para produtos de um sistema
export const useProdutosBySystem = (sistemaId: string) => {
  return useQuery({
    queryKey: ['produtos-by-system', sistemaId],
    queryFn: async () => {
      if (!sistemaId) return [];

      console.log('🔍 [useProdutosBySystem] Fetching produtos for sistema:', sistemaId);

      const { data: produtos, error } = await supabase
        .from('produtos')
        .select(`
          id,
          nome,
          descricao,
          sistema_id,
          ordem,
          video_aulas (
            id,
            titulo,
            descricao,
            url_video,
            id_video_bunny,
            ordem,
            produto_id,
            url_thumbnail
          )
        `)
        .eq('sistema_id', sistemaId)
        .order('ordem', { ascending: true });

      if (error) {
        console.error('❌ [useProdutosBySystem] Error:', error);
        throw error;
      }

      const produtosOrdenados = produtos?.map(produto => ({
        ...produto,
        video_aulas: produto.video_aulas
          ?.sort((a, b) => (a.ordem || 0) - (b.ordem || 0)) || []
      })) || [];

      console.log('✅ [useProdutosBySystem] Found', produtosOrdenados.length, 'produtos');
      return produtosOrdenados;
    },
    enabled: !!sistemaId,
    staleTime: 5 * 60 * 1000,
  });
};

// Hook para videoaulas de um produto
export const useVideoAulasByProduct = (produtoId: string) => {
  return useQuery({
    queryKey: ['video-aulas-by-product', produtoId],
    queryFn: async () => {
      if (!produtoId) return [];

      console.log('🔍 [useVideoAulasByProduct] Fetching videoaulas for produto:', produtoId);

      const { data: videoAulas, error } = await supabase
        .from('video_aulas')
        .select('*')
        .eq('produto_id', produtoId)
        .order('ordem', { ascending: true });

      if (error) {
        console.error('❌ [useVideoAulasByProduct] Error:', error);
        throw error;
      }

      console.log('✅ [useVideoAulasByProduct] Found', videoAulas?.length || 0, 'videoaulas');
      return videoAulas || [];
    },
    enabled: !!produtoId,
    staleTime: 5 * 60 * 1000,
  });
};

// Mutations padronizadas com tratamento de erro robusto
export const useCreateSistema = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { nome: string; descricao?: string; ordem: number }) => {
      console.log('🔧 [useCreateSistema] Creating sistema:', data);

      const { data: sistema, error } = await supabase
        .from('sistemas')
        .insert({
          nome: data.nome.trim(),
          descricao: data.descricao?.trim() || null,
          ordem: data.ordem
        })
        .select()
        .single();

      if (error) {
        console.error('❌ [useCreateSistema] Error:', error);
        throw error;
      }

      console.log('✅ [useCreateSistema] Sistema created:', sistema);
      return sistema;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sistemas-audited'] });
      toast({
        title: "Sistema criado",
        description: `O sistema "${data.nome}" foi criado com sucesso.`,
      });
    },
    onError: (error) => {
      console.error('💥 [useCreateSistema] Mutation error:', error);
      toast({
        title: "Erro ao criar sistema",
        description: "Ocorreu um erro ao criar o sistema.",
        variant: "destructive",
      });
    }
  });
};

export const useUpdateSistema = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; nome?: string; descricao?: string; ordem?: number }) => {
      console.log('🔧 [useUpdateSistema] Updating sistema:', id, updates);

      const updateData: any = {};
      if (updates.nome) updateData.nome = updates.nome.trim();
      if (updates.descricao !== undefined) updateData.descricao = updates.descricao?.trim() || null;
      if (updates.ordem !== undefined) updateData.ordem = updates.ordem;

      const { data: sistema, error } = await supabase
        .from('sistemas')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ [useUpdateSistema] Error:', error);
        throw error;
      }

      console.log('✅ [useUpdateSistema] Sistema updated:', sistema);
      return sistema;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sistemas-audited'] });
      toast({
        title: "Sistema atualizado",
        description: `O sistema "${data.nome}" foi atualizado com sucesso.`,
      });
    },
    onError: (error) => {
      console.error('💥 [useUpdateSistema] Mutation error:', error);
      toast({
        title: "Erro ao atualizar sistema",
        description: "Ocorreu um erro ao atualizar o sistema.",
        variant: "destructive",
      });
    }
  });
};

export const useDeleteSistema = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      console.log('🔧 [useDeleteSistema] Deleting sistema:', id);

      const { error } = await supabase
        .from('sistemas')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ [useDeleteSistema] Error:', error);
        throw error;
      }

      console.log('✅ [useDeleteSistema] Sistema deleted:', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sistemas-audited'] });
      queryClient.invalidateQueries({ queryKey: ['produtos-by-system'] });
      toast({
        title: "Sistema excluído",
        description: "O sistema foi excluído com sucesso.",
      });
    },
    onError: (error) => {
      console.error('💥 [useDeleteSistema] Mutation error:', error);
      toast({
        title: "Erro ao excluir sistema",
        description: "Ocorreu um erro ao excluir o sistema.",
        variant: "destructive",
      });
    }
  });
};

export const useCreateProduto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { nome: string; descricao?: string; sistema_id: string; ordem: number }) => {
      console.log('🔧 [useCreateProduto] Creating produto:', data);

      const { data: produto, error } = await supabase
        .from('produtos')
        .insert({
          nome: data.nome.trim(),
          descricao: data.descricao?.trim() || null,
          sistema_id: data.sistema_id,
          ordem: data.ordem
        })
        .select()
        .single();

      if (error) {
        console.error('❌ [useCreateProduto] Error:', error);
        throw error;
      }

      console.log('✅ [useCreateProduto] Produto created:', produto);
      return produto;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sistemas-audited'] });
      queryClient.invalidateQueries({ queryKey: ['produtos-by-system'] });
      toast({
        title: "Produto criado",
        description: `O produto "${data.nome}" foi criado com sucesso.`,
      });
    },
    onError: (error) => {
      console.error('💥 [useCreateProduto] Mutation error:', error);
      toast({
        title: "Erro ao criar produto",
        description: "Ocorreu um erro ao criar o produto.",
        variant: "destructive",
      });
    }
  });
};

export const useUpdateProduto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; nome?: string; descricao?: string; ordem?: number }) => {
      console.log('🔧 [useUpdateProduto] Updating produto:', id, updates);

      const updateData: any = {};
      if (updates.nome) updateData.nome = updates.nome.trim();
      if (updates.descricao !== undefined) updateData.descricao = updates.descricao?.trim() || null;
      if (updates.ordem !== undefined) updateData.ordem = updates.ordem;

      const { data: produto, error } = await supabase
        .from('produtos')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ [useUpdateProduto] Error:', error);
        throw error;
      }

      console.log('✅ [useUpdateProduto] Produto updated:', produto);
      return produto;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sistemas-audited'] });
      queryClient.invalidateQueries({ queryKey: ['produtos-by-system'] });
      toast({
        title: "Produto atualizado",
        description: `O produto "${data.nome}" foi atualizado com sucesso.`,
      });
    },
    onError: (error) => {
      console.error('💥 [useUpdateProduto] Mutation error:', error);
      toast({
        title: "Erro ao atualizar produto",
        description: "Ocorreu um erro ao atualizar o produto.",
        variant: "destructive",
      });
    }
  });
};

export const useDeleteProduto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      console.log('🔧 [useDeleteProduto] Deleting produto:', id);

      const { error } = await supabase
        .from('produtos')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ [useDeleteProduto] Error:', error);
        throw error;
      }

      console.log('✅ [useDeleteProduto] Produto deleted:', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sistemas-audited'] });
      queryClient.invalidateQueries({ queryKey: ['produtos-by-system'] });
      queryClient.invalidateQueries({ queryKey: ['video-aulas-by-product'] });
      toast({
        title: "Produto excluído",
        description: "O produto foi excluído com sucesso.",
      });
    },
    onError: (error) => {
      console.error('💥 [useDeleteProduto] Mutation error:', error);
      toast({
        title: "Erro ao excluir produto",
        description: "Ocorreu um erro ao excluir o produto.",
        variant: "destructive",
      });
    }
  });
};

export const useCreateVideoAula = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { 
      titulo: string; 
      descricao?: string; 
      produto_id: string; 
      ordem: number;
      url_video?: string;
      id_video_bunny?: string;
      url_thumbnail?: string;
    }) => {
      console.log('🔧 [useCreateVideoAula] Creating videoaula:', data);

      const { data: videoAula, error } = await supabase
        .from('video_aulas')
        .insert({
          titulo: data.titulo.trim(),
          descricao: data.descricao?.trim() || null,
          produto_id: data.produto_id,
          ordem: data.ordem,
          url_video: data.url_video?.trim() || '',
          id_video_bunny: data.id_video_bunny?.trim() || null,
          url_thumbnail: data.url_thumbnail?.trim() || null
        })
        .select()
        .single();

      if (error) {
        console.error('❌ [useCreateVideoAula] Error:', error);
        throw error;
      }

      console.log('✅ [useCreateVideoAula] VideoAula created:', videoAula);
      return videoAula;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sistemas-audited'] });
      queryClient.invalidateQueries({ queryKey: ['video-aulas-by-product'] });
      toast({
        title: "Videoaula criada",
        description: `A videoaula "${data.titulo}" foi criada com sucesso.`,
      });
    },
    onError: (error) => {
      console.error('💥 [useCreateVideoAula] Mutation error:', error);
      toast({
        title: "Erro ao criar videoaula",
        description: "Ocorreu um erro ao criar a videoaula.",
        variant: "destructive",
      });
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
      console.log('🔧 [useUpdateVideoAula] Updating videoaula:', id, updates);

      const updateData: any = {};
      if (updates.titulo) updateData.titulo = updates.titulo.trim();
      if (updates.descricao !== undefined) updateData.descricao = updates.descricao?.trim() || null;
      if (updates.ordem !== undefined) updateData.ordem = updates.ordem;
      if (updates.url_video !== undefined) updateData.url_video = updates.url_video?.trim() || '';
      if (updates.id_video_bunny !== undefined) updateData.id_video_bunny = updates.id_video_bunny?.trim() || null;
      if (updates.url_thumbnail !== undefined) updateData.url_thumbnail = updates.url_thumbnail?.trim() || null;

      const { data: videoAula, error } = await supabase
        .from('video_aulas')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ [useUpdateVideoAula] Error:', error);
        throw error;
      }

      console.log('✅ [useUpdateVideoAula] VideoAula updated:', videoAula);
      return videoAula;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sistemas-audited'] });
      queryClient.invalidateQueries({ queryKey: ['video-aulas-by-product'] });
      toast({
        title: "Videoaula atualizada",
        description: `A videoaula "${data.titulo}" foi atualizada com sucesso.`,
      });
    },
    onError: (error) => {
      console.error('💥 [useUpdateVideoAula] Mutation error:', error);
      toast({
        title: "Erro ao atualizar videoaula",
        description: "Ocorreu um erro ao atualizar a videoaula.",
        variant: "destructive",
      });
    }
  });
};

export const useDeleteVideoAula = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      console.log('🔧 [useDeleteVideoAula] Deleting videoaula:', id);

      const { error } = await supabase
        .from('video_aulas')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ [useDeleteVideoAula] Error:', error);
        throw error;
      }

      console.log('✅ [useDeleteVideoAula] VideoAula deleted:', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sistemas-audited'] });
      queryClient.invalidateQueries({ queryKey: ['video-aulas-by-product'] });
      toast({
        title: "Videoaula excluída",
        description: "O videoaula foi excluída com sucesso.",
      });
    },
    onError: (error) => {
      console.error('💥 [useDeleteVideoAula] Mutation error:', error);
      toast({
        title: "Erro ao excluir videoaula",
        description: "Ocorreu um erro ao excluir a videoaula.",
        variant: "destructive",
      });
    }
  });
};
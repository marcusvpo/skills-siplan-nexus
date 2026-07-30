import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
// Importa useAuth da versão FIXA
import { useAuth } from '@/contexts/AuthContextFixed'; 
import { logger } from '@/utils/logger';
import { toast } from '@/hooks/use-toast';

export const useSistemasWithVideoAulas = () => {
  return useQuery({
    queryKey: ['sistemas-with-video-aulas'],
    queryFn: async () => {
      logger.info('🔍 [useSistemasWithVideoAulas] Fetching sistemas with video aulas');
      
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
        logger.error('❌ [useSistemasWithVideoAulas] Error:', error);
        throw error;
      }
      
      logger.info('✅ [useSistemasWithVideoAulas] Success:', { count: data?.length });
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
      
      logger.info('🔍 [useVideoAulasByProduto] Fetching video aulas for produto:', { produtoId });
      
      const { data, error } = await supabase
        .from('video_aulas')
        .select('*')
        .eq('produto_id', produtoId)
        .order('ordem', { ascending: true });
      
      if (error) {
        logger.error('❌ [useVideoAulasByProduto] Error:', error);
        throw error;
      }
      
      logger.info('✅ [useVideoAulasByProduto] Success:', { count: data?.length });
      return data || [];
    },
    enabled: !!produtoId,
    retry: 3,
    retryDelay: 1000
  });
};

export const useCartoriosWithAcessos = () => {
  return useQuery({
    queryKey: ['cartorios-with-acessos'],
    queryFn: async () => {
      logger.info('🔍 [useCartoriosWithAcessos] Fetching cartorios with acessos');
      
      const { data, error } = await supabase
        .from('cartorios')
        .select(`
          *,
          acessos_cartorio (*),
          cartorio_usuarios (id, username, email, is_active)
        `)
        .order('nome', { ascending: true });
      
      if (error) {
        logger.error('❌ [useCartoriosWithAcessos] Error:', error);
        throw error;
      }
      
      logger.info('✅ [useCartoriosWithAcessos] Success:', { count: data?.length });
      return data || [];
    },
    retry: 3,
    retryDelay: 1000
  });
};

export const useCreateCartorio = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cartorioData: {
      nome: string;
      cidade?: string;
      estado?: string;
      observacoes?: string;
      data_expiracao: string;
    }) => {
      logger.info('🏗️ [useCreateCartorio] Creating cartorio:', { 
        nome: cartorioData.nome,
        data_expiracao: cartorioData.data_expiracao
      });
      
      try {
        // Validar campos obrigatórios
        if (!cartorioData.nome || !cartorioData.data_expiracao) {
          throw new Error('Campos obrigatórios não preenchidos: nome, data_expiracao');
        }

        // 1. Criar o cartório
        const { data: cartorio, error: cartorioError } = await supabase
          .from('cartorios')
          .insert({
            nome: cartorioData.nome.trim(),
            cidade: cartorioData.cidade?.trim() || null,
            estado: cartorioData.estado?.trim() || 'SP',
            observacoes: cartorioData.observacoes?.trim() || null,
            is_active: true
          })
          .select()
          .single();

        if (cartorioError) {
          logger.error('❌ [useCreateCartorio] Error creating cartorio:', cartorioError);
          throw new Error(`Erro ao criar cartório: ${cartorioError.message}`);
        }

        logger.info('✅ [useCreateCartorio] Cartorio created:', { id: cartorio.id });

        // 2. Gerar token único (formato simples e seguro)
        const timestamp = Date.now().toString();
        const randomNum = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
        const login_token = `CART${timestamp.slice(-8)}${randomNum}`;

        logger.info('🔑 [useCreateCartorio] Generated token:', { login_token });

        // 3. Criar acesso do cartório
        const { data: acesso, error: acessoError } = await supabase
          .from('acessos_cartorio')
          .insert({
            login_token,
            cartorio_id: cartorio.id,
            data_expiracao: cartorioData.data_expiracao,
            ativo: true
          })
          .select()
          .single();

        if (acessoError) {
          logger.error('❌ [useCreateCartorio] Error creating acesso:', acessoError);
          
          // Limpar cartório criado em caso de erro no acesso
          await supabase.from('cartorios').delete().eq('id', cartorio.id);
          
          throw new Error(`Erro ao criar acesso do cartório: ${acessoError.message}`);
        }

        logger.info('✅ [useCreateCartorio] Acesso created:', { token: login_token });

        // 4. Criar usuário padrão "admin" para o cartório (sem email)
        const { error: usuarioError } = await supabase
          .from('cartorio_usuarios')
          .insert({
            cartorio_id: cartorio.id,
            username: 'admin',
            is_active: true
          });

        if (usuarioError) {
          logger.warn('⚠️ [useCreateCartorio] Warning creating default user:', usuarioError);
          // Não falhar por causa do usuário padrão, mas logar o aviso
        }

        logger.info('✅ [useCreateCartorio] Cartorio creation completed successfully');

        return {
          cartorio,
          acesso,
          login_token
        };

      } catch (error) {
        logger.error('❌ [useCreateCartorio] Unexpected error:', error);
        
        // Re-throw com mensagem mais amigável
        if (error instanceof Error) {
          throw error;
        } else {
          throw new Error('Erro desconhecido ao criar cartório. Tente novamente.');
        }
      }
    },
    onSuccess: (data) => {
      logger.info('🎉 [useCreateCartorio] Success callback:', { cartorioId: data.cartorio.id });
      queryClient.invalidateQueries({ queryKey: ['cartorios-with-acessos'] });
      
      toast({
        title: "Cartório criado com sucesso!",
        description: `Token gerado: ${data.login_token}`,
      });
    },
    onError: (error) => {
      logger.error('💥 [useCreateCartorio] Error callback:', error);
      
      toast({
        title: "Erro ao criar cartório",
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: "destructive",
      });
    }
  });
};

export const useCreateSistema = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sistemaData: { nome: string; descricao?: string; ordem: number }) => {
      logger.info('🏗️ [useCreateSistema] Creating sistema:', { nome: sistemaData.nome });
      
      const { data, error } = await supabase
        .from('sistemas')
        .insert(sistemaData)
        .select()
        .single();

      if (error) {
        logger.error('❌ [useCreateSistema] Error:', error);
        throw error;
      }
      
      logger.info('✅ [useCreateSistema] Success:', { id: data.id });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sistemas-with-video-aulas'] });
    }
  });
};

export const useUpdateSistema = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; nome?: string; descricao?: string; ordem?: number }) => {
      logger.info('🔄 [useUpdateSistema] Updating sistema:', { id, updates });
      
      const { data, error } = await supabase
        .from('sistemas')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('❌ [useUpdateSistema] Error:', error);
        throw error;
      }
      
      logger.info('✅ [useUpdateSistema] Success:', { id: data.id });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sistemas-with-video-aulas'] });
    }
  });
};

export const useDeleteSistema = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      logger.info('🗑️ [useDeleteSistema] Deleting sistema:', { id });
      
      const { error } = await supabase
        .from('sistemas')
        .delete()
        .eq('id', id);

      if (error) {
        logger.error('❌ [useDeleteSistema] Error:', error);
        throw error;
      }
      
      logger.info('✅ [useDeleteSistema] Success:', { id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sistemas-with-video-aulas'] });
    }
  });
};

export const useCreateProduto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (produtoData: { nome: string; descricao?: string; sistema_id: string; ordem: number }) => {
      logger.info('🏗️ [useCreateProduto] Creating produto:', { nome: produtoData.nome });
      
      const { data, error } = await supabase
        .from('produtos')
        .insert(produtoData)
        .select()
        .single();

      if (error) {
        logger.error('❌ [useCreateProduto] Error:', error);
        throw error;
      }
      
      logger.info('✅ [useCreateProduto] Success:', { id: data.id });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sistemas-with-video-aulas'] });
    }
  });
};

export const useUpdateProduto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; nome?: string; descricao?: string; ordem?: number }) => {
      logger.info('🔄 [useUpdateProduto] Updating produto:', { id, updates });
      
      const { data, error } = await supabase
        .from('produtos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('❌ [useUpdateProduto] Error:', error);
        throw error;
      }
      
      logger.info('✅ [useUpdateProduto] Success:', { id: data.id });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sistemas-with-video-aulas'] });
    }
  });
};

export const useDeleteProduto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      logger.info('🗑️ [useDeleteProduto] Deleting produto:', { id });
      
      const { error } = await supabase
        .from('produtos')
        .delete()
        .eq('id', id);

      if (error) {
        logger.error('❌ [useDeleteProduto] Error:', error);
        throw error;
      }
      
      logger.info('✅ [useDeleteProduto] Success:', { id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sistemas-with-video-aulas'] });
    }
  });
};

export const useCreateVideoAula = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (videoAulaData: { 
      titulo: string; 
      descricao?: string; 
      url_video: string;
      produto_id: string; 
      ordem: number;
      id_video_bunny?: string;
      url_thumbnail?: string;
    }) => {
      logger.info('🏗️ [useCreateVideoAula] Creating video aula:', { titulo: videoAulaData.titulo });
      const { data, error } = await supabase
        .from('video_aulas')
        .insert(videoAulaData)
        .select()
        .single();

      if (error) {
        logger.error('❌ [useCreateVideoAula] Error:', error);
        throw error;
      }
      
      logger.info('✅ [useCreateVideoAula] Success:', { id: data.id });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sistemas-with-video-aulas'] });
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
      url_video?: string;
      ordem?: number;
      id_video_bunny?: string;
      url_thumbnail?: string;
    }) => {
      logger.info('🔄 [useUpdateVideoAula] Updating video aula:', { id, updates });
      
      const { data, error } = await supabase
        .from('video_aulas')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('❌ [useUpdateVideoAula] Error:', error);
        throw error;
      }
      
      logger.info('✅ [useUpdateVideoAula] Success:', { id: data.id });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sistemas-with-video-aulas'] });
      queryClient.invalidateQueries({ queryKey: ['video-aulas-by-produto'] });
    }
  });
};

export const useDeleteVideoAula = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      logger.info('🗑️ [useDeleteVideoAula] Deleting video aula:', { id });
      
      const { error } = await supabase
        .from('video_aulas')
        .delete()
        .eq('id', id);

      if (error) {
        logger.error('❌ [useDeleteVideoAula] Error:', error);
        throw error;
      }
      
      logger.info('✅ [useDeleteVideoAula] Success:', { id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sistemas-with-video-aulas'] });
      queryClient.invalidateQueries({ queryKey: ['video-aulas-by-produto'] });
    }
  });
};

export const useVideoAulaData = (videoId: string) => {
  return useQuery({
    queryKey: ['video-aula', videoId],
    queryFn: async () => {
      if (!videoId) throw new Error('Video ID is required');
      
      logger.info('🔍 [useVideoAulaData] Fetching video aula:', { videoId });
      
      const { data, error } = await supabase
        .from('video_aulas')
        .select(`
          *,
          produtos (
            *,
            sistemas (*)
          )
        `)
        .eq('id', videoId)
        .single();
      
      if (error) {
        logger.error('❌ [useVideoAulaData] Error:', error);
        throw error;
      }
      
      logger.info('✅ [useVideoAulaData] Success');
      return data;
    },
    enabled: !!videoId,
    retry: 3,
    retryDelay: 1000
  });
};

export const useCartorioAccess = () => {
  const queryClient = useQueryClient();

  const getCartorioAccess = (cartorioId: string) => {
    return useQuery({
      queryKey: ['cartorio-access', cartorioId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('cartorio_acesso_conteudo')
          .select('*')
          .eq('cartorio_id', cartorioId)
          .eq('ativo', true);
        
        if (error) throw error;
        return data || [];
      },
      enabled: !!cartorioId
    });
  };

  const grantAccess = useMutation({
    mutationFn: async ({ cartorioId, sistemaId, produtoId }: {
      cartorioId: string;
      sistemaId: string;
      produtoId?: string;
    }) => {
      const { data, error } = await supabase
        .from('cartorio_acesso_conteudo')
        .insert({
          cartorio_id: cartorioId,
          sistema_id: sistemaId,
          produto_id: produtoId || null,
          ativo: true,
          nivel_acesso: 'completo'
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cartorio-access'] });
      toast({ title: "Acesso concedido com sucesso" });
    },
    onError: (error) => {
      toast({ 
        title: "Erro ao conceder acesso", 
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: "destructive" 
      });
    }
  });

  const revokeAccess = useMutation({
    mutationFn: async (accessId: string) => {
      const { error } = await supabase
        .from('cartorio_acesso_conteudo')
        .delete()
        .eq('id', accessId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cartorio-access'] });
      toast({ title: "Acesso revogado com sucesso" });
    },
    onError: (error) => {
      toast({ 
        title: "Erro ao revogar acesso", 
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: "destructive" 
      });
    }
  });

  return { getCartorioAccess, grantAccess, revokeAccess };
};
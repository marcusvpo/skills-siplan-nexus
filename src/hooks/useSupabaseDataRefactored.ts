
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';

// Interfaces para tipagem robusta
interface Sistema {
  id: string;
  nome: string;
  descricao?: string;
  ordem: number;
  produtos?: Produto[];
}

interface Produto {
  id: string;
  nome: string;
  descricao?: string;
  sistema_id: string;
  ordem: number;
  video_aulas?: VideoAula[];
}

interface VideoAula {
  id: string;
  titulo: string;
  descricao?: string;
  url_video: string;
  id_video_bunny?: string;
  url_thumbnail?: string;
  ordem: number;
  produto_id: string;
}

interface Cartorio {
  id: string;
  nome: string;
  cidade?: string;
  estado?: string;
  is_active: boolean;
  data_cadastro: string;
  observacoes?: string;
  acessos_cartorio?: AcessoCartorio[];
}

interface AcessoCartorio {
  id: string;
  login_token: string;
  cartorio_id: string;
  data_expiracao: string;
  email_contato: string;
  ativo: boolean;
  data_criacao: string;
}

// Hook para buscar sistemas com hierarquia completa - CORRIGIDO para resolver ambiguidade
export const useSistemasWithVideoAulas = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['sistemas-hierarchical'],
    queryFn: async (): Promise<Sistema[]> => {
      logger.info('🔍 Iniciando busca hierárquica de sistemas', { userType: user?.type });
      
      try {
        // Primeiro, buscar todos os sistemas
        const { data: sistemas, error: sistemasError } = await supabase
          .from('sistemas')
          .select('id, nome, descricao, ordem')
          .order('ordem', { ascending: true });
        
        if (sistemasError) {
          logger.error('❌ Erro ao buscar sistemas', sistemasError);
          throw sistemasError;
        }
        
        logger.info(`✅ Encontrados ${sistemas?.length || 0} sistemas`);
        
        if (!sistemas || sistemas.length === 0) {
          return [];
        }
        
        // Para cada sistema, buscar seus produtos usando foreign key explícita
        const sistemasComProdutos = await Promise.all(
          sistemas.map(async (sistema) => {
            const { data: produtos, error: produtosError } = await supabase
              .from('produtos')
              .select('id, nome, descricao, ordem, sistema_id')
              .eq('sistema_id', sistema.id)
              .order('ordem', { ascending: true });
            
            if (produtosError) {
              logger.error(`❌ Erro ao buscar produtos do sistema ${sistema.nome}`, produtosError);
              return { ...sistema, produtos: [] };
            }
            
            logger.info(`📦 Sistema "${sistema.nome}": ${produtos?.length || 0} produtos`);
            
            // Para cada produto, buscar suas videoaulas
            const produtosComVideoAulas = await Promise.all(
              (produtos || []).map(async (produto) => {
                const { data: videoAulas, error: videoAulasError } = await supabase
                  .from('video_aulas')
                  .select('id, titulo, descricao, url_video, url_thumbnail, ordem, produto_id, id_video_bunny')
                  .eq('produto_id', produto.id)
                  .order('ordem', { ascending: true });
                
                if (videoAulasError) {
                  logger.error(`❌ Erro ao buscar videoaulas do produto ${produto.nome}`, videoAulasError);
                  return { ...produto, video_aulas: [] };
                }
                
                logger.info(`🎥 Produto "${produto.nome}": ${videoAulas?.length || 0} videoaulas`);
                
                return {
                  ...produto,
                  video_aulas: videoAulas || []
                };
              })
            );
            
            return {
              ...sistema,
              produtos: produtosComVideoAulas
            };
          })
        );
        
        logger.info('🎯 Hierarquia completa carregada com sucesso');
        return sistemasComProdutos;
        
      } catch (error) {
        logger.error('💥 Exceção ao carregar hierarquia de sistemas', error);
        throw error;
      }
    },
    retry: 3,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

// Hook para buscar cartórios com acessos - CORRIGIDO para RLS
export const useCartoriosWithAcessos = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['cartorios-with-acessos'],
    queryFn: async (): Promise<Cartorio[]> => {
      logger.info('🏢 Iniciando busca de cartórios', { userType: user?.type });
      
      try {
        // Buscar cartórios primeiro
        const { data: cartorios, error: cartoriosError } = await supabase
          .from('cartorios')
          .select('*')
          .order('nome', { ascending: true });
        
        if (cartoriosError) {
          logger.error('❌ Erro ao buscar cartórios', cartoriosError);
          throw cartoriosError;
        }
        
        logger.info(`✅ Encontrados ${cartorios?.length || 0} cartórios`);
        
        if (!cartorios || cartorios.length === 0) {
          return [];
        }
        
        // Para cada cartório, buscar seus acessos
        const cartoriosComAcessos = await Promise.all(
          cartorios.map(async (cartorio) => {
            const { data: acessos, error: acessosError } = await supabase
              .from('acessos_cartorio')
              .select('*')
              .eq('cartorio_id', cartorio.id)
              .order('data_criacao', { ascending: false });
            
            if (acessosError) {
              logger.error(`❌ Erro ao buscar acessos do cartório ${cartorio.nome}`, acessosError);
              return { ...cartorio, acessos_cartorio: [] };
            }
            
            logger.info(`🔑 Cartório "${cartorio.nome}": ${acessos?.length || 0} acessos`);
            
            return {
              ...cartorio,
              acessos_cartorio: acessos || []
            };
          })
        );
        
        logger.info('🎯 Cartórios com acessos carregados com sucesso');
        return cartoriosComAcessos;
        
      } catch (error) {
        logger.error('💥 Exceção ao carregar cartórios', error);
        throw error;
      }
    },
    retry: 3,
    retryDelay: 1000,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
};

// Hook para buscar videoaulas por produto
export const useVideoAulasByProduto = (produtoId: string) => {
  return useQuery({
    queryKey: ['video-aulas-by-produto', produtoId],
    queryFn: async (): Promise<VideoAula[]> => {
      if (!produtoId) {
        logger.info('🎥 ID do produto não fornecido');
        return [];
      }
      
      logger.info('🎥 Buscando videoaulas do produto', { produtoId });
      
      try {
        const { data, error } = await supabase
          .from('video_aulas')
          .select('*')
          .eq('produto_id', produtoId)
          .order('ordem', { ascending: true });
        
        if (error) {
          logger.error('❌ Erro ao buscar videoaulas', error);
          throw error;
        }
        
        logger.info(`✅ Encontradas ${data?.length || 0} videoaulas`);
        return data || [];
      } catch (error) {
        logger.error('💥 Exceção ao buscar videoaulas', error);
        throw error;
      }
    },
    enabled: !!produtoId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

// Hook para criar videoaula - CORRIGIDO para evitar carregamento infinito
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
    }): Promise<VideoAula> => {
      logger.info('🔧 Iniciando criação de videoaula', { titulo: videoAulaData.titulo });
      
      try {
        // Garantir que url_video tenha um valor padrão se não fornecido
        const dataToInsert = {
          titulo: videoAulaData.titulo.trim(),
          descricao: videoAulaData.descricao?.trim() || null,
          produto_id: videoAulaData.produto_id,
          ordem: videoAulaData.ordem || 1,
          url_video: videoAulaData.url_video?.trim() || '',
          id_video_bunny: videoAulaData.id_video_bunny?.trim() || null,
          url_thumbnail: videoAulaData.url_thumbnail?.trim() || null
        };

        logger.info('📝 Dados para inserção', dataToInsert);

        const { data, error } = await supabase
          .from('video_aulas')
          .insert(dataToInsert)
          .select()
          .single();

        if (error) {
          logger.error('❌ Erro ao inserir videoaula', error);
          throw error;
        }

        if (!data) {
          throw new Error('Nenhum dado retornado após inserção');
        }

        logger.info('✅ Videoaula criada com sucesso', { id: data.id, titulo: data.titulo });
        return data;
      } catch (error) {
        logger.error('💥 Exceção ao criar videoaula', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      logger.info('🎯 Invalidando caches após criação de videoaula');
      queryClient.invalidateQueries({ queryKey: ['sistemas-hierarchical'] });
      queryClient.invalidateQueries({ queryKey: ['video-aulas-by-produto', data.produto_id] });
    },
    onError: (error) => {
      logger.error('❌ Erro na mutação de criação de videoaula', error);
    }
  });
};

// Hook para atualizar videoaula
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
    }): Promise<VideoAula> => {
      logger.info('🔧 Atualizando videoaula', { id, updates });
      
      try {
        const { data, error } = await supabase
          .from('video_aulas')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          logger.error('❌ Erro ao atualizar videoaula', error);
          throw error;
        }

        if (!data) {
          throw new Error('Nenhum dado retornado após atualização');
        }

        logger.info('✅ Videoaula atualizada com sucesso', { id: data.id });
        return data;
      } catch (error) {
        logger.error('💥 Exceção ao atualizar videoaula', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      logger.info('🎯 Invalidando caches após atualização de videoaula');
      queryClient.invalidateQueries({ queryKey: ['sistemas-hierarchical'] });
      queryClient.invalidateQueries({ queryKey: ['video-aulas-by-produto', data.produto_id] });
    }
  });
};

// Hook para deletar videoaula
export const useDeleteVideoAula = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      logger.info('🗑️ Deletando videoaula', { id });
      
      try {
        const { error } = await supabase
          .from('video_aulas')
          .delete()
          .eq('id', id);

        if (error) {
          logger.error('❌ Erro ao deletar videoaula', error);
          throw error;
        }

        logger.info('✅ Videoaula deletada com sucesso', { id });
      } catch (error) {
        logger.error('💥 Exceção ao deletar videoaula', error);
        throw error;
      }
    },
    onSuccess: () => {
      logger.info('🎯 Invalidando caches após deleção de videoaula');
      queryClient.invalidateQueries({ queryKey: ['sistemas-hierarchical'] });
      queryClient.invalidateQueries({ queryKey: ['video-aulas-by-produto'] });
    }
  });
};

// Hook para criar cartório
export const useCreateCartorio = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cartorioData: {
      nome: string;
      cidade?: string;
      estado?: string;
      observacoes?: string;
      email_contato: string;
      data_expiracao: string;
    }): Promise<{ cartorio: Cartorio; acesso: AcessoCartorio }> => {
      logger.info('🏢 Criando novo cartório', { nome: cartorioData.nome });
      
      try {
        // Criar cartório
        const { data: cartorio, error: cartorioError } = await supabase
          .from('cartorios')
          .insert({
            nome: cartorioData.nome.trim(),
            cidade: cartorioData.cidade?.trim() || null,
            estado: cartorioData.estado?.trim() || null,
            observacoes: cartorioData.observacoes?.trim() || null,
            is_active: true
          })
          .select()
          .single();

        if (cartorioError || !cartorio) {
          logger.error('❌ Erro ao criar cartório', cartorioError);
          throw cartorioError || new Error('Cartório não foi criado');
        }

        // Gerar token único
        const token = `CART-${Date.now()}-${Math.random().toString(36).substr(2, 11)}`;

        // Criar acesso
        const { data: acesso, error: acessoError } = await supabase
          .from('acessos_cartorio')
          .insert({
            login_token: token,
            cartorio_id: cartorio.id,
            email_contato: cartorioData.email_contato.trim(),
            data_expiracao: cartorioData.data_expiracao,
            ativo: true
          })
          .select()
          .single();

        if (acessoError || !acesso) {
          logger.error('❌ Erro ao criar acesso', acessoError);
          throw acessoError || new Error('Acesso não foi criado');
        }

        logger.info('✅ Cartório e acesso criados com sucesso', { 
          cartorioId: cartorio.id, 
          token: token.substring(0, 10) + '...' 
        });

        return { cartorio, acesso };
      } catch (error) {
        logger.error('💥 Exceção ao criar cartório', error);
        throw error;
      }
    },
    onSuccess: () => {
      logger.info('🎯 Invalidando cache de cartórios');
      queryClient.invalidateQueries({ queryKey: ['cartorios-with-acessos'] });
    }
  });
};

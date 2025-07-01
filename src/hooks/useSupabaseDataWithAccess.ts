
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';
import { useAuth } from '@/contexts/AuthContext';

// Hook para buscar sistemas com controle de acesso por cartório
export const useSistemasCartorioWithAccess = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['sistemas-cartorio-with-access', user?.cartorio_id],
    queryFn: async () => {
      logger.info('🏢 [useSistemasCartorioWithAccess] Fetching sistemas with access control');

      if (!user?.cartorio_id) {
        logger.warn('❌ [useSistemasCartorioWithAccess] No cartorio_id available');
        return [];
      }

      try {
        // Primeiro, verificar se há restrições definidas para este cartório
        const { data: accessRules, error: accessError } = await supabase
          .from('cartorio_acesso_conteudo')
          .select('*')
          .eq('cartorio_id', user.cartorio_id)
          .eq('ativo', true);

        if (accessError) {
          logger.error('❌ [useSistemasCartorioWithAccess] Error fetching access rules:', { accessError });
          throw new Error(`Erro ao carregar regras de acesso: ${accessError.message}`);
        }

        // Se não há regras de acesso definidas, retorna todos os sistemas (acesso total)
        if (!accessRules || accessRules.length === 0) {
          logger.info('✅ [useSistemasCartorioWithAccess] No access restrictions, returning all sistemas');
          
          const { data: allSistemas, error: sistemasError } = await supabase
            .from('sistemas')
            .select(`
              *,
              produtos (
                *,
                video_aulas (*)
              )
            `)
            .order('ordem', { ascending: true });

          if (sistemasError) {
            throw new Error(`Erro ao carregar sistemas: ${sistemasError.message}`);
          }

          return allSistemas || [];
        }

        // Se há regras de acesso, filtrar sistemas e produtos
        const sistemasIds = [...new Set(accessRules.map(rule => rule.sistema_id).filter(Boolean))];
        
        if (sistemasIds.length === 0) {
          logger.info('✅ [useSistemasCartorioWithAccess] No sistema access rules, returning empty');
          return [];
        }

        const { data: sistemas, error: sistemasError } = await supabase
          .from('sistemas')
          .select(`
            *,
            produtos (
              *,
              video_aulas (*)
            )
          `)
          .in('id', sistemasIds)
          .order('ordem', { ascending: true });

        if (sistemasError) {
          logger.error('❌ [useSistemasCartorioWithAccess] Error fetching sistemas:', { sistemasError });
          throw new Error(`Erro ao carregar sistemas: ${sistemasError.message}`);
        }

        // Filtrar produtos baseado nas regras de acesso
        const sistemasFiltered = sistemas?.map(sistema => {
          const produtosPermitidos = accessRules
            .filter(rule => rule.sistema_id === sistema.id && rule.produto_id)
            .map(rule => rule.produto_id);

          if (produtosPermitidos.length === 0) {
            // Se não há produtos específicos definidos, permite todos os produtos do sistema
            return sistema;
          }

          // Filtrar apenas os produtos permitidos
          return {
            ...sistema,
            produtos: sistema.produtos?.filter(produto => 
              produtosPermitidos.includes(produto.id)
            ) || []
          };
        }) || [];

        logger.info('✅ [useSistemasCartorioWithAccess] Successfully fetched filtered sistemas:', { 
          count: sistemasFiltered.length,
          cartorioId: user.cartorio_id
        });

        return sistemasFiltered;

      } catch (error) {
        logger.error('❌ [useSistemasCartorioWithAccess] Unexpected error:', { error });
        throw error;
      }
    },
    enabled: !!user?.cartorio_id,
    retry: 1,
    retryDelay: 2000,
    staleTime: 30000,
    gcTime: 300000,
  });
};

// Hook para gerenciar acesso de cartório (admin)
export const useCartorioAccess = () => {
  const queryClient = useQueryClient();

  const getCartorioAccess = (cartorioId: string) => {
    return useQuery({
      queryKey: ['cartorio-access', cartorioId],
      queryFn: async () => {
        logger.info('🔐 [useCartorioAccess] Fetching access for cartorio:', { cartorioId });

        const { data, error } = await supabase
          .from('cartorio_acesso_conteudo')
          .select(`
            *,
            sistemas (id, nome),
            produtos (id, nome)
          `)
          .eq('cartorio_id', cartorioId)
          .eq('ativo', true)
          .order('data_liberacao', { ascending: false });

        if (error) {
          logger.error('❌ [useCartorioAccess] Error fetching access:', { error });
          throw new Error(`Erro ao carregar acessos: ${error.message}`);
        }

        return data || [];
      },
      enabled: !!cartorioId,
    });
  };

  const grantAccess = useMutation({
    mutationFn: async (data: {
      cartorioId: string;
      sistemaId?: string;
      produtoId?: string;
      nivelAcesso?: string;
    }) => {
      logger.info('🔐 [useCartorioAccess] Granting access:', data);

      const { data: result, error } = await supabase
        .from('cartorio_acesso_conteudo')
        .upsert({
          cartorio_id: data.cartorioId,
          sistema_id: data.sistemaId || null,
          produto_id: data.produtoId || null,
          nivel_acesso: data.nivelAcesso || 'completo',
          ativo: true
        })
        .select()
        .single();

      if (error) {
        logger.error('❌ [useCartorioAccess] Error granting access:', { error });
        throw new Error(`Erro ao conceder acesso: ${error.message}`);
      }

      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cartorio-access', data.cartorio_id] });
      queryClient.invalidateQueries({ queryKey: ['sistemas-cartorio-with-access'] });
      
      toast({
        title: "Acesso concedido",
        description: "Permissão de acesso adicionada com sucesso!",
      });
    },
    onError: (error) => {
      logger.error('❌ [useCartorioAccess] Grant access error:', { error });
      toast({
        title: "Erro ao conceder acesso",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  });

  const revokeAccess = useMutation({
    mutationFn: async (accessId: string) => {
      logger.info('🔐 [useCartorioAccess] Revoking access:', { accessId });

      const { error } = await supabase
        .from('cartorio_acesso_conteudo')
        .update({ ativo: false })
        .eq('id', accessId);

      if (error) {
        logger.error('❌ [useCartorioAccess] Error revoking access:', { error });
        throw new Error(`Erro ao revogar acesso: ${error.message}`);
      }

      return { accessId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cartorio-access'] });
      queryClient.invalidateQueries({ queryKey: ['sistemas-cartorio-with-access'] });
      
      toast({
        title: "Acesso revogado",
        description: "Permissão de acesso removida com sucesso!",
      });
    },
    onError: (error) => {
      logger.error('❌ [useCartorioAccess] Revoke access error:', { error });
      toast({
        title: "Erro ao revogar acesso",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  });

  return {
    getCartorioAccess,
    grantAccess,
    revokeAccess
  };
};

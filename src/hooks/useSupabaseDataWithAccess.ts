
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';
import { useAuth } from '@/contexts/AuthContextFixed';

// Hook to fetch systems with access control via RLS
export const useSistemasCartorioWithAccess = () => {
  const { user, authenticatedClient } = useAuth();
  
  return useQuery({
    queryKey: ['sistemas-cartorio-with-access', user?.cartorio_id],
    queryFn: async () => {
      logger.info('🏢 [useSistemasCartorioWithAccess] Fetching sistemas filtered by RLS');

      if (!user?.cartorio_id) {
        logger.warn('❌ [useSistemasCartorioWithAccess] No cartorio_id available, returning empty.');
        return []; 
      }

      // Use the authenticated client with the custom JWT token
      const client = authenticatedClient || supabase;

      // The SELECT query relies on RLS policies to filter the data
      const { data: sistemas, error: sistemasError } = await client
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
        logger.error('❌ [useSistemasCartorioWithAccess] Error fetching sistemas from RLS:', { sistemasError });
        throw new Error(`Erro ao carregar sistemas: ${sistemasError.message}`);
      }

      logger.info('✅ [useSistemasCartorioWithAccess] Successfully fetched RLS-filtered sistemas:', { 
        count: sistemas?.length || 0,
        cartorioId: user.cartorio_id
      });

      return sistemas || [];
    },
    enabled: !!user?.cartorio_id,
    retry: 1,
    retryDelay: 2000,
    staleTime: 30000,
    gcTime: 300000,
  });
};

// Hook to manage cartorio access (admin)
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
      sistemaId?: string | null;
      produtoId?: string | null;
      nivelAcesso?: string;
    }) => {
      logger.info('🔐 [useCartorioAccess] Granting access:', data);

      const { data: result, error } = await supabase
        .from('cartorio_acesso_conteudo')
        .upsert({
          cartorio_id: data.cartorioId,
          sistema_id: data.sistemaId,
          produto_id: data.produtoId,
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
    },
    retry: 0,
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
    },
    retry: 0,
  });

  return {
    getCartorioAccess,
    grantAccess,
    revokeAccess
  };
};

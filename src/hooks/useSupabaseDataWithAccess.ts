
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
      logger.info('🏢 [useSistemasCartorioWithAccess] Starting fetch', {
        userType: user?.type,
        cartorioId: user?.cartorio_id,
        hasAuthClient: !!authenticatedClient
      });

      if (!user) {
        logger.warn('❌ [useSistemasCartorioWithAccess] No user found');
        throw new Error('Usuário não autenticado');
      }

      if (user.type !== 'cartorio') {
        logger.warn('❌ [useSistemasCartorioWithAccess] User is not cartorio type');
        throw new Error('Tipo de usuário inválido');
      }

      if (!user.cartorio_id) {
        logger.warn('❌ [useSistemasCartorioWithAccess] No cartorio_id available');
        throw new Error('ID do cartório não encontrado');
      }

      // Use authenticated client if available, otherwise fall back to regular client
      const client = authenticatedClient || supabase;
      
      logger.info('🏢 [useSistemasCartorioWithAccess] Using client type:', {
        clientType: authenticatedClient ? 'authenticated' : 'regular',
        cartorioId: user.cartorio_id
      });

      try {
        // Try to fetch systems with RLS policies applied
        logger.info('🏢 [useSistemasCartorioWithAccess] Executing query...');
        
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
          logger.error('❌ [useSistemasCartorioWithAccess] Supabase error:', {
            error: sistemasError,
            code: sistemasError.code,
            message: sistemasError.message,
            details: sistemasError.details
          });
          
          // Provide user-friendly error message
          if (sistemasError.code === 'PGRST116') {
            throw new Error('Erro de permissão: Verifique se você tem acesso aos sistemas.');
          } else if (sistemasError.code === '42501') {
            throw new Error('Permissão negada: Contate o administrador.');
          } else {
            throw new Error(`Erro ao carregar sistemas: ${sistemasError.message}`);
          }
        }

        logger.info('✅ [useSistemasCartorioWithAccess] Successfully fetched sistemas:', { 
          count: sistemas?.length || 0,
          cartorioId: user.cartorio_id,
          sistemas: sistemas?.map(s => ({ id: s.id, nome: s.nome, produtos: s.produtos?.length || 0 }))
        });

        return sistemas || [];
        
      } catch (error: any) {
        logger.error('❌ [useSistemasCartorioWithAccess] Fetch error:', {
          error: error.message,
          stack: error.stack,
          cartorioId: user.cartorio_id
        });
        throw error;
      }
    },
    enabled: !!user?.cartorio_id && user?.type === 'cartorio',
    retry: (failureCount, error: any) => {
      // Don't retry permission errors
      if (error?.message?.includes('permissão') || error?.message?.includes('Permissão')) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: 1000,
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


import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';
import { useAuth } from '@/contexts/AuthContext';

// Hook to fetch systems with access control via RLS
export const useSistemasCartorioWithAccess = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['sistemas-cartorio-with-access', user?.cartorio_id],
    queryFn: async () => {
      logger.info('🏢 [useSistemasCartorioWithAccess] Starting fetch', {
        userType: user?.type,
        cartorioId: user?.cartorio_id,
        token: user?.token ? 'present' : 'missing'
      });

      if (!user) {
        logger.warn('❌ [useSistemasCartorioWithAccess] No user found');
        throw new Error('Usuário não autenticado');
      }

      if (user.type !== 'cartorio') {
        logger.warn('❌ [useSistemasCartorioWithAccess] User is not cartorio type');
        throw new Error('Tipo de usuário inválido');
      }

      if (!user.cartorio_id || !user.token) {
        logger.warn('❌ [useSistemasCartorioWithAccess] Missing cartorio_id or token');
        throw new Error('Dados de autenticação incompletos');
      }

      try {
        logger.info('🏢 [useSistemasCartorioWithAccess] Calling edge function');
        
        // Use the new edge function that handles permissions properly
        const response = await fetch('https://bnulocsnxiffavvabfdj.supabase.co/functions/v1/get-sistemas-cartorio-with-permissions', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJudWxvY3NueGlmZmF2dmFiZmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NzM1NTMsImV4cCI6MjA2NjQ0OTU1M30.3QeKQtbvTN4KQboUKhqOov16HZvz-xVLxmhl70S2IAE`,
            'X-Custom-Auth': user.token,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ 
            error: `Erro HTTP ${response.status}` 
          }));
          logger.error('❌ [useSistemasCartorioWithAccess] Edge function error:', errorData);
          throw new Error(errorData.error || `Erro ao carregar sistemas (${response.status})`);
        }

        const data = await response.json();
        
        logger.info('✅ [useSistemasCartorioWithAccess] Successfully fetched from edge function:', { 
          count: data.sistemas?.length || 0,
          hasPermissions: data.hasPermissions,
          cartorioId: user.cartorio_id
        });

        return data.sistemas || [];
        
      } catch (error: any) {
        logger.error('❌ [useSistemasCartorioWithAccess] Fetch error:', {
          error: error.message,
          stack: error.stack,
          cartorioId: user.cartorio_id
        });
        throw error;
      }
    },
    enabled: !!user?.cartorio_id && !!user?.token && user?.type === 'cartorio',
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

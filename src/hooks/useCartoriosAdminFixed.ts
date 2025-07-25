
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { toast } from '@/hooks/use-toast';

interface CartorioAdmin {
  id: string;
  nome: string;
  cidade?: string;
  estado?: string;
  is_active: boolean;
  data_cadastro: string;
  observacoes?: string;
  acessos_cartorio: Array<{
    id: string;
    login_token: string;
    data_expiracao: string;
    ativo: boolean;
    email_contato?: string;
  }>;
  cartorio_usuarios: Array<{
    id: string;
    username: string;
    email?: string;
    is_active: boolean;
  }>;
}

export const useCartoriosAdminFixed = () => {
  const [cartorios, setCartorios] = useState<CartorioAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCartorios = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      logger.info('🏢 [useCartoriosAdminFixed] Fetching cartorios via Edge Function');

      const { data, error } = await supabase.functions.invoke('get-cartorios-admin', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (error) {
        logger.error('❌ [useCartoriosAdminFixed] Function error:', error);
        throw new Error(error.message || 'Erro ao buscar cartórios');
      }

      if (!data?.success) {
        logger.error('❌ [useCartoriosAdminFixed] API error:', { error: data?.error });
        throw new Error(data?.error || 'Erro na resposta da API');
      }

      logger.info('✅ [useCartoriosAdminFixed] Cartorios loaded:', { count: data.data?.length });
      setCartorios(data.data || []);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      logger.error('❌ [useCartoriosAdminFixed] Error:', err);
      setError(errorMessage);
      
      toast({
        title: "Erro ao carregar cartórios",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCartorio = async (cartorioId: string) => {
    try {
      logger.info('🗑️ [useCartoriosAdminFixed] Deleting cartorio:', { cartorioId });

      const { data, error } = await supabase.functions.invoke('delete-cartorio', {
        body: { cartorioId }
      });

      if (error) {
        logger.error('❌ [useCartoriosAdminFixed] Delete function error:', error);
        throw new Error(error.message || 'Erro ao deletar cartório');
      }

      if (!data?.success) {
        logger.error('❌ [useCartoriosAdminFixed] Delete API error:', { error: data?.error });
        throw new Error(data?.error || 'Erro na resposta da API');
      }

      logger.info('✅ [useCartoriosAdminFixed] Cartorio deleted successfully');
      
      toast({
        title: "Sucesso",
        description: data.message || "Cartório deletado com sucesso!",
      });

      // Refresh the list
      await fetchCartorios();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      logger.error('❌ [useCartoriosAdminFixed] Delete error:', err);
      
      toast({
        title: "Erro ao deletar cartório",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw err;
    }
  };

  useEffect(() => {
    fetchCartorios();
  }, []);

  return {
    cartorios,
    isLoading,
    error,
    refetch: fetchCartorios,
    deleteCartorio
  };
};


import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { toast } from '@/hooks/use-toast';

export const useCartoriosAdmin = () => {
  return useQuery({
    queryKey: ['cartorios-admin'],
    queryFn: async () => {
      logger.info('🏢 [useCartoriosAdmin] Fetching cartorios for admin');
      
      try {
        // Primeiro, tentar buscar os cartórios com uma consulta simples
        const { data: cartorios, error: cartoriosError } = await supabase
          .from('cartorios')
          .select(`
            *,
            acessos_cartorio (*)
          `)
          .order('nome', { ascending: true });

        if (cartoriosError) {
          logger.error('❌ [useCartoriosAdmin] Error fetching cartorios:', cartoriosError);
          throw new Error(`Erro ao buscar cartórios: ${cartoriosError.message}`);
        }

        logger.info('✅ [useCartoriosAdmin] Successfully fetched cartorios:', { 
          count: cartorios?.length || 0 
        });

        return cartorios || [];
      } catch (error) {
        logger.error('❌ [useCartoriosAdmin] Unexpected error:', error);
        
        toast({
          title: "Erro ao carregar cartórios",
          description: "Não foi possível carregar a lista de cartórios. Verifique as permissões.",
          variant: "destructive",
        });
        
        throw error;
      }
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

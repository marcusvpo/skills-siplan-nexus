
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export const useAdminDashboardStats = () => {
  return useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      logger.info('📊 [useAdminDashboardStats] Fetching dashboard statistics');

      try {
        // Usar edge function para buscar cartórios com auth token do Supabase
        const { data: cartoriosData, error: cartoriosError } = await supabase.functions.invoke('get-cartorios-admin', {
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          }
        });
        
        if (cartoriosError) {
          logger.error('❌ [useAdminDashboardStats] Error fetching cartorios via function:', cartoriosError);
          throw new Error('Erro ao buscar cartórios');
        }
        
        const cartoriosAtivos = cartoriosData?.data?.filter((c: any) => c.is_active).length || 0;


        // Usar edge function para buscar estatísticas para evitar problemas de RLS
        const { data: statsData, error: statsError } = await supabase.functions.invoke('get-admin-stats', {
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          }
        });
        
        if (statsError) {
          logger.error('❌ [useAdminDashboardStats] Error fetching stats via function:', statsError);
          throw new Error('Erro ao buscar estatísticas');
        }

        const {
          adminCount = 0,
          cartorioUsersCount = 0, 
          videoaulasCount = 0,
          sistemasCount = 0,
          produtosCount = 0
        } = statsData?.data || {};

        const stats = {
          cartoriosAtivos: cartoriosAtivos || 0,
          totalUsuarios: (adminCount || 0) + (cartorioUsersCount || 0),
          totalVideoaulas: videoaulasCount || 0,
          totalSistemas: sistemasCount || 0,
          totalProdutos: produtosCount || 0
        };

        logger.info('✅ [useAdminDashboardStats] Statistics loaded:', stats);
        return stats;

      } catch (error) {
        logger.error('❌ [useAdminDashboardStats] Unexpected error:', error);
        throw error;
      }
    },
    refetchInterval: 60000, // Atualiza a cada 1 minuto
    staleTime: 30000, // Considera dados válidos por 30 segundos
  });
};

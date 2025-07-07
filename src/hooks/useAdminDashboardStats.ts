
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export const useAdminDashboardStats = () => {
  return useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      logger.info('📊 [useAdminDashboardStats] Fetching dashboard statistics');

      try {
        // Cartórios ativos
        const { count: cartoriosAtivos, error: cartoriosError } = await supabase
          .from('cartorios')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true);

        if (cartoriosError) {
          logger.error('❌ [useAdminDashboardStats] Error fetching cartorios:', cartoriosError);
          throw cartoriosError;
        }

        // Total de usuários cadastrados (admins + usuários de cartório)
        const [
          { count: adminCount, error: adminError },
          { count: cartorioUsersCount, error: cartorioUsersError }
        ] = await Promise.all([
          supabase.from('admins').select('*', { count: 'exact', head: true }),
          supabase.from('cartorio_usuarios').select('*', { count: 'exact', head: true }).eq('is_active', true)
        ]);

        if (adminError) {
          logger.error('❌ [useAdminDashboardStats] Error fetching admins:', adminError);
          throw adminError;
        }

        if (cartorioUsersError) {
          logger.error('❌ [useAdminDashboardStats] Error fetching cartorio users:', cartorioUsersError);
          throw cartorioUsersError;
        }

        // Total de videoaulas
        const { count: videoaulasCount, error: videoaulasError } = await supabase
          .from('video_aulas')
          .select('*', { count: 'exact', head: true });

        if (videoaulasError) {
          logger.error('❌ [useAdminDashboardStats] Error fetching videoaulas:', videoaulasError);
          throw videoaulasError;
        }

        // Total de sistemas
        const { count: sistemasCount, error: sistemasError } = await supabase
          .from('sistemas')
          .select('*', { count: 'exact', head: true });

        if (sistemasError) {
          logger.error('❌ [useAdminDashboardStats] Error fetching sistemas:', sistemasError);
          throw sistemasError;
        }

        // Total de produtos
        const { count: produtosCount, error: produtosError } = await supabase
          .from('produtos')
          .select('*', { count: 'exact', head: true });

        if (produtosError) {
          logger.error('❌ [useAdminDashboardStats] Error fetching produtos:', produtosError);
          throw produtosError;
        }

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

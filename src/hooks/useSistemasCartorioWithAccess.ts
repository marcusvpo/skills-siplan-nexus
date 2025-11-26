import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContextFixed';
import { logger } from '@/utils/logger';

export const useSistemasCartorioWithAccess = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['sistemas-cartorio-with-access', user?.cartorio_id],
    queryFn: async () => {
      if (!user?.cartorio_id) {
        logger.warn('⚠️ [useSistemasCartorioWithAccess] No cartorio_id found');
        return [];
      }
      
      logger.info('🔍 [useSistemasCartorioWithAccess] Fetching sistemas for cartorio:', { 
        cartorioId: user.cartorio_id 
      });
      
      // First, check if cartorio has any specific access restrictions
      const { data: acessos, error: acessosError } = await supabase
        .from('cartorio_acesso_conteudo')
        .select('sistema_id, produto_id')
        .eq('cartorio_id', user.cartorio_id)
        .eq('ativo', true);
      
      if (acessosError) {
        logger.error('❌ [useSistemasCartorioWithAccess] Error fetching acessos:', acessosError);
        throw acessosError;
      }
      
      // If no specific access, return all sistemas
      const hasRestrictions = acessos && acessos.length > 0;
      
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
        logger.error('❌ [useSistemasCartorioWithAccess] Error fetching sistemas:', error);
        throw error;
      }
      
      if (!hasRestrictions) {
        logger.info('✅ [useSistemasCartorioWithAccess] No restrictions, returning all sistemas');
        return data || [];
      }
      
      // Filter sistemas and produtos based on access
      const filteredSistemas = data?.map(sistema => {
        const sistemaAccess = acessos.filter(a => a.sistema_id === sistema.id);
        
        if (sistemaAccess.length === 0) return null;
        
        // Check if there are product-specific restrictions
        const produtoIds = sistemaAccess.map(a => a.produto_id).filter(Boolean);
        
        if (produtoIds.length === 0) {
          // Full system access
          return sistema;
        }
        
        // Filter products
        return {
          ...sistema,
          produtos: sistema.produtos?.filter(p => produtoIds.includes(p.id))
        };
      }).filter(Boolean);
      
      logger.info('✅ [useSistemasCartorioWithAccess] Success:', { 
        count: filteredSistemas?.length 
      });
      
      return filteredSistemas || [];
    },
    enabled: !!user?.cartorio_id,
    retry: 3,
    retryDelay: 1000
  });
};

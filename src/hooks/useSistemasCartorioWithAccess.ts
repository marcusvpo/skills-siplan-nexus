import { useQuery } from '@tanstack/react-query';
import { getAuthToken } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContextFixed';
import { logger } from '@/utils/logger';

const SUPABASE_URL = 'https://bnulocsnxiffavvabfdj.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_Qf2Fc0CgFvljfVhk3v9IYg_PrDm9z4J';

/**
 * Busca os sistemas/produtos/videoaulas que o cartório PODE acessar.
 *
 * IMPORTANTE: a filtragem é feita 100% no backend (Edge Function com service role
 * + verificação do JWT customizado). Consultas diretas ao PostgREST com o JWT
 * customizado são rejeitadas (assinatura inválida) e caem no papel `anon`,
 * onde as políticas de RLS liberam todo o conteúdo — era essa a causa de todos
 * os cartórios verem tudo.
 */
export const useSistemasCartorioWithAccess = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['sistemas-cartorio-with-access', user?.cartorio_id],
    queryFn: async () => {
      const token = getAuthToken();

      if (!user?.cartorio_id || !token) {
        logger.warn('⚠️ [useSistemasCartorioWithAccess] Sem cartorio_id ou token');
        return [];
      }

      logger.info('🔍 [useSistemasCartorioWithAccess] Buscando conteúdo permitido', {
        cartorioId: user.cartorio_id,
      });

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/get-sistemas-cartorio-with-permissions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${token}`,
            'x-custom-auth': `Bearer ${token}`,
          },
          body: JSON.stringify({}),
        }
      );

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const message = payload?.error || 'Erro ao carregar conteúdo permitido';
        logger.error('❌ [useSistemasCartorioWithAccess] Falha na Edge Function', {
          status: response.status,
          message,
        });
        throw new Error(message);
      }

      const sistemas = (payload?.sistemas || []).filter(
        (s: any) => !payload?.hasPermissions || (s.produtos && s.produtos.length > 0)
      );

      logger.info('✅ [useSistemasCartorioWithAccess] Conteúdo permitido carregado', {
        hasPermissions: payload?.hasPermissions,
        sistemas: sistemas.length,
      });

      return sistemas;
    },
    enabled: !!user?.cartorio_id,
    retry: 1,
    retryDelay: 1000,
  });
};

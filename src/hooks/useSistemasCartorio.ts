
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';

interface Sistema {
  id: string;
  nome: string;
  descricao?: string;
  ordem: number;
}

export const useSistemasCartorio = () => {
  const [sistemas, setSistemas] = useState<Sistema[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchSistemas = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!user?.cartorio_id) {
        logger.warn('⚠️ [useSistemasCartorio] No cartorio_id found for user');
        setSistemas([]);
        return;
      }

      logger.info('🎯 [useSistemasCartorio] Fetching sistemas for cartorio:', { cartorioId: user.cartorio_id });

      const { data, error } = await supabase.functions.invoke('get-sistemas-cartorio', {
        body: { cartorioId: user.cartorio_id }
      });

      if (error) {
        logger.error('❌ [useSistemasCartorio] Function error:', error);
        throw new Error(error.message || 'Erro ao buscar sistemas');
      }

      if (!data?.success) {
        logger.error('❌ [useSistemasCartorio] API error:', { error: data?.error });
        throw new Error(data?.error || 'Erro na resposta da API');
      }

      logger.info('✅ [useSistemasCartorio] Sistemas loaded:', { count: data.data?.length });
      setSistemas(data.data || []);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      logger.error('❌ [useSistemasCartorio] Error:', err);
      setError(errorMessage);
      setSistemas([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.cartorio_id) {
      fetchSistemas();
    } else {
      setIsLoading(false);
    }
  }, [user?.cartorio_id]);

  return {
    sistemas,
    isLoading,
    error,
    refetch: fetchSistemas
  };
};

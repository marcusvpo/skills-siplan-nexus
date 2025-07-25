import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContextFixed';
import { useProgressContext } from '@/contexts/ProgressContext';
import { logger } from '@/utils/logger';

const useSafeProgressContext = () => {
  try {
    return useProgressContext();
  } catch {
    return { refreshKey: 0 };
  }
};

interface ProdutoProgresso {
  total: number;
  completas: number;
  percentual: number;
}

export interface ProgressoGeral {
  [produtoId: string]: ProdutoProgresso;
}

export const useProgressoGeral = () => {
  const { user } = useAuth();
  const { refreshKey } = useSafeProgressContext();

  const [progressos, setProgressos] = useState<ProgressoGeral>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calcularProgressos = async () => {
    if (!user?.cartorio_id || !user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Buscar todas as video_aulas com produto_id
      const { data: videoAulas, error: errVideoAulas } = await supabase
        .from('video_aulas')
        .select('id, produto_id')
        .order('ordem', { ascending: true });

      if (errVideoAulas) throw new Error(errVideoAulas.message);

      // Buscar visualizacoes completas do usuário
      const { data: visualizacoes, error: errVisualizacoes } = await supabase
        .from('user_video_progress')
        .select('video_aula_id')
        .eq('user_id', user.id)
        .eq('completed', true);

      if (errVisualizacoes) throw new Error(errVisualizacoes.message);

      const videoAulasByProduto: Record<string, { total: number; completas: number; }> = {};

      const completedSet = new Set(visualizacoes?.map(v => v.video_aula_id) ?? []);

      videoAulas?.forEach((va) => {
        if (!va.produto_id) return;
        if (!videoAulasByProduto[va.produto_id]) {
          videoAulasByProduto[va.produto_id] = { total: 0, completas: 0 };
        }
        videoAulasByProduto[va.produto_id].total++;

        if (completedSet.has(va.id)) {
          videoAulasByProduto[va.produto_id].completas++;
        }
      });

      const calculatedProgress: ProgressoGeral = {};

      Object.entries(videoAulasByProduto).forEach(([produtoId, dados]) => {
        const percentual = dados.total > 0 ? Math.round((dados.completas / dados.total) * 100) : 0;
        calculatedProgress[produtoId] = {
          total: dados.total,
          completas: dados.completas,
          percentual,
        };
      });

      setProgressos(calculatedProgress);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      setError(message);
      setProgressos({});
      logger.error('[useProgressoGeral] erro:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    calcularProgressos();
  }, [user?.cartorio_id, user?.id, refreshKey]);

  return {
    progressos,
    isLoading,
    error,
    refetch: calcularProgressos,
  };
};

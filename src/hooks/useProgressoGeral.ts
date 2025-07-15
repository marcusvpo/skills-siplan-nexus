import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContextFixed';
import { useProgressContext } from '@/contexts/ProgressContext';

// Helper hook to safely use progress context
const useSafeProgressContext = () => {
  try {
    return useProgressContext();
  } catch {
    return { refreshKey: 0 };
  }
};

export interface ProgressoGeral {
  [productId: string]: {
    total: number;
    completas: number;
    percentual: number;
  };
}

export const useProgressoGeral = () => {
  const { user } = useAuth();
  const { refreshKey } = useSafeProgressContext();
  const [progressos, setProgressos] = useState<ProgressoGeral>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calcularProgressos = async () => {
    if (!user?.cartorio_id) return;

    try {
      setIsLoading(true);
      setError(null);

      // Buscar todas as videoaulas com seus produtos
      const { data: videoAulas, error: videoError } = await supabase
        .from('video_aulas')
        .select('id, produto_id')
        .order('produto_id');

      if (videoError) throw videoError;

      // Buscar todas as visualizações do cartório - FORÇA REFRESH
      const timestamp = Date.now();
      const { data: visualizacoes, error: visualError } = await supabase
        .from('visualizacoes_cartorio')
        .select('video_aula_id')
        .eq('cartorio_id', user.cartorio_id)
        .eq('completo', true)
        .range(0, 1000); // Força uma nova query sempre

      if (visualError) {
        console.error('❌ [useProgressoGeral] Erro ao buscar visualizações:', visualError);
        throw visualError;
      }

      // Agrupar por produto
      const progressosPorProduto: ProgressoGeral = {};
      const completedVideos = new Set(visualizacoes?.map(v => v.video_aula_id) || []);

      videoAulas?.forEach(video => {
        if (!progressosPorProduto[video.produto_id]) {
          progressosPorProduto[video.produto_id] = {
            total: 0,
            completas: 0,
            percentual: 0
          };
        }
        
        progressosPorProduto[video.produto_id].total++;
        
        if (completedVideos.has(video.id)) {
          progressosPorProduto[video.produto_id].completas++;
        }
      });

      // Calcular percentuais
      Object.keys(progressosPorProduto).forEach(produtoId => {
        const progresso = progressosPorProduto[produtoId];
        progresso.percentual = progresso.total > 0 
          ? Math.round((progresso.completas / progresso.total) * 100) 
          : 0;
      });

      console.log('🎯 [useProgressoGeral] Progresso geral calculado:', {
        cartorioId: user.cartorio_id,
        totalVideoAulas: videoAulas?.length || 0,
        totalVisualizacoes: visualizacoes?.length || 0,
        produtosCount: Object.keys(progressosPorProduto).length,
        timestamp,
        sample: Object.entries(progressosPorProduto).slice(0, 2)
      });

      setProgressos(progressosPorProduto);
    } catch (error) {
      console.error('Erro ao calcular progressos gerais:', error);
      setError('Erro ao carregar progresso');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    calcularProgressos();
  }, [user?.cartorio_id, refreshKey]);

  return {
    progressos,
    isLoading,
    error,
    refetch: calcularProgressos
  };
};
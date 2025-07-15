import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContextFixed';

export interface ProgressoGeral {
  [productId: string]: {
    total: number;
    completas: number;
    percentual: number;
  };
}

export const useProgressoGeral = () => {
  const { user } = useAuth();
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

      // Buscar todas as visualizações do cartório
      const { data: visualizacoes, error: visualError } = await supabase
        .from('visualizacoes_cartorio')
        .select('video_aula_id')
        .eq('cartorio_id', user.cartorio_id)
        .eq('completo', true);

      if (visualError) throw visualError;

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
  }, [user?.cartorio_id]);

  return {
    progressos,
    isLoading,
    error,
    refetch: calcularProgressos
  };
};
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContextFixed';

export interface ProgressoProduto {
  total: number;
  completas: number;
  percentual: number;
  restantes: number;
  isLoading: boolean;
  error: string | null;
}

export const useProgressoProduto = (produtoId: string) => {
  const { user } = useAuth();
  const [progresso, setProgresso] = useState<ProgressoProduto>({
    total: 0,
    completas: 0,
    percentual: 0,
    restantes: 0,
    isLoading: true,
    error: null
  });

  const calcularProgresso = async () => {
    if (!user?.cartorio_id || !produtoId) return;

    try {
      setProgresso(prev => ({ ...prev, isLoading: true, error: null }));

      // 1. Buscar todas as videoaulas do produto
      const { data: videoAulas, error: videoError } = await supabase
        .from('video_aulas')
        .select('id')
        .eq('produto_id', produtoId)
        .order('ordem');

      if (videoError) throw videoError;

      const total = videoAulas?.length || 0;
      const videoIds = videoAulas?.map(v => v.id) || [];

      if (total === 0) {
        setProgresso({
          total: 0,
          completas: 0,
          percentual: 0,
          restantes: 0,
          isLoading: false,
          error: null
        });
        return;
      }

      // 2. Buscar videoaulas concluídas pelo cartório
      const { data: visualizacoes, error: visualError } = await supabase
        .from('visualizacoes_cartorio')
        .select('video_aula_id')
        .eq('cartorio_id', user.cartorio_id)
        .eq('completo', true)
        .in('video_aula_id', videoIds);

      if (visualError) throw visualError;

      const completas = visualizacoes?.length || 0;
      const percentual = total > 0 ? Math.round((completas / total) * 100) : 0;
      const restantes = total - completas;

      setProgresso({
        total,
        completas,
        percentual,
        restantes,
        isLoading: false,
        error: null
      });

    } catch (error) {
      console.error('Erro ao calcular progresso:', error);
      setProgresso(prev => ({
        ...prev,
        isLoading: false,
        error: 'Erro ao carregar progresso'
      }));
    }
  };

  useEffect(() => {
    calcularProgresso();
  }, [produtoId, user?.cartorio_id]);

  return {
    ...progresso,
    refetch: calcularProgresso
  };
};
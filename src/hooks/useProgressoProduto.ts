import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProgressContext } from '@/contexts/ProgressContext';

// Helper hook to safely use progress context
const useSafeProgressContext = () => {
  try {
    return useProgressContext();
  } catch {
    return { refreshKey: 0 };
  }
};

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
  const { refreshKey } = useSafeProgressContext();
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

      // 2. Buscar videoaulas concluídas pelo cartório - FORÇA REFRESH
      const timestamp = Date.now();
      const { data: visualizacoes, error: visualError } = await supabase
        .from('visualizacoes_cartorio')
        .select('video_aula_id')
        .eq('cartorio_id', user.cartorio_id)
        .eq('completo', true)
        .in('video_aula_id', videoIds)
        .range(0, 1000); // Força uma nova query sempre

      if (visualError) {
        console.error('❌ [useProgressoProduto] Erro ao buscar visualizações:', visualError);
        throw visualError;
      }

      const completas = visualizacoes?.length || 0;
      const percentual = total > 0 ? Math.round((completas / total) * 100) : 0;
      const restantes = total - completas;

      console.log('🎯 [useProgressoProduto] Progresso calculado:', {
        produtoId,
        total,
        completas,
        percentual,
        restantes,
        timestamp,
        videoIds: videoIds.slice(0, 3) // Mostrar apenas os primeiros 3 IDs
      });

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
  }, [produtoId, user?.cartorio_id, refreshKey]);

  return {
    ...progresso,
    refetch: calcularProgresso
  };
};
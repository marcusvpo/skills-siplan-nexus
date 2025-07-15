import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContextFixed';

export interface ProgressoReativo {
  totalAulas: number;
  aulasCompletas: number;
  percentual: number;
  videosCompletos: Set<string>;
  isLoading: boolean;
  error: string | null;
}

export const useProgressoReativo = (produtoId: string) => {
  const { user } = useAuth();
  const [progresso, setProgresso] = useState<ProgressoReativo>({
    totalAulas: 0,
    aulasCompletas: 0,
    percentual: 0,
    videosCompletos: new Set(),
    isLoading: true,
    error: null
  });

  const cartorioId = user?.cartorio_id;

  const carregarProgresso = async () => {
    if (!cartorioId || !produtoId) return;

    try {
      setProgresso(prev => ({ ...prev, isLoading: true, error: null }));

      // Buscar todas as videoaulas do produto
      const { data: videoAulas, error: videoError } = await supabase
        .from('video_aulas')
        .select('id')
        .eq('produto_id', produtoId)
        .order('ordem');

      if (videoError) throw videoError;

      const totalAulas = videoAulas?.length || 0;
      const videoIds = videoAulas?.map(v => v.id) || [];

      if (totalAulas === 0) {
        setProgresso({
          totalAulas: 0,
          aulasCompletas: 0,
          percentual: 0,
          videosCompletos: new Set(),
          isLoading: false,
          error: null
        });
        return;
      }

      // Buscar visualizações completas
      const { data: visualizacoes, error: visualError } = await supabase
        .from('visualizacoes_cartorio')
        .select('video_aula_id')
        .eq('cartorio_id', cartorioId)
        .eq('completo', true)
        .in('video_aula_id', videoIds);

      if (visualError) throw visualError;

      const videosCompletos = new Set(visualizacoes?.map(v => v.video_aula_id) || []);
      const aulasCompletas = videosCompletos.size;
      const percentual = totalAulas > 0 ? Math.round((aulasCompletas / totalAulas) * 100) : 0;

      setProgresso({
        totalAulas,
        aulasCompletas,
        percentual,
        videosCompletos,
        isLoading: false,
        error: null
      });

    } catch (error) {
      console.error('Erro ao carregar progresso:', error);
      setProgresso(prev => ({
        ...prev,
        isLoading: false,
        error: 'Erro ao carregar progresso'
      }));
    }
  };

  const marcarVideoCompleto = (videoId: string, completo: boolean) => {
    setProgresso(prev => {
      const novosVideosCompletos = new Set(prev.videosCompletos);
      
      if (completo) {
        novosVideosCompletos.add(videoId);
      } else {
        novosVideosCompletos.delete(videoId);
      }

      const novasAulasCompletas = novosVideosCompletos.size;
      const novoPercentual = prev.totalAulas > 0 ? Math.round((novasAulasCompletas / prev.totalAulas) * 100) : 0;

      return {
        ...prev,
        aulasCompletas: novasAulasCompletas,
        percentual: novoPercentual,
        videosCompletos: novosVideosCompletos
      };
    });
  };

  const isVideoCompleto = (videoId: string) => {
    return progresso.videosCompletos.has(videoId);
  };

  useEffect(() => {
    carregarProgresso();
  }, [produtoId, cartorioId]);

  return {
    ...progresso,
    marcarVideoCompleto,
    isVideoCompleto,
    recarregar: carregarProgresso
  };
};
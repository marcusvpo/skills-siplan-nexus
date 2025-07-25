import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContextFixed';
import { useProgressContext } from '@/contexts/ProgressContext';
import { logger } from '@/utils/logger';
import type { Database } from '@/types/database';

type VideoAula = Database['public']['Tables']['video_aulas']['Row'];
type VisualizacaoCartorio = Database['public']['Tables']['visualizacoes_cartorio']['Row'];

const useSafeProgressContext = () => {
  try {
    return useProgressContext();
  } catch {
    return { refreshKey: 0 };
  }
};

export interface ProgressoReativo {
  videoId: string;
  completo: boolean;
  percentual: number;
  totalAulas: number;
  aulasCompletas: number;
  isLoading: boolean;
  error: string | null;

  marcarCompleto: () => Promise<boolean>;
  desmarcarCompleto: () => Promise<boolean>;
  refetch: () => Promise<void>;
  isVideoCompleto?: (videoId: string) => boolean;
}

export const useProgressoReativo = (videoId?: string): ProgressoReativo => {
  const { user } = useAuth();
  const { refreshKey } = useSafeProgressContext();

  const [progresso, setProgresso] = useState<Omit<
    ProgressoReativo,
    'marcarCompleto' | 'desmarcarCompleto' | 'refetch' | 'isVideoCompleto'
  >>({
    videoId: videoId || '',
    completo: false,
    percentual: 0,
    totalAulas: 0,
    aulasCompletas: 0,
    isLoading: true,
    error: null,
  });

  const buscarProgresso = useCallback(async () => {
    if (!videoId || !user?.cartorio_id || !user?.id) {
      setProgresso(prev => ({ ...prev, isLoading: false, error: null }));
      return;
    }
    try {
      setProgresso(prev => ({ ...prev, isLoading: true }));

      // Buscar produto_id do video
      const { data: videoAula, error: errVideoAula } = await supabase
        .from('video_aulas')
        .select('id, produto_id')
        .eq('id', videoId)
        .maybeSingle();

      if (errVideoAula || !videoAula) {
        throw new Error(errVideoAula?.message || 'Vídeo-aula não encontrada');
      }

      const produtoId = videoAula.produto_id;
      if (!produtoId) throw new Error('Produto do vídeo não encontrado');

      // Buscar todas as aulas do produto
      const { data: aulasProduto, error: errAulasProduto } = await supabase
        .from('video_aulas')
        .select('id')
        .eq('produto_id', produtoId);

      if (errAulasProduto) throw new Error(errAulasProduto.message);

      const totalAulas = aulasProduto?.length ?? 0;
      const videoIdsProduto = aulasProduto?.map(a => a.id) ?? [];

      // Buscar visualizações completas desse usuário/ cartório / produto
      let aulasCompletas = 0;
      if (videoIdsProduto.length > 0) {
        const { data: visualizacoesCompletas, error: errVisualizacoes } = await supabase
          .from('visualizacoes_cartorio')
          .select('video_aula_id')
          .eq('cartorio_id', user.cartorio_id)
          .eq('user_id', user.id)
          .eq('completo', true)
          .in('video_aula_id', videoIdsProduto);

        if (errVisualizacoes) throw new Error(errVisualizacoes.message);

        aulasCompletas = visualizacoesCompletas?.length ?? 0;
      }

      // Buscar visualização específica desse vídeo
      const { data: visualizacao, error: errVisualizacao } = await supabase
        .from('visualizacoes_cartorio')
        .select('completo')
        .eq('cartorio_id', user.cartorio_id)
        .eq('user_id', user.id)
        .eq('video_aula_id', videoId)
        .maybeSingle(); // (usa maybeSingle pra não dar erro se não existe)

      if (errVisualizacao && errVisualizacao.code !== 'PGRST116') {
        throw new Error(errVisualizacao.message);
      }

      const completo = visualizacao?.completo ?? false;
      const percentual = totalAulas > 0 ? Math.round((aulasCompletas / totalAulas) * 100) : 0;

      setProgresso({
        videoId,
        completo,
        percentual,
        totalAulas,
        aulasCompletas,
        isLoading: false,
        error: null
      });

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      setProgresso(prev => ({ ...prev, isLoading: false, error: message }));
      logger.error('[useProgressoReativo]', error);
    }
  }, [videoId, user?.cartorio_id, user?.id]);

  const marcarCompleto = useCallback(async () => {
    if (!videoId || !user?.cartorio_id || !user?.id) return false;
    try {
      const { error } = await supabase
        .from('visualizacoes_cartorio')
        .upsert(
          {
            video_aula_id: videoId,
            cartorio_id: user.cartorio_id,
            user_id: user.id,
            completo: true,
            concluida: true,
            data_conclusao: new Date().toISOString(),
          },
          { onConflict: 'video_aula_id,cartorio_id,user_id' }
        );

      if (error) throw new Error(error.message);

      setProgresso(prev => ({
        ...prev,
        completo: true,
        percentual: 100,
        aulasCompletas: prev.aulasCompletas + 1
      }));

      return true;
    } catch (error) {
      logger.error('[useProgressoReativo] marcarCompleto erro: ', error);
      return false;
    }
  }, [videoId, user?.cartorio_id, user?.id]);

  const desmarcarCompleto = useCallback(async () => {
    if (!videoId || !user?.cartorio_id || !user?.id) return false;
    try {
      const { error } = await supabase
        .from('visualizacoes_cartorio')
        .update({
          completo: false,
          concluida: false,
          data_conclusao: null,
        })
        .eq('video_aula_id', videoId)
        .eq('cartorio_id', user.cartorio_id)
        .eq('user_id', user.id);

      if (error) throw new Error(error.message);

      setProgresso(prev => ({
        ...prev,
        completo: false,
        percentual: Math.max(0, prev.percentual - (100 / prev.totalAulas)),
        aulasCompletas: Math.max(0, prev.aulasCompletas - 1),
      }));

      return true;
    } catch (error) {
      logger.error('[useProgressoReativo] desmarcarCompleto erro: ', error);
      return false;
    }
  }, [videoId, user?.cartorio_id, user?.id]);

  useEffect(() => {
    buscarProgresso();
  }, [buscarProgresso, refreshKey]);

  const isVideoCompleto = useCallback(
    (id: string) => progresso.videoId === id ? progresso.completo : false,
    [progresso]
  );

  return {
    ...progresso,
    marcarCompleto,
    desmarcarCompleto,
    refetch: buscarProgresso,
    isVideoCompleto
  };
};
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContextFixed';
import { useProgressContext } from '@/contexts/ProgressContext';
import { logger } from '@/utils/logger';

// Helper hook to safely use progress context
const useSafeProgressContext = () => {
  try {
    return useProgressContext();
  } catch {
    return { refreshKey: 0 };
  }
};

interface ProgressoReativo {
  videoId: string;
  completo: boolean;
  percentual: number;
  isLoading: boolean;
  error: string | null;
}

export const useProgressoReativo = (videoId?: string) => {
  const { user } = useAuth();
  const { refreshKey } = useSafeProgressContext();
  const [progresso, setProgresso] = useState<ProgressoReativo>({
    videoId: videoId || '',
    completo: false,
    percentual: 0,
    isLoading: true,
    error: null
  });

  const buscarProgresso = useCallback(async () => {
    if (!videoId || !user?.cartorio_id || !user?.id) {
      logger.debug('⚠️ [useProgressoReativo] Parâmetros insuficientes:', { 
        hasVideoId: !!videoId,
        hasCartorioId: !!user?.cartorio_id,
        hasUserId: !!user?.id
      });
      setProgresso(prev => ({
        ...prev,
        isLoading: false,
        error: null
      }));
      return;
    }

    try {
      setProgresso(prev => ({ ...prev, isLoading: true, error: null }));

      logger.debug('🔍 [useProgressoReativo] Buscando progresso para:', {
        videoId,
        cartorioId: user.cartorio_id,
        userId: user.id
      });

      // ✅ Buscar visualização específica usando campos corretos do schema
      const { data: visualizacao, error } = await supabase
        .from('visualizacoes_cartorio')
        .select('id, completo, concluida, data_conclusao')
        .eq('video_aula_id', videoId)
        .eq('cartorio_id', user.cartorio_id) 
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        logger.error('❌ [useProgressoReativo] Erro ao buscar visualização:', { 
          error: error.message,
          videoId,
          cartorioId: user.cartorio_id,
          userId: user.id
        });
        throw new Error(`Erro ao carregar progresso: ${error.message}`);
      }

      const completo = visualizacao?.completo || visualizacao?.concluida || false;
      const percentual = completo ? 100 : 0;

      setProgresso({
        videoId,
        completo,
        percentual,
        isLoading: false,
        error: null
      });

      logger.debug('✅ [useProgressoReativo] Progresso carregado:', {
        videoId,
        completo,
        percentual,
        hasVisualizacao: !!visualizacao
      });

    } catch (error) {
      logger.error('❌ [useProgressoReativo] Erro inesperado:', { 
        error,
        videoId,
        cartorioId: user?.cartorio_id,
        userId: user?.id
      });
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setProgresso(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
    }
  }, [videoId, user?.cartorio_id, user?.id]);

  const marcarCompleto = useCallback(async () => {
    if (!videoId || !user?.cartorio_id || !user?.id) {
      logger.warn('⚠️ [useProgressoReativo] Não é possível marcar como completo - parâmetros insuficientes:', {
        hasVideoId: !!videoId,
        hasCartorioId: !!user?.cartorio_id,
        hasUserId: !!user?.id
      });
      return false;
    }

    try {
      logger.info('📝 [useProgressoReativo] Marcando vídeo como completo:', {
        videoId,
        cartorioId: user.cartorio_id,
        userId: user.id
      });

      // ✅ Upsert usando campos corretos do schema
      const { error } = await supabase
        .from('visualizacoes_cartorio')
        .upsert({
          video_aula_id: videoId,
          cartorio_id: user.cartorio_id,
          user_id: user.id,
          completo: true,
          concluida: true,
          data_conclusao: new Date().toISOString()
        }, {
          onConflict: 'video_aula_id,cartorio_id,user_id'
        });

      if (error) {
        logger.error('❌ [useProgressoReativo] Erro ao marcar como completo:', {
          error: error.message,
          videoId,
          cartorioId: user.cartorio_id,
          userId: user.id
        });
        throw new Error(`Erro ao salvar progresso: ${error.message}`);
      }

      // ✅ Atualizar estado local
      setProgresso(prev => ({
        ...prev,
        completo: true,
        percentual: 100,
        error: null
      }));

      logger.info('✅ [useProgressoReativo] Vídeo marcado como completo com sucesso:', {
        videoId,
        cartorioId: user.cartorio_id,
        userId: user.id
      });

      return true;

    } catch (error) {
      logger.error('❌ [useProgressoReativo] Erro inesperado ao marcar completo:', {
        error,
        videoId,
        cartorioId: user?.cartorio_id,
        userId: user?.id
      });
      
      const errorMessage = error instanceof Error ? error.message : 'Erro ao salvar progresso';
      setProgresso(prev => ({
        ...prev,
        error: errorMessage
      }));
      
      return false;
    }
  }, [videoId, user?.cartorio_id, user?.id]);

  const desmarcarCompleto = useCallback(async () => {
    if (!videoId || !user?.cartorio_id || !user?.id) {
      logger.warn('⚠️ [useProgressoReativo] Não é possível desmarcar - parâmetros insuficientes:', {
        hasVideoId: !!videoId,
        hasCartorioId: !!user?.cartorio_id,
        hasUserId: !!user?.id
      });
      return false;
    }

    try {
      logger.info('📝 [useProgressoReativo] Desmarcando vídeo como completo:', {
        videoId,
        cartorioId: user.cartorio_id,
        userId: user.id
      });

      // ✅ Atualizar usando campos corretos do schema
      const { error } = await supabase
        .from('visualizacoes_cartorio')
        .update({
          completo: false,
          concluida: false,
          data_conclusao: null
        })
        .eq('video_aula_id', videoId)
        .eq('cartorio_id', user.cartorio_id)
        .eq('user_id', user.id);

      if (error) {
        logger.error('❌ [useProgressoReativo] Erro ao desmarcar:', {
          error: error.message,
          videoId,
          cartorioId: user.cartorio_id,
          userId: user.id
        });
        throw new Error(`Erro ao atualizar progresso: ${error.message}`);
      }

      // ✅ Atualizar estado local
      setProgresso(prev => ({
        ...prev,
        completo: false,
        percentual: 0,
        error: null
      }));

      logger.info('✅ [useProgressoReativo] Vídeo desmarcado como completo:', {
        videoId,
        cartorioId: user.cartorio_id,
        userId: user.id
      });

      return true;

    } catch (error) {
      logger.error('❌ [useProgressoReativo] Erro inesperado ao desmarcar:', {
        error,
        videoId,
        cartorioId: user?.cartorio_id,
        userId: user?.id
      });
      
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar progresso';
      setProgresso(prev => ({
        ...prev,
        error: errorMessage
      }));
      
      return false;
    }
  }, [videoId, user?.cartorio_id, user?.id]);

  // ✅ Effect para buscar progresso quando parâmetros mudarem
  useEffect(() => {
    buscarProgresso();
  }, [buscarProgresso, refreshKey]);

  return {
    ...progresso,
    marcarCompleto,
    desmarcarCompleto,
    refetch: buscarProgresso
  };
};

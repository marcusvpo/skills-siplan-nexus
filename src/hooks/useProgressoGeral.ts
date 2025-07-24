import { useState, useEffect } from 'react';
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

// ✅ Interface para progresso geral
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
    if (!user?.cartorio_id || !user?.id) {
      logger.debug('⚠️ [useProgressoGeral] Parâmetros insuficientes:', {
        hasCartorioId: !!user?.cartorio_id,
        hasUserId: !!user?.id
      });
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      logger.debug('🔍 [useProgressoGeral] Buscando dados para:', {
        cartorioId: user.cartorio_id,
        userId: user.id
      });

      // ✅ Buscar videoaulas e visualizações em paralelo usando schema correto
      const [videoAulasResult, visualizacoesResult] = await Promise.all([
        // Buscar todas as videoaulas com seus produtos (sem campos inexistentes)
        supabase
          .from('video_aulas')
          .select('id, produto_id')
          .order('produto_id'),

        // Buscar visualizações completas do usuário no cartório
        supabase
          .from('visualizacoes_cartorio')
          .select('video_aula_id')
          .eq('cartorio_id', user.cartorio_id)
          .eq('user_id', user.id)
          .eq('completo', true)
      ]);

      // ✅ Verificar erros de forma consolidada
      if (videoAulasResult.error) {
        logger.error('❌ [useProgressoGeral] Erro ao buscar videoaulas:', { 
          error: videoAulasResult.error.message,
          cartorioId: user.cartorio_id,
          userId: user.id
        });
        throw new Error(`Erro ao carregar videoaulas: ${videoAulasResult.error.message}`);
      }

      if (visualizacoesResult.error) {
        logger.error('❌ [useProgressoGeral] Erro ao buscar visualizações:', { 
          error: visualizacoesResult.error.message,
          cartorioId: user.cartorio_id,
          userId: user.id
        });
        throw new Error(`Erro ao carregar progresso: ${visualizacoesResult.error.message}`);
      }

      const videoAulas = videoAulasResult.data || [];
      const visualizacoes = visualizacoesResult.data || [];

      // ✅ Agrupar e calcular progressos
      const progressosPorProduto: ProgressoGeral = {};
      
      // ✅ CORREÇÃO CRÍTICA: Set tipado corretamente
      const completedVideos = new Set<string>(
        visualizacoes
          .map(v => v.video_aula_id)
          .filter((id): id is string => typeof id === 'string' && id.length > 0)
      );

      // Inicializar contadores por produto
      videoAulas.forEach(video => {
        if (!video.produto_id) return; // Skip se não tiver produto_id
        
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

      logger.info('🎯 [useProgressoGeral] Progresso calculado com sucesso:', {
        cartorioId: user.cartorio_id,
        userId: user.id,
        totalVideoAulas: videoAulas.length,
        totalVisualizacoes: visualizacoes.length,
        produtosComProgresso: Object.keys(progressosPorProduto).length,
        resumo: Object.entries(progressosPorProduto).slice(0, 3).map(([id, prog]) => ({
          produtoId: id,
          progresso: `${prog.completas}/${prog.total} (${prog.percentual}%)`
        }))
      });

      setProgressos(progressosPorProduto);

    } catch (error) {
      logger.error('❌ [useProgressoGeral] Erro inesperado:', { 
        error,
        cartorioId: user?.cartorio_id,
        userId: user?.id
      });
      
      const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar progresso';
      setError(errorMessage);
      setProgressos({}); // Reset em caso de erro
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Effect com dependências específicas
  useEffect(() => {
    if (user?.cartorio_id && user?.id) {
      calcularProgressos();
    } else {
      setIsLoading(false);
      setProgressos({});
    }
  }, [user?.cartorio_id, user?.id, refreshKey]);

  return {
    progressos,
    isLoading,
    error,
    refetch: calcularProgressos
  };
};

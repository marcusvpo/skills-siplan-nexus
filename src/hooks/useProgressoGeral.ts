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
    // ✅ Verificação consolidada de autenticação
    if (!user?.cartorio_id || !user?.id) {
      console.log('⚠️ [useProgressoGeral] Aguardando autenticação completa...');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('🔍 [useProgressoGeral] Buscando dados para:', {
        cartorioId: user.cartorio_id,
        userId: user.id
      });

      // ✅ Buscar videoaulas e visualizações em paralelo para melhor performance
      const [videoAulasResult, visualizacoesResult] = await Promise.all([
        // Buscar todas as videoaulas com seus produtos
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
        console.error('❌ Erro ao buscar videoaulas:', videoAulasResult.error);
        throw new Error(`Erro ao carregar videoaulas: ${videoAulasResult.error.message}`);
      }

      if (visualizacoesResult.error) {
        console.error('❌ Erro ao buscar visualizações:', visualizacoesResult.error);
        throw new Error(`Erro ao carregar progresso: ${visualizacoesResult.error.message}`);
      }

      const videoAulas = videoAulasResult.data || [];
      const visualizacoes = visualizacoesResult.data || [];

      // ✅ Agrupar e calcular progressos
      const progressosPorProduto: ProgressoGeral = {};
      const completedVideos = new Set(visualizacoes.map(v => v.video_aula_id));

      // Inicializar contadores por produto
      videoAulas.forEach(video => {
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

      console.log('🎯 [useProgressoGeral] Progresso calculado:', {
        cartorioId: user.cartorio_id,
        userId: user.id,
        totalVideoAulas: videoAulas.length,
        totalVisualizacoes: visualizacoes.length,
        produtosComProgresso: Object.keys(progressosPorProduto).length,
        resumo: Object.entries(progressosPorProduto).map(([id, prog]) => ({
          produtoId: id,
          progresso: `${prog.completas}/${prog.total} (${prog.percentual}%)`
        }))
      });

      setProgressos(progressosPorProduto);

    } catch (error) {
      console.error('❌ [useProgressoGeral] Erro:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar progresso');
      setProgressos({}); // Reset em caso de erro
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Effect com dependências mais específicas
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

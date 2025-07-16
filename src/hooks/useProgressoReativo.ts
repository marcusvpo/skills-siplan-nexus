
import { useState, useEffect, useCallback } from 'react';
import { executeRPCWithCartorioContext } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ProgressResult {
  total_aulas: number;
  aulas_concluidas: number;
  percentual: number;
}

export const useProgressoReativo = (produtoId?: string, refreshKey: number = 0) => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [totalAulas, setTotalAulas] = useState(0);
  const [aulasCompletas, setAulasCompletas] = useState(0);
  const [percentual, setPercentual] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cartorioId = user?.cartorio_id;

  console.log('🟢 [useProgressoReativo] Hook state:', { 
    produtoId, 
    cartorioId, 
    isAuthenticated, 
    authLoading,
    refreshKey 
  });

  const calcularProgresso = useCallback(async () => {
    // AGUARDAR autenticação estar completamente resolvida
    if (authLoading) {
      console.log('⏳ [useProgressoReativo] Aguardando autenticação...');
      setIsLoading(true);
      return;
    }

    // SÓ prosseguir se autenticado E com dados necessários
    if (!isAuthenticated || !cartorioId || !produtoId) {
      console.log('⚠️ [useProgressoReativo] Não autenticado ou dados faltando:', {
        isAuthenticated,
        cartorioId: !!cartorioId,
        produtoId: !!produtoId
      });
      
      // Se não autenticado, zerar dados e marcar como não carregando
      setTotalAulas(0);
      setAulasCompletas(0);
      setPercentual(0);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔄 [useProgressoReativo] Calculando progresso para produto:', produtoId);

      // Remover verificações redundantes de sessão - confiar no contexto de auth
      const resultado = await executeRPCWithCartorioContext('get_product_progress', {
        p_produto_id: produtoId,
        p_cartorio_id: cartorioId
      }) as ProgressResult;

      console.log('✅ [useProgressoReativo] Progresso calculado:', resultado);

      const total = resultado?.total_aulas || 0;
      const completas = resultado?.aulas_concluidas || 0;
      const percent = resultado?.percentual || 0;

      setTotalAulas(total);
      setAulasCompletas(completas);
      setPercentual(percent);

      console.log('🎯 [useProgressoReativo] Estado atualizado:', { 
        total, 
        completas, 
        percent 
      });

    } catch (error: any) {
      console.error('❌ [useProgressoReativo] Erro ao calcular progresso:', error);
      
      // Não assumir problemas de autenticação - confiar no contexto
      setError('Erro ao carregar progresso. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }, [cartorioId, produtoId, isAuthenticated, authLoading]);

  // Função para marcar vídeo como completo e recalcular
  const marcarVideoCompleto = useCallback(async (videoId: string, completo: boolean) => {
    console.log('🔄 [useProgressoReativo] Marcando vídeo e recalculando:', { videoId, completo });
    
    // Aguardar um pouco para a visualização ser registrada
    setTimeout(() => {
      calcularProgresso();
    }, 500);
  }, [calcularProgresso]);

  // Function to check if a specific video is completed
  const isVideoCompleto = useCallback((videoId: string): boolean => {
    // This would need to be implemented with additional data
    // For now, return false as placeholder
    return false;
  }, []);

  // Effect principal: SÓ executar quando autenticação estiver resolvida
  useEffect(() => {
    // Se ainda carregando auth, não fazer nada
    if (authLoading) {
      console.log('⏳ [useProgressoReativo] Auth ainda carregando, aguardando...');
      return;
    }

    // Agora que auth está resolvida, calcular progresso
    calcularProgresso();
  }, [calcularProgresso, refreshKey, authLoading]);

  return {
    totalAulas,
    aulasCompletas,
    percentual,
    isLoading,
    error,
    marcarVideoCompleto,
    isVideoCompleto,
    refetch: calcularProgresso
  };
};

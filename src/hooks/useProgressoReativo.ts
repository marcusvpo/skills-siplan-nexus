
import { useState, useEffect, useCallback } from 'react';
import { executeRPCWithCartorioContext } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useProgressoReativo = (produtoId?: string, refreshKey: number = 0) => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [totalAulas, setTotalAulas] = useState(0);
  const [aulasCompletas, setAulasCompletas] = useState(0);
  const [percentual, setPercentual] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cartorioId = user?.cartorio_id;

  console.log('🟢 [useProgressoReativo] Hook iniciado:', { 
    produtoId, 
    cartorioId, 
    isAuthenticated, 
    authLoading,
    refreshKey 
  });

  const calcularProgresso = useCallback(async () => {
    // Aguardar autenticação completa
    if (!isAuthenticated || authLoading || !cartorioId || !produtoId) {
      console.log('⏳ [useProgressoReativo] Aguardando autenticação completa...');
      setIsLoading(true);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔄 [useProgressoReativo] Calculando progresso para produto:', produtoId);

      // Usar função robusta que garante autenticação
      const resultado = await executeRPCWithCartorioContext('get_product_progress', {
        p_produto_id: produtoId,
        p_cartorio_id: cartorioId
      });

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
      
      if (error.message?.includes('Sessão expirada') || error.message?.includes('Token')) {
        setError('Sessão expirada. Faça login novamente.');
      } else {
        setError('Erro ao carregar progresso');
      }
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

  // Effect principal para calcular progresso
  useEffect(() => {
    calcularProgresso();
  }, [calcularProgresso, refreshKey]);

  return {
    totalAulas,
    aulasCompletas,
    percentual,
    isLoading,
    error,
    marcarVideoCompleto,
    refetch: calcularProgresso
  };
};

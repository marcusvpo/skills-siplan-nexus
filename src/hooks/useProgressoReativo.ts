import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ProgressoReativo {
  totalAulas: number;
  aulasCompletas: number;
  percentual: number;
  videosCompletos: Set<string>;
  isLoading: boolean;
  error: string | null;
}

export const useProgressoReativo = (produtoId?: string, forceRefresh?: number) => {
  console.log('🟡 [useProgressoReativo] Hook iniciado com produtoId:', produtoId, 'forceRefresh:', forceRefresh);
  
  const { user, isLoading: authLoading } = useAuth();
  const [progresso, setProgresso] = useState<ProgressoReativo>({
    totalAulas: 0,
    aulasCompletas: 0,
    percentual: 0,
    videosCompletos: new Set(),
    isLoading: true,
    error: null
  });

  // ✅ FORCE reset quando produtoId mudar
  useEffect(() => {
    console.log('🔄 [useProgressoReativo] RESET - produtoId mudou:', produtoId);
    setProgresso({
      totalAulas: 0,
      aulasCompletas: 0,
      percentual: 0,
      videosCompletos: new Set(),
      isLoading: true,
      error: null
    });
  }, [produtoId, forceRefresh]);

  const cartorioId = user?.cartorio_id;
  console.log('🟡 [useProgressoReativo] Auth state:', { cartorioId, authLoading, userType: user?.type });

  const carregarProgresso = useCallback(async () => {
    console.log('🟡 [useProgressoReativo] carregarProgresso chamado:', { cartorioId, produtoId, authLoading });
    
    // ✅ CONDIÇÕES MAIS RIGOROSAS
    if (authLoading) {
      console.log('🟡 [useProgressoReativo] Aguardando autenticação...');
      return;
    }

    if (!user || !cartorioId) {
      console.log('❌ [useProgressoReativo] Usuário não autenticado');
      setProgresso(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Usuário não autenticado' 
      }));
      return;
    }

    if (!produtoId) {
      console.log('⏳ [useProgressoReativo] Aguardando produtoId...');
      // NÃO define loading como false aqui - continua aguardando
      return;
    }

    try {
      console.log('🟡 [useProgressoReativo] Iniciando carregamento...');
      setProgresso(prev => ({ ...prev, isLoading: true, error: null }));

      // Verificar se o produto existe
      const { data: produto, error: produtoError } = await supabase
        .from('produtos')
        .select('id, nome')
        .eq('id', produtoId)
        .single();

      if (produtoError || !produto) {
        console.log('❌ [useProgressoReativo] Produto não encontrado:', produtoId);
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

      // Buscar todas as videoaulas do produto
      const { data: videoAulas, error: videoError } = await supabase
        .from('video_aulas')
        .select('id')
        .eq('produto_id', produtoId)
        .order('ordem');

      if (videoError) throw videoError;

      const totalAulas = videoAulas?.length || 0;
      const videoIds = videoAulas?.map(v => v.id) || [];
      console.log('🟡 [useProgressoReativo] VideoAulas encontradas:', { totalAulas, videoIds });

      if (totalAulas === 0) {
        console.log('🟡 [useProgressoReativo] Nenhuma videoaula encontrada');
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

      // ✅ CORREÇÃO: Buscar visualizações completas com query direta incluindo user_id
      console.log('🔍 [useProgressoReativo] Buscando visualizações para cartório:', cartorioId, 'usuário:', user.id);
      
      // ✅ USAR user_id do contexto ao invés de supabase.auth.getUser()
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      const { data: visualizacoes, error: visualError } = await supabase
        .from('visualizacoes_cartorio')
        .select('video_aula_id, completo')
        .eq('cartorio_id', cartorioId)
        .eq('user_id', user.id)
        .eq('completo', true)
        .in('video_aula_id', videoIds);

      if (visualError) throw visualError;

      const videosCompletos = new Set(visualizacoes?.map(v => v.video_aula_id) || []);
      const aulasCompletas = videosCompletos.size;
      const percentual = totalAulas > 0 ? Math.round((aulasCompletas / totalAulas) * 100) : 0;
      
      console.log('🟡 [useProgressoReativo] Progresso calculado:', {
        totalAulas,
        aulasCompletas,
        percentual,
        videosCompletos: Array.from(videosCompletos)
      });

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
  }, [cartorioId, produtoId, authLoading, user, forceRefresh]);

  const marcarVideoCompleto = (videoId: string, completo: boolean) => {
    console.log('🟡 [useProgressoReativo] marcarVideoCompleto chamado:', { videoId, completo });
    
    setProgresso(prev => {
      console.log('🟡 [useProgressoReativo] Estado anterior:', {
        totalAulas: prev.totalAulas,
        aulasCompletas: prev.aulasCompletas,
        percentual: prev.percentual,
        videosCompletos: Array.from(prev.videosCompletos)
      });
      
      const novosVideosCompletos = new Set(prev.videosCompletos);
      
      if (completo) {
        novosVideosCompletos.add(videoId);
      } else {
        novosVideosCompletos.delete(videoId);
      }

      const novasAulasCompletas = novosVideosCompletos.size;
      const novoPercentual = prev.totalAulas > 0 ? Math.round((novasAulasCompletas / prev.totalAulas) * 100) : 0;

      const novoEstado = {
        ...prev,
        aulasCompletas: novasAulasCompletas,
        percentual: novoPercentual,
        videosCompletos: novosVideosCompletos
      };
      
      console.log('🟡 [useProgressoReativo] Novo estado:', {
        totalAulas: novoEstado.totalAulas,
        aulasCompletas: novoEstado.aulasCompletas,
        percentual: novoEstado.percentual,
        videosCompletos: Array.from(novoEstado.videosCompletos)
      });

      return novoEstado;
    });
    
    // Recarregar dados do banco após pequeno delay para garantir sincronização
    setTimeout(() => {
      console.log('🟡 [useProgressoReativo] Recarregando dados após marcar como completo');
      carregarProgresso();
    }, 500);
  };

  const isVideoCompleto = (videoId: string) => {
    return progresso.videosCompletos.has(videoId);
  };

  useEffect(() => {
    console.log('🟡 [useProgressoReativo] useEffect executado:', { produtoId, cartorioId, authLoading });
    carregarProgresso();
  }, [carregarProgresso]); // ✅ DEPENDÊNCIAS CORRETAS

  const result = {
    ...progresso,
    marcarVideoCompleto,
    isVideoCompleto,
    recarregar: carregarProgresso,
    forceRefresh: () => {
      console.log('🔄 [useProgressoReativo] Force refresh chamado');
      carregarProgresso();
    }
  };
  
  console.log('🟡 [useProgressoReativo] Retornando:', {
    totalAulas: result.totalAulas,
    aulasCompletas: result.aulasCompletas,
    percentual: result.percentual,
    isLoading: result.isLoading,
    error: result.error
  });
  
  return result;
};
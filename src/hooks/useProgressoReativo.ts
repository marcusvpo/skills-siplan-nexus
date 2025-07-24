import { useState, useEffect, useCallback } from 'react';
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

  // Reset quando produtoId mudar
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

  // 🔧 FUNÇÃO ALTERNATIVA: Usar Edge Function se queries diretas falharem
  const buscarProgressoViaEdgeFunction = async () => {
    console.log('🔧 [useProgressoReativo] Tentando Edge Function...');
    
    const token = localStorage.getItem('siplan-auth-token');
    if (!token) {
      throw new Error('Token de autenticação não encontrado');
    }

    try {
      const response = await fetch('https://bnulocsnxiffavvabfdj.supabase.co/functions/v1/get-product-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          produtoId: produtoId,
          cartorioId: cartorioId,
          userId: user?.id
        })
      });

      if (!response.ok) {
        throw new Error(`Edge Function error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ [useProgressoReativo] Edge Function failed:', error);
      throw error;
    }
  };

  const carregarProgresso = useCallback(async () => {
    console.log('🟡 [useProgressoReativo] carregarProgresso chamado:', { cartorioId, produtoId, authLoading });
    
    // Condições de validação
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
      return;
    }

    try {
      console.log('🟡 [useProgressoReativo] Iniciando carregamento...');
      setProgresso(prev => ({ ...prev, isLoading: true, error: null }));

      // 🔧 CORREÇÃO: Tentar queries diretas primeiro, fallback para Edge Function
      let dadosProgresso = null;
      
      try {
        console.log('🔧 [useProgressoReativo] Tentando queries diretas ao Supabase...');
        
        // ✅ REMOÇÃO: Não usar .setHeader() - o interceptor deve cuidar disso
        // Verificar se o produto existe
        const { data: produto, error: produtoError } = await supabase
          .from('produtos')
          .select('id, nome')
          .eq('id', produtoId)
          .single();

        if (produtoError) {
          // Se falhar com erro 401, indica problema de chave/RLS
          if (produtoError.message?.includes('Invalid API key') || produtoError.message?.includes('401')) {
            console.warn('⚠️ [useProgressoReativo] Query direta falhou - tentando Edge Function');
            dadosProgresso = await buscarProgressoViaEdgeFunction();
          } else {
            throw produtoError;
          }
        } else if (!produto) {
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
        } else {
          // Query direta funcionou, continuar com ela
          console.log('✅ [useProgressoReativo] Produto encontrado via query direta:', produto.nome);
          
          // Buscar videoaulas do produto
          const { data: videoAulas, error: videoError } = await supabase
            .from('video_aulas')
            .select('id')
            .eq('produto_id', produtoId)
            .order('ordem');

          if (videoError) throw videoError;

          const totalAulas = videoAulas?.length || 0;
          const videoIds = videoAulas?.map(v => v.id) || [];
          
          console.log('🟡 [useProgressoReativo] VideoAulas encontradas via query direta:', { totalAulas, videoIds });

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
          console.log('🔍 [useProgressoReativo] Buscando visualizações para cartório:', cartorioId, 'usuário:', user.id);
          
          const { data: visualizacoes, error: visualError } = await supabase
            .from('visualizacoes_cartorio')
            .select('video_aula_id, completo')
            .eq('cartorio_id', cartorioId)
            .eq('user_id', user.id)
            .eq('completo', true)
            .in('video_aula_id', videoIds);

          if (visualError) throw visualError;

          dadosProgresso = {
            totalAulas,
            videoIds,
            visualizacoes: visualizacoes || []
          };
        }
      } catch (directQueryError) {
        console.warn('⚠️ [useProgressoReativo] Queries diretas falharam, tentando Edge Function:', directQueryError);
        dadosProgresso = await buscarProgressoViaEdgeFunction();
      }

      // Processar dados (vindos de query direta ou Edge Function)
      if (dadosProgresso) {
        const { totalAulas, videoIds, visualizacoes } = dadosProgresso;
        
        const videosCompletos = new Set(visualizacoes?.map((v: any) => v.video_aula_id) || []);
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
      }

    } catch (error) {
      console.error('❌ [useProgressoReativo] Erro crítico ao carregar progresso:', error);
      setProgresso(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro ao carregar progresso'
      }));
    }
  }, [cartorioId, produtoId, authLoading, user, forceRefresh]);

  // 🔧 FUNÇÃO PARA MARCAR VÍDEO COMO COMPLETO - Usar Edge Function
  const marcarVideoCompleto = async (videoId: string, completo: boolean) => {
    console.log('🟡 [useProgressoReativo] marcarVideoCompleto chamado:', { videoId, completo });
    
    // Atualização otimista da UI
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

    // Salvar no banco via Edge Function (mais confiável)
    try {
      const token = localStorage.getItem('siplan-auth-token');
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      const response = await fetch('https://bnulocsnxiffavvabfdj.supabase.co/functions/v1/mark-lesson-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          videoAulaId: videoId,
          completo: completo,
          progressoSegundos: completo ? 100 : 0 // Valor simbólico
        })
      });

      if (!response.ok) {
        throw new Error(`Erro ao salvar progresso: ${response.status}`);
      }

      console.log('✅ [useProgressoReativo] Progresso salvo no banco via Edge Function');
      
      // Recarregar dados após salvar
      setTimeout(() => {
        console.log('🔄 [useProgressoReativo] Recarregando dados após salvar');
        carregarProgresso();
      }, 500);

    } catch (error) {
      console.error('❌ [useProgressoReativo] Erro ao salvar progresso:', error);
      // Reverter otimistic update em caso de erro
      carregarProgresso();
    }
  };

  const isVideoCompleto = (videoId: string) => {
    return progresso.videosCompletos.has(videoId);
  };

  useEffect(() => {
    console.log('🟡 [useProgressoReativo] useEffect executado:', { produtoId, cartorioId, authLoading });
    carregarProgresso();
  }, [carregarProgresso]);

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

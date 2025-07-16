
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useProgressoReativo } from '@/hooks/useProgressoReativo';

interface VideoProgressButtonProps {
  videoAulaId: string;
  videoTitle?: string;
  produtoId?: string;
  onProgressChange?: (videoId: string, completo: boolean) => void;
}

export const VideoProgressButton: React.FC<VideoProgressButtonProps> = ({ 
  videoAulaId,
  videoTitle = 'esta videoaula',
  produtoId,
  onProgressChange
}) => {
  console.log('🔵 [VideoProgressButton] Componente renderizado:', { 
    videoAulaId, 
    videoTitle,
    produtoId,
    onProgressChange: !!onProgressChange
  });
  
  // Obtém dados do usuário autenticado e status de autenticação do AuthContextFixed
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  // Estados locais do componente
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // O ID do cartório, obtido do user do AuthContextFixed
  const cartorioId = user?.cartorio_id;
  
  console.log('🔵 [VideoProgressButton] Estado inicial:', {
    cartorioId,
    isAuthenticated,
    authLoading,
    isCompleted,
    isLoading,
    isChecking
  });

  // Efeito para verificar o progresso inicial da videoaula
  useEffect(() => {
    // Só prossegue se o usuário estiver autenticado e os dados estiverem disponíveis
    if (!isAuthenticated || authLoading || !cartorioId || !videoAulaId) {
      if (!authLoading) {
        setIsChecking(false);
      }
      return;
    }

    const checkProgress = async () => {
      setIsChecking(true);
      try {
        console.log('🔍 [VideoProgressButton] Checking progress:', {
          cartorioId,
          videoAulaId,
          isAuthenticated,
          userType: user?.type
        });

        // ✅ CORREÇÃO: Usar query direta para verificar progresso
        console.log('🔍 [VideoProgressButton] Verificando progresso com query direta:', {
          cartorioId,
          videoAulaId
        });

        const { data, error } = await supabase
          .from('visualizacoes_cartorio')
          .select('completo')
          .eq('video_aula_id', videoAulaId)
          .eq('cartorio_id', cartorioId)
          .maybeSingle();

        if (error) {
          console.error('❌ [VideoProgressButton] Erro ao verificar progresso:', error);
        } else {
          console.log('✅ [VideoProgressButton] Progresso encontrado:', data);
          setIsCompleted(data?.completo || false);
        }
      } catch (error) {
        console.error('❌ [VideoProgressButton] Erro inesperado:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkProgress();
  }, [cartorioId, videoAulaId, isAuthenticated, authLoading, user?.type]);

  // Função para marcar/desmarcar a videoaula como concluída
  const toggleCompletion = async () => {
    console.log('🔵 [VideoProgressButton] toggleCompletion chamado:', { cartorioId, videoAulaId, isLoading });
    
    if (!cartorioId || !videoAulaId || isLoading) return;

    setIsLoading(true);

    try {
      const newCompletedState = !isCompleted;
      console.log('🔵 [VideoProgressButton] Novo estado:', { newCompletedState, isCompleted });

      console.log('🔄 [VideoProgressButton] Registrando visualização:', {
        cartorioId,
        videoAulaId,
        newCompletedState,
        userType: user?.type,
        isAuthenticated,
        hasUser: !!user
      });

      // Verificar se o usuário está autenticado
      if (!isAuthenticated || !cartorioId) {
        console.error('❌ [VideoProgressButton] Usuário não autenticado ou cartório não identificado', {
          isAuthenticated,
          cartorioId,
          userType: user?.type
        });
        toast({
          title: "Erro de autenticação",
          description: "Faça login para marcar o progresso das videoaulas.",
          variant: "destructive",
        });
        return;
      }

      // ✅ CORREÇÃO: Usar função robusta com RLS configurado
      console.log('🔄 [VideoProgressButton] Configurando contexto do cartório e registrando visualização:', {
        cartorio_id: cartorioId,
        video_aula_id: videoAulaId,
        completo: newCompletedState,
        concluida: newCompletedState
      });

      // Primeiro, setar o contexto do cartório para RLS
      const { error: contextError } = await supabase.rpc('set_cartorio_context', {
        p_cartorio_id: cartorioId
      });

      if (contextError) {
        console.error('❌ [VideoProgressButton] Erro ao setar contexto:', contextError);
        toast({
          title: "Erro",
          description: "Erro ao configurar contexto do cartório",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ [VideoProgressButton] Contexto do cartório configurado com sucesso');

      // Testar se o contexto foi setado corretamente
      const { data: testCartorioId, error: testError } = await supabase.rpc('get_current_cartorio_id_from_jwt');
      console.log('🔍 [VideoProgressButton] Contexto após setar:', testCartorioId);
      
      if (testError) {
        console.error('❌ [VideoProgressButton] Erro ao testar contexto:', testError);
      }

      // Usar a função de teste para verificar múltiplas fontes de contexto
      const { data: contextTest, error: contextTestError } = await supabase.rpc('test_cartorio_context');
      
      if (contextTestError) {
        console.error('❌ [VideoProgressButton] Erro ao testar contexto completo:', contextTestError);
      } else {
        console.log('✅ [VideoProgressButton] Teste de contexto completo:', contextTest);
      }

      // Usar a nova função robusta para registrar visualização
      const { data, error } = await supabase.rpc('registrar_visualizacao_cartorio_robust', {
        p_video_aula_id: videoAulaId,
        p_completo: newCompletedState,
        p_concluida: newCompletedState,
        p_data_conclusao: newCompletedState ? new Date().toISOString() : null,
      });

      if (error) {
        console.error('❌ [VideoProgressButton] Erro RPC:', error);
        console.error('❌ [VideoProgressButton] Detalhes do erro:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        // Se o RPC falhar, mostrar toast informativo
        toast({
          title: "Erro",
          description: "Não foi possível atualizar o progresso. Verifique sua conexão e tente novamente.",
          variant: "destructive",
        });
        
        return;
      }

      // Verificar se a função retornou sucesso
      const result = data as { success: boolean; error?: string; debug?: string };
      if (result && !result.success) {
        console.error('❌ [VideoProgressButton] Erro retornado pela função:', result);
        console.error('❌ [VideoProgressButton] Debug da função:', result.debug || 'Sem debug');
        toast({
          title: "Erro",
          description: result.error || "Erro desconhecido ao atualizar progresso",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ [VideoProgressButton] Visualização registrada:', data);
      setIsCompleted(newCompletedState);

      // ✅ SEMPRE notificar mudança de progresso
      if (onProgressChange) {
        console.log('🔵 [VideoProgressButton] Chamando onProgressChange:', { videoAulaId, newCompletedState });
        onProgressChange(videoAulaId, newCompletedState);
      } else {
        console.log('🔵 [VideoProgressButton] onProgressChange não fornecido - progresso local atualizado');
      }

      toast({
        title: newCompletedState ? "Videoaula concluída!" : "Videoaula desmarcada",
        description: newCompletedState 
          ? `Você marcou "${videoTitle}" como concluída.`
          : `Você desmarcou "${videoTitle}" como concluída.`,
      });

    } catch (error) {
      console.error('❌ [VideoProgressButton] Erro ao atualizar progresso:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o progresso da videoaula.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Condição para não renderizar o botão
  if (!isAuthenticated || authLoading || !cartorioId) {
    if (authLoading) {
      return (
        <Button disabled className="w-full">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Autenticando...
        </Button>
      );
    }
    return (
      <Button disabled className="w-full">
        <Circle className="mr-2 h-4 w-4" />
        Faça login para marcar progresso
      </Button>
    );
  }

  // Estado de carregamento enquanto verifica o progresso inicial
  if (isChecking) {
    return (
      <Button disabled className="w-full">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Verificando progresso...
      </Button>
    );
  }

  // Renderização final do botão "Marcar como Concluída"
  return (
    <Button
      onClick={toggleCompletion}
      disabled={isLoading}
      className={`w-full ${
        isCompleted 
          ? 'bg-green-600 hover:bg-green-700 text-white' 
          : 'bg-red-600 hover:bg-red-700 text-white'
      }`}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Atualizando...
        </>
      ) : isCompleted ? (
        <>
          <CheckCircle className="mr-2 h-4 w-4" />
          Concluída
        </>
      ) : (
        <>
          <Circle className="mr-2 h-4 w-4" />
          Marcar como Concluída
        </>
      )}
    </Button>
  );
};

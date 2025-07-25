import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
// Importa useAuth da versão FIXA
import { useAuth } from '@/contexts/AuthContextFixed'; 
import { toast } from '@/hooks/use-toast';
import { useProgressContext } from '@/contexts/ProgressContext';

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
  
  // Obtém funcionalidades do contexto de progresso para forçar refresh
  const { refreshAll } = useProgressContext();
  
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

        // ✅ Usar nova tabela user_video_progress
        if (!user?.id) {
          console.error('❌ [VideoProgressButton] Usuário não autenticado para verificação');
          return;
        }

        const { data, error } = await supabase
          .from('user_video_progress')
          .select('completed')
          .eq('video_aula_id', videoAulaId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('❌ [VideoProgressButton] Erro ao verificar progresso:', error);
        } else {
          console.log('✅ [VideoProgressButton] Progresso encontrado:', data);
          setIsCompleted(data?.completed || false);
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

      // ✅ Usar nova tabela user_video_progress diretamente
      console.log('🔄 [VideoProgressButton] Salvando progresso na nova tabela:', {
        user_id: user.id,
        video_aula_id: videoAulaId,
        completed: newCompletedState
      });

      const { data, error } = await supabase
        .from('user_video_progress')
        .upsert({
          user_id: user.id,
          video_aula_id: videoAulaId,
          completed: newCompletedState,
          completed_at: newCompletedState ? new Date().toISOString() : null
        }, {
          onConflict: 'user_id,video_aula_id'
        })
        .select('id')
        .single();

      if (error) {
        console.error('❌ [VideoProgressButton] Erro ao salvar progresso:', error);
        toast({
          title: "Erro",
          description: "Não foi possível atualizar o progresso. Verifique sua conexão e tente novamente.",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ [VideoProgressButton] Progresso salvo com sucesso:', data);
      setIsCompleted(newCompletedState);

      // ✅ Refresh all progress contexts to update UI immediately
      refreshAll();

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
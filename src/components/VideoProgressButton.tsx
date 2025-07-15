
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContextFixed';
import { toast } from '@/hooks/use-toast';
import { useVideoProgress } from '@/components/product/VideoProgressContext';

interface VideoProgressButtonProps {
  videoAulaId: string;
  videoTitle?: string;
}

export const VideoProgressButton: React.FC<VideoProgressButtonProps> = ({ 
  videoAulaId,
  videoTitle = 'esta videoaula'
}) => {
  // Obtém dados do usuário autenticado e status de autenticação do AuthContextFixed
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  // Context para atualizar progresso
  const { refreshProgress } = useVideoProgress();
  
  // Estados locais do componente
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // O ID do usuário do cartório, obtido do user do AuthContextFixed
  const userId = user?.id;

  // Efeito para verificar o progresso inicial da videoaula
  useEffect(() => {
    // Só prossegue se o usuário estiver autenticado e os dados estiverem disponíveis
    if (!isAuthenticated || authLoading || !userId || !videoAulaId) {
      if (!authLoading) {
        setIsChecking(false);
      }
      return;
    }

    const checkProgress = async () => {
      setIsChecking(true);
      try {
        const { data, error } = await supabase
          .from('user_video_progress')
          .select('completed')
          .eq('user_id', userId)
          .eq('video_aula_id', videoAulaId)
          .maybeSingle();

        if (error) {
          console.error('Erro ao verificar progresso da videoaula:', error);
        } else {
          setIsCompleted(data?.completed || false);
        }
      } catch (error) {
        console.error('Erro inesperado ao verificar progresso:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkProgress();
  }, [userId, videoAulaId, isAuthenticated, authLoading]);

  // Função para marcar/desmarcar a videoaula como concluída
  const toggleCompletion = async () => {
    if (!userId || !videoAulaId || isLoading) return;

    setIsLoading(true);

    try {
      const newCompletedState = !isCompleted;

      const { error } = await supabase
        .from('user_video_progress')
        .upsert({
          user_id: userId,
          video_aula_id: videoAulaId,
          completed: newCompletedState,
          completed_at: newCompletedState ? new Date().toISOString() : null
        }, {
          onConflict: 'user_id,video_aula_id'
        });

      if (error) {
        throw error;
      }

      setIsCompleted(newCompletedState);

      // Atualizar progresso em tempo real
      refreshProgress();

      toast({
        title: newCompletedState ? "Videoaula concluída!" : "Videoaula desmarcada",
        description: newCompletedState 
          ? `Você marcou "${videoTitle}" como concluída.`
          : `Você desmarcou "${videoTitle}" como concluída.`,
      });

    } catch (error) {
      console.error('Erro ao atualizar progresso:', error);
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
  if (!isAuthenticated || authLoading || !userId) {
    if (authLoading) {
      return (
        <Button disabled className="w-full">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Autenticando...
        </Button>
      );
    }
    return null;
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

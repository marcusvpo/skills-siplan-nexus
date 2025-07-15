
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContextFixed';
import { toast } from '@/hooks/use-toast';

interface VideoProgressButtonProps {
  videoAulaId: string;
  videoTitle?: string;
}

export const VideoProgressButton: React.FC<VideoProgressButtonProps> = ({
  videoAulaId,
  videoTitle = 'esta videoaula'
}) => {
  const { user } = useAuth();
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Verificar se a videoaula já foi concluída
  useEffect(() => {
    const checkProgress = async () => {
      if (!user?.id || !videoAulaId) {
        setIsChecking(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_video_progress')
          .select('completed')
          .eq('user_id', user.id)
          .eq('video_aula_id', videoAulaId)
          .maybeSingle();

        if (error) {
          console.error('Erro ao verificar progresso:', error);
        } else {
          setIsCompleted(data?.completed || false);
        }
      } catch (error) {
        console.error('Erro ao verificar progresso:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkProgress();
  }, [user?.id, videoAulaId]);

  // Marcar/desmarcar como concluída
  const toggleCompletion = async () => {
    if (!user?.id || !videoAulaId || isLoading) return;

    setIsLoading(true);
    
    try {
      const newCompletedState = !isCompleted;
      
      const { error } = await supabase
        .from('user_video_progress')
        .upsert({
          user_id: user.id,
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

  // Não renderizar se não há usuário autenticado
  if (!user?.id) {
    return null;
  }

  // Loading state enquanto verifica o progresso
  if (isChecking) {
    return (
      <Button variant="outline" disabled className="w-full">
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Verificando progresso...
      </Button>
    );
  }

  return (
    <Button
      onClick={toggleCompletion}
      disabled={isLoading}
      className={`w-full transition-all duration-200 ${
        isCompleted 
          ? 'bg-green-600 hover:bg-green-700 text-white' 
          : 'bg-gray-600 hover:bg-gray-700 text-white'
      }`}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Atualizando...
        </>
      ) : isCompleted ? (
        <>
          <CheckCircle className="h-4 w-4 mr-2" />
          Concluída
        </>
      ) : (
        <>
          <Circle className="h-4 w-4 mr-2" />
          Marcar como Concluída
        </>
      )}
    </Button>
  );
};

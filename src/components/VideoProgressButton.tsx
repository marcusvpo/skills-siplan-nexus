
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface VideoProgressButtonProps {
  videoAulaId: string;
  videoTitle?: string;
}

export const VideoProgressButton: React.FC<VideoProgressButtonProps> = ({
  videoAulaId,
  videoTitle = 'esta videoaula'
}) => {
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Obter o ID do usuário atual do cartório
  useEffect(() => {
    const getCurrentUserId = async () => {
      try {
        const { data, error } = await supabase.rpc('get_current_cartorio_usuario_id');
        
        if (error) {
          console.error('Erro ao obter ID do usuário:', error);
          return;
        }

        if (data) {
          setCurrentUserId(data);
        }
      } catch (error) {
        console.error('Erro ao obter ID do usuário:', error);
      }
    };

    getCurrentUserId();
  }, []);

  // Verificar se a videoaula já foi concluída
  useEffect(() => {
    const checkProgress = async () => {
      if (!currentUserId || !videoAulaId) {
        setIsChecking(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_video_progress')
          .select('completed')
          .eq('user_id', currentUserId)
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
  }, [currentUserId, videoAulaId]);

  // Marcar/desmarcar como concluída
  const toggleCompletion = async () => {
    if (!currentUserId || !videoAulaId || isLoading) return;

    setIsLoading(true);
    
    try {
      const newCompletedState = !isCompleted;
      
      const { error } = await supabase
        .from('user_video_progress')
        .upsert({
          user_id: currentUserId,
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
  if (!currentUserId) {
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

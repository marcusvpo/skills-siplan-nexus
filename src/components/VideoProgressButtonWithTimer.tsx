
import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle, Loader2, Clock } from 'lucide-react';
import { useVideoWatchTimer } from '@/hooks/useVideoWatchTimer';

interface VideoProgressButtonWithTimerProps {
  videoAulaId: string;
  videoTitle?: string;
  isCompleted: boolean;
  isLoading: boolean;
  onToggleCompletion: () => void;
  onTimerComplete?: () => void;
}

export const VideoProgressButtonWithTimer: React.FC<VideoProgressButtonWithTimerProps> = ({
  videoAulaId,
  videoTitle = 'esta videoaula',
  isCompleted,
  isLoading,
  onToggleCompletion,
  onTimerComplete
}) => {
  const { timeRemaining, canMarkComplete, formatTime, resetTimer } = useVideoWatchTimer(videoAulaId);

  // Resetar timer quando a aula é marcada como concluída
  React.useEffect(() => {
    if (isCompleted) {
      resetTimer();
    }
  }, [isCompleted, resetTimer]);

  // Callback quando timer é concluído
  React.useEffect(() => {
    if (canMarkComplete && onTimerComplete) {
      onTimerComplete();
    }
  }, [canMarkComplete, onTimerComplete]);

  const handleClick = () => {
    if (canMarkComplete || isCompleted) {
      onToggleCompletion();
    }
  };

  // Estado de carregamento
  if (isLoading) {
    return (
      <Button disabled className="w-full">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Atualizando...
      </Button>
    );
  }

  // Se já está concluída, mostrar botão de desconcluir
  if (isCompleted) {
    return (
      <Button
        onClick={handleClick}
        className="w-full bg-green-600 hover:bg-green-700 text-white"
      >
        <CheckCircle className="mr-2 h-4 w-4" />
        Concluída
      </Button>
    );
  }

  // Se ainda não pode marcar como concluída (timer não terminou)
  if (!canMarkComplete) {
    return (
      <Button
        disabled
        className="w-full bg-gray-600 opacity-50 cursor-not-allowed"
      >
        <Clock className="mr-2 h-4 w-4" />
        Disponível em {formatTime(timeRemaining)}
      </Button>
    );
  }

  // Timer concluído, pode marcar como concluída
  return (
    <Button
      onClick={handleClick}
      className="w-full bg-red-600 hover:bg-red-700 text-white"
    >
      <Circle className="mr-2 h-4 w-4" />
      Marcar como Concluída
    </Button>
  );
};

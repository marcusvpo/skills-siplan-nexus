
import React from 'react';
import { useUpdateProgress } from '@/hooks/useSupabaseDataFixed';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface ProgressTrackerProps {
  videoAulaId: string;
  progressoSegundos?: number;
  completo?: boolean;
  onProgressUpdate?: (progress: { progressoSegundos: number; completo: boolean }) => void;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  videoAulaId,
  progressoSegundos = 0,
  completo = false,
  onProgressUpdate
}) => {
  const { user } = useAuth();
  const updateProgressMutation = useUpdateProgress();

  const markAsComplete = async () => {
    if (!user?.cartorio_id) {
      toast({
        title: "Erro",
        description: "Usuário não identificado",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateProgressMutation.mutateAsync({
        videoAulaId,
        progressoSegundos: progressoSegundos,
        completo: true,
        cartorioId: user.cartorio_id
      });

      onProgressUpdate?.({ progressoSegundos, completo: true });
      
      toast({
        title: "Progresso salvo",
        description: "Aula marcada como concluída!",
      });
    } catch (error) {
      console.error('Error updating progress:', error);
      toast({
        title: "Erro ao salvar progresso",
        description: "Não foi possível marcar a aula como concluída.",
        variant: "destructive",
      });
    }
  };

  const updateProgress = async (newProgressoSegundos: number) => {
    if (!user?.cartorio_id) return;

    try {
      await updateProgressMutation.mutateAsync({
        videoAulaId,
        progressoSegundos: newProgressoSegundos,
        completo: completo,
        cartorioId: user.cartorio_id
      });

      onProgressUpdate?.({ progressoSegundos: newProgressoSegundos, completo });
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  return {
    markAsComplete,
    updateProgress,
    isLoading: updateProgressMutation.isPending
  };
};

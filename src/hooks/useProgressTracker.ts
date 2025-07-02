
import { useAuth } from '@/contexts/AuthContextFixed';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface UseProgressTrackerProps {
  videoAulaId: string;
  progressoSegundos?: number;
  completo?: boolean;
  onProgressUpdate?: (progress: { progressoSegundos: number; completo: boolean }) => void;
}

export const useProgressTracker = ({
  videoAulaId,
  progressoSegundos = 0,
  completo = false,
  onProgressUpdate
}: UseProgressTrackerProps) => {
  const { user } = useAuth();

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
      logger.info('📊 [useProgressTracker] Marking as complete', {
        videoAulaId,
        cartorioId: user.cartorio_id,
        progressoSegundos
      });

      const { error } = await supabase
        .from('visualizacoes_cartorio')
        .upsert({
          video_aula_id: videoAulaId,
          cartorio_id: user.cartorio_id,
          progresso_segundos: progressoSegundos,
          completo: true,
          ultima_visualizacao: new Date().toISOString()
        }, {
          onConflict: 'video_aula_id,cartorio_id'
        });

      if (error) {
        logger.error('❌ [useProgressTracker] Error marking complete:', { error });
        throw error;
      }

      onProgressUpdate?.({ progressoSegundos, completo: true });
      
      toast({
        title: "Progresso salvo",
        description: "Aula marcada como concluída!",
      });

      logger.info('✅ [useProgressTracker] Marked as complete successfully');
    } catch (error) {
      logger.error('❌ [useProgressTracker] Error updating progress:', { error });
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
      logger.info('📊 [useProgressTracker] Updating progress', {
        videoAulaId,
        cartorioId: user.cartorio_id,
        newProgressoSegundos
      });

      const { error } = await supabase
        .from('visualizacoes_cartorio')
        .upsert({
          video_aula_id: videoAulaId,
          cartorio_id: user.cartorio_id,
          progresso_segundos: newProgressoSegundos,
          completo: completo,
          ultima_visualizacao: new Date().toISOString()
        }, {
          onConflict: 'video_aula_id,cartorio_id'
        });

      if (error) {
        logger.error('❌ [useProgressTracker] Error updating progress:', { error });
        throw error;
      }

      onProgressUpdate?.({ progressoSegundos: newProgressoSegundos, completo });

      logger.info('✅ [useProgressTracker] Progress updated successfully');
    } catch (error) {
      logger.error('❌ [useProgressTracker] Error updating progress:', { error });
    }
  };

  return {
    markAsComplete,
    updateProgress,
    isLoading: false
  };
};

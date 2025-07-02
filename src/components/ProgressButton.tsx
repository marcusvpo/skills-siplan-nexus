
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContextFixed';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface ProgressButtonProps {
  videoAulaId: string;
}

export const ProgressButton: React.FC<ProgressButtonProps> = ({ videoAulaId }) => {
  const { user } = useAuth();
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [checkingProgress, setCheckingProgress] = useState(true);

  useEffect(() => {
    const checkProgress = async () => {
      if (!user?.cartorio_id || !videoAulaId) {
        setCheckingProgress(false);
        return;
      }

      try {
        logger.info('📊 [ProgressButton] Checking progress', {
          videoAulaId,
          cartorioId: user.cartorio_id
        });

        const { data: progress, error } = await supabase
          .from('visualizacoes_cartorio')
          .select('completo')
          .eq('video_aula_id', videoAulaId)
          .eq('cartorio_id', user.cartorio_id)
          .maybeSingle();

        if (error) {
          logger.error('❌ [ProgressButton] Error checking progress:', { error });
        } else {
          setIsCompleted(progress?.completo || false);
          logger.info('✅ [ProgressButton] Progress checked', {
            completo: progress?.completo || false
          });
        }
      } catch (err) {
        logger.error('❌ [ProgressButton] Unexpected error:', { error: err });
      } finally {
        setCheckingProgress(false);
      }
    };

    checkProgress();
  }, [videoAulaId, user?.cartorio_id]);

  const markAsComplete = async () => {
    if (!user?.cartorio_id || !videoAulaId) {
      toast({
        title: "Erro",
        description: "Usuário não identificado",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      logger.info('📊 [ProgressButton] Marking as complete', {
        videoAulaId,
        cartorioId: user.cartorio_id
      });

      const { error } = await supabase
        .from('visualizacoes_cartorio')
        .upsert({
          video_aula_id: videoAulaId,
          cartorio_id: user.cartorio_id,
          completo: true,
          data_conclusao: new Date().toISOString()
        }, {
          onConflict: 'video_aula_id,cartorio_id'
        });

      if (error) {
        logger.error('❌ [ProgressButton] Error marking complete:', { error });
        toast({
          title: "Erro ao salvar progresso",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setIsCompleted(true);
      
      toast({
        title: "Progresso salvo",
        description: "Aula marcada como concluída!",
      });

      logger.info('✅ [ProgressButton] Marked as complete successfully');
    } catch (err) {
      logger.error('❌ [ProgressButton] Unexpected error:', { error: err });
      toast({
        title: "Erro ao salvar progresso",
        description: "Não foi possível marcar a aula como concluída.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user?.cartorio_id) {
    return null;
  }

  if (checkingProgress) {
    return (
      <div className="flex items-center space-x-2 text-gray-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Verificando progresso...</span>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="flex items-center space-x-2 text-green-400">
        <CheckCircle2 className="h-5 w-5" />
        <span className="text-sm font-medium">Aula Concluída</span>
      </div>
    );
  }

  return (
    <Button
      onClick={markAsComplete}
      disabled={isLoading}
      size="sm"
      className="bg-green-600 hover:bg-green-700 text-white"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Salvando...
        </>
      ) : (
        <>
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Marcar como Concluída
        </>
      )}
    </Button>
  );
};


import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Play, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContextFixed';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface ProgressTrackerFixedProps {
  videoAulaId: string;
}

export const ProgressTrackerFixed: React.FC<ProgressTrackerFixedProps> = ({ videoAulaId }) => {
  const { user } = useAuth();
  const [isCompleted, setIsCompleted] = useState(false);
  const [progressSeconds, setProgressSeconds] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadProgress = async () => {
      if (!user?.cartorio_id || !videoAulaId) return;

      try {
        logger.info('📊 [ProgressTrackerFixed] Loading progress', {
          videoAulaId,
          cartorioId: user.cartorio_id
        });

        const { data: progress, error } = await supabase
          .from('visualizacoes_cartorio')
          .select('*')
          .eq('video_aula_id', videoAulaId)
          .eq('cartorio_id', user.cartorio_id)
          .maybeSingle();

        if (error) {
          logger.error('❌ [ProgressTrackerFixed] Error loading progress:', { error });
          return;
        }

        if (progress) {
          setIsCompleted(progress.completo);
          setProgressSeconds(progress.progresso_segundos || 0);
          logger.info('✅ [ProgressTrackerFixed] Progress loaded', {
            completo: progress.completo,
            progresso: progress.progresso_segundos
          });
        }
      } catch (err) {
        logger.error('❌ [ProgressTrackerFixed] Unexpected error:', { error: err });
      }
    };

    loadProgress();
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
      logger.info('📊 [ProgressTrackerFixed] Marking as complete', {
        videoAulaId,
        cartorioId: user.cartorio_id
      });

      const { error } = await supabase
        .from('visualizacoes_cartorio')
        .upsert({
          video_aula_id: videoAulaId,
          cartorio_id: user.cartorio_id,
          progresso_segundos: progressSeconds,
          completo: true,
          ultima_visualizacao: new Date().toISOString()
        }, {
          onConflict: 'video_aula_id,cartorio_id'
        });

      if (error) {
        logger.error('❌ [ProgressTrackerFixed] Error marking complete:', { error });
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

      logger.info('✅ [ProgressTrackerFixed] Marked as complete successfully');
    } catch (err) {
      logger.error('❌ [ProgressTrackerFixed] Unexpected error:', { error: err });
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

  return (
    <Card className="bg-gray-800/50 border-gray-600 w-80">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-sm flex items-center">
          {isCompleted ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-400 mr-2" />
              Aula Concluída
            </>
          ) : (
            <>
              <Clock className="h-4 w-4 text-yellow-400 mr-2" />
              Em Progresso
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {!isCompleted && (
          <Button
            onClick={markAsComplete}
            disabled={isLoading}
            size="sm"
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Salvando...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Marcar como Concluída
              </>
            )}
          </Button>
        )}
        
        {isCompleted && (
          <div className="text-center">
            <CheckCircle2 className="h-8 w-8 text-green-400 mx-auto mb-2" />
            <p className="text-sm text-green-400">
              Parabéns! Você concluiu esta aula.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

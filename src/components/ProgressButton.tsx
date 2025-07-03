// src/user/ProgressButton.tsx

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContextFixed'; // Já está aqui
import { toast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface ProgressButtonProps {
  videoAulaId: string;
}

export const ProgressButton: React.FC<ProgressButtonProps> = ({ videoAulaId }) => {
  // ATENÇÃO AQUI: authenticatedClient MUDOU PARA supabaseClient
  const { user, supabaseClient } = useAuth(); // <--- ALTERADO AQUI!
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [checkingProgress, setCheckingProgress] = useState(true);

  useEffect(() => {
    // ATENÇÃO AQUI: authenticatedClient MUDOU PARA supabaseClient
    if (!user?.cartorio_id || !videoAulaId || !supabaseClient) { // <--- ALTERADO AQUI!
      setCheckingProgress(false);
      return;
    }

    try {
      logger.info('📊 [ProgressButton] Checking progress', {
        videoAulaId,
        cartorioId: user.cartorio_id,
        hasAuthClient: !!supabaseClient // <--- ALTERADO AQUI!
      });

      // ATENÇÃO AQUI: authenticatedClient MUDOU PARA supabaseClient
      const { data: progress, error } = await supabaseClient // <--- ALTERADO AQUI!
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
  }, [videoAulaId, user?.cartorio_id, supabaseClient]); // <--- ALTERADO AQUI!

  const markAsComplete = async () => {
    // ATENÇÃO AQUI: authenticatedClient MUDOU PARA supabaseClient
    if (!user?.cartorio_id || !videoAulaId || !supabaseClient) { // <--- ALTERADO AQUI!
      toast({
        title: "Erro",
        description: "Usuário não identificado ou cliente não autenticado",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      logger.info('📊 [ProgressButton] Marking as complete', {
        videoAulaId,
        cartorioId: user.cartorio_id,
        hasAuthClient: !!supabaseClient // <--- ALTERADO AQUI!
      });

      // Dados para upsert
      const progressData = {
        video_aula_id: videoAulaId,
        cartorio_id: user.cartorio_id,
        completo: true,
        data_conclusao: new Date().toISOString()
      };

      logger.info('📊 [ProgressButton] Upserting data:', progressData);

      // ATENÇÃO AQUI: authenticatedClient MUDOU PARA supabaseClient
      const { error } = await supabaseClient // <--- ALTERADO AQUI!
        .from('visualizacoes_cartorio')
        .upsert(progressData, {
          onConflict: 'video_aula_id,cartorio_id'
        });

      if (error) {
        logger.error('❌ [ProgressButton] Error marking complete:', { 
          error,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        
        toast({
          title: "Erro ao salvar progresso",
          description: `${error.message}${error.details ? ` - ${error.details}` : ''}`,
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
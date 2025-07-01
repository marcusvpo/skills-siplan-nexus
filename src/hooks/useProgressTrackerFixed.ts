
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';

interface UseProgressTrackerProps {
  videoAulaId: string;
  progressoSegundos?: number;
  completo?: boolean;
  onProgressUpdate?: (progress: { progressoSegundos: number; completo: boolean }) => void;
}

export const useProgressTrackerFixed = ({
  videoAulaId,
  progressoSegundos = 0,
  completo = false,
  onProgressUpdate
}: UseProgressTrackerProps) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const markAsComplete = async () => {
    if (!user?.cartorio_id) {
      toast({
        title: "Erro",
        description: "Usuário não identificado",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('🎯 [useProgressTrackerFixed] Calling mark-lesson-progress:', {
        videoAulaId,
        progressoSegundos,
        cartorioId: user.cartorio_id
      });

      const { data, error } = await supabase.functions.invoke('mark-lesson-progress', {
        body: {
          videoAulaId,
          progressoSegundos,
          completo: true,
          cartorioId: user.cartorio_id
        }
      });

      if (error) {
        console.error('❌ [useProgressTrackerFixed] Function error:', error);
        throw new Error(`Erro na função: ${error.message}`);
      }

      if (!data?.success) {
        console.error('❌ [useProgressTrackerFixed] API error:', data?.error);
        throw new Error(data?.error || 'Erro desconhecido da API');
      }

      console.log('✅ [useProgressTrackerFixed] Progress marked successfully');
      
      onProgressUpdate?.({ progressoSegundos, completo: true });
      
      toast({
        title: "Sucesso",
        description: data.message || "Aula marcada como concluída!",
      });

    } catch (error) {
      console.error('❌ [useProgressTrackerFixed] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      toast({
        title: "Erro ao salvar progresso",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateProgress = async (newProgressoSegundos: number) => {
    if (!user?.cartorio_id) return;

    try {
      const { data, error } = await supabase.functions.invoke('mark-lesson-progress', {
        body: {
          videoAulaId,
          progressoSegundos: newProgressoSegundos,
          completo: completo,
          cartorioId: user.cartorio_id
        }
      });

      if (error || !data?.success) {
        console.error('❌ [useProgressTrackerFixed] Update progress error:', error || data?.error);
        return;
      }

      onProgressUpdate?.({ progressoSegundos: newProgressoSegundos, completo });
    } catch (error) {
      console.error('❌ [useProgressTrackerFixed] Update progress error:', error);
    }
  };

  return {
    markAsComplete,
    updateProgress,
    isLoading
  };
};

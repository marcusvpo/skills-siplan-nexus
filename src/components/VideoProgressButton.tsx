
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContextFixed';
import { toast } from '@/hooks/use-toast';
import { useVideoProgress } from '@/components/product/VideoProgressContext';
import { useProgressContext } from '@/contexts/ProgressContext';

// Helper hook to safely use progress context
const useSafeProgressContext = () => {
  try {
    return useProgressContext();
  } catch {
    return { refreshAll: () => {} };
  }
};

// Helper hook to safely use video progress context
const useSafeVideoProgress = () => {
  try {
    return useVideoProgress();
  } catch {
    return { refreshProgress: () => {} };
  }
};

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
  
  // Context para atualizar progresso (opcional)
  const { refreshProgress } = useSafeVideoProgress();
  
  // Context global para invalidar todos os progressos
  const { refreshAll } = useSafeProgressContext();
  
  // Estados locais do componente
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // O ID do cartório, obtido do user do AuthContextFixed
  const cartorioId = user?.cartorio_id;

  // Efeito para verificar o progresso inicial da videoaula
  useEffect(() => {
    // Só prossegue se o usuário estiver autenticado e os dados estiverem disponíveis
    if (!isAuthenticated || authLoading || !cartorioId || !videoAulaId) {
      if (!authLoading) {
        setIsChecking(false);
      }
      return;
    }

    const checkProgress = async () => {
      setIsChecking(true);
      try {
        console.log('🔍 [VideoProgressButton] Checking progress:', {
          cartorioId,
          videoAulaId,
          isAuthenticated,
          userType: user?.type
        });

        const { data, error } = await supabase
          .from('visualizacoes_cartorio')
          .select('completo')
          .eq('video_aula_id', videoAulaId)
          .eq('cartorio_id', cartorioId)
          .maybeSingle();

        if (error) {
          console.error('❌ [VideoProgressButton] Erro ao verificar progresso:', error);
        } else {
          console.log('✅ [VideoProgressButton] Progresso encontrado:', data);
          setIsCompleted(data?.completo || false);
        }
      } catch (error) {
        console.error('❌ [VideoProgressButton] Erro inesperado:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkProgress();
  }, [cartorioId, videoAulaId, isAuthenticated, authLoading, user?.type]);

  // Função para marcar/desmarcar a videoaula como concluída
  const toggleCompletion = async () => {
    if (!cartorioId || !videoAulaId || isLoading) return;

    setIsLoading(true);

    try {
      const newCompletedState = !isCompleted;

      console.log('🔄 [VideoProgressButton] Registrando visualização:', {
        cartorioId,
        videoAulaId,
        newCompletedState,
        userType: user?.type
      });

      const { data, error } = await supabase.rpc('registrar_visualizacao_cartorio', {
        p_video_aula_id: videoAulaId,
        p_completo: newCompletedState,
        p_concluida: newCompletedState,
        p_data_conclusao: newCompletedState ? new Date().toISOString() : null
      });

      if (error) {
        console.error('❌ [VideoProgressButton] Erro RPC:', error);
        throw error;
      }

      console.log('✅ [VideoProgressButton] Visualização registrada:', data);
      setIsCompleted(newCompletedState);

      // Atualizar progresso em tempo real
      refreshProgress();
      
      // Invalidar cache global de progressos
      refreshAll();

      toast({
        title: newCompletedState ? "Videoaula concluída!" : "Videoaula desmarcada",
        description: newCompletedState 
          ? `Você marcou "${videoTitle}" como concluída.`
          : `Você desmarcou "${videoTitle}" como concluída.`,
      });

    } catch (error) {
      console.error('❌ [VideoProgressButton] Erro ao atualizar progresso:', error);
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
  if (!isAuthenticated || authLoading || !cartorioId) {
    if (authLoading) {
      return (
        <Button disabled className="w-full">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Autenticando...
        </Button>
      );
    }
    return (
      <Button disabled className="w-full">
        <Circle className="mr-2 h-4 w-4" />
        Faça login para marcar progresso
      </Button>
    );
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

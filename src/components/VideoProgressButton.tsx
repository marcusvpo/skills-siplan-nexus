
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle, Loader2 } from 'lucide-react';
import { executeRPCWithCartorioContext } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface VideoProgressButtonProps {
  videoAulaId: string;
  videoTitle?: string;
  produtoId?: string;
  onProgressChange?: (videoId: string, completo: boolean) => void;
}

interface VisualizacaoResult {
  completo?: boolean;
}

interface RPCResult {
  success?: boolean;
  error?: string;
  message?: string;
}

export const VideoProgressButton: React.FC<VideoProgressButtonProps> = ({ 
  videoAulaId,
  videoTitle = 'esta videoaula',
  produtoId,
  onProgressChange
}) => {
  console.log('🔵 [VideoProgressButton] Renderizado:', { videoAulaId, videoTitle });
  
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const cartorioId = user?.cartorio_id;
  
  // Verificar progresso inicial APENAS após autenticação completa
  useEffect(() => {
    // Se auth ainda carregando, aguardar
    if (authLoading) {
      console.log('⏳ [VideoProgressButton] Aguardando autenticação...');
      setIsChecking(true);
      return;
    }

    // Se não autenticado, finalizar verificação
    if (!isAuthenticated || !cartorioId || !videoAulaId) {
      console.log('⚠️ [VideoProgressButton] Não autenticado ou dados faltando');
      setIsChecking(false);
      setIsCompleted(false);
      return;
    }

    const checkProgress = async () => {
      setIsChecking(true);
      try {
        console.log('🔍 [VideoProgressButton] Verificando progresso para cartório autenticado:', cartorioId);

        const result = await executeRPCWithCartorioContext('get_visualizacao_cartorio', {
          p_cartorio_id: cartorioId,
          p_video_aula_id: videoAulaId
        }) as VisualizacaoResult;

        console.log('✅ [VideoProgressButton] Progresso encontrado:', result);
        setIsCompleted(result?.completo || false);
      } catch (error) {
        console.error('❌ [VideoProgressButton] Erro ao verificar progresso:', error);
        setIsCompleted(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkProgress();
  }, [cartorioId, videoAulaId, isAuthenticated, authLoading]);

  // Função para marcar/desmarcar conclusão - SEM TIMER, imediatamente disponível
  const toggleCompletion = async () => {
    console.log('🔵 [VideoProgressButton] Toggle completion iniciado');
    
    if (!cartorioId || !videoAulaId || isLoading) return;

    setIsLoading(true);

    try {
      const newCompletedState = !isCompleted;
      console.log('🔵 [VideoProgressButton] Novo estado:', newCompletedState);

      const result = await executeRPCWithCartorioContext('registrar_visualizacao_cartorio_robust', {
        p_video_aula_id: videoAulaId,
        p_completo: newCompletedState,
        p_concluida: newCompletedState,
        p_data_conclusao: newCompletedState ? new Date().toISOString() : null,
      }) as RPCResult;

      // Verificar se a RPC foi bem-sucedida
      if (result && typeof result === 'object' && 'success' in result) {
        if (!result.success) {
          console.error('❌ [VideoProgressButton] Erro retornado pela RPC:', result);
          toast({
            title: "Erro",
            description: result.error || "Erro desconhecido ao atualizar progresso",
            variant: "destructive",
          });
          return;
        }
      }

      console.log('✅ [VideoProgressButton] Visualização registrada com sucesso:', result);
      setIsCompleted(newCompletedState);

      // CRÍTICO: Invalidar cache de progresso após mudança
      if (onProgressChange) {
        onProgressChange(videoAulaId, newCompletedState);
      }

      // Disparar evento customizado para invalidar cache globalmente
      window.dispatchEvent(new CustomEvent('progressoAtualizado', {
        detail: {
          videoAulaId,
          produtoId,
          completo: newCompletedState,
          timestamp: Date.now()
        }
      }));

      toast({
        title: newCompletedState ? "Videoaula concluída!" : "Videoaula desmarcada",
        description: newCompletedState 
          ? `Você marcou "${videoTitle}" como concluída.`
          : `Você desmarcou "${videoTitle}" como concluída.`,
      });

    } catch (error: any) {
      console.error('❌ [VideoProgressButton] Erro ao atualizar progresso:', error);
      
      if (error.message?.includes('Sessão expirada') || error.message?.includes('Token')) {
        toast({
          title: "Sessão expirada",
          description: "Sua sessão expirou. Redirecionando para login...",
          variant: "destructive",
        });
        
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível atualizar o progresso. Verifique sua conexão e tente novamente.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Estados condicionais baseados em autenticação
  if (authLoading) {
    return (
      <Button disabled className="w-full">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Autenticando...
      </Button>
    );
  }

  if (!isAuthenticated || !cartorioId) {
    return (
      <Button disabled className="w-full">
        <Circle className="mr-2 h-4 w-4" />
        Faça login para marcar progresso
      </Button>
    );
  }

  if (isChecking) {
    return (
      <Button disabled className="w-full">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Verificando progresso...
      </Button>
    );
  }

  // Botão principal - IMEDIATAMENTE CLICÁVEL (sem timer de 2 minutos)
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
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : isCompleted ? (
        <CheckCircle className="mr-2 h-4 w-4" />
      ) : (
        <Circle className="mr-2 h-4 w-4" />
      )}
      {isLoading 
        ? 'Atualizando...' 
        : isCompleted 
          ? 'Concluída' 
          : 'Marcar como Concluída'
      }
    </Button>
  );
};

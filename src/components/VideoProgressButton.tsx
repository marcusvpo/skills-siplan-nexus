
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
  
  // Verificar progresso inicial apenas após autenticação completa
  useEffect(() => {
    if (!isAuthenticated || authLoading || !cartorioId || !videoAulaId) {
      if (!authLoading) {
        console.log('⚠️ [VideoProgressButton] Aguardando autenticação completa...');
        setIsChecking(false);
      }
      return;
    }

    const checkProgress = async () => {
      setIsChecking(true);
      try {
        console.log('🔍 [VideoProgressButton] Verificando progresso para cartório autenticado:', cartorioId);

        // Usar executeRPCWithCartorioContext para garantir autenticação
        const result = await executeRPCWithCartorioContext('get_visualizacao_cartorio', {
          p_cartorio_id: cartorioId,
          p_video_aula_id: videoAulaId
        });

        console.log('✅ [VideoProgressButton] Progresso encontrado:', result);
        setIsCompleted(result?.completo || false);
      } catch (error) {
        console.error('❌ [VideoProgressButton] Erro ao verificar progresso:', error);
        // Não mostrar erro para o usuário se for apenas falta de dados
        setIsCompleted(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkProgress();
  }, [cartorioId, videoAulaId, isAuthenticated, authLoading]);

  // Função para marcar/desmarcar conclusão
  const toggleCompletion = async () => {
    console.log('🔵 [VideoProgressButton] Toggle completion iniciado');
    
    if (!cartorioId || !videoAulaId || isLoading) return;

    setIsLoading(true);

    try {
      const newCompletedState = !isCompleted;
      console.log('🔵 [VideoProgressButton] Novo estado:', newCompletedState);

      // Usar função robusta com validação completa de autenticação
      const result = await executeRPCWithCartorioContext('registrar_visualizacao_cartorio_robust', {
        p_video_aula_id: videoAulaId,
        p_completo: newCompletedState,
        p_concluida: newCompletedState,
        p_data_conclusao: newCompletedState ? new Date().toISOString() : null,
      });

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

      if (onProgressChange) {
        onProgressChange(videoAulaId, newCompletedState);
      }

      toast({
        title: newCompletedState ? "Videoaula concluída!" : "Videoaula desmarcada",
        description: newCompletedState 
          ? `Você marcou "${videoTitle}" como concluída.`
          : `Você desmarcou "${videoTitle}" como concluída.`,
      });

    } catch (error: any) {
      console.error('❌ [VideoProgressButton] Erro ao atualizar progresso:', error);
      
      // Tratar diferentes tipos de erro
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

  // Estados de não-renderização
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

  if (isChecking) {
    return (
      <Button disabled className="w-full">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Verificando progresso...
      </Button>
    );
  }

  // Botão principal - SEM TIMER, disponível imediatamente
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

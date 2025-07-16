
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle, Loader2 } from 'lucide-react';
import { supabase, getValidSession } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { VideoProgressButtonWithTimer } from '@/components/VideoProgressButtonWithTimer';

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
  console.log('🔵 [VideoProgressButton] Componente renderizado:', { 
    videoAulaId, 
    videoTitle,
    produtoId,
    onProgressChange: !!onProgressChange
  });
  
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const cartorioId = user?.cartorio_id;
  
  console.log('🔵 [VideoProgressButton] Estado inicial:', {
    cartorioId,
    isAuthenticated,
    authLoading,
    isCompleted,
    isLoading,
    isChecking
  });

  // Verificar progresso inicial
  useEffect(() => {
    if (!isAuthenticated || authLoading || !cartorioId || !videoAulaId) {
      if (!authLoading) {
        setIsChecking(false);
      }
      return;
    }

    const checkProgress = async () => {
      setIsChecking(true);
      try {
        console.log('🔍 [VideoProgressButton] Verificando progresso:', {
          cartorioId,
          videoAulaId
        });

        // VERIFICAÇÃO CRÍTICA: Validar sessão antes da consulta
        const validSession = await getValidSession();
        if (!validSession) {
          console.error('❌ [VideoProgressButton] Sessão inválida ao verificar progresso');
          setIsChecking(false);
          return;
        }

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

  // Função para atualizar progresso com validação robusta de sessão
  const toggleCompletion = async () => {
    console.log('🔵 [VideoProgressButton] toggleCompletion chamado');
    
    if (!cartorioId || !videoAulaId || isLoading) return;

    setIsLoading(true);

    try {
      // VALIDAÇÃO CRÍTICA 1: Verificar se usuário está autenticado
      if (!isAuthenticated || !cartorioId) {
        console.error('❌ [VideoProgressButton] Usuário não autenticado');
        toast({
          title: "Erro de autenticação",
          description: "Faça login para marcar o progresso das videoaulas.",
          variant: "destructive",
        });
        return;
      }

      // VALIDAÇÃO CRÍTICA 2: Obter e validar sessão atual
      console.log('🔒 [VideoProgressButton] Validando sessão antes da requisição...');
      const validSession = await getValidSession();
      
      if (!validSession) {
        console.error('❌ [VideoProgressButton] Sessão inválida ou expirada');
        toast({
          title: "Sessão expirada",
          description: "Sua sessão expirou. Por favor, faça login novamente.",
          variant: "destructive",
        });
        
        // Redirecionar para login
        window.location.href = '/login';
        return;
      }

      // VALIDAÇÃO CRÍTICA 3: Verificar se o token é authenticated
      try {
        const jwtPayload = JSON.parse(atob(validSession.access_token.split('.')[1]));
        
        if (jwtPayload.role !== 'authenticated') {
          console.error('❌ [VideoProgressButton] Token não é authenticated:', jwtPayload.role);
          toast({
            title: "Erro de autenticação",
            description: "Token de autenticação inválido. Faça login novamente.",
            variant: "destructive",
          });
          window.location.href = '/login';
          return;
        }
        
        console.log('✅ [VideoProgressButton] Token authenticated válido confirmado');
      } catch (jwtError) {
        console.error('❌ [VideoProgressButton] Erro ao validar JWT:', jwtError);
        window.location.href = '/login';
        return;
      }

      const newCompletedState = !isCompleted;
      console.log('🔵 [VideoProgressButton] Novo estado:', { newCompletedState, isCompleted });

      // Setar contexto do cartório
      const { error: contextError } = await supabase.rpc('set_cartorio_context', {
        p_cartorio_id: cartorioId
      });

      if (contextError) {
        console.error('❌ [VideoProgressButton] Erro ao setar contexto:', contextError);
        toast({
          title: "Erro",
          description: "Erro ao configurar contexto do cartório",
          variant: "destructive",
        });
        return;
      }

      // Usar função robusta para registrar visualização
      const { data, error } = await supabase.rpc('registrar_visualizacao_cartorio_robust', {
        p_video_aula_id: videoAulaId,
        p_completo: newCompletedState,
        p_concluida: newCompletedState,
        p_data_conclusao: newCompletedState ? new Date().toISOString() : null,
      });

      if (error) {
        console.error('❌ [VideoProgressButton] Erro RPC:', error);
        toast({
          title: "Erro",
          description: "Não foi possível atualizar o progresso. Verifique sua conexão e tente novamente.",
          variant: "destructive",
        });
        return;
      }

      const result = data as { success: boolean; error?: string };
      if (result && !result.success) {
        console.error('❌ [VideoProgressButton] Erro retornado pela função:', result);
        toast({
          title: "Erro",
          description: result.error || "Erro desconhecido ao atualizar progresso",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ [VideoProgressButton] Visualização registrada:', data);
      setIsCompleted(newCompletedState);

      if (onProgressChange) {
        console.log('🔵 [VideoProgressButton] Chamando onProgressChange');
        onProgressChange(videoAulaId, newCompletedState);
      }

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

  // Usar o botão com timer
  return (
    <VideoProgressButtonWithTimer
      videoAulaId={videoAulaId}
      videoTitle={videoTitle}
      isCompleted={isCompleted}
      isLoading={isLoading}
      onToggleCompletion={toggleCompletion}
    />
  );
};

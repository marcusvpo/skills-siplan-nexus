
import { useState, useEffect, useCallback, useRef } from 'react';

interface UseVideoWatchTimerReturn {
  timeRemaining: number;
  canMarkComplete: boolean;
  formatTime: (seconds: number) => string;
  resetTimer: () => void;
}

export const useVideoWatchTimer = (videoaulaId: string): UseVideoWatchTimerReturn => {
  const [timeRemaining, setTimeRemaining] = useState(120); // 2 minutos
  const [canMarkComplete, setCanMarkComplete] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const requiredWatchTime = 120; // 2 minutos em segundos

  const formatTime = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  const resetTimer = useCallback(() => {
    console.log('🕐 [useVideoWatchTimer] Resetando timer para videoaula:', videoaulaId);
    localStorage.removeItem(`video_timer_${videoaulaId}`);
    setTimeRemaining(requiredWatchTime);
    setCanMarkComplete(false);
  }, [videoaulaId, requiredWatchTime]);

  useEffect(() => {
    if (!videoaulaId) return;

    console.log('🕐 [useVideoWatchTimer] Iniciando timer para videoaula:', videoaulaId);

    // Verificar se já existe timer salvo no localStorage
    const savedTime = localStorage.getItem(`video_timer_${videoaulaId}`);
    const startTime = savedTime ? parseInt(savedTime) : Date.now();

    // Se não havia timer salvo, salvar o timestamp inicial
    if (!savedTime) {
      localStorage.setItem(`video_timer_${videoaulaId}`, startTime.toString());
      console.log('🕐 [useVideoWatchTimer] Timer iniciado para videoaula:', videoaulaId);
    }

    const updateTimer = () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(requiredWatchTime - elapsed, 0);
      
      setTimeRemaining(remaining);
      setCanMarkComplete(remaining === 0);
      
      if (remaining === 0) {
        console.log('🕐 [useVideoWatchTimer] Timer concluído para videoaula:', videoaulaId);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        localStorage.removeItem(`video_timer_${videoaulaId}`);
      }
    };

    // Executar imediatamente para definir estado inicial
    updateTimer();

    // Configurar intervalo apenas se ainda há tempo restante
    if (timeRemaining > 0) {
      intervalRef.current = setInterval(updateTimer, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [videoaulaId, requiredWatchTime]);

  // Cleanup ao desmontar o componente
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  return {
    timeRemaining,
    canMarkComplete,
    formatTime,
    resetTimer
  };
};

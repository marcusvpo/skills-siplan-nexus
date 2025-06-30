
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

interface BunnyVideoIdFixResult {
  success: boolean;
  message: string;
  updated: number;
  total: number;
  results: Array<{
    id: string;
    titulo: string;
    success: boolean;
    bunny_video_id?: string;
    error?: string;
  }>;
}

export const useBunnyVideoIdFixer = () => {
  const [isFixing, setIsFixing] = useState(false);

  const fixBunnyVideoIds = async (): Promise<BunnyVideoIdFixResult | null> => {
    setIsFixing(true);
    
    try {
      console.log('🔧 Starting bunny video ID fix process...');
      
      const response = await fetch('/api/update-bunny-video-ids', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: BunnyVideoIdFixResult = await response.json();
      
      console.log('🔧 Fix process result:', result);

      if (result.success) {
        toast({
          title: "IDs da Bunny.net atualizados",
          description: result.message,
        });
      } else {
        toast({
          title: "Erro ao atualizar IDs",
          description: result.message || "Erro desconhecido",
          variant: "destructive",
        });
      }

      return result;
    } catch (error) {
      console.error('Error fixing bunny video IDs:', error);
      
      toast({
        title: "Erro ao corrigir IDs da Bunny.net",
        description: "Ocorreu um erro ao tentar corrigir os IDs dos vídeos.",
        variant: "destructive",
      });
      
      return null;
    } finally {
      setIsFixing(false);
    }
  };

  return {
    fixBunnyVideoIds,
    isFixing
  };
};


import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface BunnyVideoDetails {
  success: boolean;
  videoId: string;
  title: string;
  playUrl: string;
  thumbnailUrl: string | null;
  duration: number;
  status: number;
  encodeProgress: number;
  isPublic: boolean;
  resolution: {
    width: number;
    height: number;
  };
  uploadDate: string;
  views: number;
  storageSize: number;
}

interface UseBunnyVideoDetailsReturn {
  videoDetails: BunnyVideoDetails | null;
  isLoading: boolean;
  error: string | null;
  fetchVideoDetails: (videoId: string) => Promise<BunnyVideoDetails | null>;
}

export const useBunnyVideoDetails = (videoId?: string): UseBunnyVideoDetailsReturn => {
  const [videoDetails, setVideoDetails] = useState<BunnyVideoDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVideoDetails = async (id: string): Promise<BunnyVideoDetails | null> => {
    if (!id?.trim()) {
      setError('ID do vídeo é obrigatório');
      toast({
        title: "ID do vídeo é obrigatório",
        description: "Digite um ID válido do vídeo Bunny.net",
        variant: "destructive",
      });
      return null;
    }

    setIsLoading(true);
    setError(null);

    logger.info('🎥 [useBunnyVideoDetails] Fetching video details', { videoId: id });

    try {
      // Chamada direta sem autenticação para função pública
      const response = await fetch(`https://bnulocsnxiffavvabfdj.supabase.co/functions/v1/get-bunny-video-details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoId: id.trim() })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      logger.info('🎥 [useBunnyVideoDetails] Function response', { 
        data: data ? { success: data.success, hasError: !!data.error } : null
      });

      if (!data) {
        throw new Error('Nenhum dado retornado pela API');
      }


      if (!data.success) {
        logger.error('❌ [useBunnyVideoDetails] API error:', data.error);
        throw new Error(data.error || 'Erro desconhecido da API');
      }

      logger.info('✅ [useBunnyVideoDetails] Video details fetched successfully', {
        videoId: data.videoId,
        title: data.title.substring(0, 50) + '...',
        hasPlayUrl: !!data.playUrl,
        hasThumbnailUrl: !!data.thumbnailUrl
      });

      const details = data as BunnyVideoDetails;
      setVideoDetails(details);
      return details;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      
      logger.error('❌ [useBunnyVideoDetails] Error fetching video details:', { 
        error: errorMessage,
        videoId: id 
      });

      setError(errorMessage);

      toast({
        title: "Erro ao buscar detalhes do vídeo",
        description: errorMessage,
        variant: "destructive",
      });

      return null;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (videoId) {
      fetchVideoDetails(videoId);
    }
  }, [videoId]);

  return {
    videoDetails,
    fetchVideoDetails,
    isLoading,
    error
  };
};

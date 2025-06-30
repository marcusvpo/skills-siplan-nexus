
import { useState } from 'react';
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
  fetchVideoDetails: (videoId: string) => Promise<BunnyVideoDetails | null>;
  isLoading: boolean;
  error: string | null;
}

export const useBunnyVideoDetails = (): UseBunnyVideoDetailsReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVideoDetails = async (videoId: string): Promise<BunnyVideoDetails | null> => {
    if (!videoId?.trim()) {
      setError('ID do vídeo é obrigatório');
      return null;
    }

    setIsLoading(true);
    setError(null);

    logger.info('🎥 [useBunnyVideoDetails] Fetching video details', { videoId });

    try {
      const { data, error: functionError } = await supabase.functions.invoke(
        'get-bunny-video-details',
        {
          body: { videoId: videoId.trim() }
        }
      );

      if (functionError) {
        logger.error('❌ [useBunnyVideoDetails] Function error:', functionError);
        throw new Error(`Erro na função: ${functionError.message}`);
      }

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

      toast({
        title: "Detalhes do vídeo obtidos",
        description: `Vídeo "${data.title}" carregado com sucesso`,
      });

      return data as BunnyVideoDetails;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      
      logger.error('❌ [useBunnyVideoDetails] Error fetching video details:', { 
        error: errorMessage,
        videoId 
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

  return {
    fetchVideoDetails,
    isLoading,
    error
  };
};

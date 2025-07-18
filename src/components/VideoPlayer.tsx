
import React, { useState, useRef, useEffect } from 'react';
import { logger } from '@/utils/logger';

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
  thumbnailUrl?: string | null;
  duration?: number;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  videoUrl, 
  title, 
  thumbnailUrl,
  duration: videoDuration 
}) => {
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isVideoError, setIsVideoError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    logger.info('🎥 [VideoPlayer] Initializing with URL:', { videoUrl, title });
    
    if (videoUrl && videoUrl.trim() !== '') {
      // Verificar se é uma URL válida do Bunny.net ou iframe
      if (videoUrl.includes('iframe') || 
          videoUrl.includes('bunnycdn.com') || 
          videoUrl.includes('bunny.net') ||
          videoUrl.includes('mediadelivery.net') ||
          videoUrl.startsWith('http')) {
        setIsVideoReady(true);
        setIsVideoError(false);
        setIsLoading(false);
        logger.info('✅ [VideoPlayer] Valid video URL detected');
      } else {
        logger.warn('⚠️ [VideoPlayer] Invalid video URL format:', { videoUrl });
        setIsVideoError(true);
        setIsVideoReady(false);
        setIsLoading(false);
      }
    } else {
      logger.warn('⚠️ [VideoPlayer] No video URL provided');
      setIsVideoError(false);
      setIsVideoReady(false);
      setIsLoading(false);
    }
  }, [videoUrl, title]);

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Se não há URL de vídeo ou há erro, mostrar placeholder
  if (!videoUrl || videoUrl === '' || isVideoError) {
    return (
      <div className="w-full aspect-video bg-gray-900 rounded-lg flex items-center justify-center border border-gray-600">
        <div className="text-center">
          <div className="text-6xl mb-4">🎥</div>
          <p className="text-gray-400 text-lg">{title}</p>
          {isVideoError ? (
            <p className="text-xs text-red-400 mt-2">
              URL de vídeo inválida: {videoUrl}
            </p>
          ) : (
            <p className="text-xs text-gray-600 mt-2">Nenhum vídeo configurado</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-black rounded-lg overflow-hidden">
      {/* Video Player - Support for both iframe URLs and direct video URLs */}
      {videoUrl.includes('iframe') || videoUrl.includes('embed') ? (
        <iframe
          ref={iframeRef}
          className="w-full aspect-video"
          src={videoUrl}
          title={title}
          frameBorder="0"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          style={{
            width: '100%',
            height: '100%',
            border: 'none'
          }}
          onLoad={() => {
            logger.info('✅ [VideoPlayer] Iframe loaded successfully');
            setIsVideoReady(true);
            setIsVideoError(false);
            setIsLoading(false);
          }}
          onError={(e) => {
            logger.error('❌ [VideoPlayer] Iframe error:', { error: e });
            setIsVideoError(true);
            setIsVideoReady(false);
            setIsLoading(false);
          }}
        />
      ) : (
        <video
          ref={(ref) => {
            if (ref) {
              (iframeRef as any).current = ref;
            }
          }}
          className="w-full aspect-video"
          controls
          preload="metadata"
          poster={thumbnailUrl || undefined}
          onLoadedData={() => {
            logger.info('✅ [VideoPlayer] Video loaded successfully');
            setIsVideoReady(true);
            setIsVideoError(false);
            setIsLoading(false);
          }}
          onError={(e) => {
            logger.error('❌ [VideoPlayer] Video error:', { error: e });
            setIsVideoError(true);
            setIsVideoReady(false);
            setIsLoading(false);
          }}
        >
          <source src={videoUrl} type="video/mp4" />
          <p className="text-white">Seu navegador não suporta o elemento de vídeo.</p>
        </video>
      )}
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-2"></div>
            <p className="text-white text-sm">Carregando vídeo...</p>
          </div>
        </div>
      )}
      
      {/* Video Info Overlay - apenas duração se disponível */}
      {videoDuration && isVideoReady && (
        <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-md text-sm">
          {formatTime(videoDuration)}
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;

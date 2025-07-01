
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Maximize, Settings } from 'lucide-react';
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
      // Verificar se é uma URL válida do Bunny.net
      if (videoUrl.includes('iframe.mediadelivery.net') || 
          videoUrl.includes('bunnycdn.com') || 
          videoUrl.includes('bunny.net')) {
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
    <div className="relative bg-black rounded-lg overflow-hidden group">
      {/* Bunny.net Iframe Player */}
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
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-2"></div>
            <p className="text-white text-sm">Carregando vídeo...</p>
          </div>
        </div>
      )}
      
      {/* Video Info Overlay */}
      {videoDuration && isVideoReady && (
        <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-md text-sm">
          {formatTime(videoDuration)}
        </div>
      )}
      
      {/* Controls Overlay */}
      <div className="absolute bottom-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <Button 
          variant="ghost" 
          size="sm"
          className="text-white hover:bg-white/20 bg-black/50"
          onClick={() => {
            if (iframeRef.current) {
              iframeRef.current.requestFullscreen?.();
            }
          }}
        >
          <Maximize className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          className="text-white hover:bg-white/20 bg-black/50"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default VideoPlayer;

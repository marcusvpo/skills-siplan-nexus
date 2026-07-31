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
  duration: videoDuration,
}) => {
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isVideoError, setIsVideoError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    logger.info('🎥 [VideoPlayer] Initializing with URL:', { videoUrl, title });

    if (videoUrl && videoUrl.trim() !== '') {
      if (
        videoUrl.includes('iframe') ||
        videoUrl.includes('bunnycdn.com') ||
        videoUrl.includes('bunny.net') ||
        videoUrl.includes('mediadelivery.net') ||
        videoUrl.startsWith('http')
      ) {
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

  if (!videoUrl || videoUrl === '' || isVideoError) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-2xl border border-border/50 bg-card/60 backdrop-blur-md">
        <div className="text-center">
          <div className="mb-4 text-6xl">🎥</div>
          <p className="text-lg text-muted-foreground">{title}</p>
          {isVideoError ? (
            <p className="mt-2 text-xs text-destructive">URL de vídeo inválida</p>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground/70">Nenhum vídeo configurado</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Luz de ambiente (modo cinema) */}
      <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] bg-primary/10 blur-3xl" />

      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-black shadow-2xl shadow-primary/10">
        {videoUrl.includes('iframe') || videoUrl.includes('embed') ? (
          <iframe
            ref={iframeRef}
            className="aspect-video w-full"
            src={videoUrl}
            title={title}
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            style={{ border: 'none' }}
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
            className="aspect-video w-full"
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
            <p className="text-foreground">Seu navegador não suporta o elemento de vídeo.</p>
          </video>
        )}

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <div className="text-center">
              <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
              <p className="text-sm text-muted-foreground">Carregando vídeo...</p>
            </div>
          </div>
        )}

        {videoDuration && isVideoReady && (
          <div className="absolute right-4 top-4 rounded-full border border-border/50 bg-background/70 px-3 py-1 text-xs font-medium text-foreground backdrop-blur-md">
            {formatTime(videoDuration)}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;
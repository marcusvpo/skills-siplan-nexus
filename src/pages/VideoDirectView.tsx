import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import VideoPlayer from '@/components/VideoPlayer';
import { useVideoAulaData } from '@/hooks/useSupabaseDataRefactored';

const VideoDirectView: React.FC = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const { data: videoAula, isLoading, error } = useVideoAulaData(videoId || '');

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
          <p className="text-foreground">Carregando vídeo...</p>
        </div>
      </div>
    );
  }

  if (error || !videoAula) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="mx-auto mb-4 h-14 w-14 text-destructive" />
            <h3 className="mb-2 text-xl font-semibold text-foreground">Vídeo não encontrado</h3>
            <p className="mb-5 text-sm text-muted-foreground">
              {error instanceof Error ? error.message : 'Não foi possível carregar este vídeo.'}
            </p>
            <Button variant="glow" onClick={() => navigate(-1)}>
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const produto = (videoAula as any).produtos;
  const sistema = produto?.sistemas;

  return (
    <div className="min-h-screen text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/70 backdrop-blur-xl">
        <div className="container mx-auto flex items-center gap-4 px-4 py-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div className="min-w-0">
            <p className="truncate text-xs uppercase tracking-wider text-muted-foreground">
              {sistema?.nome} {produto?.nome ? `• ${produto.nome}` : ''}
            </p>
            <p className="truncate text-sm font-medium">{videoAula.titulo}</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-5xl px-4 py-8">
        <VideoPlayer
          videoUrl={videoAula.url_video}
          title={videoAula.titulo}
          thumbnailUrl={videoAula.url_thumbnail}
        />
        <h1 className="mt-6 text-2xl font-bold leading-tight">{videoAula.titulo}</h1>
        {videoAula.descricao && (
          <p className="mt-3 leading-relaxed text-muted-foreground">{videoAula.descricao}</p>
        )}
      </main>
    </div>
  );
};

export default VideoDirectView;
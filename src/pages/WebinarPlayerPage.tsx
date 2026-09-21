import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Lock, Radio, Loader2, CalendarDays, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContextFixed';
import { useWebinars, useWebinarVideo, WebinarAccessError } from '@/hooks/useWebinars';
import { WebinarCountdown } from '@/components/webinar/WebinarCountdown';
import { WebinarCard } from '@/components/webinar/WebinarCard';
import { formatWebinarDate } from '@/lib/webinar';

const WebinarPlayerPage: React.FC = () => {
  const { produtoId, videoId } = useParams<{ produtoId: string; videoId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { tracks } = useWebinars();
  const { data, isLoading, error } = useWebinarVideo(videoId);

  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate('/login');
  }, [authLoading, isAuthenticated, navigate]);

  const track = tracks.find((t) => t.id === produtoId);
  const meta = track?.videos.find((v) => v.id === videoId);
  const outros = (track?.videos || []).filter((v) => v.id !== videoId).slice(0, 8);
  const accessError = error as WebinarAccessError | null;

  const embedUrl = data?.video?.url_video;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-background/90 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/webinars')}
            className="rounded-none text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Webinars
          </Button>
          <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
            <Radio className="h-3 w-3" />
            {track?.nome || 'Webinar'}
          </span>
        </div>
      </header>

      {/* Faixa fixa de prazo */}
      {meta && (
        <div className="sticky top-0 z-30">
          <WebinarCountdown video={meta} variant="banner" className="rounded-none border-x-0" />
        </div>
      )}

      <main className="container mx-auto grid gap-8 px-4 py-8 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <div className="relative aspect-video w-full overflow-hidden border border-border/60 bg-black">
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="font-mono text-[11px] uppercase tracking-[0.18em]">
                  Validando seu acesso
                </p>
              </div>
            )}

            {!isLoading && accessError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
                <Lock className="h-8 w-8 text-destructive" />
                <p className="text-sm font-medium text-foreground">{accessError.message}</p>
                {accessError.disponivelAte && (
                  <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    prazo encerrado em {formatWebinarDate(accessError.disponivelAte)}
                  </p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 rounded-none"
                  onClick={() => navigate('/webinars')}
                >
                  Ver outros webinars
                </Button>
              </div>
            )}

            {!isLoading && !accessError && embedUrl && (
              embedUrl.includes('iframe') || embedUrl.includes('embed') ? (
                <iframe
                  src={embedUrl}
                  title={data?.video?.titulo}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video src={embedUrl} controls className="absolute inset-0 h-full w-full" />
              )
            )}
          </div>

          <div className="space-y-4">
            <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">
              {data?.video?.titulo || meta?.titulo || 'Webinar'}
            </h1>
            <div className="flex flex-wrap items-center gap-4 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {(data?.disponivel_em || meta?.disponivel_em) && (
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-3 w-3" />
                  gravado em {formatWebinarDate(data?.disponivel_em || meta?.disponivel_em)}
                </span>
              )}
              {(data?.disponivel_ate || meta?.window.endsAt) && (
                <span>
                  disponível até {formatWebinarDate(data?.disponivel_ate || meta?.window.endsAt)}
                </span>
              )}
            </div>
            {(data?.video?.descricao || meta?.descricao) && (
              <p className="max-w-3xl whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {data?.video?.descricao || meta?.descricao}
              </p>
            )}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="border border-border/60 bg-card/30 p-5">
            <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
              <Info className="h-3 w-3" />
              Como funciona o acesso
            </p>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground">
              <li>A gravação fica disponível apenas dentro do prazo informado acima.</li>
              <li>Após o prazo, o vídeo é bloqueado automaticamente pela plataforma.</li>
              <li>O conteúdo é exclusivo do seu cartório e não deve ser compartilhado.</li>
            </ul>
          </div>

          {outros.length > 0 && (
            <div className="space-y-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Outras sessões
              </p>
              <div className="flex flex-col gap-4">
                {outros.map((video, index) => (
                  <WebinarCard
                    key={video.id}
                    video={video}
                    index={index}
                    layout="list"
                    onOpen={() => navigate(`/webinars/${track?.id}/${video.id}`)}
                  />
                ))}
              </div>
            </div>
          )}
        </aside>
      </main>
    </div>
  );
};

export default WebinarPlayerPage;

import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Lock, Radio, Loader2, CalendarDays, ShieldCheck, EyeOff, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContextFixed';
import { useWebinars, useWebinarVideo, WebinarAccessError } from '@/hooks/useWebinars';
import { WebinarCountdown } from '@/components/webinar/WebinarCountdown';
import { WebinarCard } from '@/components/webinar/WebinarCard';
import { formatWebinarDate } from '@/lib/webinar';

const REGRAS = [
  {
    icon: ShieldCheck,
    texto: 'A gravação fica disponível apenas dentro do prazo informado.',
  },
  {
    icon: EyeOff,
    texto: 'Após o prazo, o vídeo é bloqueado automaticamente pela plataforma.',
  },
  {
    icon: Users,
    texto: 'Conteúdo exclusivo do seu cartório — não compartilhe.',
  },
];

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
  const outros = (track?.videos || []).filter((v) => v.id !== videoId).slice(0, 6);
  const accessError = error as WebinarAccessError | null;

  const embedUrl = data?.video?.url_video;
  const titulo = data?.video?.titulo || meta?.titulo || 'Webinar';
  const descricao = data?.video?.descricao || meta?.descricao;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5">
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

      <main className="mx-auto max-w-6xl px-4 pb-14 pt-6">
        {/* Player centralizado */}
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
                title={titulo}
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

        {/* Título e metadados em uma única linha de leitura */}
        <div className="mt-5 flex flex-wrap items-end justify-between gap-x-8 gap-y-3 border-b border-border/60 pb-5">
          <div className="min-w-0 space-y-1.5">
            <h1 className="text-xl font-semibold leading-tight sm:text-2xl">{titulo}</h1>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
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
          </div>
        </div>

        {descricao && (
          <p className="mt-4 max-w-3xl whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {descricao}
          </p>
        )}

        {/* Regras de acesso em linha — compactas e alinhadas */}
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {REGRAS.map(({ icon: Icon, texto }) => (
            <div
              key={texto}
              className="flex items-start gap-3 border border-border/50 bg-card/30 px-4 py-3"
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-xs leading-relaxed text-muted-foreground">{texto}</p>
            </div>
          ))}
        </div>

        {/* Outras sessões em grade — preenche a página sem sobrar espaço */}
        {outros.length > 0 && (
          <section className="mt-10">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                Outras sessões · {track?.nome}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-none text-muted-foreground"
                onClick={() => navigate('/webinars')}
              >
                Ver todas
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          </section>
        )}
      </main>
    </div>
  );
};

export default WebinarPlayerPage;

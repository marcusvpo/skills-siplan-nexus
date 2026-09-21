import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, LogOut, Radio, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContextFixed';
import { useWebinars } from '@/hooks/useWebinars';
import { WebinarSpotlight } from '@/components/webinar/WebinarSpotlight';
import { WebinarCard } from '@/components/webinar/WebinarCard';
import { cn } from '@/lib/utils';

const WebinarHub: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const { tracks, isLoading, error, refetch } = useWebinars();
  const [activeTrack, setActiveTrack] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate('/login');
  }, [authLoading, isAuthenticated, navigate]);

  React.useEffect(() => {
    if (!activeTrack && tracks.length > 0) setActiveTrack(tracks[0].id);
  }, [tracks, activeTrack]);

  const track = tracks.find((t) => t.id === activeTrack) || tracks[0];
  const spotlight = track?.videos.find((v) => v.window.status === 'available') || track?.videos[0];
  const rest = track?.videos.filter((v) => v.id !== spotlight?.id) || [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Cabeçalho próprio do módulo de webinars */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-4">
            {!isWebinarOnly && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/dashboard')}
                  className="rounded-none text-muted-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Treinamentos
                </Button>
                <div className="h-6 w-px bg-border/60" />
              </>
            )}
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center border border-primary/50 bg-primary/10 text-primary">
                <Radio className="h-4 w-4" />
              </span>
              <div className="leading-tight">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
                  Siplan Skills
                </p>
                <h1 className="text-lg font-semibold">Webinars</h1>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">{user?.username || user?.name}</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                {user?.cartorio_name}
              </p>
            </div>
            <Button variant="outline" size="sm" className="rounded-none" onClick={() => logout()}>
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto space-y-10 px-4 py-10">
        <div className="max-w-2xl space-y-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            Gravações exclusivas · acesso por tempo limitado
          </p>
          <h2 className="text-2xl font-semibold sm:text-3xl">
            Assista às sessões ao vivo dentro da plataforma
          </h2>
          <p className="text-sm text-muted-foreground">
            Cada gravação fica disponível por um período definido. Depois do prazo, o acesso é
            encerrado automaticamente.
          </p>
        </div>

        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse border border-border/50 bg-card/40" />
            ))}
          </div>
        )}

        {error && (
          <div className="border border-destructive/40 bg-destructive/10 p-6">
            <p className="mb-4 flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {error instanceof Error ? error.message : 'Erro ao carregar os webinars.'}
            </p>
            <Button variant="outline" size="sm" className="rounded-none" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </Button>
          </div>
        )}

        {!isLoading && !error && tracks.length === 0 && (
          <div className="border border-border/60 bg-card/30 p-10 text-center">
            <Radio className="mx-auto mb-4 h-8 w-8 text-primary" />
            <h3 className="text-lg font-semibold">Nenhum webinar liberado</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Assim que uma nova sessão for publicada, ela aparecerá aqui.
            </p>
          </div>
        )}

        {!isLoading && tracks.length > 0 && (
          <>
            {/* Abas por produto de webinar */}
            <div className="flex flex-wrap gap-2 border-b border-border/60 pb-3">
              {tracks.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTrack(t.id)}
                  className={cn(
                    'border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors',
                    t.id === track?.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                  )}
                >
                  {t.nome}
                  <span className="ml-2 opacity-60">{t.videos.length}</span>
                </button>
              ))}
            </div>

            {track && spotlight && (
              <WebinarSpotlight
                key={spotlight.id}
                video={spotlight}
                trackName={track.nome}
                onOpen={() => navigate(`/webinars/${track.id}/${spotlight.id}`)}
              />
            )}

            {track && track.videos.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Este produto ainda não possui webinars publicados.
              </p>
            )}

            {rest.length > 0 && track && (
              <motion.section
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <div className="flex items-baseline justify-between">
                  <h3 className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                    Sessões anteriores · {track.nome}
                  </h3>
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    {rest.length} gravaç{rest.length === 1 ? 'ão' : 'ões'}
                  </span>
                </div>
                <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-4">
                  {rest.map((video, index) => (
                    <WebinarCard
                      key={video.id}
                      video={video}
                      index={index}
                      onOpen={() => navigate(`/webinars/${track.id}/${video.id}`)}
                    />
                  ))}
                </div>
              </motion.section>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default WebinarHub;

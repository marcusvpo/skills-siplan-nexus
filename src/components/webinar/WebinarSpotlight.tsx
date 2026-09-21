import React from 'react';
import { motion } from 'framer-motion';
import { Play, Lock, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BunnyThumbnail } from '@/components/admin/BunnyThumbnail';
import { WebinarCountdown } from '@/components/webinar/WebinarCountdown';
import { formatWebinarDate } from '@/lib/webinar';
import type { WebinarVideo } from '@/hooks/useWebinars';

interface Props {
  video: WebinarVideo;
  trackName: string;
  onOpen: () => void;
}

export const WebinarSpotlight: React.FC<Props> = ({ video, trackName, onOpen }) => {
  const blocked = video.window.status !== 'available';

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="relative overflow-hidden border border-border/60 bg-card/30"
    >
      <div className="absolute inset-0">
        <BunnyThumbnail
          videoId={video.id_video_bunny || undefined}
          fallbackUrl={video.url_thumbnail || undefined}
          alt={video.titulo}
          className="h-full w-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/30" />
      </div>

      <div className="relative grid gap-8 p-6 sm:p-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <div className="space-y-5">
          <span className="inline-flex items-center gap-2 border border-primary/50 bg-primary/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
            <Radio className="h-3 w-3" />
            Último webinar · {trackName}
          </span>

          <h2 className="max-w-2xl text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
            {video.titulo}
          </h2>

          {video.descricao && (
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
              {video.descricao}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <WebinarCountdown video={video} />
            {video.disponivel_em && (
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                gravado em {formatWebinarDate(video.disponivel_em)}
              </span>
            )}
          </div>

          <Button onClick={onOpen} disabled={blocked} variant="glow" size="lg" className="rounded-none">
            {blocked ? <Lock className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
            {blocked ? 'Fora do prazo de visualização' : 'Assistir agora'}
          </Button>
        </div>

        <div className="hidden overflow-hidden border border-border/60 lg:block">
          <BunnyThumbnail
            videoId={video.id_video_bunny || undefined}
            fallbackUrl={video.url_thumbnail || undefined}
            alt={video.titulo}
            className="aspect-video w-full object-cover"
          />
        </div>
      </div>
    </motion.section>
  );
};

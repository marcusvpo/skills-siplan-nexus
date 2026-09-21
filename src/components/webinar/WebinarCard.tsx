import React from 'react';
import { motion } from 'framer-motion';
import { Play, Lock } from 'lucide-react';
import { BunnyThumbnail } from '@/components/BunnyThumbnail';
import { WebinarCountdown } from '@/components/webinar/WebinarCountdown';
import { formatWebinarDateShort } from '@/lib/webinar';
import type { WebinarVideo } from '@/hooks/useWebinars';
import { cn } from '@/lib/utils';

interface Props {
  video: WebinarVideo;
  index?: number;
  onOpen: () => void;
}

export const WebinarCard: React.FC<Props> = ({ video, index = 0, onOpen }) => {
  const blocked = video.window.status !== 'available';

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      disabled={blocked}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3) }}
      className={cn(
        'group relative w-[300px] shrink-0 overflow-hidden border border-border/60 bg-card/40 text-left transition-colors',
        blocked ? 'cursor-not-allowed opacity-60' : 'hover:border-primary/60 hover:bg-card/70'
      )}
    >
      <div className="relative aspect-video overflow-hidden bg-muted/30">
        <BunnyThumbnail
          videoId={video.id_video_bunny || undefined}
          fallbackUrl={video.url_thumbnail || undefined}
          alt={video.titulo}
          className={cn(
            'absolute inset-0 h-full w-full object-cover transition-transform duration-500',
            blocked ? 'grayscale' : 'group-hover:scale-105'
          )}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        <span className="absolute bottom-3 left-3 flex h-10 w-10 items-center justify-center border border-white/15 bg-black/60 text-primary backdrop-blur">
          {blocked ? <Lock className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
        </span>
      </div>

      <div className="space-y-3 p-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {video.disponivel_em ? formatWebinarDateShort(video.disponivel_em) : 'Sem data'}
        </p>
        <h4 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
          {video.titulo}
        </h4>
        <WebinarCountdown video={video} />
      </div>
    </motion.button>
  );
};

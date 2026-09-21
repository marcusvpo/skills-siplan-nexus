import React from 'react';
import { Clock, CalendarX2, CalendarClock } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  formatRemaining,
  formatWebinarDate,
  getWebinarWindow,
  type WebinarWindowInput,
} from '@/lib/webinar';

/** Relógio compartilhado: atualiza a cada 30s sem multiplicar timers. */
const useNow = (intervalMs = 30000) => {
  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
};

interface Props {
  video: WebinarWindowInput;
  variant?: 'pill' | 'banner' | 'inline';
  className?: string;
}

export const WebinarCountdown: React.FC<Props> = ({ video, variant = 'pill', className }) => {
  const now = useNow();
  const w = getWebinarWindow(video, now);

  const tone =
    w.status === 'expired' || w.status === 'inactive'
      ? 'text-destructive border-destructive/40 bg-destructive/10'
      : w.status === 'scheduled'
        ? 'text-muted-foreground border-border/60 bg-muted/30'
        : w.endingSoon
          ? 'text-primary border-primary/50 bg-primary/10'
          : 'text-emerald-300 border-emerald-400/30 bg-emerald-400/10';

  const Icon =
    w.status === 'expired' || w.status === 'inactive'
      ? CalendarX2
      : w.status === 'scheduled'
        ? CalendarClock
        : Clock;

  const label =
    w.status === 'inactive'
      ? 'Indisponível'
      : w.status === 'expired'
        ? `Encerrado em ${formatWebinarDate(w.endsAt)}`
        : w.status === 'scheduled'
          ? `Liberação em ${formatWebinarDate(w.startsAt)}`
          : w.endsAt
            ? `Disponível por mais ${formatRemaining(w.msRemaining)}`
            : 'Disponível sem prazo definido';

  if (variant === 'banner') {
    return (
      <div
        className={cn(
          'flex flex-wrap items-center justify-between gap-3 border px-4 py-3 font-mono text-xs uppercase tracking-[0.14em]',
          tone,
          className
        )}
      >
        <span className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {label}
        </span>
        {w.endsAt && w.status === 'available' && (
          <span className="opacity-80">expira em {formatWebinarDate(w.endsAt)}</span>
        )}
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <span className={cn('font-mono text-[11px] uppercase tracking-[0.14em]', className)}>
        {label}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em]',
        tone,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
};

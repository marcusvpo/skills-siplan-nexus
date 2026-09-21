import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Radio, ArrowRight } from 'lucide-react';
import { useWebinars } from '@/hooks/useWebinars';
import { formatRemaining } from '@/lib/webinar';

/** Porta de entrada para o módulo de webinars (só aparece quando há webinars liberados). */
export const WebinarAccessBanner: React.FC = () => {
  const navigate = useNavigate();
  const { tracks, hasWebinars, isLoading } = useWebinars();

  if (isLoading || !hasWebinars) return null;

  const disponiveis = tracks.flatMap((t) => t.videos.filter((v) => v.window.status === 'available'));
  const proximoAExpirar = disponiveis
    .filter((v) => v.window.msRemaining !== null)
    .sort((a, b) => (a.window.msRemaining || 0) - (b.window.msRemaining || 0))[0];

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-xl border border-webinar/40 bg-webinar-surface/60 backdrop-blur-md transition-colors hover:border-webinar/60"
      style={{ boxShadow: 'var(--shadow-webinar)' }}
    >
      {/* Faixa lateral com a identidade do módulo */}
      <div className="absolute inset-y-0 left-0 w-1" style={{ background: 'var(--gradient-webinar)' }} />
      <div className="pointer-events-none absolute -right-14 -top-14 h-36 w-36 rounded-full bg-webinar/10 blur-3xl" />

      <div className="relative flex flex-wrap items-center justify-between gap-4 py-5 pl-6 pr-5">
        <div className="flex items-center gap-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-webinar/40 bg-webinar/10 text-webinar">
            <Radio className="h-5 w-5" />
          </span>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-webinar">
              Webinar liberado para você
            </p>
            <h3 className="text-lg font-semibold text-foreground">
              {disponiveis.length} gravaç{disponiveis.length === 1 ? 'ão' : 'ões'} disponíve
              {disponiveis.length === 1 ? 'l' : 'is'}
            </h3>
            {proximoAExpirar && (
              <p className="text-xs text-muted-foreground">
                A próxima expira em {formatRemaining(proximoAExpirar.window.msRemaining)}.
              </p>
            )}
          </div>
        </div>
        <button
          onClick={() => navigate('/webinars')}
          className="inline-flex items-center gap-2 rounded-md bg-webinar px-4 py-2 text-sm font-medium text-webinar-foreground transition-colors hover:bg-webinar/90"
        >
          Acessar webinars
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </motion.section>
  );
};

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Radio, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
      className="flex flex-wrap items-center justify-between gap-4 border border-primary/40 bg-primary/5 p-5"
    >
      <div className="flex items-center gap-4">
        <span className="flex h-11 w-11 items-center justify-center border border-primary/50 bg-primary/10 text-primary">
          <Radio className="h-5 w-5" />
        </span>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
            Módulo de webinars
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
      <Button variant="glow" className="rounded-none" onClick={() => navigate('/webinars')}>
        Acessar webinars
        <ArrowRight className="h-4 w-4" />
      </Button>
    </motion.section>
  );
};

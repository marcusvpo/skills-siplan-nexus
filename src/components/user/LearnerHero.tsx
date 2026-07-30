import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface LearnerHeroProps {
  nome: string;
  cartorio?: string | null;
  subtitulo?: string;
}

const saudacao = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
};

export const LearnerHero: React.FC<LearnerHeroProps> = ({ nome, cartorio, subtitulo }) => (
  <motion.section
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, ease: 'easeOut' }}
    className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/70 p-8 backdrop-blur-md md:p-10"
  >
    <div
      aria-hidden
      className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl"
    />
    <div
      aria-hidden
      className="pointer-events-none absolute -bottom-32 left-1/3 h-56 w-56 rounded-full bg-primary/10 blur-3xl"
    />

    <div className="relative z-10 max-w-3xl">
      <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
        <Sparkles className="h-3.5 w-3.5" />
        {saudacao()}
      </span>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
        Olá, {nome}! Pronto para continuar seu aprendizado?
      </h1>
      <p className="mt-3 text-base text-muted-foreground">
        {subtitulo ?? 'Escolha um sistema e siga evoluindo no seu ritmo.'}
        {cartorio ? ` · ${cartorio}` : ''}
      </p>
    </div>
  </motion.section>
);

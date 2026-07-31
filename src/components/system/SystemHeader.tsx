
import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Layers } from 'lucide-react';

interface SystemHeaderProps {
  system: {
    id: string;
    nome: string;
    descricao?: string;
  };
}

const SystemHeader: React.FC<SystemHeaderProps> = ({ system }) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/70 p-8 backdrop-blur-md"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/20 blur-[110px]"
      />
      <div className="relative flex flex-wrap items-center gap-5">
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
          <span className="text-2xl font-bold">{system.nome.charAt(0).toUpperCase()}</span>
        </div>
        <div className="min-w-0">
          <Badge variant="secondary" className="mb-2">
            <Layers className="mr-1 h-3 w-3" />
            Categoria
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{system.nome}</h1>
        </div>
      </div>

      {system.descricao && (
        <p className="relative mt-6 max-w-3xl border-l-2 border-primary/50 pl-4 text-base leading-relaxed text-muted-foreground">
          {system.descricao}
        </p>
      )}
    </motion.section>
  );
};

export default SystemHeader;

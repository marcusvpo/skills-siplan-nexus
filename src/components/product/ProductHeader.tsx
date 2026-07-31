
import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Play, Package } from 'lucide-react';

interface ProductHeaderProps {
  product: {
    id: string;
    nome: string;
    descricao?: string;
    video_aulas?: any[];
  };
  system: {
    id: string;
    nome: string;
  };
}

const ProductHeader: React.FC<ProductHeaderProps> = ({ product, system }) => {
  const videoAulas = product.video_aulas || [];

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/70 p-8 backdrop-blur-md"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-primary/15 blur-[110px]"
      />
      <div className="relative flex flex-wrap items-start gap-5">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <Package className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="mb-3 text-3xl font-bold tracking-tight text-foreground">{product.nome}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">
              <BookOpen className="mr-1 h-3 w-3" />
              {system.nome}
            </Badge>
            <Badge variant="outline">
              <Play className="mr-1 h-3 w-3" />
              {videoAulas.length} videoaula{videoAulas.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>
      </div>

      {product.descricao && (
        <p className="relative mt-6 max-w-3xl border-l-2 border-primary/50 pl-4 text-base leading-relaxed text-muted-foreground">
          {product.descricao}
        </p>
      )}
    </motion.section>
  );
};

export default ProductHeader;

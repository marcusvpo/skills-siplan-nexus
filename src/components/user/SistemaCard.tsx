import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, PlayCircle, Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface SistemaCardProps {
  nome: string;
  descricao?: string | null;
  totalProdutos: number;
  totalVideoaulas: number;
  aulasConcluidas: number;
  index?: number;
  onOpen: () => void;
}

export const SistemaCard: React.FC<SistemaCardProps> = ({
  nome,
  descricao,
  totalProdutos,
  totalVideoaulas,
  aulasConcluidas,
  index = 0,
  onOpen,
}) => {
  const percentual = totalVideoaulas > 0 ? Math.round((aulasConcluidas / totalVideoaulas) * 100) : 0;
  const completo = percentual === 100 && totalVideoaulas > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3), ease: 'easeOut' }}
    >
      <Card
        interactive
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpen();
          }
        }}
        className="group relative h-full cursor-pointer overflow-hidden"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl transition-opacity duration-500 group-hover:opacity-100 opacity-60"
        />
        <CardContent className="relative z-10 flex h-full flex-col gap-5 p-6">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/60 text-lg font-bold text-primary-foreground shadow-lg shadow-primary/25">
              {nome.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
                {nome}
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="muted">
                  <Package className="h-3 w-3" />
                  {totalProdutos} produto{totalProdutos === 1 ? '' : 's'}
                </Badge>
                <Badge variant="secondary">
                  <PlayCircle className="h-3 w-3" />
                  {totalVideoaulas} aula{totalVideoaulas === 1 ? '' : 's'}
                </Badge>
                {completo && <Badge variant="success" dot>Concluído</Badge>}
              </div>
            </div>
          </div>

          {descricao && (
            <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{descricao}</p>
          )}

          <div className="mt-auto space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{aulasConcluidas} de {totalVideoaulas} aulas concluídas</span>
                <span className="font-semibold text-foreground">{percentual}%</span>
              </div>
              <Progress value={percentual} />
            </div>

            <Button
              className="w-full"
              variant={percentual > 0 ? 'glow' : 'default'}
              onClick={(e) => {
                e.stopPropagation();
                onOpen();
              }}
            >
              {percentual > 0 ? 'Continuar sistema' : 'Acessar sistema'}
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

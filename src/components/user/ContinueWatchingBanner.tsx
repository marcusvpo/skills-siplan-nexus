import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Clock3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useContinuarAssistindo } from '@/hooks/useContinuarAssistindo';
import { useProgressoGeral } from '@/hooks/useProgressoGeral';

export const ContinueWatchingBanner: React.FC = () => {
  const navigate = useNavigate();
  const { data: item, isLoading } = useContinuarAssistindo();
  const { progressos } = useProgressoGeral();

  if (isLoading || !item) return null;

  const progressoProduto = item.produtoId ? progressos[item.produtoId] : undefined;
  const percentual = progressoProduto?.percentual ?? 0;

  const podeNavegar = !!item.sistemaId && !!item.produtoId;
  const destino = podeNavegar
    ? `/system/${item.sistemaId}/product/${item.produtoId}/lesson/${item.videoAulaId}`
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.05, ease: 'easeOut' }}
    >
      <Card className="overflow-hidden border-primary/25 bg-card/80">
        <CardContent className="flex flex-col gap-6 p-6 md:flex-row md:items-center">
          <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-xl border border-border/50 bg-muted/40 md:w-72">
            {item.thumbnail ? (
              <img
                src={item.thumbnail}
                alt={`Thumbnail da videoaula ${item.titulo}`}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-transparent">
                <Play className="h-10 w-10 text-primary" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            <button
              type="button"
              aria-label="Continuar assistindo"
              onClick={() => destino && navigate(destino)}
              className="absolute inset-0 flex items-center justify-center"
            >
              <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/40 transition-transform duration-300 hover:scale-105">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/50" />
                <Play className="relative h-6 w-6 translate-x-[1px]" />
              </span>
            </button>
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge dot variant={item.concluida ? 'success' : 'default'}>
                {item.concluida ? 'Aula concluída' : 'Em progresso'}
              </Badge>
              {item.sistemaNome && <Badge variant="muted">{item.sistemaNome}</Badge>}
              {item.produtoNome && <Badge variant="secondary">{item.produtoNome}</Badge>}
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Continuar de onde parou
              </p>
              <h2 className="mt-1 truncate text-2xl font-bold text-foreground">{item.titulo}</h2>
              {item.descricao && (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.descricao}</p>
              )}
            </div>

            {progressoProduto && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {progressoProduto.completas} de {progressoProduto.total} aulas do produto
                  </span>
                  <span className="font-semibold text-foreground">{percentual}%</span>
                </div>
                <Progress value={percentual} />
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button variant="glow" disabled={!destino} onClick={() => destino && navigate(destino)}>
                <Play className="h-4 w-4" />
                {item.concluida ? 'Rever aula' : 'Continuar assistindo'}
              </Button>
              {item.atualizadoEm && (
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock3 className="h-3.5 w-3.5" />
                  Último acesso em {new Date(item.atualizadoEm).toLocaleDateString('pt-BR')}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

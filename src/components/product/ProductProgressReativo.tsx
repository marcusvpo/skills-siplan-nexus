import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { useProgressoProduto } from '@/hooks/useProgressoProduto';

interface ProductProgressReativoProps {
  produtoId?: string;
  produtoNome: string;
}

export const ProductProgressReativo: React.FC<ProductProgressReativoProps> = ({
  produtoId,
  produtoNome
}) => {
  console.log('🟢 [ProductProgressReativo] Componente renderizado:', { produtoId, produtoNome });

  const { total: totalAulas, completas: aulasCompletas, percentual, isLoading, error } = useProgressoProduto(produtoId || '');

  console.log('🟢 [ProductProgressReativo] Hook retornou:', {
    totalAulas,
    aulasCompletas,
    percentual,
    isLoading,
    error
  });

  if (isLoading || !produtoId) {
    return (
      <Card className="mb-6">
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center justify-between">
            <div className="h-4 w-40 animate-pulse rounded bg-muted/50" />
            <div className="h-4 w-20 animate-pulse rounded bg-muted/50" />
          </div>
          <div className="h-2 w-full animate-pulse rounded-full bg-muted/40" />
          <p className="text-xs text-muted-foreground">
            {!produtoId ? 'Aguardando produto...' : 'Carregando seu progresso...'}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mb-6 border-destructive/30">
        <CardContent className="flex items-start gap-3 p-6">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div>
            <h3 className="font-semibold text-foreground">Não foi possível carregar o progresso</h3>
            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const concluido = percentual === 100;

  return (
    <Card className="relative mb-6 overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-primary/15 blur-[100px]"
      />
      <CardContent className="relative space-y-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                concluido ? 'bg-primary text-primary-foreground' : 'bg-primary/15 text-primary'
              }`}
            >
              {concluido ? <CheckCircle2 className="h-5 w-5" /> : <TrendingUp className="h-5 w-5" />}
            </span>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Seu progresso</p>
              <h3 className="text-lg font-semibold text-foreground">{produtoNome}</h3>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold leading-none text-foreground">{percentual}%</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {aulasCompletas}/{totalAulas} aulas
            </p>
          </div>
        </div>

        <Progress value={percentual} className="h-2" />

        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          {concluido ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Produto concluído — parabéns!
            </>
          ) : (
            <>
              <Clock className="h-4 w-4" />
              {totalAulas - aulasCompletas} aula{totalAulas - aulasCompletas !== 1 ? 's' : ''} restante
              {totalAulas - aulasCompletas !== 1 ? 's' : ''}
            </>
          )}
        </p>
      </CardContent>
    </Card>
  );
};
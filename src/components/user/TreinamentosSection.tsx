import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, BookOpen } from 'lucide-react';
import { useSistemasCartorioWithAccess } from '@/hooks/useSistemasCartorioWithAccess';
import { useProgressoGeral } from '@/hooks/useProgressoGeral';
import { SistemaCard } from '@/components/user/SistemaCard';
import { logger } from '@/utils/logger';
import { useAuth } from '@/contexts/AuthContextFixed';

const SkeletonCard = () => (
  <div className="h-64 animate-pulse rounded-xl border border-border/40 bg-card/60" />
);

export const TreinamentosSection: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: sistemas = [], isLoading, error, refetch } = useSistemasCartorioWithAccess();
  const { progressos } = useProgressoGeral();

  React.useEffect(() => {
    logger.info('📚 [TreinamentosSection] Component state:', {
      categoriasCount: sistemas.length,
      isLoading,
      hasError: !!error,
      userType: user?.type,
      cartorioId: user?.cartorio_id,
    });
  }, [sistemas.length, isLoading, error, user]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    logger.error('❌ [TreinamentosSection] Error details:', { error: error.message });

    return (
      <div className="flex items-center justify-center py-16">
        <Card className="max-w-lg border-destructive/40">
          <CardContent className="p-8 text-center">
            <AlertCircle className="mx-auto mb-4 h-14 w-14 text-destructive" />
            <h3 className="mb-2 text-xl font-bold text-foreground">Erro ao carregar sistemas</h3>
            <p className="mb-6 text-sm text-muted-foreground">
              {error instanceof Error ? error.message : 'Erro desconhecido ao carregar sistemas.'}
            </p>
            <Button onClick={() => refetch()} className="w-full" variant="glow">
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </Button>
            <p className="mt-3 text-xs text-muted-foreground">
              Se o problema persistir, contate o administrador.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (sistemas.length === 0) {
    return (
      <div className="py-16 text-center">
        <Card className="mx-auto max-w-lg">
          <CardContent className="p-10 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <BookOpen className="h-8 w-8" />
            </div>
            <h3 className="mb-3 text-2xl font-semibold text-foreground">
              Nenhum sistema disponível
            </h3>
            <p className="text-sm text-muted-foreground">
              Os sistemas aparecerão aqui quando estiverem liberados para o seu cartório.
              Entre em contato com o administrador para mais informações.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="flex items-center gap-3 text-2xl font-bold text-foreground">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <BookOpen className="h-5 w-5" />
          </span>
          Seus sistemas
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Selecione um sistema para acessar os produtos e videoaulas.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {sistemas.map((categoria, index) => {
          const produtos = categoria.produtos || [];
          const totalVideoaulas = produtos.reduce((acc, p) => acc + (p.video_aulas?.length || 0), 0);
          const aulasConcluidas = produtos.reduce(
            (acc, p) => acc + (progressos[p.id]?.completas || 0),
            0
          );

          return (
            <SistemaCard
              key={categoria.id}
              index={index}
              nome={categoria.nome}
              descricao={categoria.descricao}
              totalProdutos={produtos.length}
              totalVideoaulas={totalVideoaulas}
              aulasConcluidas={aulasConcluidas}
              onOpen={() => navigate(`/system/${categoria.id}`)}
            />
          );
        })}
      </div>
    </section>
  );
};

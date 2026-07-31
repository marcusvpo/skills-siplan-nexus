
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, PlayCircle, CheckCircle2, Package } from 'lucide-react';
import { useProgressoGeral } from '@/hooks/useProgressoGeral';
import { useProgressContext } from '@/contexts/ProgressContext';

interface Product {
  id: string;
  nome: string;
  descricao?: string;
  video_aulas?: any[];
}

interface ProductsListProps {
  products: Product[];
  systemId: string;
}

const ProductsList: React.FC<ProductsListProps> = ({ products, systemId }) => {
  const navigate = useNavigate();
  const { progressos, isLoading: progressLoading, refetch: refetchProgressos } = useProgressoGeral();
  
  // Observar mudanças de progresso globalmente
  const { refreshKey } = useProgressContext();
  
  // Refetch quando houver mudanças no progresso
  useEffect(() => {
    if (refetchProgressos && refreshKey > 0) {
      refetchProgressos();
    }
  }, [refreshKey, refetchProgressos]);

  if (products.length === 0) {
    return (
      <Card className="page-transition">
        <CardContent className="p-12 text-center">
          <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Package className="h-8 w-8" />
          </span>
          <h3 className="mb-2 text-xl font-semibold text-foreground">Nenhum produto disponível</h3>
          <p className="mx-auto mb-6 max-w-md text-sm leading-relaxed text-muted-foreground">
            Os produtos de treinamento para esta categoria serão disponibilizados em breve.
          </p>
          <Button onClick={() => navigate('/dashboard')} variant="outline">
            Voltar ao Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="page-transition grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {products.map((produto, index) => {
        const totalAulas = produto.video_aulas?.length || 0;
        const progresso = progressos[produto.id] || { 
          total: totalAulas, 
          completas: 0, 
          percentual: 0 
        };
        
        const concluido = totalAulas > 0 && progresso.percentual >= 100;

        return (
          <motion.div
            key={produto.id}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: Math.min(index * 0.06, 0.4) }}
          >
            <Card
              interactive
              className="group flex h-full cursor-pointer flex-col"
              onClick={() => navigate(`/system/${systemId}/product/${produto.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Package className="h-5 w-5" />
                  </span>
                  {concluido ? (
                    <Badge variant="secondary">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Concluído
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      <PlayCircle className="mr-1 h-3 w-3" />
                      {totalAulas} aula{totalAulas !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg leading-snug transition-colors group-hover:text-primary">
                  {produto.nome}
                </CardTitle>
                {produto.descricao && (
                  <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                    {produto.descricao}
                  </p>
                )}
              </CardHeader>
              <CardContent className="mt-auto space-y-4">
                {totalAulas > 0 && !progressLoading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="uppercase tracking-wider text-muted-foreground">Progresso</span>
                      <span className="font-semibold text-foreground">
                        {progresso.completas}/{progresso.total} · {progresso.percentual}%
                      </span>
                    </div>
                    <Progress value={progresso.percentual} className="h-1.5" />
                  </div>
                )}

                <Button
                  variant="glow"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/system/${systemId}/product/${produto.id}`);
                  }}
                >
                  Acessar produto
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};

export default ProductsList;

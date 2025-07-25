import React, { useEffect } from 'react';
import { useProgressoProduto } from '@/hooks/useProgressoProduto';
import ProgressBar from '@/components/ProgressBar';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';
import { useProgressContext } from '@/contexts/ProgressContext';

interface ProductProgressBarProps {
  produtoId: string;
  className?: string;
}

export const ProductProgressBar: React.FC<ProductProgressBarProps> = ({ 
  produtoId, 
  className = '' 
}) => {
  const { total, completas, percentual, isLoading, error, refetch } = useProgressoProduto(produtoId);
  
  // Observar mudanças de progresso globalmente
  const { refreshKey } = useProgressContext();
  
  // Refetch quando houver mudanças no progresso
  useEffect(() => {
    if (refetch && refreshKey > 0) {
      refetch();
    }
  }, [refreshKey, refetch]);

  if (isLoading) {
    return (
      <Card className={`gradient-card shadow-modern border-gray-600/50 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-4 w-4 animate-spin text-gray-400 mr-2" />
            <span className="text-sm text-gray-400">Carregando progresso...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`gradient-card shadow-modern border-red-600/50 ${className}`}>
        <CardContent className="p-4">
          <div className="text-center">
            <span className="text-sm text-red-400">Erro ao carregar progresso</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`gradient-card shadow-modern border-gray-600/50 ${className}`}>
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-white">
              Progresso do Produto
            </span>
            <span className="text-sm text-gray-400">
              {completas} de {total} concluídas
            </span>
          </div>
          
          <ProgressBar 
            percentual={percentual}
            total={total}
            completas={completas}
            size="large"
            showText={true}
            showStats={true}
          />
        </div>
      </CardContent>
    </Card>
  );
};
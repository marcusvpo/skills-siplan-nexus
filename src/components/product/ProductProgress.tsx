import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import ProgressBar from '@/components/ProgressBar';
import { useProgressoProduto } from '@/hooks/useProgressoProduto';
import { Trophy, Target, Play } from 'lucide-react';

interface ProductProgressProps {
  productId: string;
  productName: string;
}

const ProductProgress: React.FC<ProductProgressProps> = ({ productId, productName }) => {
  const { total, completas, percentual, restantes, isLoading, error, refetch } = useProgressoProduto(productId);

  if (isLoading) {
    return (
      <Card className="bg-gray-800/50 border-gray-600 mb-6">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="h-3 bg-gray-700 rounded w-full mb-2"></div>
            <div className="h-2 bg-gray-700 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-900/20 border-red-800/50 mb-6">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-red-400">
            <Target className="h-5 w-5" />
            <span className="text-sm">Erro ao carregar progresso</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getProgressIcon = () => {
    if (percentual === 100) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (percentual >= 70) return <Target className="h-5 w-5 text-green-500" />;
    return <Play className="h-5 w-5 text-blue-500" />;
  };

  return (
    <Card className="bg-gray-800/50 border-gray-600 mb-6">
      <CardContent className="p-6">
        <div className="flex items-center space-x-3 mb-4">
          {getProgressIcon()}
          <div>
            <h3 className="text-lg font-semibold text-white">Seu Progresso</h3>
            <p className="text-sm text-gray-400">Curso: {productName}</p>
          </div>
        </div>
        
        <ProgressBar
          percentual={percentual}
          total={total}
          completas={completas}
          size="large"
          showText={true}
          showStats={true}
        />
        
        {percentual === 100 && (
          <div className="mt-4 p-3 bg-green-900/30 border border-green-800/50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-green-400 font-medium">
                Parabéns! Você concluiu este curso!
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductProgress;
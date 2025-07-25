
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, ArrowRight, Clock } from 'lucide-react';
import ProgressBar from '@/components/ProgressBar';
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
      <div className="page-transition">
        <Card className="gradient-card shadow-elevated border-gray-600/50 card-enter">
          <CardContent className="p-12 text-center">
            <div className="text-6xl mb-6 animate-bounce">📚</div>
            <h3 className="text-2xl font-semibold text-gray-300 mb-3 text-enhanced">Nenhum produto disponível</h3>
            <p className="text-gray-400 mb-6 leading-relaxed text-lg">
              Os produtos de treinamento para este sistema serão disponibilizados em breve.
            </p>
            <Button 
              onClick={() => navigate('/dashboard')} 
              variant="outline" 
              className="border-gray-600 text-gray-300 hover:bg-gray-700/50 btn-hover-lift shadow-modern"
            >
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 page-transition">
      {products.map((produto, index) => {
        const totalAulas = produto.video_aulas?.length || 0;
        const progresso = progressos[produto.id] || { 
          total: totalAulas, 
          completas: 0, 
          percentual: 0 
        };
        
        console.log('🎯 [ProductsList] Renderizando produto:', {
          produtoId: produto.id,
          nome: produto.nome,
          progresso,
          totalAulas,
          progressLoading,
          allProgressos: progressos
        });
        
        return (
          <Card 
            key={produto.id} 
            className="gradient-card shadow-modern hover:shadow-elevated border-gray-600/50 hover:border-red-500/50 transition-all duration-500 cursor-pointer group card-enter btn-hover-lift"
            style={{ animationDelay: `${index * 0.1}s` }}
            onClick={() => navigate(`/system/${systemId}/product/${produto.id}`)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-xl text-white group-hover:text-red-400 transition-colors duration-300 text-enhanced">
                {produto.nome}
              </CardTitle>
              {produto.descricao && (
                <p className="text-gray-400 text-sm leading-relaxed line-clamp-3">
                  {produto.descricao}
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm text-gray-400">
                <div className="flex items-center space-x-2">
                  <div className="p-1 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full shadow-modern">
                    <Clock className="h-3 w-3 text-white" />
                  </div>
                  <span>{totalAulas} videoaula{totalAulas !== 1 ? 's' : ''}</span>
                </div>
                <div className="p-1 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full">
                  <BookOpen className="h-4 w-4 text-gray-300 group-hover:text-red-400 transition-colors duration-300" />
                </div>
              </div>
              
              {/* Mini Progress Bar */}
              {totalAulas > 0 && !progressLoading && (
                <div className="mt-3 pt-3 border-t border-gray-600/50">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-500">Progresso</span>
                    <span className="text-xs font-medium text-gray-400">{progresso.percentual}%</span>
                  </div>
                  <ProgressBar 
                    percentual={progresso.percentual}
                    total={progresso.total}
                    completas={progresso.completas}
                    size="small"
                    showText={false}
                    showStats={false}
                  />
                </div>
              )}
              
              <Button 
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 transition-all duration-300 btn-hover-lift shadow-modern group-hover:shadow-elevated mt-4"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/system/${systemId}/product/${produto.id}`);
                }}
              >
                Acessar Produto
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ProductsList;

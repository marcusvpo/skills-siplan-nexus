
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, ArrowRight, Clock } from 'lucide-react';
import { ProductProgress } from '@/components/ProductProgress';

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

  if (products.length === 0) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-12 text-center">
          <div className="text-6xl mb-6">📚</div>
          <h3 className="text-2xl font-semibold text-gray-300 mb-3">Nenhum produto disponível</h3>
          <p className="text-gray-400 mb-6">
            Os produtos de treinamento para este sistema serão disponibilizados em breve.
          </p>
          <Button 
            onClick={() => navigate('/dashboard')} 
            variant="outline" 
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            Voltar ao Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((produto) => {
        const totalAulas = produto.video_aulas?.length || 0;
        
        return (
          <Card 
            key={produto.id} 
            className="bg-gray-800/50 border-gray-600 hover:border-red-500/50 transition-all duration-300 cursor-pointer group hover:scale-105"
            onClick={() => navigate(`/system/${systemId}/product/${produto.id}`)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-xl text-white group-hover:text-red-400 transition-colors">
                {produto.nome}
              </CardTitle>
              {produto.descricao && (
                <p className="text-gray-400 text-sm leading-relaxed">
                  {produto.descricao}
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm text-gray-400">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>{totalAulas} videoaula{totalAulas !== 1 ? 's' : ''}</span>
                </div>
              </div>
              
              {/* Barra de Progresso do Produto */}
              <ProductProgress productId={produto.id} className="mb-4" />
              
              <Button 
                className="w-full bg-red-600 hover:bg-red-700 transition-all duration-200 group-hover:scale-105"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/system/${systemId}/product/${produto.id}`);
                }}
              >
                Acessar Produto
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ProductsList;

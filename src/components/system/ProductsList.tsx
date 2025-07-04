
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, ArrowRight, Clock } from 'lucide-react';

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
      <div className="page-transition">
        <Card className="gradient-card shadow-elevated border-gray-700/50">
          <CardContent className="p-12 text-center">
            <div className="text-6xl mb-6 animate-bounce">📚</div>
            <h3 className="text-2xl font-semibold text-gray-300 mb-3 text-enhanced">Nenhum produto disponível</h3>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Os produtos de treinamento para este sistema serão disponibilizados em breve.
            </p>
            <Button 
              onClick={() => navigate('/dashboard')} 
              variant="outline" 
              className="border-gray-600 text-gray-300 hover:bg-gray-700/50 btn-hover-lift"
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
        
        return (
          <Card 
            key={produto.id} 
            className="gradient-card shadow-modern hover:shadow-elevated border-gray-600/50 hover:border-red-500/50 transition-all duration-500 cursor-pointer group card-enter"
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
                  <div className="p-1 bg-blue-600/20 rounded-full">
                    <Clock className="h-3 w-3 text-blue-400" />
                  </div>
                  <span>{totalAulas} videoaula{totalAulas !== 1 ? 's' : ''}</span>
                </div>
                <BookOpen className="h-4 w-4 text-gray-500 group-hover:text-red-400 transition-colors duration-300" />
              </div>
              
              <Button 
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 transition-all duration-300 btn-hover-lift shadow-modern group-hover:shadow-elevated"
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

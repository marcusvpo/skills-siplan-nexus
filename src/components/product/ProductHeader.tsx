
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Play } from 'lucide-react';

interface ProductHeaderProps {
  product: {
    id: string;
    nome: string;
    descricao?: string;
    video_aulas?: any[];
  };
  system: {
    id: string;
    nome: string;
  };
}

const ProductHeader: React.FC<ProductHeaderProps> = ({ product, system }) => {
  const videoAulas = product.video_aulas || [];

  return (
    <div className="bg-gray-800/50 rounded-lg p-8 border border-gray-600">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{product.nome}</h1>
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="bg-blue-600/20 text-blue-300 border-0">
              <BookOpen className="h-3 w-3 mr-1" />
              {system.nome}
            </Badge>
            <Badge variant="secondary" className="bg-green-600/20 text-green-300 border-0">
              <Play className="h-3 w-3 mr-1" />
              {videoAulas.length} videoaula{videoAulas.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>
      </div>
      
      {product.descricao && (
        <p className="text-gray-300 text-lg leading-relaxed">
          {product.descricao}
        </p>
      )}
    </div>
  );
};

export default ProductHeader;


import React from 'react';
import { Badge } from '@/components/ui/badge';
import { BookOpen } from 'lucide-react';

interface SystemHeaderProps {
  system: {
    id: string;
    nome: string;
    descricao?: string;
  };
}

const SystemHeader: React.FC<SystemHeaderProps> = ({ system }) => {
  return (
    <div className="bg-gray-800/50 rounded-lg p-8 border border-gray-600">
      <div className="flex items-center space-x-4 mb-6">
        <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
          <span className="text-2xl font-bold text-white">
            {system.nome.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">{system.nome}</h1>
          <Badge variant="secondary" className="bg-blue-600/20 text-blue-300 border-0 mt-2">
            <BookOpen className="h-3 w-3 mr-1" />
            Categoria de Treinamento
          </Badge>
        </div>
      </div>
      
      {system.descricao && (
        <p className="text-gray-300 text-lg leading-relaxed">
          {system.descricao}
        </p>
      )}
    </div>
  );
};

export default SystemHeader;

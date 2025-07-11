
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Video } from 'lucide-react';

interface Sistema {
  id: string;
  nome: string;
  descricao?: string;
  ordem: number;
}

interface Produto {
  id: string;
  nome: string;
  descricao?: string;
  sistema_id: string;
  ordem: number;
}

interface VideoAulasHeaderProps {
  sistema: Sistema;
  produto: Produto;
  onBack: () => void;
  onCreateNew: () => void;
  onShowForm: () => void;
}

export const VideoAulasHeader: React.FC<VideoAulasHeaderProps> = ({
  sistema,
  produto,
  onBack,
  onCreateNew,
  onShowForm
}) => {
  return (
    <div className="flex items-center justify-between page-transition">
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="border-gray-600 text-gray-300 hover:bg-gray-700/50 btn-hover-lift"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar aos Produtos
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-white text-enhanced">Videoaulas</h2>
          <p className="text-gray-300">
            Categoria: {sistema.nome} | Produto: {produto.nome}
          </p>
        </div>
      </div>
      <div className="flex space-x-3">
        <Button
          onClick={onCreateNew}
          className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white btn-hover-lift shadow-modern"
        >
          <Video className="h-4 w-4 mr-2" />
          Editor WYSIWYG
        </Button>
        <Button
          onClick={onShowForm}
          className="bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white btn-hover-lift shadow-modern"
        >
          <Plus className="h-4 w-4 mr-2" />
          Cadastrar Nova Videoaula
        </Button>
      </div>
    </div>
  );
};

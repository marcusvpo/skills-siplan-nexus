
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2, ArrowLeft, Play, Palette } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { VideoAulaFormFixed } from './VideoAulaFormFixed';
import { useNavigate } from 'react-router-dom';

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

interface VideoAula {
  id: string;
  titulo: string;
  descricao?: string;
  url_video: string;
  id_video_bunny: string;
  ordem: number;
  produto_id: string;
}

interface VideoAulasListFixedProps {
  sistema: Sistema;
  produto: Produto;
  videoAulas: VideoAula[];
  onVideoAulasChange: () => void;
  onBack: () => void;
}

export const VideoAulasListFixed: React.FC<VideoAulasListFixedProps> = ({
  sistema,
  produto,
  videoAulas,
  onVideoAulasChange,
  onBack
}) => {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [editingVideoAula, setEditingVideoAula] = useState<VideoAula | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async (videoAulaId: string, videoAulaTitle: string) => {
    if (!confirm(`Tem certeza que deseja excluir a videoaula "${videoAulaTitle}"?`)) {
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('video_aulas')
        .delete()
        .eq('id', videoAulaId);

      if (error) throw error;

      toast({
        title: "Videoaula excluída",
        description: `A videoaula "${videoAulaTitle}" foi excluída com sucesso.`,
      });

      onVideoAulasChange();
    } catch (error) {
      console.error('Error deleting video aula:', error);
      toast({
        title: "Erro ao excluir videoaula",
        description: "Ocorreu um erro ao excluir a videoaula.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (videoAula: VideoAula) => {
    setEditingVideoAula(videoAula);
    setShowForm(true);
  };

  const handleCreateNew = () => {
    setEditingVideoAula(null);
    setShowForm(true);
  };

  const handleCreateNewWYSIWYG = () => {
    navigate(`/admin/videoaula-editor?sistema_id=${sistema.id}&produto_id=${produto.id}`);
  };

  const handleEditWYSIWYG = (videoAula: VideoAula) => {
    navigate(`/admin/videoaula-editor/${videoAula.id}`);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingVideoAula(null);
    onVideoAulasChange();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingVideoAula(null);
  };

  if (showForm) {
    return (
      <VideoAulaFormFixed
        videoAula={editingVideoAula}
        onSuccess={handleFormSuccess}
        onCancel={handleFormCancel}
        preSelectedSistema={sistema.id}
        preSelectedProduto={produto.id}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={onBack}
            className="border-gray-600 text-gray-300 hover:bg-gray-700/50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar aos Produtos
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-white">Videoaulas</h2>
            <p className="text-gray-300">
              Sistema: {sistema.nome} • Produto: {produto.nome}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={handleCreateNew}
            variant="outline"
            className="border-orange-600 text-orange-400 hover:bg-orange-700/20"
          >
            <Plus className="h-4 w-4 mr-2" />
            Formulário Simples
          </Button>
          <Button
            onClick={handleCreateNewWYSIWYG}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            <Palette className="h-4 w-4 mr-2" />
            Editor WYSIWYG
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {videoAulas.map((videoAula) => (
          <Card key={videoAula.id} className="bg-gray-800/50 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg">{videoAula.titulo}</CardTitle>
              {videoAula.descricao && (
                <p className="text-gray-300 text-sm">{videoAula.descricao}</p>
              )}
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span>Ordem: {videoAula.ordem}</span>
                {videoAula.id_video_bunny && (
                  <span>ID Bunny: {videoAula.id_video_bunny}</span>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => videoAula.url_video && window.open(videoAula.url_video, '_blank')}
                  disabled={!videoAula.url_video}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700/50 disabled:opacity-50"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {videoAula.url_video ? 'Visualizar' : 'Sem vídeo'}
                </Button>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(videoAula)}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700/50"
                    title="Editar com formulário simples"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditWYSIWYG(videoAula)}
                    className="border-orange-600 text-orange-400 hover:bg-orange-700/20"
                    title="Editar com editor WYSIWYG"
                  >
                    <Palette className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(videoAula.id, videoAula.titulo)}
                    disabled={isLoading}
                    className="border-red-600 text-red-400 hover:bg-red-700/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {videoAulas.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">Nenhuma videoaula cadastrada neste produto</p>
          <p className="text-gray-500 text-sm mt-2 mb-4">
            Escolha uma das opções para começar:
          </p>
          <div className="flex justify-center space-x-4">
            <Button
              onClick={handleCreateNew}
              variant="outline"
              className="border-orange-600 text-orange-400 hover:bg-orange-700/20"
            >
              <Plus className="h-4 w-4 mr-2" />
              Formulário Simples
            </Button>
            <Button
              onClick={handleCreateNewWYSIWYG}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Palette className="h-4 w-4 mr-2" />
              Editor WYSIWYG
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

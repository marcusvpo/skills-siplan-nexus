import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2, ArrowLeft, ExternalLink, Video } from 'lucide-react';
import { VideoAulaFormFixed } from './VideoAulaFormFixed';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (videoAulaId: string, videoAulaTitle: string) => {
    if (!confirm(`Tem certeza que deseja excluir a videoaula "${videoAulaTitle}"?`)) {
      return;
    }

    setIsDeleting(videoAulaId);
    try {
      const { error } = await supabase
        .from('video_aulas')
        .delete()
        .eq('id', videoAulaId);

      if (error) {
        console.error('Error deleting video aula:', error);
        throw error;
      }

      toast({
        title: "Videoaula excluída",
        description: `A videoaula "${videoAulaTitle}" foi excluída com sucesso.`,
      });
      
      // Forçar atualização da lista
      onVideoAulasChange();
      
    } catch (error) {
      console.error('Error deleting video aula:', error);
      toast({
        title: "Erro ao excluir videoaula",
        description: "Ocorreu um erro ao excluir a videoaula.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingVideoAula(null);
    
    // Forçar atualização da lista
    onVideoAulasChange();
  };

  const handleEdit = (videoAula: VideoAula) => {
    setEditingVideoAula(videoAula);
    setShowForm(true);
  };

  const handleCreateNew = () => {
    navigate(`/admin/videoaula/nova?sistema_id=${sistema.id}&produto_id=${produto.id}`);
  };

  const handleEditWYSIWYG = (videoAula: VideoAula) => {
    navigate(`/admin/videoaula-editor/${videoAula.id}`);
  };

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
              Sistema: {sistema.nome} | Produto: {produto.nome}
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={handleCreateNew}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Video className="h-4 w-4 mr-2" />
            Editor WYSIWYG
          </Button>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Cadastrar Nova Videoaula
          </Button>
        </div>
      </div>

      {showForm && (
        <VideoAulaFormFixed
          sistema={sistema}
          produto={produto}
          videoAula={editingVideoAula}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowForm(false);
            setEditingVideoAula(null);
          }}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videoAulas.map((videoAula) => (
          <Card key={videoAula.id} className="bg-gray-800/50 border-gray-600 shadow-modern">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg">{videoAula.titulo}</CardTitle>
              {videoAula.descricao && (
                <p className="text-gray-300 text-sm line-clamp-2">{videoAula.descricao}</p>
              )}
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Ordem: {videoAula.ordem}</span>
                {videoAula.id_video_bunny && (
                  <span className="bg-green-600 text-white px-2 py-1 rounded">
                    Bunny.net
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-col space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditWYSIWYG(videoAula)}
                  className="border-purple-600 text-purple-400 hover:bg-purple-700/20 w-full"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Editar WYSIWYG
                </Button>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(videoAula)}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700/50 flex-1"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(videoAula.id, videoAula.titulo)}
                    disabled={isDeleting === videoAula.id}
                    className="border-red-600 text-red-400 hover:bg-red-700/20 flex-1"
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
          <p className="text-gray-500 text-sm mt-2">
            Clique em "Editor WYSIWYG" ou "Cadastrar Nova Videoaula" para começar
          </p>
        </div>
      )}
    </div>
  );
};

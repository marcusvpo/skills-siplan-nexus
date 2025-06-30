import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2, ArrowLeft, Play } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
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

interface VideoAulasListProps {
  sistema: Sistema;
  produto: Produto;
  videoAulas: VideoAula[];
  onVideoAulasChange: () => void;
  onBack: () => void;
}

export const VideoAulasList: React.FC<VideoAulasListProps> = ({
  sistema,
  produto,
  videoAulas,
  onVideoAulasChange,
  onBack
}) => {
  const navigate = useNavigate();
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
    navigate(`/admin/video-aulas/editar/${videoAula.id}`);
  };

  const handleCreateNew = () => {
    navigate(`/admin/videoaula/nova?sistema_id=${sistema.id}&produto_id=${produto.id}`);
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
              Sistema: {sistema.nome} • Produto: {produto.nome}
            </p>
          </div>
        </div>
        <Button
          onClick={handleCreateNew}
          className="bg-orange-600 hover:bg-orange-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Cadastrar Nova Videoaula
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {videoAulas.map((videoAula) => (
          <Card key={videoAula.id} className="bg-gray-800/50 border-gray-600 shadow-modern">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg">{videoAula.titulo}</CardTitle>
              {videoAula.descricao && (
                <p className="text-gray-300 text-sm">{videoAula.descricao}</p>
              )}
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span>Ordem: {videoAula.ordem}</span>
                <span>ID Bunny: {videoAula.id_video_bunny || 'Não configurado'}</span>
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
                  >
                    <Edit className="h-4 w-4" />
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
          <p className="text-gray-500 text-sm mt-2">
            Clique em "Cadastrar Nova Videoaula" para começar
          </p>
        </div>
      )}
    </div>
  );
};

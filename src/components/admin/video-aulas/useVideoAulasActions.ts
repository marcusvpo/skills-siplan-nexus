
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VideoAula {
  id: string;
  titulo: string;
  descricao?: string;
  url_video: string;
  id_video_bunny: string;
  ordem: number;
  produto_id: string;
}

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

export const useVideoAulasActions = (
  sistema: Sistema,
  produto: Produto,
  onVideoAulasChange: () => void
) => {
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (videoAulaId: string, videoAulaTitle: string) => {
    if (!confirm(`Tem certeza que deseja excluir a videoaula "${videoAulaTitle}"?`)) {
      return;
    }

    setIsDeleting(videoAulaId);
    try {
      // Primeiro, deletar todos os registros de progresso relacionados
      const { error: progressError } = await supabase
        .from('user_video_progress')
        .delete()
        .eq('video_aula_id', videoAulaId);

      if (progressError) {
        console.error('Error deleting user progress:', progressError);
        throw progressError;
      }

      // Depois, deletar a videoaula
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

  const handleCreateNew = () => {
    navigate(`/admin/videoaula/nova?sistema_id=${sistema.id}&produto_id=${produto.id}`);
  };

  const handleEditWYSIWYG = (videoAula: VideoAula) => {
    navigate(`/admin/videoaula-editor/${videoAula.id}`);
  };

  return {
    isDeleting,
    handleDelete,
    handleCreateNew,
    handleEditWYSIWYG
  };
};

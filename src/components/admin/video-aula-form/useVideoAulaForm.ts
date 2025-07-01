
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { VideoAula, VideoAulaFormData, Produto } from './types';

export const useVideoAulaForm = (videoAula: VideoAula | null | undefined, produto: Produto) => {
  const [formData, setFormData] = useState<VideoAulaFormData>({
    titulo: videoAula?.titulo || '',
    descricao: videoAula?.descricao || '',
    url_video: videoAula?.url_video || '',
    id_video_bunny: videoAula?.id_video_bunny || '',
    ordem: videoAula?.ordem || 1
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent, onSuccess: () => void) => {
    e.preventDefault();
    
    if (!formData.titulo.trim() || !formData.url_video.trim()) {
      toast({
        title: "Dados obrigatórios",
        description: "Informe pelo menos o título e a URL do vídeo.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      if (videoAula) {
        // Update existing video aula
        const { error } = await supabase
          .from('video_aulas')
          .update({
            titulo: formData.titulo.trim(),
            descricao: formData.descricao.trim() || null,
            url_video: formData.url_video.trim(),
            id_video_bunny: formData.id_video_bunny.trim() || null,
            ordem: formData.ordem
          })
          .eq('id', videoAula.id);

        if (error) throw error;

        toast({
          title: "Videoaula atualizada",
          description: `Videoaula "${formData.titulo}" foi atualizada com sucesso.`,
        });
      } else {
        // Create new video aula - directly linked to produto
        const { error } = await supabase
          .from('video_aulas')
          .insert({
            titulo: formData.titulo.trim(),
            descricao: formData.descricao.trim() || null,
            produto_id: produto.id,
            ordem: formData.ordem,
            url_video: formData.url_video.trim(),
            id_video_bunny: formData.id_video_bunny.trim() || null
          });

        if (error) throw error;

        toast({
          title: "Videoaula criada",
          description: `Videoaula "${formData.titulo}" foi criada com sucesso.`,
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving video aula:', error);
      toast({
        title: "Erro ao salvar videoaula",
        description: "Ocorreu um erro ao salvar a videoaula.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    formData,
    setFormData,
    isLoading,
    handleSubmit
  };
};

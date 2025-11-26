
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateVideoAula, useUpdateVideoAula } from '@/hooks/useSupabaseDataRefactored';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';
import { Save, X, Loader2 } from 'lucide-react';

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
  id_video_bunny?: string;
  url_thumbnail?: string;
  ordem: number;
  produto_id: string;
}

interface VideoAulaFormFixedProps {
  sistema: Sistema;
  produto: Produto;
  videoAula?: VideoAula | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const VideoAulaFormFixed: React.FC<VideoAulaFormFixedProps> = ({
  sistema,
  produto,
  videoAula,
  onSuccess,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    url_video: '',
    id_video_bunny: '',
    url_thumbnail: '',
    ordem: 1
  });

  const createVideoAula = useCreateVideoAula();
  const updateVideoAula = useUpdateVideoAula();

  const isLoading = createVideoAula.isPending || updateVideoAula.isPending;

  // Inicializar dados do formulário
  useEffect(() => {
    if (videoAula) {
      setFormData({
        titulo: videoAula.titulo || '',
        descricao: videoAula.descricao || '',
        url_video: videoAula.url_video || '',
        id_video_bunny: videoAula.id_video_bunny || '',
        url_thumbnail: videoAula.url_thumbnail || '',
        ordem: videoAula.ordem || 1
      });
    } else {
      // Para nova videoaula, usar valores padrão
      setFormData({
        titulo: '',
        descricao: '',
        url_video: '',
        id_video_bunny: '',
        url_thumbnail: '',
        ordem: 1
      });
    }
  }, [videoAula]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    logger.info('📹 [VideoAulaFormFixed] Form submission started:', {
      titulo: formData.titulo,
      produto_id: produto.id,
      isEditing: !!videoAula
    });

    // Validações básicas
    if (!formData.titulo.trim()) {
      toast({
        title: "Título obrigatório",
        description: "Digite um título para a videoaula",
        variant: "destructive",
      });
      return;
    }

    try {
      const videoAulaData = {
        titulo: formData.titulo.trim(),
        descricao: formData.descricao.trim() || undefined,
        url_video: formData.url_video.trim() || '',
        id_video_bunny: formData.id_video_bunny.trim() || undefined,
        url_thumbnail: formData.url_thumbnail.trim() || undefined,
        ordem: formData.ordem,
        produto_id: produto.id
      };

      logger.info('📹 [VideoAulaFormFixed] Submitting data:', videoAulaData);

      if (videoAula) {
        // Editando videoaula existente
        await updateVideoAula.mutateAsync({
          id: videoAula.id,
          ...videoAulaData
        });
      } else {
        // Criando nova videoaula
        await createVideoAula.mutateAsync(videoAulaData);
      }

      logger.info('✅ [VideoAulaFormFixed] Form submitted successfully');
      
      // Aguardar um pouco e chamar onSuccess
      setTimeout(() => {
        onSuccess();
      }, 1000);
      
    } catch (error) {
      logger.error('❌ [VideoAulaFormFixed] Form submission failed:', { error });
      // O erro já é tratado nos hooks, não precisamos fazer nada aqui
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Card className="bg-gray-800/50 border-gray-600">
      <CardHeader>
        <CardTitle className="text-white">
          {videoAula ? 'Editar Videoaula' : 'Nova Videoaula'}
        </CardTitle>
        <div className="text-sm text-gray-400">
          <p><strong>Sistema:</strong> {sistema.nome}</p>
          <p><strong>Produto:</strong> {produto.nome}</p>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="titulo" className="text-gray-300">
              Título da Videoaula *
            </Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => handleInputChange('titulo', e.target.value)}
              className="bg-gray-700 border-gray-600 text-white"
              placeholder="Digite o título da videoaula"
              disabled={isLoading}
              required
            />
          </div>

          <div>
            <Label htmlFor="descricao" className="text-gray-300">
              Descrição
            </Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => handleInputChange('descricao', e.target.value)}
              className="bg-gray-700 border-gray-600 text-white"
              placeholder="Descrição da videoaula (opcional)"
              rows={3}
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="url_video" className="text-gray-300">
              URL do Vídeo
            </Label>
            <Input
              id="url_video"
              value={formData.url_video}
              onChange={(e) => handleInputChange('url_video', e.target.value)}
              className="bg-gray-700 border-gray-600 text-white"
              placeholder="https://..."
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="id_video_bunny" className="text-gray-300">
                ID Bunny.net
              </Label>
              <Input
                id="id_video_bunny"
                value={formData.id_video_bunny}
                onChange={(e) => handleInputChange('id_video_bunny', e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="ID do vídeo no Bunny.net"
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="ordem" className="text-gray-300">
                Ordem
              </Label>
              <Input
                id="ordem"
                type="number"
                value={formData.ordem}
                onChange={(e) => handleInputChange('ordem', parseInt(e.target.value) || 1)}
                className="bg-gray-700 border-gray-600 text-white"
                min="1"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="url_thumbnail" className="text-gray-300">
              URL Thumbnail
            </Label>
            <Input
              id="url_thumbnail"
              value={formData.url_thumbnail}
              onChange={(e) => handleInputChange('url_thumbnail', e.target.value)}
              className="bg-gray-700 border-gray-600 text-white"
              placeholder="https://..."
              disabled={isLoading}
            />
          </div>

          <div className="flex space-x-4">
            <Button
              type="submit"
              disabled={isLoading || !formData.titulo.trim()}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {videoAula ? 'Atualizar' : 'Salvar'} Videoaula
                </>
              )}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="border-gray-600 text-gray-300"
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

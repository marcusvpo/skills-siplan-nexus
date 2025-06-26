
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, X, Save } from 'lucide-react';
import { useCreateVideoAula, useUpdateVideoAula } from '@/hooks/useSupabaseDataAudited';

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
  id?: string;
  titulo: string;
  descricao?: string;
  url_video: string;
  id_video_bunny?: string;
  ordem: number;
  produto_id?: string;
  url_thumbnail?: string;
}

interface VideoAulaFormAuditedProps {
  sistema: Sistema;
  produto: Produto;
  videoAula?: VideoAula | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const VideoAulaFormAudited: React.FC<VideoAulaFormAuditedProps> = ({
  sistema,
  produto,
  videoAula,
  onSuccess,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    titulo: videoAula?.titulo || '',
    descricao: videoAula?.descricao || '',
    url_video: videoAula?.url_video || '',
    id_video_bunny: videoAula?.id_video_bunny || '',
    ordem: videoAula?.ordem || 1,
    url_thumbnail: videoAula?.url_thumbnail || ''
  });

  const createVideoAula = useCreateVideoAula();
  const updateVideoAula = useUpdateVideoAula();

  const isLoading = createVideoAula.isPending || updateVideoAula.isPending;

  useEffect(() => {
    if (videoAula) {
      setFormData({
        titulo: videoAula.titulo || '',
        descricao: videoAula.descricao || '',
        url_video: videoAula.url_video || '',
        id_video_bunny: videoAula.id_video_bunny || '',
        ordem: videoAula.ordem || 1,
        url_thumbnail: videoAula.url_thumbnail || ''
      });
    }
  }, [videoAula]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.titulo.trim()) {
      return;
    }

    try {
      if (videoAula?.id) {
        await updateVideoAula.mutateAsync({
          id: videoAula.id,
          ...formData
        });
      } else {
        await createVideoAula.mutateAsync({
          ...formData,
          produto_id: produto.id
        });
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving videoaula:', error);
    }
  };

  return (
    <Card className="bg-gray-800/50 border-gray-600">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white">
          {videoAula ? 'Editar Videoaula' : 'Nova Videoaula'}
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={isLoading}
          className="border-gray-600 text-gray-300 hover:bg-gray-700/50"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-3 bg-gray-700/30 rounded border border-gray-600">
          <p className="text-gray-300 text-sm">
            <strong>Sistema:</strong> {sistema.nome} • <strong>Produto:</strong> {produto.nome}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="titulo" className="text-gray-300">Título da Videoaula *</Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
              placeholder="Ex: Introdução ao Sistema"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="url_video" className="text-gray-300">URL do Vídeo</Label>
            <Input
              id="url_video"
              value={formData.url_video}
              onChange={(e) => setFormData({ ...formData, url_video: e.target.value })}
              className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
              placeholder="https://exemplo.com/video.mp4"
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="id_video_bunny" className="text-gray-300">ID Bunny.net</Label>
              <Input
                id="id_video_bunny"
                value={formData.id_video_bunny}
                onChange={(e) => setFormData({ ...formData, id_video_bunny: e.target.value })}
                className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
                placeholder="ID do vídeo no Bunny.net"
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="ordem" className="text-gray-300">Ordem</Label>
              <Input
                id="ordem"
                type="number"
                value={formData.ordem}
                onChange={(e) => setFormData({ ...formData, ordem: parseInt(e.target.value) || 1 })}
                className="bg-gray-700/50 border-gray-600 text-white"
                min="1"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="url_thumbnail" className="text-gray-300">URL Thumbnail</Label>
            <Input
              id="url_thumbnail"
              value={formData.url_thumbnail}
              onChange={(e) => setFormData({ ...formData, url_thumbnail: e.target.value })}
              className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
              placeholder="https://exemplo.com/thumbnail.jpg"
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="descricao" className="text-gray-300">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
              placeholder="Descrição da videoaula..."
              rows={3}
              disabled={isLoading}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="border-gray-600 text-gray-300 hover:bg-gray-700/50"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.titulo.trim()}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {videoAula ? 'Atualizar' : 'Criar'} Videoaula
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};


import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateVideoAula } from '@/hooks/useSupabaseDataRefactored';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';
import { Save, X } from 'lucide-react';

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

interface VideoAulaFormAdminProps {
  sistema: Sistema;
  produto: Produto;
  onSuccess: () => void;
  onCancel: () => void;
}

export const VideoAulaFormAdmin: React.FC<VideoAulaFormAdminProps> = ({
  sistema,
  produto,
  onSuccess,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    url_video: '',
    ordem: 1
  });

  const createVideoAula = useCreateVideoAula();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.titulo.trim()) {
      toast({
        title: "Título obrigatório",
        description: "Digite um título para a videoaula",
        variant: "destructive",
      });
      return;
    }

    if (!formData.url_video.trim()) {
      toast({
        title: "URL do vídeo obrigatória",
        description: "Digite a URL do vídeo",
        variant: "destructive",
      });
      return;
    }

    logger.info('📹 [VideoAulaFormAdmin] Creating video aula:', {
      titulo: formData.titulo,
      produto_id: produto.id
    });

    try {
      await createVideoAula.mutateAsync({
        titulo: formData.titulo,
        descricao: formData.descricao || undefined,
        url_video: formData.url_video,
        produto_id: produto.id,
        ordem: formData.ordem
      });

      logger.info('✅ [VideoAulaFormAdmin] Video aula created successfully');
      
      toast({
        title: "Videoaula criada!",
        description: `"${formData.titulo}" foi criada com sucesso.`,
      });

      onSuccess();
    } catch (error) {
      logger.error('❌ [VideoAulaFormAdmin] Error creating video aula:', error);
      
      toast({
        title: "Erro ao criar videoaula",
        description: "Não foi possível criar a videoaula. Tente novamente.",
        variant: "destructive",
      });
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
          Nova Videoaula
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
              disabled={createVideoAula.isPending}
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
              disabled={createVideoAula.isPending}
            />
          </div>

          <div>
            <Label htmlFor="url_video" className="text-gray-300">
              URL do Vídeo *
            </Label>
            <Input
              id="url_video"
              value={formData.url_video}
              onChange={(e) => handleInputChange('url_video', e.target.value)}
              className="bg-gray-700 border-gray-600 text-white"
              placeholder="https://..."
              disabled={createVideoAula.isPending}
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
              disabled={createVideoAula.isPending}
            />
          </div>

          <div className="flex space-x-4">
            <Button
              type="submit"
              disabled={createVideoAula.isPending}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {createVideoAula.isPending ? (
                <>Salvando...</>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Videoaula
                </>
              )}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={createVideoAula.isPending}
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

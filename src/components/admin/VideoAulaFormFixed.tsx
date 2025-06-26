
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, X, Save } from 'lucide-react';
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
  id?: string;
  titulo: string;
  descricao?: string;
  url_video: string;
  id_video_bunny: string;
  ordem: number;
  produto_id: string;
}

interface VideoAulaFormFixedProps {
  videoAula?: VideoAula | null;
  onSuccess: () => void;
  onCancel: () => void;
  preSelectedSistema?: string;
  preSelectedProduto?: string;
}

export const VideoAulaFormFixed: React.FC<VideoAulaFormFixedProps> = ({
  videoAula,
  onSuccess,
  onCancel,
  preSelectedSistema,
  preSelectedProduto
}) => {
  const [formData, setFormData] = useState({
    titulo: videoAula?.titulo || '',
    descricao: videoAula?.descricao || '',
    url_video: videoAula?.url_video || '',
    id_video_bunny: videoAula?.id_video_bunny || '',
    ordem: videoAula?.ordem || 1,
    produto_id: videoAula?.produto_id || preSelectedProduto || ''
  });

  const [selectedSistema, setSelectedSistema] = useState(preSelectedSistema || '');
  const [sistemas, setSistemas] = useState<Sistema[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSistemas, setIsLoadingSistemas] = useState(true);
  const [isLoadingProdutos, setIsLoadingProdutos] = useState(false);

  // Load sistemas on component mount
  useEffect(() => {
    loadSistemas();
  }, []);

  // Load produtos when sistema is selected
  useEffect(() => {
    if (selectedSistema) {
      loadProdutos(selectedSistema);
    } else {
      setProdutos([]);
      setFormData(prev => ({ ...prev, produto_id: '' }));
    }
  }, [selectedSistema]);

  // If editing existing videoaula, find and set the sistema
  useEffect(() => {
    if (videoAula?.produto_id && sistemas.length > 0 && !selectedSistema) {
      const produto = produtos.find(p => p.id === videoAula.produto_id);
      if (produto) {
        setSelectedSistema(produto.sistema_id);
      } else {
        // If produto not loaded yet, we need to find it by loading all produtos
        findSistemaByProduto(videoAula.produto_id);
      }
    }
  }, [videoAula, sistemas, produtos, selectedSistema]);

  const loadSistemas = async () => {
    setIsLoadingSistemas(true);
    try {
      const { data, error } = await supabase
        .from('sistemas')
        .select('*')
        .order('ordem', { ascending: true });
      
      if (error) throw error;
      setSistemas(data || []);
    } catch (error) {
      console.error('Error loading sistemas:', error);
      toast({
        title: "Erro ao carregar sistemas",
        description: "Não foi possível carregar a lista de sistemas.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSistemas(false);
    }
  };

  const loadProdutos = async (sistemaId: string) => {
    setIsLoadingProdutos(true);
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('sistema_id', sistemaId)
        .order('ordem', { ascending: true });
      
      if (error) throw error;
      setProdutos(data || []);
    } catch (error) {
      console.error('Error loading produtos:', error);
      toast({
        title: "Erro ao carregar produtos",
        description: "Não foi possível carregar a lista de produtos.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingProdutos(false);
    }
  };

  const findSistemaByProduto = async (produtoId: string) => {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('sistema_id')
        .eq('id', produtoId)
        .single();
      
      if (error) throw error;
      if (data) {
        setSelectedSistema(data.sistema_id);
      }
    } catch (error) {
      console.error('Error finding sistema by produto:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.titulo.trim()) {
      toast({
        title: "Título obrigatório",
        description: "Informe o título da videoaula.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.produto_id) {
      toast({
        title: "Produto obrigatório",
        description: "Selecione um produto para a videoaula.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const videoAulaData = {
        titulo: formData.titulo.trim(),
        descricao: formData.descricao.trim() || null,
        url_video: formData.url_video.trim(),
        id_video_bunny: formData.id_video_bunny.trim(),
        ordem: formData.ordem,
        produto_id: formData.produto_id
      };

      if (videoAula?.id) {
        // Update existing videoaula
        const { error } = await supabase
          .from('video_aulas')
          .update(videoAulaData)
          .eq('id', videoAula.id);

        if (error) throw error;

        toast({
          title: "Videoaula atualizada",
          description: `"${formData.titulo}" foi atualizada com sucesso.`,
        });
      } else {
        // Create new videoaula
        const { error } = await supabase
          .from('video_aulas')
          .insert(videoAulaData);

        if (error) throw error;

        toast({
          title: "Videoaula criada",
          description: `"${formData.titulo}" foi criada com sucesso.`,
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving videoaula:', error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar a videoaula.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
          className="border-gray-600 text-gray-300 hover:bg-gray-700/50"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sistema Selection */}
          <div>
            <Label htmlFor="sistema" className="text-gray-300">Sistema *</Label>
            {isLoadingSistemas ? (
              <div className="flex items-center p-2 text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Carregando sistemas...
              </div>
            ) : (
              <Select value={selectedSistema} onValueChange={setSelectedSistema}>
                <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white">
                  <SelectValue placeholder="Selecione o sistema" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  {sistemas.map((sistema) => (
                    <SelectItem key={sistema.id} value={sistema.id} className="text-white focus:bg-gray-700">
                      {sistema.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Produto Selection */}
          <div>
            <Label htmlFor="produto" className="text-gray-300">Produto *</Label>
            {isLoadingProdutos ? (
              <div className="flex items-center p-2 text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Carregando produtos...
              </div>
            ) : (
              <Select 
                value={formData.produto_id} 
                onValueChange={(value) => setFormData({ ...formData, produto_id: value })}
                disabled={!selectedSistema}
              >
                <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white">
                  <SelectValue placeholder={selectedSistema ? "Selecione o produto" : "Primeiro selecione um sistema"} />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  {produtos.map((produto) => (
                    <SelectItem key={produto.id} value={produto.id} className="text-white focus:bg-gray-700">
                      {produto.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Título */}
          <div>
            <Label htmlFor="titulo" className="text-gray-300">Título da Videoaula *</Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
              placeholder="Ex: Introdução ao Sistema"
              required
            />
          </div>

          {/* URL do Vídeo */}
          <div>
            <Label htmlFor="url_video" className="text-gray-300">URL do Vídeo</Label>
            <Input
              id="url_video"
              value={formData.url_video}
              onChange={(e) => setFormData({ ...formData, url_video: e.target.value })}
              className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
              placeholder="https://exemplo.com/video.mp4"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ID Bunny */}
            <div>
              <Label htmlFor="id_video_bunny" className="text-gray-300">ID Bunny.net</Label>
              <Input
                id="id_video_bunny"
                value={formData.id_video_bunny}
                onChange={(e) => setFormData({ ...formData, id_video_bunny: e.target.value })}
                className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
                placeholder="ID do vídeo no Bunny.net"
              />
            </div>

            {/* Ordem */}
            <div>
              <Label htmlFor="ordem" className="text-gray-300">Ordem</Label>
              <Input
                id="ordem"
                type="number"
                value={formData.ordem}
                onChange={(e) => setFormData({ ...formData, ordem: parseInt(e.target.value) || 1 })}
                className="bg-gray-700/50 border-gray-600 text-white"
                min="1"
              />
            </div>
          </div>

          {/* Descrição */}
          <div>
            <Label htmlFor="descricao" className="text-gray-300">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
              placeholder="Descrição da videoaula..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="border-gray-600 text-gray-300 hover:bg-gray-700/50"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
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

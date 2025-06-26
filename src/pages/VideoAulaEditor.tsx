
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Upload, X, Play } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';

interface VideoAula {
  id: string;
  titulo: string;
  descricao?: string;
  url_video: string;
  id_video_bunny: string;
  url_thumbnail?: string;
  transcricao_texto?: string;
  tags_ia?: string[];
  duracao_segundos: number;
  ordem: number;
  modulo_id: string;
}

interface Sistema {
  id: string;
  nome: string;
}

interface Produto {
  id: string;
  nome: string;
  sistema_id: string;
}

interface Modulo {
  id: string;
  titulo: string;
  produto_id: string;
}

const VideoAulaEditor: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEditing = !!id;
  
  const [videoAula, setVideoAula] = useState<VideoAula>({
    id: '',
    titulo: '',
    descricao: '',
    url_video: '',
    id_video_bunny: '',
    url_thumbnail: '',
    transcricao_texto: '',
    tags_ia: [],
    duracao_segundos: 0,
    ordem: 1,
    modulo_id: ''
  });
  
  const [sistemas, setSistemas] = useState<Sistema[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [selectedSistema, setSelectedSistema] = useState<string>('');
  const [selectedProduto, setSelectedProduto] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadSistemas();
    if (isEditing) {
      loadVideoAula();
    } else {
      // Para nova videoaula, usar parâmetros da URL
      const sistemaId = searchParams.get('sistema_id');
      const produtoId = searchParams.get('produto_id');
      if (sistemaId) setSelectedSistema(sistemaId);
      if (produtoId) setSelectedProduto(produtoId);
    }
  }, [id, searchParams]);

  useEffect(() => {
    if (selectedSistema) {
      loadProdutos(selectedSistema);
    }
  }, [selectedSistema]);

  useEffect(() => {
    if (selectedProduto) {
      loadModulos(selectedProduto);
    }
  }, [selectedProduto]);

  const loadSistemas = async () => {
    const { data, error } = await supabase
      .from('sistemas')
      .select('id, nome')
      .order('ordem');
    
    if (error) {
      console.error('Error loading sistemas:', error);
      return;
    }
    setSistemas(data || []);
  };

  const loadProdutos = async (sistemaId: string) => {
    const { data, error } = await supabase
      .from('produtos')
      .select('id, nome, sistema_id')
      .eq('sistema_id', sistemaId)
      .order('ordem');
    
    if (error) {
      console.error('Error loading produtos:', error);
      return;
    }
    setProdutos(data || []);
  };

  const loadModulos = async (produtoId: string) => {
    let { data, error } = await supabase
      .from('modulos')
      .select('id, titulo, produto_id')
      .eq('produto_id', produtoId)
      .order('ordem');
    
    if (error) {
      console.error('Error loading modulos:', error);
      return;
    }

    // Se não há módulos, criar um automaticamente
    if (!data || data.length === 0) {
      const produto = produtos.find(p => p.id === produtoId);
      if (produto) {
        const { data: novoModulo, error: moduloError } = await supabase
          .from('modulos')
          .insert({
            titulo: `Módulo Principal - ${produto.nome}`,
            descricao: `Módulo principal do produto ${produto.nome}`,
            produto_id: produtoId,
            ordem: 1
          })
          .select()
          .single();

        if (moduloError) {
          console.error('Error creating module:', moduloError);
          return;
        }
        data = [novoModulo];
      }
    }

    setModulos(data || []);
    if (data && data.length > 0 && !videoAula.modulo_id) {
      setVideoAula(prev => ({ ...prev, modulo_id: data[0].id }));
    }
  };

  const loadVideoAula = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from('video_aulas')
      .select(`
        *,
        modulos (
          *,
          produtos (
            *,
            sistemas (*)
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error loading video aula:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a videoaula.",
        variant: "destructive",
      });
      return;
    }

    if (data) {
      setVideoAula(data);
      const modulo = data.modulos;
      const produto = modulo?.produtos;
      const sistema = produto?.sistemas;
      
      if (sistema) setSelectedSistema(sistema.id);
      if (produto) setSelectedProduto(produto.id);
    }
  };

  const handleVideoUpload = async (file: File) => {
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('video', file);
      formData.append('title', videoAula.titulo || 'Nova Videoaula');

      const { data, error } = await supabase.functions.invoke('upload-video-bunny', {
        body: formData
      });

      if (error) throw error;

      if (data?.videoId && data?.playbackUrl) {
        setVideoAula(prev => ({
          ...prev,
          id_video_bunny: data.videoId,
          url_video: data.playbackUrl,
          duracao_segundos: data.duration || 0,
          url_thumbnail: data.thumbnailUrl || ''
        }));

        toast({
          title: "Upload concluído",
          description: "Vídeo enviado com sucesso para o Bunny.net!",
        });
      }
    } catch (error) {
      console.error('Error uploading video:', error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível enviar o vídeo.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!videoAula.titulo.trim()) {
      toast({
        title: "Dados obrigatórios",
        description: "Informe pelo menos o título da videoaula.",
        variant: "destructive",
      });
      return;
    }

    if (!videoAula.modulo_id) {
      toast({
        title: "Dados obrigatórios",
        description: "Selecione um produto para associar a videoaula.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const videoData = {
        titulo: videoAula.titulo.trim(),
        descricao: videoAula.descricao?.trim() || null,
        url_video: videoAula.url_video.trim(),
        id_video_bunny: videoAula.id_video_bunny.trim(),
        url_thumbnail: videoAula.url_thumbnail?.trim() || null,
        transcricao_texto: videoAula.transcricao_texto?.trim() || null,
        tags_ia: videoAula.tags_ia || [],
        duracao_segundos: videoAula.duracao_segundos || 0,
        ordem: videoAula.ordem,
        modulo_id: videoAula.modulo_id
      };

      if (isEditing) {
        const { error } = await supabase
          .from('video_aulas')
          .update(videoData)
          .eq('id', videoAula.id);

        if (error) throw error;

        toast({
          title: "Videoaula atualizada",
          description: `Videoaula "${videoAula.titulo}" foi atualizada com sucesso.`,
        });
      } else {
        const { error } = await supabase
          .from('video_aulas')
          .insert(videoData);

        if (error) throw error;

        toast({
          title: "Videoaula criada",
          description: `Videoaula "${videoAula.titulo}" foi criada com sucesso.`,
        });
      }

      navigate('/admin');
    } catch (error) {
      console.error('Error saving video aula:', error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar a videoaula.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Layout>
      <div className="min-h-screen bg-black text-white">
        {/* Header */}
        <div className="bg-gray-900 border-b border-gray-700 p-4">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => navigate('/admin')}
                className="border-gray-600 text-gray-300 hover:bg-gray-700/50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Admin
              </Button>
              <h1 className="text-2xl font-bold">
                {isEditing ? 'Editar Videoaula' : 'Nova Videoaula'}
              </h1>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => navigate('/admin')}
                className="border-gray-600 text-gray-300 hover:bg-gray-700/50"
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Salvando...' : 'Salvar Videoaula'}
              </Button>
            </div>
          </div>
        </div>

        {/* Editor Content */}
        <div className="container mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Video Area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Video Player/Upload Area */}
              <Card className="bg-gray-900 border-gray-700">
                <CardContent className="p-6">
                  <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4 relative flex items-center justify-center">
                    {videoAula.url_video ? (
                      <div className="w-full h-full">
                        <video
                          controls
                          className="w-full h-full object-contain"
                          poster={videoAula.url_thumbnail}
                        >
                          <source src={videoAula.url_video} type="video/mp4" />
                        </video>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-400 mb-4">Nenhum vídeo carregado</p>
                      </div>
                    )}
                  </div>

                  {/* Video Upload */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Upload de Vídeo
                      </label>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleVideoUpload(file);
                        }}
                        disabled={isUploading}
                        className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-600 file:text-white hover:file:bg-red-700 file:cursor-pointer"
                      />
                      {isUploading && (
                        <p className="text-sm text-red-400 mt-2">Enviando vídeo...</p>
                      )}
                    </div>

                    {/* Video Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          ID Bunny.net
                        </label>
                        <Input
                          value={videoAula.id_video_bunny}
                          onChange={(e) => setVideoAula(prev => ({ ...prev, id_video_bunny: e.target.value }))}
                          className="bg-gray-800 border-gray-600 text-white"
                          placeholder="ID do vídeo no Bunny.net"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Duração
                        </label>
                        <Input
                          value={videoAula.duracao_segundos ? formatDuration(videoAula.duracao_segundos) : ''}
                          readOnly
                          className="bg-gray-700 border-gray-600 text-gray-300"
                          placeholder="Detectado automaticamente"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        URL da Thumbnail
                      </label>
                      <Input
                        value={videoAula.url_thumbnail || ''}
                        onChange={(e) => setVideoAula(prev => ({ ...prev, url_thumbnail: e.target.value }))}
                        className="bg-gray-800 border-gray-600 text-white"
                        placeholder="URL da imagem de capa"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Title */}
              <Card className="bg-gray-900 border-gray-700">
                <CardContent className="p-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Título da Videoaula *
                  </label>
                  <Input
                    value={videoAula.titulo}
                    onChange={(e) => setVideoAula(prev => ({ ...prev, titulo: e.target.value }))}
                    className="bg-gray-800 border-gray-600 text-white text-xl font-bold"
                    placeholder="Digite o título da videoaula..."
                  />
                </CardContent>
              </Card>

              {/* Description */}
              <Card className="bg-gray-900 border-gray-700">
                <CardContent className="p-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Descrição
                  </label>
                  <Textarea
                    value={videoAula.descricao || ''}
                    onChange={(e) => setVideoAula(prev => ({ ...prev, descricao: e.target.value }))}
                    className="bg-gray-800 border-gray-600 text-white min-h-[120px]"
                    placeholder="Descreva o conteúdo da videoaula..."
                  />
                </CardContent>
              </Card>

              {/* Transcription and Tags */}
              <Card className="bg-gray-900 border-gray-700">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Transcrição (preenchida automaticamente)
                      </label>
                      <Textarea
                        value={videoAula.transcricao_texto || ''}
                        onChange={(e) => setVideoAula(prev => ({ ...prev, transcricao_texto: e.target.value }))}
                        className="bg-gray-800 border-gray-600 text-white min-h-[80px]"
                        placeholder="Transcrição será gerada automaticamente..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Tags IA (separadas por vírgula)
                      </label>
                      <Input
                        value={videoAula.tags_ia?.join(', ') || ''}
                        onChange={(e) => setVideoAula(prev => ({ 
                          ...prev, 
                          tags_ia: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag) 
                        }))}
                        className="bg-gray-800 border-gray-600 text-white"
                        placeholder="tags, automaticas, ia"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Settings */}
            <div className="space-y-6">
              {/* Configuration */}
              <Card className="bg-gray-900 border-gray-700">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Configurações</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Sistema
                      </label>
                      <Select value={selectedSistema} onValueChange={setSelectedSistema}>
                        <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                          <SelectValue placeholder="Selecione o sistema" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          {sistemas.map((sistema) => (
                            <SelectItem key={sistema.id} value={sistema.id} className="text-white">
                              {sistema.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Produto
                      </label>
                      <Select value={selectedProduto} onValueChange={setSelectedProduto}>
                        <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                          <SelectValue placeholder="Selecione o produto" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          {produtos.map((produto) => (
                            <SelectItem key={produto.id} value={produto.id} className="text-white">
                              {produto.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Módulo
                      </label>
                      <Select 
                        value={videoAula.modulo_id} 
                        onValueChange={(value) => setVideoAula(prev => ({ ...prev, modulo_id: value }))}
                      >
                        <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                          <SelectValue placeholder="Selecione o módulo" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          {modulos.map((modulo) => (
                            <SelectItem key={modulo.id} value={modulo.id} className="text-white">
                              {modulo.titulo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Ordem
                      </label>
                      <Input
                        type="number"
                        value={videoAula.ordem}
                        onChange={(e) => setVideoAula(prev => ({ ...prev, ordem: parseInt(e.target.value) || 1 }))}
                        className="bg-gray-800 border-gray-600 text-white"
                        min="1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AI Chat Placeholder */}
              <Card className="bg-gray-900 border-gray-700">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Chat com IA</h3>
                  <div className="bg-gray-800 rounded-lg p-4 border border-gray-600">
                    <p className="text-gray-400 text-sm text-center">
                      💬 Chat com IA disponível para o usuário final aqui
                    </p>
                    <p className="text-gray-500 text-xs text-center mt-2">
                      Esta área será funcional na visualização do usuário
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default VideoAulaEditor;

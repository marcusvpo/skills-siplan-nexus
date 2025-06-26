import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Upload, X, Play, Check } from 'lucide-react';
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
  ordem: number;
  produto_id: string;
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
    ordem: 1,
    produto_id: ''
  });
  
  const [sistemas, setSistemas] = useState<Sistema[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [selectedSistema, setSelectedSistema] = useState<string>('');
  const [selectedProduto, setSelectedProduto] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    loadSistemas();
    if (isEditing) {
      loadVideoAula();
    } else {
      // Para nova videoaula, usar parâmetros da URL
      const sistemaId = searchParams.get('sistema_id');
      const produtoId = searchParams.get('produto_id');
      if (sistemaId) setSelectedSistema(sistemaId);
      if (produtoId) {
        setSelectedProduto(produtoId);
        setVideoAula(prev => ({ ...prev, produto_id: produtoId }));
      }
    }
  }, [id, searchParams]);

  useEffect(() => {
    if (selectedSistema) {
      loadProdutos(selectedSistema);
    }
  }, [selectedSistema]);

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

  const loadVideoAula = async () => {
    if (!id) return;

    try {
      // First get the video aula
      const { data: videoAulaData, error: videoError } = await supabase
        .from('video_aulas')
        .select('*')
        .eq('id', id)
        .single();

      if (videoError) {
        console.error('Error loading video aula:', videoError);
        toast({
          title: "Erro",
          description: "Não foi possível carregar a videoaula.",
          variant: "destructive",
        });
        return;
      }

      if (videoAulaData) {
        setVideoAula(videoAulaData);
        
        // Then get the produto
        if (videoAulaData.produto_id) {
          const { data: produtoData, error: produtoError } = await supabase
            .from('produtos')
            .select('*')
            .eq('id', videoAulaData.produto_id)
            .single();

          if (produtoError) {
            console.error('Error loading produto:', produtoError);
            return;
          }

          if (produtoData) {
            setSelectedProduto(produtoData.id);
            
            // Then get the sistema
            const { data: sistemaData, error: sistemaError } = await supabase
              .from('sistemas')
              .select('*')
              .eq('id', produtoData.sistema_id)
              .single();

            if (sistemaError) {
              console.error('Error loading sistema:', sistemaError);
              return;
            }

            if (sistemaData) {
              setSelectedSistema(sistemaData.id);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error in loadVideoAula:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a videoaula.",
        variant: "destructive",
      });
    }
  };

  const handleVideoUpload = async (file: File) => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Simulação de progresso
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const formData = new FormData();
      formData.append('video', file);
      formData.append('title', videoAula.titulo || 'Nova Videoaula');

      const { data, error } = await supabase.functions.invoke('upload-video-bunny', {
        body: formData
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (error) throw error;

      if (data?.videoId && data?.playbackUrl) {
        setVideoAula(prev => ({
          ...prev,
          id_video_bunny: data.videoId,
          url_video: data.playbackUrl,
          url_thumbnail: data.thumbnailUrl || ''
        }));

        toast({
          title: "Upload concluído",
          description: "Vídeo enviado com sucesso para o Bunny.net!",
        });
      }
    } catch (error) {
      console.error('Error uploading video:', error);
      setUploadProgress(0);
      toast({
        title: "Erro no upload",
        description: "Não foi possível enviar o vídeo.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 2000);
    }
  };

  const handleSave = async () => {
    if (!videoAula.titulo.trim()) {
      toast({
        title: "Dados obrigatórios",
        description: "Informe o título da videoaula.",
        variant: "destructive",
      });
      return;
    }

    if (!videoAula.produto_id) {
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
        url_video: videoAula.url_video?.trim() || '',
        id_video_bunny: videoAula.id_video_bunny?.trim() || '',
        url_thumbnail: videoAula.url_thumbnail?.trim() || null,
        ordem: videoAula.ordem || 1,
        produto_id: videoAula.produto_id
      };

      if (isEditing) {
        const { error } = await supabase
          .from('video_aulas')
          .update(videoData)
          .eq('id', videoAula.id);

        if (error) throw error;

        toast({
          title: "Videoaula atualizada",
          description: `"${videoAula.titulo}" foi atualizada com sucesso.`,
        });
      } else {
        const { error } = await supabase
          .from('video_aulas')
          .insert(videoData);

        if (error) throw error;

        toast({
          title: "Videoaula criada",
          description: `"${videoAula.titulo}" foi criada com sucesso.`,
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
            {/* Main Video Area - WYSIWYG */}
            <div className="lg:col-span-2 space-y-6">
              {/* Video Player/Upload Area */}
              <Card className="bg-gray-900 border-gray-700">
                <CardContent className="p-6">
                  <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4 relative flex items-center justify-center border border-gray-600">
                    {videoAula.url_video ? (
                      <div className="w-full h-full">
                        <video
                          controls
                          className="w-full h-full object-contain"
                          poster={videoAula.url_thumbnail}
                        >
                          <source src={videoAula.url_video} type="video/mp4" />
                        </video>
                        <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded text-xs flex items-center">
                          <Check className="h-3 w-3 mr-1" />
                          Vídeo Carregado
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-400 mb-2">Nenhum vídeo carregado</p>
                        <p className="text-gray-500 text-sm">Faça o upload ou configure o ID do Bunny.net</p>
                      </div>
                    )}
                    
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-32 h-2 bg-gray-700 rounded-full mb-2">
                            <div 
                              className="h-full bg-red-600 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                          <p className="text-white text-sm">Enviando... {uploadProgress}%</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Video Upload Controls */}
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
                        className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-600 file:text-white hover:file:bg-red-700 file:cursor-pointer disabled:opacity-50"
                      />
                    </div>

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
                          URL do Vídeo
                        </label>
                        <Input
                          value={videoAula.url_video}
                          onChange={(e) => setVideoAula(prev => ({ ...prev, url_video: e.target.value }))}
                          className="bg-gray-800 border-gray-600 text-white"
                          placeholder="URL de reprodução"
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

              {/* Title - WYSIWYG */}
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

              {/* Description - WYSIWYG */}
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
            </div>

            {/* Sidebar - Settings & AI Chat Preview */}
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
                        Produto *
                      </label>
                      <Select 
                        value={selectedProduto} 
                        onValueChange={(value) => {
                          setSelectedProduto(value);
                          setVideoAula(prev => ({ ...prev, produto_id: value }));
                        }}
                      >
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

              {/* AI Chat Preview - WYSIWYG */}
              <Card className="bg-gray-900 border-gray-700">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Chat com IA (Preview)</h3>
                  <div className="bg-gray-800 rounded-lg p-4 border border-gray-600 min-h-[300px]">
                    <div className="flex flex-col space-y-3">
                      {/* Simulated Chat Messages */}
                      <div className="bg-gray-700 rounded-lg p-3 text-sm">
                        <div className="font-semibold text-blue-400 mb-1">IA Assistant</div>
                        <div className="text-gray-300">
                          Olá! Sou seu assistente de IA para esta videoaula. 
                          Posso responder dúvidas sobre o conteúdo apresentado.
                        </div>
                      </div>
                      
                      <div className="bg-red-600/20 rounded-lg p-3 text-sm ml-8">
                        <div className="font-semibold text-gray-300 mb-1">Você</div>
                        <div className="text-gray-300">
                          Exemplo de pergunta do usuário...
                        </div>
                      </div>

                      <div className="bg-gray-700 rounded-lg p-3 text-sm">
                        <div className="font-semibold text-blue-400 mb-1">IA Assistant</div>
                        <div className="text-gray-300">
                          Resposta baseada na transcrição e contexto do vídeo...
                        </div>
                      </div>
                    </div>
                    
                    {/* Chat Input Preview */}
                    <div className="mt-4 pt-4 border-t border-gray-600">
                      <div className="flex space-x-2">
                        <input 
                          type="text" 
                          placeholder="Digite sua pergunta..." 
                          className="flex-1 bg-gray-700 text-white px-3 py-2 rounded text-sm"
                          disabled
                        />
                        <button className="bg-red-600 text-white px-4 py-2 rounded text-sm" disabled>
                          Enviar
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 p-3 bg-blue-900/20 rounded border border-blue-700">
                    <p className="text-blue-300 text-xs">
                      💡 <strong>Preview do Chat IA:</strong> Esta interface será funcional para os usuários finais, 
                      alimentada pela transcrição automática do vídeo e integrada via n8n.
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

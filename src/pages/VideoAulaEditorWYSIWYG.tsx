
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Play, Check, X } from 'lucide-react';
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

const VideoAulaEditorWYSIWYG: React.FC = () => {
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
  const [isLoadingSistemas, setIsLoadingSistemas] = useState(true);
  const [isLoadingProdutos, setIsLoadingProdutos] = useState(false);

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
    } else {
      setProdutos([]);
    }
  }, [selectedSistema]);

  const loadSistemas = async () => {
    setIsLoadingSistemas(true);
    try {
      console.log('Loading sistemas...');
      const { data, error } = await supabase
        .from('sistemas')
        .select('id, nome')
        .order('ordem');
      
      if (error) {
        console.error('Error loading sistemas:', error);
        throw error;
      }
      console.log('Sistemas loaded:', data);
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
      console.log('Loading produtos for sistema:', sistemaId);
      const { data, error } = await supabase
        .from('produtos')
        .select('id, nome, sistema_id')
        .eq('sistema_id', sistemaId)
        .order('ordem');
      
      if (error) {
        console.error('Error loading produtos:', error);
        throw error;
      }
      console.log('Produtos loaded:', data);
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

  const loadVideoAula = async () => {
    if (!id) return;

    try {
      console.log('Loading video aula:', id);
      const { data, error } = await supabase
        .from('video_aulas')
        .select(`
          *,
          produtos!inner (
            *,
            sistemas!inner (*)
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error loading video aula:', error);
        throw error;
      }

      if (data) {
        console.log('Video aula loaded:', data);
        setVideoAula(data);
        const produto = data.produtos;
        const sistema = produto?.sistemas;
        
        if (sistema) setSelectedSistema(sistema.id);
        if (produto) setSelectedProduto(produto.id);
      }
    } catch (error) {
      console.error('Error loading video aula:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a videoaula.",
        variant: "destructive",
      });
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

      console.log('Saving video aula:', videoData);

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

        {/* WYSIWYG Editor Content */}
        <div className="container mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content Area - WYSIWYG */}
            <div className="lg:col-span-2 space-y-6">
              {/* Video Player Area - Exactly as users will see it */}
              <Card className="bg-gray-900 border-gray-700">
                <CardContent className="p-0">
                  <div className="aspect-video bg-black rounded-t-lg overflow-hidden relative flex items-center justify-center border-b border-gray-600">
                    {videoAula.url_video ? (
                      <div className="w-full h-full relative">
                        <video
                          controls
                          className="w-full h-full object-contain"
                          poster={videoAula.url_thumbnail}
                        >
                          <source src={videoAula.url_video} type="video/mp4" />
                        </video>
                        <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded text-xs flex items-center">
                          <Check className="h-3 w-3 mr-1" />
                          Vídeo Configurado
                        </div>
                      </div>
                    ) : (
                      <div className="text-center p-8">
                        <Play className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-400 mb-2">Preview do Player de Vídeo</p>
                        <p className="text-gray-500 text-sm">Configure o vídeo na lateral para visualizar</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Video Info Area - As users will see */}
                  <div className="p-6 bg-gray-900">
                    <div className="mb-4">
                      <input
                        type="text"
                        value={videoAula.titulo}
                        onChange={(e) => setVideoAula(prev => ({ ...prev, titulo: e.target.value }))}
                        className="w-full bg-transparent text-2xl font-bold text-white border-none outline-none placeholder-gray-400 focus:ring-2 focus:ring-red-600 rounded px-2 py-1"
                        placeholder="Título da Videoaula"
                      />
                    </div>
                    <div className="mb-4">
                      <textarea
                        value={videoAula.descricao || ''}
                        onChange={(e) => setVideoAula(prev => ({ ...prev, descricao: e.target.value }))}
                        className="w-full bg-transparent text-gray-300 border-none outline-none placeholder-gray-400 focus:ring-2 focus:ring-red-600 rounded px-2 py-1 resize-none"
                        placeholder="Descrição da videoaula..."
                        rows={3}
                      />
                    </div>
                    
                    {/* Course Info Display */}
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span>Sistema: {sistemas.find(s => s.id === selectedSistema)?.nome || 'Não selecionado'}</span>
                      <span>•</span>
                      <span>Produto: {produtos.find(p => p.id === selectedProduto)?.nome || 'Não selecionado'}</span>
                      <span>•</span>
                      <span>Ordem: {videoAula.ordem}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AI Chat Interface - Exactly as users will see it */}
              <Card className="bg-gray-900 border-gray-700">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    🤖 Assistente de IA
                    <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded">PREVIEW</span>
                  </h3>
                  
                  <div className="bg-gray-800 rounded-lg p-4 border border-gray-600 h-80 flex flex-col">
                    {/* Chat Messages Area */}
                    <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                      <div className="bg-gray-700 rounded-lg p-3 text-sm">
                        <div className="font-semibold text-blue-400 mb-1">🤖 IA Assistant</div>
                        <div className="text-gray-300">
                          Olá! Sou seu assistente de IA para esta videoaula "{videoAula.titulo || 'Nova Videoaula'}". 
                          Posso responder dúvidas sobre o conteúdo apresentado.
                        </div>
                      </div>
                      
                      <div className="bg-red-600/20 rounded-lg p-3 text-sm ml-8">
                        <div className="font-semibold text-gray-300 mb-1">👤 Usuário</div>
                        <div className="text-gray-300">
                          Como funciona esta funcionalidade?
                        </div>
                      </div>

                      <div className="bg-gray-700 rounded-lg p-3 text-sm">
                        <div className="font-semibold text-blue-400 mb-1">🤖 IA Assistant</div>
                        <div className="text-gray-300">
                          Esta IA será alimentada pela transcrição automática do vídeo e poderá responder 
                          perguntas específicas sobre o conteúdo da aula.
                        </div>
                      </div>
                    </div>
                    
                    {/* Chat Input */}
                    <div className="border-t border-gray-600 pt-4">
                      <div className="flex space-x-2">
                        <input 
                          type="text" 
                          placeholder="Digite sua pergunta sobre a videoaula..." 
                          className="flex-1 bg-gray-700 text-white px-3 py-2 rounded text-sm border border-gray-600 focus:border-blue-500 outline-none"
                          disabled
                        />
                        <button className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 transition-colors" disabled>
                          Enviar
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 p-3 bg-blue-900/20 rounded border border-blue-700">
                    <p className="text-blue-300 text-xs">
                      💡 <strong>Chat com IA:</strong> Esta interface será funcional para os usuários finais, 
                      alimentada pela transcrição automática do vídeo.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Configuration Panel */}
            <div className="space-y-6">
              {/* Video Configuration */}
              <Card className="bg-gray-900 border-gray-700">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">🎬 Configuração do Vídeo</h3>
                  
                  <div className="space-y-4">
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
                        placeholder="URL de reprodução do vídeo"
                      />
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

              {/* Course Configuration */}
              <Card className="bg-gray-900 border-gray-700">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">📚 Configuração do Curso</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Sistema *
                      </label>
                      {isLoadingSistemas ? (
                        <div className="text-gray-400 text-sm">Carregando sistemas...</div>
                      ) : (
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
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Produto *
                      </label>
                      {isLoadingProdutos ? (
                        <div className="text-gray-400 text-sm">Carregando produtos...</div>
                      ) : (
                        <Select 
                          value={selectedProduto} 
                          onValueChange={(value) => {
                            setSelectedProduto(value);
                            setVideoAula(prev => ({ ...prev, produto_id: value }));
                          }}
                          disabled={!selectedSistema}
                        >
                          <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                            <SelectValue placeholder={selectedSistema ? "Selecione o produto" : "Primeiro selecione um sistema"} />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-600">
                            {produtos.map((produto) => (
                              <SelectItem key={produto.id} value={produto.id} className="text-white">
                                {produto.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Ordem na Sequência
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

              {/* AI Configuration Preview */}
              <Card className="bg-gray-900 border-gray-700">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">🤖 Configuração da IA</h3>
                  
                  <div className="space-y-4">
                    <div className="p-3 bg-gray-800 rounded border border-gray-600">
                      <p className="text-gray-300 text-sm mb-2">
                        <strong>Transcrição Automática:</strong> Ativada
                      </p>
                      <p className="text-gray-400 text-xs">
                        O vídeo será automaticamente transcrito para alimentar a IA
                      </p>
                    </div>
                    
                    <div className="p-3 bg-gray-800 rounded border border-gray-600">
                      <p className="text-gray-300 text-sm mb-2">
                        <strong>Contexto da IA:</strong> Videoaula específica
                      </p>
                      <p className="text-gray-400 text-xs">
                        A IA responderá apenas sobre o conteúdo desta aula
                      </p>
                    </div>
                    
                    <div className="p-3 bg-blue-900/20 rounded border border-blue-700">
                      <p className="text-blue-300 text-xs">
                        ⚙️ A configuração da IA será automática após o salvamento
                      </p>
                    </div>
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

export default VideoAulaEditorWYSIWYG;

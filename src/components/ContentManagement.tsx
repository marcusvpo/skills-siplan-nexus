
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Loader2, Trash2, Edit } from 'lucide-react';
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
  id: string;
  titulo: string;
  descricao?: string;
  url_video: string;
  id_video_bunny: string;
  duracao_segundos: number;
  ordem: number;
}

const ContentManagement = () => {
  const [sistemas, setSistemas] = useState<Sistema[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [videoAulas, setVideoAulas] = useState<VideoAula[]>([]);
  const [selectedSistema, setSelectedSistema] = useState('');
  const [selectedProduto, setSelectedProduto] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Forms
  const [sistemaForm, setSistemaForm] = useState({ nome: '', descricao: '', ordem: 1 });
  const [produtoForm, setProdutoForm] = useState({ nome: '', descricao: '', sistema_id: '', ordem: 1 });
  const [videoForm, setVideoForm] = useState({
    titulo: '',
    descricao: '',
    url_video: '',
    id_video_bunny: '',
    duracao_segundos: 0,
    ordem: 1
  });

  // Carregar dados
  useEffect(() => {
    loadSistemas();
    loadVideoAulas();
  }, []);

  useEffect(() => {
    if (selectedSistema) {
      loadProdutos(selectedSistema);
    } else {
      setProdutos([]);
      setSelectedProduto('');
    }
  }, [selectedSistema]);

  const loadSistemas = async () => {
    const { data, error } = await supabase
      .from('sistemas')
      .select('*')
      .order('ordem', { ascending: true });
    
    if (!error && data) setSistemas(data);
  };

  const loadProdutos = async (sistemaId: string) => {
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .eq('sistema_id', sistemaId)
      .order('ordem', { ascending: true });
    
    if (!error && data) setProdutos(data);
  };

  const loadVideoAulas = async () => {
    const { data, error } = await supabase
      .from('video_aulas')
      .select('*')
      .order('ordem', { ascending: true });
    
    if (!error && data) setVideoAulas(data);
  };

  // Criar Sistema
  const createSistema = async () => {
    if (!sistemaForm.nome) {
      toast({
        title: "Nome obrigatório",
        description: "Informe o nome do sistema.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('sistemas')
        .insert({
          nome: sistemaForm.nome,
          descricao: sistemaForm.descricao,
          ordem: sistemaForm.ordem
        });

      if (error) throw error;

      toast({
        title: "Sistema criado com sucesso!",
        description: `Sistema "${sistemaForm.nome}" foi criado.`,
      });

      setSistemaForm({ nome: '', descricao: '', ordem: 1 });
      loadSistemas();
    } catch (error) {
      console.error('Error creating system:', error);
      toast({
        title: "Erro ao criar sistema",
        description: "Ocorreu um erro ao criar o sistema.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Criar Produto
  const createProduto = async () => {
    if (!produtoForm.nome || !selectedSistema) {
      toast({
        title: "Dados incompletos",
        description: "Selecione um sistema e informe o nome do produto.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('produtos')
        .insert({
          nome: produtoForm.nome,
          descricao: produtoForm.descricao,
          sistema_id: selectedSistema,
          ordem: produtoForm.ordem
        });

      if (error) throw error;

      toast({
        title: "Produto criado com sucesso!",
        description: `Produto "${produtoForm.nome}" foi criado.`,
      });

      setProdutoForm({ nome: '', descricao: '', sistema_id: '', ordem: 1 });
      loadProdutos(selectedSistema);
    } catch (error) {
      console.error('Error creating product:', error);
      toast({
        title: "Erro ao criar produto",
        description: "Ocorreu um erro ao criar o produto.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Criar Videoaula
  const createVideoAula = async () => {
    if (!videoForm.titulo || !selectedSistema || !selectedProduto || !videoForm.url_video) {
      toast({
        title: "Dados incompletos",
        description: "Selecione sistema e produto, e preencha título e URL do vídeo.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Encontrar ou criar módulo para o produto
      let { data: modulo } = await supabase
        .from('modulos')
        .select('id')
        .eq('produto_id', selectedProduto)
        .single();

      if (!modulo) {
        // Criar módulo automaticamente
        const produtoSelecionado = produtos.find(p => p.id === selectedProduto);
        const { data: novoModulo, error: moduloError } = await supabase
          .from('modulos')
          .insert({
            titulo: `Módulo Principal - ${produtoSelecionado?.nome}`,
            descricao: `Módulo principal do produto ${produtoSelecionado?.nome}`,
            produto_id: selectedProduto,
            ordem: 1,
            tempo_estimado_min: 0
          })
          .select()
          .single();

        if (moduloError) throw moduloError;
        modulo = novoModulo;
      }

      const { error } = await supabase
        .from('video_aulas')
        .insert({
          titulo: videoForm.titulo,
          descricao: videoForm.descricao,
          modulo_id: modulo.id,
          ordem: videoForm.ordem,
          url_video: videoForm.url_video,
          id_video_bunny: videoForm.id_video_bunny,
          duracao_segundos: videoForm.duracao_segundos
        });

      if (error) throw error;

      toast({
        title: "Videoaula criada com sucesso!",
        description: `Videoaula "${videoForm.titulo}" foi criada.`,
      });

      setVideoForm({ 
        titulo: '', 
        descricao: '', 
        url_video: '', 
        id_video_bunny: '', 
        duracao_segundos: 0,
        ordem: 1 
      });
      loadVideoAulas();
    } catch (error) {
      console.error('Error creating video:', error);
      toast({
        title: "Erro ao criar videoaula",
        description: "Ocorreu um erro ao criar a videoaula.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Criar Sistema */}
      <Card className="bg-gray-800/50 border-gray-600 shadow-modern">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Plus className="h-5 w-5 mr-2 text-blue-500" />
            Criar Novo Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sistema-nome" className="text-gray-300">Nome do Sistema</Label>
              <Input
                id="sistema-nome"
                value={sistemaForm.nome}
                onChange={(e) => setSistemaForm({...sistemaForm, nome: e.target.value})}
                className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20"
                placeholder="Ex: Sistema de Gestão"
              />
            </div>
            <div>
              <Label htmlFor="sistema-ordem" className="text-gray-300">Ordem</Label>
              <Input
                id="sistema-ordem"
                type="number"
                value={sistemaForm.ordem}
                onChange={(e) => setSistemaForm({...sistemaForm, ordem: parseInt(e.target.value)})}
                className="bg-gray-700/50 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500/20"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="sistema-descricao" className="text-gray-300">Descrição</Label>
            <Textarea
              id="sistema-descricao"
              value={sistemaForm.descricao}
              onChange={(e) => setSistemaForm({...sistemaForm, descricao: e.target.value})}
              className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20"
              placeholder="Descrição do sistema..."
            />
          </div>
          <Button 
            onClick={createSistema}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
            Criar Sistema
          </Button>
        </CardContent>
      </Card>

      {/* Criar Produto */}
      <Card className="bg-gray-800/50 border-gray-600 shadow-modern">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Plus className="h-5 w-5 mr-2 text-green-500" />
            Criar Novo Produto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="produto-sistema" className="text-gray-300">Sistema *</Label>
            <Select value={selectedSistema} onValueChange={setSelectedSistema}>
              <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white focus:border-green-500 focus:ring-green-500/20">
                <SelectValue placeholder="Selecione um sistema" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                {sistemas.map((sistema) => (
                  <SelectItem key={sistema.id} value={sistema.id} className="text-white hover:bg-gray-600">
                    {sistema.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="produto-nome" className="text-gray-300">Nome do Produto</Label>
              <Input
                id="produto-nome"
                value={produtoForm.nome}
                onChange={(e) => setProdutoForm({...produtoForm, nome: e.target.value})}
                className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-green-500 focus:ring-green-500/20"
                placeholder="Ex: Módulo Básico"
                disabled={!selectedSistema}
              />
            </div>
            <div>
              <Label htmlFor="produto-ordem" className="text-gray-300">Ordem</Label>
              <Input
                id="produto-ordem"
                type="number"
                value={produtoForm.ordem}
                onChange={(e) => setProdutoForm({...produtoForm, ordem: parseInt(e.target.value)})}
                className="bg-gray-700/50 border-gray-600 text-white focus:border-green-500 focus:ring-green-500/20"
                disabled={!selectedSistema}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="produto-descricao" className="text-gray-300">Descrição</Label>
            <Textarea
              id="produto-descricao"
              value={produtoForm.descricao}
              onChange={(e) => setProdutoForm({...produtoForm, descricao: e.target.value})}
              className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-green-500 focus:ring-green-500/20"
              placeholder="Descrição do produto..."
              disabled={!selectedSistema}
            />
          </div>
          <Button 
            onClick={createProduto}
            disabled={isLoading || !selectedSistema}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
            Criar Produto
          </Button>
        </CardContent>
      </Card>

      {/* Criar Videoaula */}
      <Card className="bg-gray-800/50 border-gray-600 shadow-modern">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Plus className="h-5 w-5 mr-2 text-orange-500" />
            Criar Nova Videoaula
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="video-sistema" className="text-gray-300">Sistema *</Label>
              <Select value={selectedSistema} onValueChange={setSelectedSistema}>
                <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white focus:border-orange-500 focus:ring-orange-500/20">
                  <SelectValue placeholder="Selecione um sistema" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  {sistemas.map((sistema) => (
                    <SelectItem key={sistema.id} value={sistema.id} className="text-white hover:bg-gray-600">
                      {sistema.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="video-produto" className="text-gray-300">Produto *</Label>
              <Select value={selectedProduto} onValueChange={setSelectedProduto} disabled={!selectedSistema}>
                <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white focus:border-orange-500 focus:ring-orange-500/20">
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  {produtos.map((produto) => (
                    <SelectItem key={produto.id} value={produto.id} className="text-white hover:bg-gray-600">
                      {produto.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="video-titulo" className="text-gray-300">Título da Videoaula</Label>
              <Input
                id="video-titulo"
                value={videoForm.titulo}
                onChange={(e) => setVideoForm({...videoForm, titulo: e.target.value})}
                className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-orange-500 focus:ring-orange-500/20"
                placeholder="Ex: Introdução ao Sistema"
                disabled={!selectedProduto}
              />
            </div>
            <div>
              <Label htmlFor="video-url" className="text-gray-300">URL do Vídeo</Label>
              <Input
                id="video-url"
                value={videoForm.url_video}
                onChange={(e) => setVideoForm({...videoForm, url_video: e.target.value})}
                className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-orange-500 focus:ring-orange-500/20"
                placeholder="https://exemplo.com/video"
                disabled={!selectedProduto}
              />
            </div>
            <div>
              <Label htmlFor="video-bunny" className="text-gray-300">ID Bunny</Label>
              <Input
                id="video-bunny"
                value={videoForm.id_video_bunny}
                onChange={(e) => setVideoForm({...videoForm, id_video_bunny: e.target.value})}
                className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-orange-500 focus:ring-orange-500/20"
                placeholder="ID do vídeo no Bunny.net"
                disabled={!selectedProduto}
              />
            </div>
            <div>
              <Label htmlFor="video-duracao" className="text-gray-300">Duração (segundos)</Label>
              <Input
                id="video-duracao"
                type="number"
                value={videoForm.duracao_segundos}
                onChange={(e) => setVideoForm({...videoForm, duracao_segundos: parseInt(e.target.value)})}
                className="bg-gray-700/50 border-gray-600 text-white focus:border-orange-500 focus:ring-orange-500/20"
                disabled={!selectedProduto}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="video-descricao" className="text-gray-300">Descrição</Label>
            <Textarea
              id="video-descricao"
              value={videoForm.descricao}
              onChange={(e) => setVideoForm({...videoForm, descricao: e.target.value})}
              className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-orange-500 focus:ring-orange-500/20"
              placeholder="Descrição da videoaula..."
              disabled={!selectedProduto}
            />
          </div>
          <Button 
            onClick={createVideoAula}
            disabled={isLoading || !selectedProduto}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
            Criar Videoaula
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContentManagement;


import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Calendar } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CartorioForm {
  nome: string;
  cnpj: string;
  email_contato: string;
  data_expiracao: string;
}

interface SystemForm {
  nome: string;
  descricao: string;
  ordem: number;
}

interface ProductForm {
  nome: string;
  descricao: string;
  sistema_id: string;
  ordem: number;
}

interface ModuleForm {
  titulo: string;
  descricao: string;
  produto_id: string;
  ordem: number;
  tempo_estimado_min: number;
}

interface VideoForm {
  titulo: string;
  descricao: string;
  modulo_id: string;
  ordem: number;
  url_video: string;
  id_video_bunny: string;
  duracao_segundos: number;
}

const AdminManagement = () => {
  const [cartorioForm, setCartorioForm] = useState<CartorioForm>({
    nome: '',
    cnpj: '',
    email_contato: '',
    data_expiracao: ''
  });

  const [systemForm, setSystemForm] = useState<SystemForm>({
    nome: '',
    descricao: '',
    ordem: 1
  });

  const [productForm, setProductForm] = useState<ProductForm>({
    nome: '',
    descricao: '',
    sistema_id: '',
    ordem: 1
  });

  const [moduleForm, setModuleForm] = useState<ModuleForm>({
    titulo: '',
    descricao: '',
    produto_id: '',
    ordem: 1,
    tempo_estimado_min: 0
  });

  const [videoForm, setVideoForm] = useState<VideoForm>({
    titulo: '',
    descricao: '',
    modulo_id: '',
    ordem: 1,
    url_video: '',
    id_video_bunny: '',
    duracao_segundos: 0
  });

  const [isLoading, setIsLoading] = useState(false);

  const generateCartorioToken = async () => {
    if (!cartorioForm.nome || !cartorioForm.cnpj || !cartorioForm.email_contato) {
      toast({
        title: "Dados incompletos",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Criar cartório
      const { data: cartorio, error: cartorioError } = await supabase
        .from('cartorios')
        .insert({
          nome: cartorioForm.nome,
          cnpj: cartorioForm.cnpj
        })
        .select()
        .single();

      if (cartorioError) throw cartorioError;

      // Gerar token único
      const loginToken = `CART-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      
      // Criar acesso
      const { error: acessoError } = await supabase
        .from('acessos_cartorio')
        .insert({
          login_token: loginToken,
          cartorio_id: cartorio.id,
          data_expiracao: cartorioForm.data_expiracao,
          email_contato: cartorioForm.email_contato,
          ativo: true
        });

      if (acessoError) throw acessoError;

      toast({
        title: "Token gerado com sucesso!",
        description: `Token: ${loginToken}`,
      });

      // Reset form
      setCartorioForm({
        nome: '',
        cnpj: '',
        email_contato: '',
        data_expiracao: ''
      });
    } catch (error) {
      console.error('Error generating token:', error);
      toast({
        title: "Erro ao gerar token",
        description: "Ocorreu um erro ao gerar o token.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createSystem = async () => {
    if (!systemForm.nome) {
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
          nome: systemForm.nome,
          descricao: systemForm.descricao,
          ordem: systemForm.ordem
        });

      if (error) throw error;

      toast({
        title: "Sistema criado com sucesso!",
        description: `Sistema "${systemForm.nome}" foi criado.`,
      });

      setSystemForm({ nome: '', descricao: '', ordem: 1 });
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

  const createProduct = async () => {
    if (!productForm.nome || !productForm.sistema_id) {
      toast({
        title: "Dados incompletos",
        description: "Informe nome e sistema.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('produtos')
        .insert({
          nome: productForm.nome,
          descricao: productForm.descricao,
          sistema_id: productForm.sistema_id,
          ordem: productForm.ordem
        });

      if (error) throw error;

      toast({
        title: "Produto criado com sucesso!",
        description: `Produto "${productForm.nome}" foi criado.`,
      });

      setProductForm({ nome: '', descricao: '', sistema_id: '', ordem: 1 });
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

  const createModule = async () => {
    if (!moduleForm.titulo || !moduleForm.produto_id) {
      toast({
        title: "Dados incompletos",
        description: "Informe título e produto.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('modulos')
        .insert({
          titulo: moduleForm.titulo,
          descricao: moduleForm.descricao,
          produto_id: moduleForm.produto_id,
          ordem: moduleForm.ordem,
          tempo_estimado_min: moduleForm.tempo_estimado_min
        });

      if (error) throw error;

      toast({
        title: "Módulo criado com sucesso!",
        description: `Módulo "${moduleForm.titulo}" foi criado.`,
      });

      setModuleForm({ titulo: '', descricao: '', produto_id: '', ordem: 1, tempo_estimado_min: 0 });
    } catch (error) {
      console.error('Error creating module:', error);
      toast({
        title: "Erro ao criar módulo",
        description: "Ocorreu um erro ao criar o módulo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createVideo = async () => {
    if (!videoForm.titulo || !videoForm.modulo_id || !videoForm.url_video) {
      toast({
        title: "Dados incompletos",
        description: "Informe título, módulo e URL do vídeo.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('video_aulas')
        .insert({
          titulo: videoForm.titulo,
          descricao: videoForm.descricao,
          modulo_id: videoForm.modulo_id,
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
        modulo_id: '', 
        ordem: 1, 
        url_video: '', 
        id_video_bunny: '', 
        duracao_segundos: 0 
      });
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
      {/* Gerar Token para Cartório */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle>Gerar Token para Cartório</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nome">Nome do Cartório</Label>
              <Input
                id="nome"
                value={cartorioForm.nome}
                onChange={(e) => setCartorioForm({...cartorioForm, nome: e.target.value})}
                className="bg-gray-700 border-gray-600"
              />
            </div>
            <div>
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={cartorioForm.cnpj}
                onChange={(e) => setCartorioForm({...cartorioForm, cnpj: e.target.value})}
                className="bg-gray-700 border-gray-600"
              />
            </div>
            <div>
              <Label htmlFor="email">Email de Contato</Label>
              <Input
                id="email"
                type="email"
                value={cartorioForm.email_contato}
                onChange={(e) => setCartorioForm({...cartorioForm, email_contato: e.target.value})}
                className="bg-gray-700 border-gray-600"
              />
            </div>
            <div>
              <Label htmlFor="expiracao">Data de Expiração</Label>
              <Input
                id="expiracao"
                type="date"
                value={cartorioForm.data_expiracao}
                onChange={(e) => setCartorioForm({...cartorioForm, data_expiracao: e.target.value})}
                className="bg-gray-700 border-gray-600"
              />
            </div>
          </div>
          <Button 
            onClick={generateCartorioToken}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            {isLoading ? 'Gerando...' : 'Gerar Token'}
          </Button>
        </CardContent>
      </Card>

      {/* Criar Sistema */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle>Criar Novo Sistema</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sistema-nome">Nome do Sistema</Label>
              <Input
                id="sistema-nome"
                value={systemForm.nome}
                onChange={(e) => setSystemForm({...systemForm, nome: e.target.value})}
                className="bg-gray-700 border-gray-600"
              />
            </div>
            <div>
              <Label htmlFor="sistema-ordem">Ordem</Label>
              <Input
                id="sistema-ordem"
                type="number"
                value={systemForm.ordem}
                onChange={(e) => setSystemForm({...systemForm, ordem: parseInt(e.target.value)})}
                className="bg-gray-700 border-gray-600"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="sistema-descricao">Descrição</Label>
            <Textarea
              id="sistema-descricao"
              value={systemForm.descricao}
              onChange={(e) => setSystemForm({...systemForm, descricao: e.target.value})}
              className="bg-gray-700 border-gray-600"
            />
          </div>
          <Button 
            onClick={createSystem}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            {isLoading ? 'Criando...' : 'Criar Sistema'}
          </Button>
        </CardContent>
      </Card>

      {/* Criar Produto */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle>Criar Novo Produto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="produto-nome">Nome do Produto</Label>
              <Input
                id="produto-nome"
                value={productForm.nome}
                onChange={(e) => setProductForm({...productForm, nome: e.target.value})}
                className="bg-gray-700 border-gray-600"
              />
            </div>
            <div>
              <Label htmlFor="produto-sistema">Sistema</Label>
              <Input
                id="produto-sistema"
                placeholder="ID do Sistema"
                value={productForm.sistema_id}
                onChange={(e) => setProductForm({...productForm, sistema_id: e.target.value})}
                className="bg-gray-700 border-gray-600"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="produto-descricao">Descrição</Label>
            <Textarea
              id="produto-descricao"
              value={productForm.descricao}
              onChange={(e) => setProductForm({...productForm, descricao: e.target.value})}
              className="bg-gray-700 border-gray-600"
            />
          </div>
          <Button 
            onClick={createProduct}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            {isLoading ? 'Criando...' : 'Criar Produto'}
          </Button>
        </CardContent>
      </Card>

      {/* Criar Módulo */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle>Criar Novo Módulo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="modulo-titulo">Título do Módulo</Label>
              <Input
                id="modulo-titulo"
                value={moduleForm.titulo}
                onChange={(e) => setModuleForm({...moduleForm, titulo: e.target.value})}
                className="bg-gray-700 border-gray-600"
              />
            </div>
            <div>
              <Label htmlFor="modulo-produto">Produto</Label>
              <Input
                id="modulo-produto"
                placeholder="ID do Produto"
                value={moduleForm.produto_id}
                onChange={(e) => setModuleForm({...moduleForm, produto_id: e.target.value})}
                className="bg-gray-700 border-gray-600"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="modulo-tempo">Tempo Estimado (minutos)</Label>
            <Input
              id="modulo-tempo"
              type="number"
              value={moduleForm.tempo_estimado_min}
              onChange={(e) => setModuleForm({...moduleForm, tempo_estimado_min: parseInt(e.target.value)})}
              className="bg-gray-700 border-gray-600"
            />
          </div>
          <div>
            <Label htmlFor="modulo-descricao">Descrição</Label>
            <Textarea
              id="modulo-descricao"
              value={moduleForm.descricao}
              onChange={(e) => setModuleForm({...moduleForm, descricao: e.target.value})}
              className="bg-gray-700 border-gray-600"
            />
          </div>
          <Button 
            onClick={createModule}
            disabled={isLoading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            {isLoading ? 'Criando...' : 'Criar Módulo'}
          </Button>
        </CardContent>
      </Card>

      {/* Criar Videoaula */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle>Criar Nova Videoaula</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="video-titulo">Título da Videoaula</Label>
              <Input
                id="video-titulo"
                value={videoForm.titulo}
                onChange={(e) => setVideoForm({...videoForm, titulo: e.target.value})}
                className="bg-gray-700 border-gray-600"
              />
            </div>
            <div>
              <Label htmlFor="video-modulo">Módulo</Label>
              <Input
                id="video-modulo"
                placeholder="ID do Módulo"
                value={videoForm.modulo_id}
                onChange={(e) => setVideoForm({...videoForm, modulo_id: e.target.value})}
                className="bg-gray-700 border-gray-600"
              />
            </div>
            <div>
              <Label htmlFor="video-url">URL do Vídeo</Label>
              <Input
                id="video-url"
                value={videoForm.url_video}
                onChange={(e) => setVideoForm({...videoForm, url_video: e.target.value})}
                className="bg-gray-700 border-gray-600"
              />
            </div>
            <div>
              <Label htmlFor="video-bunny">ID Bunny</Label>
              <Input
                id="video-bunny"
                value={videoForm.id_video_bunny}
                onChange={(e) => setVideoForm({...videoForm, id_video_bunny: e.target.value})}
                className="bg-gray-700 border-gray-600"
              />
            </div>
            <div>
              <Label htmlFor="video-duracao">Duração (segundos)</Label>
              <Input
                id="video-duracao"
                type="number"
                value={videoForm.duracao_segundos}
                onChange={(e) => setVideoForm({...videoForm, duracao_segundos: parseInt(e.target.value)})}
                className="bg-gray-700 border-gray-600"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="video-descricao">Descrição</Label>
            <Textarea
              id="video-descricao"
              value={videoForm.descricao}
              onChange={(e) => setVideoForm({...videoForm, descricao: e.target.value})}
              className="bg-gray-700 border-gray-600"
            />
          </div>
          <Button 
            onClick={createVideo}
            disabled={isLoading}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            {isLoading ? 'Criando...' : 'Criar Videoaula'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminManagement;

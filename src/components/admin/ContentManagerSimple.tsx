import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, ArrowLeft, Video, Loader2 } from 'lucide-react';
import { 
  useSistemasWithVideoAulas, 
  useCreateSistema, 
  useUpdateSistema, 
  useDeleteSistema,
  useCreateProduto,
  useUpdateProduto,
  useDeleteProduto,
  useCreateVideoAula,
  useUpdateVideoAula,
  useDeleteVideoAula
} from '@/hooks/useSupabaseDataRefactored';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

type ViewMode = 'sistemas' | 'produtos' | 'videoaulas';

export const ContentManagerSimple: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('sistemas');
  const [selectedSistema, setSelectedSistema] = useState<any>(null);
  const [selectedProduto, setSelectedProduto] = useState<any>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({ nome: '', descricao: '', ordem: 1 });

  const { data: sistemas, isLoading, refetch } = useSistemasWithVideoAulas();
  const createSistema = useCreateSistema();
  const updateSistema = useUpdateSistema();
  const deleteSistema = useDeleteSistema();
  const createProduto = useCreateProduto();
  const updateProduto = useUpdateProduto();
  const deleteProduto = useDeleteProduto();
  const deleteVideoAula = useDeleteVideoAula();

  const handleCreateSistema = async () => {
    if (!formData.nome.trim()) {
      toast({ title: "Nome obrigatório", variant: "destructive" });
      return;
    }
    
    try {
      await createSistema.mutateAsync(formData);
      setFormData({ nome: '', descricao: '', ordem: 1 });
      refetch();
    } catch (error) {
      console.error('Error creating sistema:', error);
    }
  };

  const handleCreateProduto = async () => {
    if (!formData.nome.trim() || !selectedSistema) {
      toast({ title: "Nome e sistema obrigatórios", variant: "destructive" });
      return;
    }
    
    try {
      await createProduto.mutateAsync({
        ...formData,
        sistema_id: selectedSistema.id
      });
      setFormData({ nome: '', descricao: '', ordem: 1 });
      refetch();
    } catch (error) {
      console.error('Error creating produto:', error);
    }
  };

  const handleDelete = async (id: string, type: 'sistema' | 'produto' | 'videoaula') => {
    if (!confirm('Tem certeza que deseja excluir?')) return;
    
    try {
      if (type === 'sistema') await deleteSistema.mutateAsync(id);
      if (type === 'produto') await deleteProduto.mutateAsync(id);
      if (type === 'videoaula') await deleteVideoAula.mutateAsync(id);
      refetch();
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-gray-800/50 border-gray-600">
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-red-400 mr-3" />
          <span className="text-white">Carregando conteúdo...</span>
        </CardContent>
      </Card>
    );
  }

  // View: Sistemas
  if (viewMode === 'sistemas') {
    return (
      <div className="space-y-6">
        <Card className="bg-gray-800/50 border-gray-600">
          <CardHeader>
            <CardTitle className="text-white">Criar Novo Sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-gray-300">Nome</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">Descrição</Label>
              <Textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">Ordem</Label>
              <Input
                type="number"
                value={formData.ordem}
                onChange={(e) => setFormData({ ...formData, ordem: parseInt(e.target.value) || 1 })}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <Button onClick={handleCreateSistema} className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Criar Sistema
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-600">
          <CardHeader>
            <CardTitle className="text-white">Sistemas Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sistemas?.map((sistema: any) => (
                <div key={sistema.id} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="text-white font-medium">{sistema.nome}</h4>
                    {sistema.descricao && <p className="text-sm text-gray-400">{sistema.descricao}</p>}
                    <Badge variant="secondary" className="mt-2">
                      {sistema.produtos?.length || 0} produto(s)
                    </Badge>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedSistema(sistema);
                        setViewMode('produtos');
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Ver Produtos
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(sistema.id, 'sistema')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // View: Produtos
  if (viewMode === 'produtos' && selectedSistema) {
    const produtos = selectedSistema.produtos || [];
    
    return (
      <div className="space-y-6">
        <Button
          onClick={() => {
            setViewMode('sistemas');
            setSelectedSistema(null);
          }}
          variant="outline"
          className="border-gray-600 text-gray-300"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Sistemas
        </Button>

        <Card className="bg-gray-800/50 border-gray-600">
          <CardHeader>
            <CardTitle className="text-white">Criar Novo Produto em: {selectedSistema.nome}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-gray-300">Nome</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">Descrição</Label>
              <Textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">Ordem</Label>
              <Input
                type="number"
                value={formData.ordem}
                onChange={(e) => setFormData({ ...formData, ordem: parseInt(e.target.value) || 1 })}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <Button onClick={handleCreateProduto} className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Criar Produto
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-600">
          <CardHeader>
            <CardTitle className="text-white">Produtos de {selectedSistema.nome}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {produtos.map((produto: any) => (
                <div key={produto.id} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="text-white font-medium">{produto.nome}</h4>
                    {produto.descricao && <p className="text-sm text-gray-400">{produto.descricao}</p>}
                    <Badge variant="secondary" className="mt-2">
                      {produto.video_aulas?.length || 0} videoaula(s)
                    </Badge>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedProduto(produto);
                        setViewMode('videoaulas');
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Ver Videoaulas
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(produto.id, 'produto')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // View: Videoaulas
  if (viewMode === 'videoaulas' && selectedProduto) {
    const videoAulas = selectedProduto.video_aulas || [];
    
    return (
      <div className="space-y-6">
        <Button
          onClick={() => {
            setViewMode('produtos');
            setSelectedProduto(null);
          }}
          variant="outline"
          className="border-gray-600 text-gray-300"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Produtos
        </Button>

        <Card className="bg-gray-800/50 border-gray-600">
          <CardHeader>
            <CardTitle className="text-white">Videoaulas de {selectedProduto.nome}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Button
                onClick={() => navigate(`/nova-videoaula-bunny?sistema_id=${selectedSistema.id}&produto_id=${selectedProduto.id}`)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Videoaula
              </Button>
            </div>
            
            <div className="space-y-3">
              {videoAulas.map((aula: any) => (
                <div key={aula.id} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <Video className="h-5 w-5 text-red-400 mr-2" />
                      <h4 className="text-white font-medium">{aula.titulo}</h4>
                    </div>
                    {aula.descricao && <p className="text-sm text-gray-400 mt-1">{aula.descricao}</p>}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => navigate(`/editar-videoaula/${aula.id}?sistema_id=${selectedSistema.id}&produto_id=${selectedProduto.id}`)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(aula.id, 'videoaula')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};

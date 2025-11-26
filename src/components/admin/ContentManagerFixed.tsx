import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Plus, FolderOpen, Video, Edit, Trash2, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSistemasWithVideoAulas } from '@/hooks/useSupabaseDataRefactored';

type ViewMode = 'sistemas' | 'produtos' | 'videoaulas';

export const ContentManagerFixed: React.FC = () => {
  const { data: sistemasData, isLoading, refetch } = useSistemasWithVideoAulas();
  const [viewMode, setViewMode] = useState<ViewMode>('sistemas');
  const [selectedSistema, setSelectedSistema] = useState<any>(null);
  const [selectedProduto, setSelectedProduto] = useState<any>(null);
  const [createSistemaOpen, setCreateSistemaOpen] = useState(false);
  const [createProdutoOpen, setCreateProdutoOpen] = useState(false);
  const [editSistemaOpen, setEditSistemaOpen] = useState(false);
  const [editProdutoOpen, setEditProdutoOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({ nome: '', descricao: '' });

  // SISTEMAS HANDLERS
  const handleCreateSistema = async () => {
    if (!formData.nome.trim()) {
      toast({ title: "Nome obrigatório", variant: "destructive" });
      return;
    }
    setIsCreating(true);
    try {
      const { error } = await supabase.from('sistemas').insert({
        nome: formData.nome.trim(),
        descricao: formData.descricao?.trim() || null,
        ordem: (sistemasData?.length || 0) + 1
      });
      if (error) throw error;
      toast({ title: "Sistema criado com sucesso!" });
      setFormData({ nome: '', descricao: '' });
      setCreateSistemaOpen(false);
      refetch();
    } catch (error: any) {
      toast({ title: "Erro ao criar sistema", description: error.message, variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateSistema = async () => {
    if (!selectedSistema || !formData.nome.trim()) return;
    setIsCreating(true);
    try {
      const { error } = await supabase.from('sistemas').update({
        nome: formData.nome.trim(),
        descricao: formData.descricao?.trim() || null
      }).eq('id', selectedSistema.id);
      if (error) throw error;
      toast({ title: "Sistema atualizado com sucesso!" });
      setEditSistemaOpen(false);
      setSelectedSistema(null);
      refetch();
    } catch (error: any) {
      toast({ title: "Erro ao atualizar sistema", description: error.message, variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteSistema = async (sistema: any) => {
    if (!confirm(`Tem certeza que deseja excluir o sistema "${sistema.nome}"?`)) return;
    try {
      const { error } = await supabase.from('sistemas').delete().eq('id', sistema.id);
      if (error) throw error;
      toast({ title: "Sistema excluído com sucesso!" });
      refetch();
    } catch (error: any) {
      toast({ title: "Erro ao excluir sistema", description: error.message, variant: "destructive" });
    }
  };

  // PRODUTOS HANDLERS
  const handleCreateProduto = async () => {
    if (!formData.nome.trim() || !selectedSistema) {
      toast({ title: "Nome obrigatório", variant: "destructive" });
      return;
    }
    setIsCreating(true);
    try {
      const { error } = await supabase.from('produtos').insert({
        nome: formData.nome.trim(),
        descricao: formData.descricao?.trim() || null,
        sistema_id: selectedSistema.id,
        ordem: (selectedSistema.produtos?.length || 0) + 1
      });
      if (error) throw error;
      toast({ title: "Produto criado com sucesso!" });
      setFormData({ nome: '', descricao: '' });
      setCreateProdutoOpen(false);
      refetch();
    } catch (error: any) {
      toast({ title: "Erro ao criar produto", description: error.message, variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateProduto = async () => {
    if (!selectedProduto || !formData.nome.trim()) return;
    setIsCreating(true);
    try {
      const { error } = await supabase.from('produtos').update({
        nome: formData.nome.trim(),
        descricao: formData.descricao?.trim() || null
      }).eq('id', selectedProduto.id);
      if (error) throw error;
      toast({ title: "Produto atualizado com sucesso!" });
      setEditProdutoOpen(false);
      setSelectedProduto(null);
      refetch();
    } catch (error: any) {
      toast({ title: "Erro ao atualizar produto", description: error.message, variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteProduto = async (produto: any) => {
    if (!confirm(`Tem certeza que deseja excluir o produto "${produto.nome}"?`)) return;
    try {
      const { error } = await supabase.from('produtos').delete().eq('id', produto.id);
      if (error) throw error;
      toast({ title: "Produto excluído com sucesso!" });
      refetch();
    } catch (error: any) {
      toast({ title: "Erro ao excluir produto", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteVideoAula = async (videoAula: any) => {
    if (!confirm(`Tem certeza que deseja excluir a videoaula "${videoAula.titulo}"?`)) return;
    try {
      const { error } = await supabase.from('video_aulas').delete().eq('id', videoAula.id);
      if (error) throw error;
      toast({ title: "Videoaula excluída com sucesso!" });
      refetch();
    } catch (error: any) {
      toast({ title: "Erro ao excluir videoaula", description: error.message, variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-red-500 mr-3" />
        <span className="text-white">Carregando conteúdo...</span>
      </div>
    );
  }

  // VIEW: SISTEMAS
  if (viewMode === 'sistemas') {
    return (
      <>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-white">Categorias</h2>
            <Button onClick={() => setCreateSistemaOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar Nova Categoria
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sistemasData?.map((sistema: any) => (
              <Card key={sistema.id} className="bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-colors">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-white mb-3">{sistema.nome}</h3>
                  <p className="text-gray-400 text-sm mb-6 min-h-[40px]">{sistema.descricao || 'Sem descrição'}</p>
                  
                  <div className="flex items-center justify-between">
                    <Button
                      onClick={() => {
                        setSelectedSistema(sistema);
                        setViewMode('produtos');
                      }}
                      variant="outline"
                      className="bg-gray-700/50 border-gray-600 text-white hover:bg-gray-600"
                    >
                      <FolderOpen className="h-4 w-4 mr-2" />
                      Ver Produtos
                    </Button>
                    
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => {
                          setSelectedSistema(sistema);
                          setFormData({ nome: sistema.nome, descricao: sistema.descricao || '' });
                          setEditSistemaOpen(true);
                        }}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => handleDeleteSistema(sistema)}
                        className="border-red-600 text-red-400 hover:bg-red-700/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Modal Criar Sistema */}
        <Dialog open={createSistemaOpen} onOpenChange={setCreateSistemaOpen}>
          <DialogContent className="bg-gray-800 border-gray-600 text-white">
            <DialogHeader>
              <DialogTitle>Cadastrar Nova Categoria</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome da Categoria *</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="Ex: Demonstrações, Orion, etc."
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="Descrição breve da categoria"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCreateSistemaOpen(false)} className="border-gray-600">
                  Cancelar
                </Button>
                <Button onClick={handleCreateSistema} disabled={isCreating} className="bg-blue-600 hover:bg-blue-700">
                  {isCreating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                  Criar Categoria
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal Editar Sistema */}
        <Dialog open={editSistemaOpen} onOpenChange={setEditSistemaOpen}>
          <DialogContent className="bg-gray-800 border-gray-600 text-white">
            <DialogHeader>
              <DialogTitle>Editar Categoria</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome da Categoria *</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditSistemaOpen(false)} className="border-gray-600">
                  Cancelar
                </Button>
                <Button onClick={handleUpdateSistema} disabled={isCreating} className="bg-blue-600 hover:bg-blue-700">
                  {isCreating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Edit className="h-4 w-4 mr-2" />}
                  Salvar Alterações
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // VIEW: PRODUTOS
  if (viewMode === 'produtos' && selectedSistema) {
    return (
      <>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Button
                onClick={() => {
                  setViewMode('sistemas');
                  setSelectedSistema(null);
                }}
                variant="outline"
                className="mb-4 border-gray-600 text-gray-300"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar às Categorias
              </Button>
              <h2 className="text-3xl font-bold text-white">Produtos</h2>
              <p className="text-gray-400 mt-1">Categoria: {selectedSistema.nome}</p>
            </div>
            <Button onClick={() => setCreateProdutoOpen(true)} className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar Novo Produto
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {selectedSistema.produtos?.map((produto: any) => (
              <Card key={produto.id} className="bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-colors">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-white mb-3">{produto.nome}</h3>
                  <p className="text-gray-400 text-sm mb-6 min-h-[40px]">{produto.descricao || 'Sem descrição'}</p>
                  
                  <div className="flex items-center justify-between">
                    <Button
                      onClick={() => {
                        setSelectedProduto(produto);
                        setViewMode('videoaulas');
                      }}
                      variant="outline"
                      className="bg-gray-700/50 border-gray-600 text-white hover:bg-gray-600"
                    >
                      <Video className="h-4 w-4 mr-2" />
                      Ver Video Aulas
                    </Button>
                    
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => {
                          setSelectedProduto(produto);
                          setFormData({ nome: produto.nome, descricao: produto.descricao || '' });
                          setEditProdutoOpen(true);
                        }}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => handleDeleteProduto(produto)}
                        className="border-red-600 text-red-400 hover:bg-red-700/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Modal Criar Produto */}
        <Dialog open={createProdutoOpen} onOpenChange={setCreateProdutoOpen}>
          <DialogContent className="bg-gray-800 border-gray-600 text-white">
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Produto</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome do Produto *</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="Ex: Orion TN, Orion Reg, etc."
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="Descrição breve do produto"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCreateProdutoOpen(false)} className="border-gray-600">
                  Cancelar
                </Button>
                <Button onClick={handleCreateProduto} disabled={isCreating} className="bg-green-600 hover:bg-green-700">
                  {isCreating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                  Criar Produto
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal Editar Produto */}
        <Dialog open={editProdutoOpen} onOpenChange={setEditProdutoOpen}>
          <DialogContent className="bg-gray-800 border-gray-600 text-white">
            <DialogHeader>
              <DialogTitle>Editar Produto</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome do Produto *</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditProdutoOpen(false)} className="border-gray-600">
                  Cancelar
                </Button>
                <Button onClick={handleUpdateProduto} disabled={isCreating} className="bg-blue-600 hover:bg-blue-700">
                  {isCreating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Edit className="h-4 w-4 mr-2" />}
                  Salvar Alterações
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // VIEW: VIDEOAULAS
  if (viewMode === 'videoaulas' && selectedProduto) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button
              onClick={() => {
                setViewMode('produtos');
                setSelectedProduto(null);
              }}
              variant="outline"
              className="mb-4 border-gray-600 text-gray-300"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar aos Produtos
            </Button>
            <h2 className="text-3xl font-bold text-white">Videoaulas</h2>
            <p className="text-gray-400 mt-1">
              Sistema: {selectedSistema?.nome} • Produto: {selectedProduto.nome}
            </p>
          </div>
          <Button
            onClick={() => window.location.href = `/admin/nova-videoaula?produto_id=${selectedProduto.id}`}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Cadastrar Nova Videoaula
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {selectedProduto.video_aulas?.map((videoAula: any) => (
            <Card key={videoAula.id} className="bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-colors">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-white mb-2">{videoAula.titulo}</h3>
                <p className="text-gray-400 text-sm mb-4 line-clamp-4">{videoAula.descricao || 'Sem descrição'}</p>
                
                <div className="space-y-2 mb-4 text-xs text-gray-500">
                  <p>Ordem: {videoAula.ordem}</p>
                  {videoAula.id_video_bunny && (
                    <p className="font-mono">ID Bunny: {videoAula.id_video_bunny}</p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <Button
                    onClick={() => window.location.href = `/video/${videoAula.id}`}
                    variant="outline"
                    size="sm"
                    className="bg-gray-700/50 border-gray-600 text-white hover:bg-gray-600"
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Visualizar
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => window.location.href = `/admin/editar-videoaula/${videoAula.id}`}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleDeleteVideoAula(videoAula)}
                      className="border-red-600 text-red-400 hover:bg-red-700/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return null;
};

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Plus, FolderOpen, Video, Edit, Trash2, Loader2, Search, X, Layers, Package, ChevronRight, Play, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSistemasWithVideoAulas } from '@/hooks/useSupabaseDataRefactored';
import { useNavigate } from 'react-router-dom';
import { ContentSearchResults, ContentHit } from './ContentSearchResults';

type ViewMode = 'sistemas' | 'produtos' | 'videoaulas';

const normalize = (value: string) =>
  (value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

type TipoFiltro = 'todos' | 'sistema' | 'produto' | 'videoaula';

interface NavState {
  viewMode: ViewMode;
  sistemaId: string | null;
  produtoId: string | null;
}

const NAV_STORAGE_KEY = 'admin:content-manager:nav';

const loadNav = (): NavState => {
  try {
    const raw = sessionStorage.getItem(NAV_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as NavState;
      if (parsed && parsed.viewMode) return parsed;
    }
  } catch {
    /* ignore */
  }
  return { viewMode: 'sistemas', sistemaId: null, produtoId: null };
};

export const ContentManagerFixed: React.FC = () => {
  const navigate = useNavigate();
  const { data: sistemasData, isLoading, refetch } = useSistemasWithVideoAulas();
  const [nav, setNav] = useState<NavState>(() => loadNav());
  const { viewMode, sistemaId, produtoId } = nav;

  const setViewMode = (mode: ViewMode) => setNav(prev => ({ ...prev, viewMode: mode }));
  const setSistemaId = (id: string | null) =>
    setNav(prev => ({ ...prev, sistemaId: id, produtoId: id ? prev.produtoId : null }));
  const setProdutoId = (id: string | null) => setNav(prev => ({ ...prev, produtoId: id }));

  // Persiste a navegação para que o admin volte exatamente onde estava
  useEffect(() => {
    try {
      sessionStorage.setItem(NAV_STORAGE_KEY, JSON.stringify(nav));
    } catch {
      /* ignore */
    }
  }, [nav]);

  const selectedSistema = useMemo(
    () => (sistemaId ? sistemasData?.find((s: any) => s.id === sistemaId) ?? null : null),
    [sistemasData, sistemaId]
  );
  const selectedProduto = useMemo(
    () => (produtoId ? selectedSistema?.produtos?.find((p: any) => p.id === produtoId) ?? null : null),
    [selectedSistema, produtoId]
  );
  const [createSistemaOpen, setCreateSistemaOpen] = useState(false);
  const [createProdutoOpen, setCreateProdutoOpen] = useState(false);
  const [editSistemaOpen, setEditSistemaOpen] = useState(false);
  const [editProdutoOpen, setEditProdutoOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({ nome: '', descricao: '' });
  const [search, setSearch] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<TipoFiltro>('todos');

  const termo = normalize(search);
  const isSearching = termo.length >= 2;

  const totals = useMemo(() => {
    const sistemas = sistemasData || [];
    let produtos = 0;
    let videoaulas = 0;
    sistemas.forEach((s: any) => {
      produtos += s.produtos?.length || 0;
      s.produtos?.forEach((p: any) => {
        videoaulas += p.video_aulas?.length || 0;
      });
    });
    return { sistemas: sistemas.length, produtos, videoaulas };
  }, [sistemasData]);

  const hits = useMemo<ContentHit[]>(() => {
    if (!isSearching || !sistemasData) return [];
    const matches = (...values: (string | null | undefined)[]) =>
      values.some(v => v && normalize(v).includes(termo));

    const results: ContentHit[] = [];
    sistemasData.forEach((sistema: any) => {
      if (matches(sistema.nome, sistema.descricao)) {
        results.push({
          tipo: 'sistema',
          id: sistema.id,
          titulo: sistema.nome,
          descricao: sistema.descricao,
        });
      }
      sistema.produtos?.forEach((produto: any) => {
        if (matches(produto.nome, produto.descricao)) {
          results.push({
            tipo: 'produto',
            id: produto.id,
            titulo: produto.nome,
            descricao: produto.descricao,
            sistema: { id: sistema.id, nome: sistema.nome },
          });
        }
        produto.video_aulas?.forEach((aula: any) => {
          if (matches(aula.titulo, aula.descricao, aula.id_video_bunny)) {
            results.push({
              tipo: 'videoaula',
              id: aula.id,
              titulo: aula.titulo,
              descricao: aula.descricao,
              sistema: { id: sistema.id, nome: sistema.nome },
              produto: { id: produto.id, nome: produto.nome },
              ordem: aula.ordem,
              idBunny: aula.id_video_bunny,
            });
          }
        });
      });
    });

    return tipoFiltro === 'todos' ? results : results.filter(r => r.tipo === tipoFiltro);
  }, [isSearching, sistemasData, termo, tipoFiltro]);

  const handleOpenHit = (hit: ContentHit) => {
    if (hit.tipo === 'sistema') {
      setNav({ viewMode: 'produtos', sistemaId: hit.id, produtoId: null });
      setSearch('');
    } else if (hit.tipo === 'produto') {
      setNav({ viewMode: 'videoaulas', sistemaId: hit.sistema?.id ?? null, produtoId: hit.id });
      setSearch('');
    } else {
      navigate(`/video/${hit.id}`);
    }
  };

  const handleEditHit = (hit: ContentHit) => {
    if (hit.tipo === 'sistema') {
      setNav({ viewMode: 'sistemas', sistemaId: hit.id, produtoId: null });
      setFormData({ nome: hit.titulo, descricao: hit.descricao || '' });
      setSearch('');
      setEditSistemaOpen(true);
    } else if (hit.tipo === 'produto') {
      setNav({ viewMode: 'produtos', sistemaId: hit.sistema?.id ?? null, produtoId: hit.id });
      setFormData({ nome: hit.titulo, descricao: hit.descricao || '' });
      setSearch('');
      setEditProdutoOpen(true);
    } else {
      navigate(`/admin/videoaula-editor/${hit.id}`);
    }
  };

  const filtros: { key: TipoFiltro; label: string }[] = [
    { key: 'todos', label: 'Tudo' },
    { key: 'sistema', label: 'Categorias' },
    { key: 'produto', label: 'Produtos' },
    { key: 'videoaula', label: 'Videoaulas' },
  ];

  const toolbar = (
    <Card className="rounded-2xl border-border/50 bg-card/60 backdrop-blur-md">
      <CardContent className="space-y-4 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por categoria, produto, título da videoaula ou ID Bunny..."
              className="h-11 rounded-xl bg-background/50 pl-10 pr-10"
            />
            {search && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearch('')}
                className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {filtros.map(f => (
              <Button
                key={f.key}
                size="sm"
                variant={tipoFiltro === f.key ? 'glow' : 'outline'}
                onClick={() => setTipoFiltro(f.key)}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary" className="gap-1">
            <Layers className="h-3 w-3" /> {totals.sistemas} categorias
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <Package className="h-3 w-3" /> {totals.produtos} produtos
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <Video className="h-3 w-3" /> {totals.videoaulas} videoaulas
          </Badge>
          {!isSearching && search.length === 1 && <span>Digite ao menos 2 caracteres para buscar</span>}
        </div>

        {/* Trilha de navegação */}
        {!isSearching && (
          <div className="flex min-w-0 flex-wrap items-center gap-1 text-sm">
            <button
              onClick={() => setNav({ viewMode: 'sistemas', sistemaId: null, produtoId: null })}
              className="text-muted-foreground transition-colors hover:text-primary"
            >
              Categorias
            </button>
            {selectedSistema && (
              <>
                <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                <button
                  onClick={() => setNav({ viewMode: 'produtos', sistemaId: selectedSistema.id, produtoId: null })}
                  className="max-w-[220px] truncate text-muted-foreground transition-colors hover:text-primary"
                >
                  {selectedSistema.nome}
                </button>
              </>
            )}
            {selectedProduto && viewMode === 'videoaulas' && (
              <>
                <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                <span className="max-w-[220px] truncate font-medium text-foreground">{selectedProduto.nome}</span>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

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

  // Fallback: se o item salvo não existe mais, volta ao nível anterior
  useEffect(() => {
    if (isLoading || !sistemasData) return;
    if (viewMode === 'videoaulas' && !selectedProduto) {
      setNav(prev => ({ ...prev, viewMode: selectedSistema ? 'produtos' : 'sistemas', produtoId: null }));
    } else if (viewMode === 'produtos' && !selectedSistema) {
      setNav({ viewMode: 'sistemas', sistemaId: null, produtoId: null });
    }
  }, [isLoading, sistemasData, viewMode, selectedSistema, selectedProduto]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
        <span className="text-foreground">Carregando conteúdo...</span>
      </div>
    );
  }

  // VIEW: SISTEMAS
  if (viewMode === 'sistemas') {
    return (
      <>
        <div className="space-y-6">
          {toolbar}
          {isSearching ? (
            <ContentSearchResults term={search} hits={hits} onOpen={handleOpenHit} onEdit={handleEditHit} />
          ) : (
          <>
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-foreground">Categorias</h2>
            <Button onClick={() => setCreateSistemaOpen(true)} variant="glow">
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar Nova Categoria
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sistemasData?.map((sistema: any) => (
              <Card key={sistema.id} className="bg-card/70 backdrop-blur-md border-border/50 hover:border-primary/40 transition-colors rounded-2xl">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-foreground mb-3">{sistema.nome}</h3>
                  <p className="text-muted-foreground text-sm mb-6 min-h-[40px]">{sistema.descricao || 'Sem descrição'}</p>
                  
                  <div className="flex items-center justify-between">
                    <Button
                      onClick={() => {
                        setSistemaId(sistema.id);
                        setViewMode('produtos');
                      }}
                      variant="outline"
                      className="bg-secondary/70 border-border text-foreground hover:bg-secondary"
                    >
                      <FolderOpen className="h-4 w-4 mr-2" />
                      Ver Produtos
                    </Button>
                    
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => {
                          setSistemaId(sistema.id);
                          setFormData({ nome: sistema.nome, descricao: sistema.descricao || '' });
                          setEditSistemaOpen(true);
                        }}
                        className="border-border text-muted-foreground hover:bg-secondary"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => handleDeleteSistema(sistema)}
                        className="border-destructive/50 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          </>
          )}
        </div>

        {/* Modal Criar Sistema */}
        <Dialog open={createSistemaOpen} onOpenChange={setCreateSistemaOpen}>
          <DialogContent className="bg-card/95 backdrop-blur-md border-border/50 text-foreground rounded-2xl">
            <DialogHeader>
              <DialogTitle>Cadastrar Nova Categoria</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome da Categoria *</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="bg-background/50 border-border text-foreground"
                  placeholder="Ex: Demonstrações, Orion, etc."
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="bg-background/50 border-border text-foreground"
                  placeholder="Descrição breve da categoria"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCreateSistemaOpen(false)} className="border-border">
                  Cancelar
                </Button>
                <Button onClick={handleCreateSistema} disabled={isCreating} variant="glow">
                  {isCreating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                  Criar Categoria
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal Editar Sistema */}
        <Dialog open={editSistemaOpen} onOpenChange={setEditSistemaOpen}>
          <DialogContent className="bg-card/95 backdrop-blur-md border-border/50 text-foreground rounded-2xl">
            <DialogHeader>
              <DialogTitle>Editar Categoria</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome da Categoria *</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="bg-background/50 border-border text-foreground"
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="bg-background/50 border-border text-foreground"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditSistemaOpen(false)} className="border-border">
                  Cancelar
                </Button>
                <Button onClick={handleUpdateSistema} disabled={isCreating} variant="glow">
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
          {toolbar}
          {isSearching ? (
            <ContentSearchResults term={search} hits={hits} onOpen={handleOpenHit} onEdit={handleEditHit} />
          ) : (
          <>
          <div className="flex items-center justify-between">
            <div>
              <Button
                onClick={() => {
                  setViewMode('sistemas');
                            }}
                variant="outline"
                className="mb-4 border-border text-muted-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar às Categorias
              </Button>
              <h2 className="text-3xl font-bold text-foreground">Produtos</h2>
              <p className="text-muted-foreground mt-1">Categoria: {selectedSistema.nome}</p>
            </div>
            <Button onClick={() => setCreateProdutoOpen(true)} variant="glow">
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar Novo Produto
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {selectedSistema.produtos?.map((produto: any) => (
              <Card key={produto.id} className="bg-card/70 backdrop-blur-md border-border/50 hover:border-primary/40 transition-colors rounded-2xl">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-foreground mb-3">{produto.nome}</h3>
                  <p className="text-muted-foreground text-sm mb-6 min-h-[40px]">{produto.descricao || 'Sem descrição'}</p>
                  
                  <div className="flex items-center justify-between">
                    <Button
                      onClick={() => {
                        setProdutoId(produto.id);
                        setViewMode('videoaulas');
                      }}
                      variant="outline"
                      className="bg-secondary/70 border-border text-foreground hover:bg-secondary"
                    >
                      <Video className="h-4 w-4 mr-2" />
                      Ver Video Aulas
                    </Button>
                    
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => {
                          setProdutoId(produto.id);
                          setFormData({ nome: produto.nome, descricao: produto.descricao || '' });
                          setEditProdutoOpen(true);
                        }}
                        className="border-border text-muted-foreground hover:bg-secondary"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => handleDeleteProduto(produto)}
                        className="border-destructive/50 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          </>
          )}
        </div>

        {/* Modal Criar Produto */}
        <Dialog open={createProdutoOpen} onOpenChange={setCreateProdutoOpen}>
          <DialogContent className="bg-card/95 backdrop-blur-md border-border/50 text-foreground rounded-2xl">
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Produto</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome do Produto *</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="bg-background/50 border-border text-foreground"
                  placeholder="Ex: Orion TN, Orion Reg, etc."
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="bg-background/50 border-border text-foreground"
                  placeholder="Descrição breve do produto"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCreateProdutoOpen(false)} className="border-border">
                  Cancelar
                </Button>
                <Button onClick={handleCreateProduto} disabled={isCreating} variant="glow">
                  {isCreating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                  Criar Produto
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal Editar Produto */}
        <Dialog open={editProdutoOpen} onOpenChange={setEditProdutoOpen}>
          <DialogContent className="bg-card/95 backdrop-blur-md border-border/50 text-foreground rounded-2xl">
            <DialogHeader>
              <DialogTitle>Editar Produto</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome do Produto *</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="bg-background/50 border-border text-foreground"
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="bg-background/50 border-border text-foreground"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditProdutoOpen(false)} className="border-border">
                  Cancelar
                </Button>
                <Button onClick={handleUpdateProduto} disabled={isCreating} variant="glow">
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
    const aulas = selectedProduto.video_aulas || [];
    const sortedAulas = [...aulas].sort((a: any, b: any) => (a.ordem || 0) - (b.ordem || 0));

    return (
      <div className="space-y-6">
        {toolbar}
        {isSearching ? (
          <ContentSearchResults term={search} hits={hits} onOpen={handleOpenHit} onEdit={handleEditHit} />
        ) : (
        <>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Button
              onClick={() => setViewMode('produtos')}
              variant="outline"
              size="sm"
              className="mb-3 border-border text-muted-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar aos Produtos
            </Button>
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Videoaulas</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {selectedSistema?.nome} <ChevronRight className="inline h-3 w-3" /> {selectedProduto.nome}
            </p>
          </div>
          <Button
            onClick={() => navigate(`/admin/videoaula/nova?sistema_id=${selectedSistema?.id}&produto_id=${selectedProduto.id}`)}
            variant="glow"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Videoaula
          </Button>
        </div>

        {sortedAulas.length === 0 ? (
          <Card className="rounded-2xl border-border/50 bg-card/60 backdrop-blur-md">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Video className="h-7 w-7" />
              </span>
              <h3 className="text-lg font-semibold text-foreground">Nenhuma videoaula cadastrada</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Cadastre a primeira videoaula deste produto para começar.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedAulas.map((videoAula: any, index: number) => {
              const hasVideo = !!videoAula.id_video_bunny;
              return (
                <motion.div
                  key={videoAula.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.35) }}
                >
                  <Card className="group flex h-full flex-col overflow-hidden rounded-2xl border-border/50 bg-card/70 backdrop-blur-md transition-all hover:border-primary/40 hover:bg-card/80">
                    {/* thumbnail / header */}
                    <div className="relative h-28 overflow-hidden bg-gradient-to-br from-secondary/60 to-muted/40 sm:h-32">
                      <BunnyThumbnail
                        videoId={videoAula.id_video_bunny}
                        fallbackUrl={videoAula.url_thumbnail}
                        alt={videoAula.titulo}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/40 text-primary backdrop-blur-sm transition-transform group-hover:scale-110">
                          {hasVideo ? <Play className="h-5 w-5 fill-current" /> : <Video className="h-5 w-5" />}
                        </div>
                      </div>

                      <div className="absolute left-3 top-3 flex items-center gap-1.5">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-black/50 text-[10px] font-bold text-primary-foreground backdrop-blur-sm">
                          {String(videoAula.ordem || 0).padStart(2, '0')}
                        </span>
                      </div>
                      <div className="absolute right-3 top-3">
                        <Badge variant={hasVideo ? 'default' : 'secondary'} className="h-6 px-2 text-[10px] font-medium backdrop-blur-sm">
                          {hasVideo ? 'Vídeo' : 'Rascunho'}
                        </Badge>
                      </div>
                    </div>

                    <CardContent className="flex flex-1 flex-col p-4">
                      <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground" title={videoAula.titulo}>
                        {videoAula.titulo}
                      </h3>

                      {videoAula.descricao && (
                        <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground" title={videoAula.descricao}>
                          {videoAula.descricao}
                        </p>
                      )}

                      <div className="mt-auto pt-3">
                        {hasVideo && (
                          <p className="mb-3 truncate font-mono text-[10px] text-muted-foreground/70" title={videoAula.id_video_bunny}>
                            {videoAula.id_video_bunny}
                          </p>
                        )}

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 flex-1 border-border/60 bg-secondary/40 text-xs hover:bg-secondary"
                            onClick={() => window.location.href = `/video/${videoAula.id}`}
                          >
                            <Eye className="mr-1.5 h-3.5 w-3.5" />
                            Ver
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 border-border/60 hover:bg-secondary"
                            onClick={() => navigate(`/admin/videoaula-editor/${videoAula.id}`)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 border-destructive/50 text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteVideoAula(videoAula)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
        </>
        )}
      </div>
    );
  }

  return null;
};

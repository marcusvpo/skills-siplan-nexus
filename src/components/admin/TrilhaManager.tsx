import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Copy, ArrowUp, ArrowDown, X, GripVertical } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export const TrilhaManager = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTrilha, setEditingTrilha] = useState<any>(null);
  const [sistemaId, setSistemaId] = useState("");
  const [formData, setFormData] = useState({ nome: "", produto_id: "", aulas: [] as any[] });
  const [aulaSearchTerm, setAulaSearchTerm] = useState("");
  const [aulaSortOrder, setAulaSortOrder] = useState<"asc" | "desc" | "alpha">("asc");
  const queryClient = useQueryClient();

  const { data: trilhas = [] } = useQuery({
    queryKey: ['trilhas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trilhas')
        .select('*, produtos(nome), trilha_aulas(*, video_aulas(titulo))')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: sistemas = [] } = useQuery({
    queryKey: ['sistemas'],
    queryFn: async () => {
      const { data, error } = await supabase.from('sistemas').select('*').order('nome');
      if (error) throw error;
      return data;
    }
  });

  const { data: produtos = [] } = useQuery({
    queryKey: ['produtos', sistemaId],
    queryFn: async () => {
      if (!sistemaId) return [];
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('sistema_id', sistemaId)
        .order('nome');
      if (error) throw error;
      return data;
    },
    enabled: !!sistemaId
  });

  const { data: videoAulas = [] } = useQuery({
    queryKey: ['video_aulas', formData.produto_id],
    queryFn: async () => {
      if (!formData.produto_id) return [];
      const { data, error } = await supabase
        .from('video_aulas')
        .select('*')
        .eq('produto_id', formData.produto_id)
        .order('ordem');
      if (error) throw error;
      return data;
    },
    enabled: !!formData.produto_id
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.functions.invoke('create-trilha', { body: data });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trilhas'] });
      toast({ title: "Trilha criada com sucesso!" });
      setIsDialogOpen(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.functions.invoke('update-trilha', { body: data });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trilhas'] });
      toast({ title: "Trilha atualizada com sucesso!" });
      setIsDialogOpen(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.functions.invoke('delete-trilha', { body: { id } });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trilhas'] });
      toast({ title: "Trilha deletada com sucesso!" });
    }
  });

  const handleSubmit = () => {
    const payload = {
      ...formData,
      aulas: formData.aulas.map((a, index) => ({ video_aula_id: a.video_aula_id, ordem: index })),
    };
    if (editingTrilha) {
      updateMutation.mutate({ id: editingTrilha.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const resetForm = () => {
    setFormData({ nome: "", produto_id: "", aulas: [] });
    setEditingTrilha(null);
    setSistemaId("");
    setAulaSearchTerm("");
    setAulaSortOrder("asc");
  };

  const handleEdit = (trilha: any) => {
    setEditingTrilha(trilha);
    const produto = produtos.find(p => p.id === trilha.produto_id);
    if (produto) setSistemaId(produto.sistema_id);
    setFormData({
      nome: trilha.nome,
      produto_id: trilha.produto_id,
      aulas: [...(trilha.trilha_aulas || [])]
        .sort((a: any, b: any) => (a.ordem ?? 0) - (b.ordem ?? 0))
        .map((ta: any, i: number) => ({ video_aula_id: ta.video_aula_id, ordem: i }))
    });
    setIsDialogOpen(true);
  };

  const handleDuplicate = (trilha: any) => {
    const produto = produtos.find(p => p.id === trilha.produto_id);
    if (produto) setSistemaId(produto.sistema_id);
    setFormData({
      nome: `${trilha.nome} (Cópia)`,
      produto_id: trilha.produto_id,
      aulas: [...(trilha.trilha_aulas || [])]
        .sort((a: any, b: any) => (a.ordem ?? 0) - (b.ordem ?? 0))
        .map((ta: any, i: number) => ({ video_aula_id: ta.video_aula_id, ordem: i }))
    });
    setIsDialogOpen(true);
  };

  const toggleAula = (videoAulaId: string) => {
    const exists = formData.aulas.find(a => a.video_aula_id === videoAulaId);
    if (exists) {
      setFormData({
        ...formData,
        aulas: formData.aulas
          .filter(a => a.video_aula_id !== videoAulaId)
          .map((a, i) => ({ ...a, ordem: i }))
      });
    } else {
      setFormData({
        ...formData,
        aulas: [...formData.aulas, { video_aula_id: videoAulaId, ordem: formData.aulas.length }]
      });
    }
  };

  const moveAula = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= formData.aulas.length) return;
    const next = [...formData.aulas];
    [next[index], next[target]] = [next[target], next[index]];
    setFormData({ ...formData, aulas: next.map((a, i) => ({ ...a, ordem: i })) });
  };

  const aulaTitulo = (id: string) => {
    const found = videoAulas.find((va: any) => va.id === id);
    if (found) return found.titulo;
    const fromTrilha = editingTrilha?.trilha_aulas?.find((ta: any) => ta.video_aula_id === id);
    return fromTrilha?.video_aulas?.titulo || "Aula";
  };

  // Filter and sort video aulas
  const filteredAndSortedAulas = videoAulas
    .filter(va => va.titulo.toLowerCase().includes(aulaSearchTerm.toLowerCase()))
    .sort((a, b) => {
      if (aulaSortOrder === "alpha") {
        return a.titulo.localeCompare(b.titulo);
      }
      return aulaSortOrder === "asc" ? a.ordem - b.ordem : b.ordem - a.ordem;
    });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestão de Trilhas</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" /> Nova Trilha
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTrilha ? 'Editar' : 'Nova'} Trilha</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome da Trilha</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Trilha Orion PRO"
                />
              </div>
              <div>
                <Label>Sistema</Label>
                <Select value={sistemaId} onValueChange={(v) => { setSistemaId(v); setFormData({ ...formData, produto_id: "", aulas: [] }); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um sistema" />
                  </SelectTrigger>
                  <SelectContent>
                    {sistemas.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Produto</Label>
                <Select value={formData.produto_id} onValueChange={(v) => setFormData({ ...formData, produto_id: v, aulas: [] })} disabled={!sistemaId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {produtos.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {formData.produto_id && (
                <div>
                  <Label>Aulas da Trilha</Label>
                  <div className="space-y-2 mb-2">
                    <Input
                      placeholder="Pesquisar aulas..."
                      value={aulaSearchTerm}
                      onChange={(e) => setAulaSearchTerm(e.target.value)}
                    />
                    <Select value={aulaSortOrder} onValueChange={(v: any) => setAulaSortOrder(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">Ordem Crescente</SelectItem>
                        <SelectItem value="desc">Ordem Decrescente</SelectItem>
                        <SelectItem value="alpha">Ordem Alfabética</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="border rounded p-4 max-h-60 overflow-y-auto space-y-2">
                    {filteredAndSortedAulas.map(va => (
                      <div key={va.id} className="flex items-center space-x-2">
                        <Checkbox
                          checked={formData.aulas.some(a => a.video_aula_id === va.id)}
                          onCheckedChange={() => toggleAula(va.id)}
                        />
                        <span className="text-sm">{va.titulo}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {formData.produto_id && formData.aulas.length > 0 && (
                <div>
                  <Label>Sequência da Trilha</Label>
                  <p className="mb-2 text-xs text-muted-foreground">
                    Defina a ordem em que as aulas aparecerão para o usuário final.
                  </p>
                  <div className="space-y-2 rounded-xl border border-border/60 bg-card/60 p-3 backdrop-blur-md">
                    {formData.aulas.map((aula, index) => (
                      <div
                        key={aula.video_aula_id}
                        className="flex items-center gap-2 rounded-lg border border-border/50 bg-background/60 px-3 py-2"
                      >
                        <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                          {index + 1}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm">{aulaTitulo(aula.video_aula_id)}</span>
                        <div className="flex shrink-0 items-center gap-1">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            disabled={index === 0}
                            onClick={() => moveAula(index, -1)}
                            aria-label="Mover para cima"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            disabled={index === formData.aulas.length - 1}
                            onClick={() => moveAula(index, 1)}
                            aria-label="Mover para baixo"
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive"
                            onClick={() => toggleAula(aula.video_aula_id)}
                            aria-label="Remover da trilha"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <Button onClick={handleSubmit} className="w-full">
                {editingTrilha ? 'Atualizar' : 'Criar'} Trilha
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {trilhas.map(trilha => (
          <Card key={trilha.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>{trilha.nome}</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(trilha)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDuplicate(trilha)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(trilha.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">Produto: {trilha.produtos?.nome}</p>
              <p className="text-sm">{trilha.trilha_aulas?.length || 0} aulas</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
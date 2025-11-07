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
import { Plus, Edit, Trash2, Copy } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export const TrilhaManager = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTrilha, setEditingTrilha] = useState<any>(null);
  const [formData, setFormData] = useState({ nome: "", produto_id: "", aulas: [] as any[] });
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

  const { data: produtos = [] } = useQuery({
    queryKey: ['produtos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('produtos').select('*').order('nome');
      if (error) throw error;
      return data;
    }
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
    if (editingTrilha) {
      updateMutation.mutate({ id: editingTrilha.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const resetForm = () => {
    setFormData({ nome: "", produto_id: "", aulas: [] });
    setEditingTrilha(null);
  };

  const handleEdit = (trilha: any) => {
    setEditingTrilha(trilha);
    setFormData({
      nome: trilha.nome,
      produto_id: trilha.produto_id,
      aulas: trilha.trilha_aulas.map((ta: any) => ({
        video_aula_id: ta.video_aula_id,
        ordem: ta.ordem
      }))
    });
    setIsDialogOpen(true);
  };

  const handleDuplicate = (trilha: any) => {
    setFormData({
      nome: `${trilha.nome} (Cópia)`,
      produto_id: trilha.produto_id,
      aulas: trilha.trilha_aulas.map((ta: any) => ({
        video_aula_id: ta.video_aula_id,
        ordem: ta.ordem
      }))
    });
    setIsDialogOpen(true);
  };

  const toggleAula = (videoAulaId: string) => {
    const exists = formData.aulas.find(a => a.video_aula_id === videoAulaId);
    if (exists) {
      setFormData({
        ...formData,
        aulas: formData.aulas.filter(a => a.video_aula_id !== videoAulaId)
      });
    } else {
      setFormData({
        ...formData,
        aulas: [...formData.aulas, { video_aula_id: videoAulaId, ordem: formData.aulas.length }]
      });
    }
  };

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
                <Label>Produto</Label>
                <Select value={formData.produto_id} onValueChange={(v) => setFormData({ ...formData, produto_id: v, aulas: [] })}>
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
                  <div className="border rounded p-4 max-h-60 overflow-y-auto space-y-2">
                    {videoAulas.map(va => (
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
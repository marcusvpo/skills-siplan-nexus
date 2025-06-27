
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Edit2, 
  Save,
  X,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface CartorioEditorProps {
  cartorio: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

interface CartorioForm {
  nome: string;
  cidade: string;
  estado: string;
  observacoes: string;
  is_active: boolean;
}

export const CartorioEditor: React.FC<CartorioEditorProps> = ({
  cartorio,
  isOpen,
  onClose,
  onUpdate
}) => {
  const [form, setForm] = useState<CartorioForm>({
    nome: '',
    cidade: '',
    estado: '',
    observacoes: '',
    is_active: true
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (cartorio) {
      setForm({
        nome: cartorio.nome || '',
        cidade: cartorio.cidade || '',
        estado: cartorio.estado || '',
        observacoes: cartorio.observacoes || '',
        is_active: cartorio.is_active
      });
    }
  }, [cartorio]);

  const handleUpdate = async () => {
    if (!form.nome.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "O nome do cartório é obrigatório",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('cartorios')
        .update({
          nome: form.nome.trim(),
          cidade: form.cidade.trim() || null,
          estado: form.estado.trim() || null,
          observacoes: form.observacoes.trim() || null,
          is_active: form.is_active
        })
        .eq('id', cartorio.id);

      if (error) throw error;

      toast({
        title: "Cartório atualizado",
        description: "Os dados do cartório foram salvos com sucesso",
      });

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating cartorio:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível salvar as alterações",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    try {
      // Delete related data first
      await supabase.from('visualizacoes_cartorio').delete().eq('cartorio_id', cartorio.id);
      await supabase.from('favoritos_cartorio').delete().eq('cartorio_id', cartorio.id);
      await supabase.from('cartorio_usuarios').delete().eq('cartorio_id', cartorio.id);
      await supabase.from('acessos_cartorio').delete().eq('cartorio_id', cartorio.id);
      
      const { error } = await supabase
        .from('cartorios')
        .delete()
        .eq('id', cartorio.id);

      if (error) throw error;

      toast({
        title: "Cartório excluído",
        description: `O cartório "${cartorio.nome}" foi removido com sucesso`,
      });

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error deleting cartorio:', error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o cartório",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-600 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Edit2 className="h-5 w-5 mr-2" />
            Editar Cartório
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300">Nome do Cartório *</Label>
              <Input
                value={form.nome}
                onChange={(e) => setForm({...form, nome: e.target.value})}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="Nome do cartório"
              />
            </div>
            <div>
              <Label className="text-gray-300">Cidade</Label>
              <Input
                value={form.cidade}
                onChange={(e) => setForm({...form, cidade: e.target.value})}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="Cidade"
              />
            </div>
            <div>
              <Label className="text-gray-300">Estado</Label>
              <Input
                value={form.estado}
                onChange={(e) => setForm({...form, estado: e.target.value})}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="UF"
                maxLength={2}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={form.is_active}
                onCheckedChange={(checked) => setForm({...form, is_active: checked})}
              />
              <Label className="text-gray-300">Cartório ativo</Label>
            </div>
          </div>

          <div>
            <Label className="text-gray-300">Observações</Label>
            <Textarea
              value={form.observacoes}
              onChange={(e) => setForm({...form, observacoes: e.target.value})}
              className="bg-gray-700 border-gray-600 text-white"
              placeholder="Observações sobre o cartório..."
              rows={3}
            />
          </div>

          <div className="flex justify-between pt-4">
            <Button
              onClick={() => setShowDeleteConfirm(true)}
              variant="outline"
              className="border-red-600 text-red-400 hover:bg-red-700/20"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir Cartório
            </Button>

            <div className="flex space-x-2">
              <Button
                onClick={onClose}
                variant="outline"
                className="border-gray-600 text-gray-300"
                disabled={isUpdating}
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                {isUpdating ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="bg-gray-800 border-red-600 max-w-md mx-4">
              <CardHeader>
                <CardTitle className="text-red-400 flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Confirmar Exclusão
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 mb-4">
                  Tem certeza que deseja excluir o cartório "{cartorio?.nome}"? 
                  Esta ação é irreversível e removerá todos os dados associados.
                </p>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => setShowDeleteConfirm(false)}
                    variant="outline"
                    className="border-gray-600 text-gray-300"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleDelete}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Excluir Permanentemente
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

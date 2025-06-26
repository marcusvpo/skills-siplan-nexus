
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, X, Save } from 'lucide-react';
import { useCreateSistema, useUpdateSistema, useDeleteSistema } from '@/hooks/useSupabaseDataAudited';

interface SystemFormAuditedProps {
  sistema?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export const SystemFormAudited: React.FC<SystemFormAuditedProps> = ({
  sistema,
  onSuccess,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    nome: sistema?.nome || '',
    descricao: sistema?.descricao || '',
    ordem: sistema?.ordem || 1
  });

  const createSistema = useCreateSistema();
  const updateSistema = useUpdateSistema();
  const deleteSistema = useDeleteSistema();

  const isLoading = createSistema.isPending || updateSistema.isPending || deleteSistema.isPending;

  useEffect(() => {
    if (sistema) {
      setFormData({
        nome: sistema.nome || '',
        descricao: sistema.descricao || '',
        ordem: sistema.ordem || 1
      });
    }
  }, [sistema]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      return;
    }

    try {
      if (sistema?.id) {
        await updateSistema.mutateAsync({
          id: sistema.id,
          ...formData
        });
      } else {
        await createSistema.mutateAsync(formData);
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving sistema:', error);
    }
  };

  const handleDelete = async () => {
    if (!sistema?.id) return;
    
    if (confirm(`Tem certeza que deseja excluir o sistema "${sistema.nome}"?`)) {
      try {
        await deleteSistema.mutateAsync(sistema.id);
        onSuccess();
      } catch (error) {
        console.error('Error deleting sistema:', error);
      }
    }
  };

  return (
    <Card className="bg-gray-800/50 border-gray-600">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white">
          {sistema ? 'Editar Sistema' : 'Novo Sistema'}
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={isLoading}
          className="border-gray-600 text-gray-300 hover:bg-gray-700/50"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nome" className="text-gray-300">Nome do Sistema *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
              placeholder="Ex: Sistema de Gestão"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="descricao" className="text-gray-300">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
              placeholder="Descrição do sistema..."
              rows={3}
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="ordem" className="text-gray-300">Ordem</Label>
            <Input
              id="ordem"
              type="number"
              value={formData.ordem}
              onChange={(e) => setFormData({ ...formData, ordem: parseInt(e.target.value) || 1 })}
              className="bg-gray-700/50 border-gray-600 text-white"
              min="1"
              disabled={isLoading}
            />
          </div>

          <div className="flex justify-between pt-4">
            {sistema && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Excluir
              </Button>
            )}
            
            <div className="flex space-x-2 ml-auto">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
                className="border-gray-600 text-gray-300 hover:bg-gray-700/50"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !formData.nome.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {sistema ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

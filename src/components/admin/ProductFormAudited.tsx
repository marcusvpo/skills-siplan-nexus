
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, X, Save } from 'lucide-react';
import { useCreateProduto, useUpdateProduto, useDeleteProduto } from '@/hooks/useSupabaseDataAudited';

interface ProductFormAuditedProps {
  sistemaId: string;
  sistemaNome: string;
  produto?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export const ProductFormAudited: React.FC<ProductFormAuditedProps> = ({
  sistemaId,
  sistemaNome,
  produto,
  onSuccess,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    nome: produto?.nome || '',
    descricao: produto?.descricao || '',
    ordem: produto?.ordem || 1
  });

  const createProduto = useCreateProduto();
  const updateProduto = useUpdateProduto();
  const deleteProduto = useDeleteProduto();

  const isLoading = createProduto.isPending || updateProduto.isPending || deleteProduto.isPending;

  useEffect(() => {
    if (produto) {
      setFormData({
        nome: produto.nome || '',
        descricao: produto.descricao || '',
        ordem: produto.ordem || 1
      });
    }
  }, [produto]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      return;
    }

    try {
      if (produto?.id) {
        await updateProduto.mutateAsync({
          id: produto.id,
          ...formData
        });
      } else {
        await createProduto.mutateAsync({
          ...formData,
          sistema_id: sistemaId
        });
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving produto:', error);
    }
  };

  const handleDelete = async () => {
    if (!produto?.id) return;
    
    if (confirm(`Tem certeza que deseja excluir o produto "${produto.nome}"?`)) {
      try {
        await deleteProduto.mutateAsync(produto.id);
        onSuccess();
      } catch (error) {
        console.error('Error deleting produto:', error);
      }
    }
  };

  return (
    <Card className="bg-gray-800/50 border-gray-600">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white">
          {produto ? 'Editar Produto' : 'Novo Produto'}
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
        <div className="mb-4 p-3 bg-gray-700/30 rounded border border-gray-600">
          <p className="text-gray-300 text-sm">
            <strong>Sistema:</strong> {sistemaNome}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nome" className="text-gray-300">Nome do Produto *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
              placeholder="Ex: Módulo Básico"
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
              placeholder="Descrição do produto..."
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
            {produto && (
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
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {produto ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

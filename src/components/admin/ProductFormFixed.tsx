
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useCreateProduto, useUpdateProduto } from '@/hooks/useSupabaseDataFixed';

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

interface ProductFormFixedProps {
  sistema: Sistema;
  produto?: Produto | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const ProductFormFixed: React.FC<ProductFormFixedProps> = ({
  sistema,
  produto,
  onSuccess,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    nome: produto?.nome || '',
    descricao: produto?.descricao || '',
    ordem: produto?.ordem || 1
  });

  const createProdutoMutation = useCreateProduto();
  const updateProdutoMutation = useUpdateProduto();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Informe o nome do produto.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (produto) {
        await updateProdutoMutation.mutateAsync({
          id: produto.id,
          nome: formData.nome.trim(),
          descricao: formData.descricao.trim() || undefined,
          ordem: formData.ordem
        });

        toast({
          title: "Produto atualizado",
          description: `Produto "${formData.nome}" foi atualizado com sucesso.`,
        });
      } else {
        await createProdutoMutation.mutateAsync({
          nome: formData.nome.trim(),
          descricao: formData.descricao.trim() || undefined,
          sistema_id: sistema.id,
          ordem: formData.ordem
        });

        toast({
          title: "Produto criado",
          description: `Produto "${formData.nome}" foi criado com sucesso.`,
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: "Erro ao salvar produto",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao salvar o produto.",
        variant: "destructive",
      });
    }
  };

  const isLoading = createProdutoMutation.isPending || updateProdutoMutation.isPending;

  return (
    <Card className="bg-gray-800/50 border-gray-600 shadow-modern">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white">
          {produto ? 'Editar Produto' : 'Novo Produto'}
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="border-gray-600 text-gray-300 hover:bg-gray-700/50"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-3 bg-gray-700/30 rounded border border-gray-600">
          <p className="text-gray-300 text-sm">
            <strong>Sistema:</strong> {sistema.nome}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nome" className="text-gray-300">Nome do Produto *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-green-500 focus:ring-green-500/20"
                placeholder="Ex: Módulo Básico"
                required
              />
            </div>
            <div>
              <Label htmlFor="ordem" className="text-gray-300">Ordem</Label>
              <Input
                id="ordem"
                type="number"
                value={formData.ordem}
                onChange={(e) => setFormData({ ...formData, ordem: parseInt(e.target.value) || 1 })}
                className="bg-gray-700/50 border-gray-600 text-white focus:border-green-500 focus:ring-green-500/20"
                min="1"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="descricao" className="text-gray-300">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-green-500 focus:ring-green-500/20"
              placeholder="Descrição do produto..."
              rows={3}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="border-gray-600 text-gray-300 hover:bg-gray-700/50"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              {produto ? 'Atualizar' : 'Criar'} Produto
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

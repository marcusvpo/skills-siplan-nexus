
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2, ArrowLeft, Video } from 'lucide-react';
import { ProductForm } from './ProductForm';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Categoria {
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

interface ProductsListProps {
  sistema: Categoria;
  produtos: Produto[];
  onProductsChange: () => void;
  onBack: () => void;
  onSelectProduct: (produto: Produto) => void;
}

export const ProductsList: React.FC<ProductsListProps> = ({
  sistema,
  produtos,
  onProductsChange,
  onBack,
  onSelectProduct
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Produto | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async (productId: string, productName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o produto "${productName}"?`)) {
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('produtos')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: "Produto excluído",
        description: `O produto "${productName}" foi excluído com sucesso.`,
      });

      onProductsChange();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Erro ao excluir produto",
        description: "Ocorreu um erro ao excluir o produto.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingProduct(null);
    onProductsChange();
  };

  const handleEdit = (produto: Produto) => {
    setEditingProduct(produto);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={onBack}
            className="border-gray-600 text-gray-300 hover:bg-gray-700/50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar às Categorias
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-white">Produtos</h2>
            <p className="text-gray-300">Categoria: {sistema.nome}</p>
          </div>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Cadastrar Novo Produto
        </Button>
      </div>

      {showForm && (
        <ProductForm
          sistema={sistema}
          produto={editingProduct}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowForm(false);
            setEditingProduct(null);
          }}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {produtos.map((produto) => (
          <Card key={produto.id} className="bg-gray-800/50 border-gray-600 shadow-modern">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg">{produto.nome}</CardTitle>
              {produto.descricao && (
                <p className="text-gray-300 text-sm">{produto.descricao}</p>
              )}
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectProduct(produto)}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700/50"
                >
                  <Video className="h-4 w-4 mr-2" />
                  Ver Vídeo Aulas
                </Button>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(produto)}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700/50"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(produto.id, produto.nome)}
                    disabled={isLoading}
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

      {produtos.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">Nenhum produto cadastrado nesta categoria</p>
          <p className="text-gray-500 text-sm mt-2">
            Clique em "Cadastrar Novo Produto" para começar
          </p>
        </div>
      )}
    </div>
  );
};

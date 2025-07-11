
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2, FolderOpen } from 'lucide-react';
import { SystemFormFixed } from './SystemFormFixed';
import { toast } from '@/hooks/use-toast';
import { useDeleteSistema } from '@/hooks/useSupabaseDataFixed';

interface Sistema {
  id: string;
  nome: string;
  descricao?: string;
  ordem: number;
}

interface SystemsListFixedProps {
  sistemas: Sistema[];
  onViewProdutos: (sistema: Sistema) => void;
}

export const SystemsListFixed: React.FC<SystemsListFixedProps> = ({
  sistemas,
  onViewProdutos
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingSystem, setEditingSystem] = useState<Sistema | null>(null);
  
  const deleteSistemaMutation = useDeleteSistema();

  const handleDelete = async (systemId: string, systemName: string) => {
    if (!confirm(`Tem certeza que deseja excluir a categoria "${systemName}"?`)) {
      return;
    }

    try {
      await deleteSistemaMutation.mutateAsync(systemId);
      toast({
        title: "Categoria excluída",
        description: `A categoria "${systemName}" foi excluída com sucesso.`,
      });
    } catch (error) {
      console.error('Error deleting system:', error);
      toast({
        title: "Erro ao excluir categoria",
        description: "Ocorreu um erro ao excluir a categoria.",
        variant: "destructive",
      });
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingSystem(null);
  };

  const handleEdit = (sistema: Sistema) => {
    setEditingSystem(sistema);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Categorias</h2>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Cadastrar Nova Categoria
        </Button>
      </div>

      {showForm && (
        <SystemFormFixed
          sistema={editingSystem}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowForm(false);
            setEditingSystem(null);
          }}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sistemas.map((sistema) => (
          <Card key={sistema.id} className="bg-gray-800/50 border-gray-600 shadow-modern">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg">{sistema.nome}</CardTitle>
              {sistema.descricao && (
                <p className="text-gray-300 text-sm">{sistema.descricao}</p>
              )}
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewProdutos(sistema)}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700/50"
                >
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Ver Produtos
                </Button>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(sistema)}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700/50"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(sistema.id, sistema.nome)}
                    disabled={deleteSistemaMutation.isPending}
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

      {sistemas.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">Nenhuma categoria cadastrada</p>
          <p className="text-gray-500 text-sm mt-2">
            Clique em "Cadastrar Nova Categoria" para começar
          </p>
        </div>
      )}
    </div>
  );
};


import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2, FolderOpen } from 'lucide-react';
import { SystemForm } from './SystemForm';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Categoria {
  id: string;
  nome: string;
  descricao?: string;
  ordem: number;
}

interface SystemsListProps {
  sistemas: Categoria[];
  onSystemsChange: () => void;
  onSelectSystem: (categoria: Categoria) => void;
}

export const SystemsList: React.FC<SystemsListProps> = ({
  sistemas,
  onSystemsChange,
  onSelectSystem
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingSystem, setEditingSystem] = useState<Categoria | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async (categoriaId: string, categoriaNome: string) => {
    if (!confirm(`Tem certeza que deseja excluir a categoria "${categoriaNome}"?`)) {
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('sistemas')
        .delete()
        .eq('id', categoriaId);

      if (error) throw error;

      toast({
        title: "Categoria excluída",
        description: `A categoria "${categoriaNome}" foi excluída com sucesso.`,
      });

      onSystemsChange();
    } catch (error) {
      console.error('Error deleting categoria:', error);
      toast({
        title: "Erro ao excluir categoria",
        description: "Ocorreu um erro ao excluir a categoria.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingSystem(null);
    onSystemsChange();
  };

  const handleEdit = (categoria: Categoria) => {
    setEditingSystem(categoria);
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
        <SystemForm
          sistema={editingSystem}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowForm(false);
            setEditingSystem(null);
          }}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sistemas.map((categoria) => (
          <Card key={categoria.id} className="bg-gray-800/50 border-gray-600 shadow-modern">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg">{categoria.nome}</CardTitle>
              {categoria.descricao && (
                <p className="text-gray-300 text-sm">{categoria.descricao}</p>
              )}
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectSystem(categoria)}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700/50"
                >
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Ver Produtos
                </Button>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(categoria)}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700/50"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(categoria.id, categoria.nome)}
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

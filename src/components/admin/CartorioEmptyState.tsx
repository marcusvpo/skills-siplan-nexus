
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Plus } from 'lucide-react';

interface CartorioEmptyStateProps {
  onCreateClick: () => void;
}

export const CartorioEmptyState: React.FC<CartorioEmptyStateProps> = ({
  onCreateClick
}) => {
  return (
    <Card className="bg-gray-800/50 border-gray-600">
      <CardContent className="flex flex-col items-center justify-center h-64">
        <Building2 className="h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">Nenhum cartório cadastrado</h3>
        <p className="text-gray-400 text-center mb-4">
          Crie o primeiro cartório para começar a gerenciar os acessos à plataforma.
        </p>
        <Button
          onClick={onCreateClick}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Criar Primeiro Cartório
        </Button>
      </CardContent>
    </Card>
  );
};

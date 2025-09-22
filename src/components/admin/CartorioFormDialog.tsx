
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useCreateCartorio } from '@/hooks/useSupabaseDataRefactored';
import { logger } from '@/utils/logger';

interface CartorioFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface NewCartorioForm {
  nome: string;
  cidade: string;
  estado: string;
  observacoes: string;
  data_expiracao: string;
}

export const CartorioFormDialog: React.FC<CartorioFormDialogProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [newCartorio, setNewCartorio] = useState<NewCartorioForm>({
    nome: '',
    cidade: '',
    estado: 'SP',
    observacoes: '',
    data_expiracao: ''
  });

  const createCartorioMutation = useCreateCartorio();

  const validateCartorioData = () => {
    const errors: string[] = [];
    
    if (!newCartorio.nome.trim()) {
      errors.push('Nome do cartório é obrigatório');
    }
    
    if (!newCartorio.data_expiracao) {
      errors.push('Data de expiração é obrigatória');
    } else {
      const expirationDate = new Date(newCartorio.data_expiracao);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (expirationDate <= today) {
        errors.push('Data de expiração deve ser futura');
      }
    }
    
    return errors;
  };

  const handleCreateCartorio = async () => {
    const validationErrors = validateCartorioData();
    
    if (validationErrors.length > 0) {
      toast({
        title: "Dados inválidos",
        description: validationErrors.join('. '),
        variant: "destructive",
      });
      return;
    }

    logger.info('🏢 [CartorioFormDialog] Creating new cartorio:', { 
      nome: newCartorio.nome
    });

    try {
      const result = await createCartorioMutation.mutateAsync(newCartorio);
      
      logger.info('✅ [CartorioFormDialog] Cartorio created successfully:', { 
        id: result.cartorio.id,
        token: result.login_token
      });

      toast({
        title: "Cartório criado com sucesso!",
        description: `"${newCartorio.nome}" foi criado. Token: ${result.login_token}`,
        duration: 10000,
      });

      setNewCartorio({
        nome: '',
        cidade: '',
        estado: 'SP',
        observacoes: '',
        data_expiracao: ''
      });
      onClose();
      onSuccess();
    } catch (error) {
      logger.error('❌ [CartorioFormDialog] Error creating cartorio:', error);
      
      let errorMessage = 'Não foi possível criar o cartório. Tente novamente.';
      
      if (error instanceof Error) {
        if (error.message.includes('duplicate key value')) {
          errorMessage = 'Já existe um cartório com este nome.';
        } else if (error.message.includes('violates check constraint')) {
          errorMessage = 'Dados inválidos fornecidos.';
        } else if (error.message.includes('permission denied')) {
          errorMessage = 'Sem permissão para criar cartório.';
        } else {
          errorMessage = `Erro: ${error.message}`;
        }
      }
      
      toast({
        title: "Erro ao criar cartório",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-600 text-white">
        <DialogHeader>
          <DialogTitle>Criar Novo Cartório</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome do Cartório *</Label>
            <Input
              id="nome"
              value={newCartorio.nome}
              onChange={(e) => setNewCartorio(prev => ({ ...prev, nome: e.target.value }))}
              className="bg-gray-700 border-gray-600 text-white"
              placeholder="Ex: 1º Cartório de Registro de Imóveis"
              disabled={createCartorioMutation.isPending}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cidade">Cidade</Label>
              <Input
                id="cidade"
                value={newCartorio.cidade}
                onChange={(e) => setNewCartorio(prev => ({ ...prev, cidade: e.target.value }))}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="São Paulo"
                disabled={createCartorioMutation.isPending}
              />
            </div>
            <div>
              <Label htmlFor="estado">Estado</Label>
              <Input
                id="estado"
                value={newCartorio.estado}
                onChange={(e) => setNewCartorio(prev => ({ ...prev, estado: e.target.value }))}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="SP"
                disabled={createCartorioMutation.isPending}
              />
            </div>
          </div>


          <div>
            <Label htmlFor="data_expiracao">Data de Expiração do Acesso *</Label>
            <Input
              id="data_expiracao"
              type="date"
              value={newCartorio.data_expiracao}
              onChange={(e) => setNewCartorio(prev => ({ ...prev, data_expiracao: e.target.value }))}
              className="bg-gray-700 border-gray-600 text-white"
              disabled={createCartorioMutation.isPending}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={newCartorio.observacoes}
              onChange={(e) => setNewCartorio(prev => ({ ...prev, observacoes: e.target.value }))}
              className="bg-gray-700 border-gray-600 text-white"
              placeholder="Observações sobre o cartório..."
              disabled={createCartorioMutation.isPending}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-gray-600 text-gray-300"
              disabled={createCartorioMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateCartorio}
              disabled={createCartorioMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {createCartorioMutation.isPending ? (
                <div className="flex items-center space-x-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Criando...</span>
                </div>
              ) : (
                'Criar Cartório'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

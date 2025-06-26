
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, Clock, Save, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface EditTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartorio: any;
  onUpdate: () => void;
}

export const EditTokenModal: React.FC<EditTokenModalProps> = ({
  isOpen,
  onClose,
  cartorio,
  onUpdate
}) => {
  const [newExpirationDate, setNewExpirationDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdateExpiration = async () => {
    if (!newExpirationDate) {
      toast({
        title: "Data obrigatória",
        description: "Selecione uma nova data de expiração",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('acessos_cartorio')
        .update({ data_expiracao: newExpirationDate })
        .eq('cartorio_id', cartorio.id);

      if (error) throw error;

      toast({
        title: "Data de expiração atualizada",
        description: `A validade do token foi alterada para ${new Date(newExpirationDate).toLocaleDateString('pt-BR')}`,
      });

      setNewExpirationDate('');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating expiration:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar a data de expiração",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addDays = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    setNewExpirationDate(date.toISOString().split('T')[0]);
  };

  const addMonths = (months: number) => {
    const date = new Date();
    date.setMonth(date.getMonth() + months);
    setNewExpirationDate(date.toISOString().split('T')[0]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-600 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Editar Validade do Token
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-white">{cartorio.nome}</h3>
            <p className="text-sm text-gray-400">
              Token: {cartorio.acessos_cartorio?.[0]?.login_token}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Expira atualmente em: {cartorio.acessos_cartorio?.[0]?.data_expiracao 
                ? new Date(cartorio.acessos_cartorio[0].data_expiracao).toLocaleDateString('pt-BR')
                : 'N/A'
              }
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="expiration" className="text-gray-300">Nova Data de Expiração</Label>
              <Input
                id="expiration"
                type="date"
                value={newExpirationDate}
                onChange={(e) => setNewExpirationDate(e.target.value)}
                className="bg-gray-700/50 border-gray-600 text-white"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => addDays(30)}
                className="border-gray-600 text-gray-300 hover:bg-gray-700/50"
              >
                +30 dias
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addDays(90)}
                className="border-gray-600 text-gray-300 hover:bg-gray-700/50"
              >
                +90 dias
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addMonths(6)}
                className="border-gray-600 text-gray-300 hover:bg-gray-700/50"
              >
                +6 meses
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addMonths(12)}
                className="border-gray-600 text-gray-300 hover:bg-gray-700/50"
              >
                +1 ano
              </Button>
            </div>
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={handleUpdateExpiration}
              disabled={isLoading || !newExpirationDate}
              className="bg-green-600 hover:bg-green-700 text-white flex-1"
            >
              {isLoading ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Nova Data
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="border-gray-600 text-gray-300 hover:bg-gray-700/50"
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

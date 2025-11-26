
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Shield, Users } from 'lucide-react';
import { useCartorioAccess, useSistemasWithVideoAulas } from '@/hooks/useSupabaseDataRefactored';
import { toast } from '@/hooks/use-toast';

interface CartorioAccessManagerProps {
  cartorioId: string;
  cartorioName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const CartorioAccessManager: React.FC<CartorioAccessManagerProps> = ({
  cartorioId,
  cartorioName,
  isOpen,
  onClose
}) => {
  const [selectedSistema, setSelectedSistema] = useState<string>('');
  const [selectedProduto, setSelectedProduto] = useState<string>('');
  const [isGranting, setIsGranting] = useState(false);

  const { getCartorioAccess, grantAccess, revokeAccess } = useCartorioAccess();
  const { data: allSistemas = [] } = useSistemasWithVideoAulas();
  const { data: currentAccess = [], refetch } = getCartorioAccess(cartorioId);

  const availableProducts = selectedSistema 
    ? allSistemas.find(s => s.id === selectedSistema)?.produtos || []
    : [];

  const handleGrantAccess = async () => {
    if (!selectedSistema) {
      toast({
        title: "Erro",
        description: "Selecione um sistema",
        variant: "destructive",
      });
      return;
    }

    setIsGranting(true);

    try {
      await grantAccess.mutateAsync({
        cartorioId,
        sistemaId: selectedSistema,
        produtoId: selectedProduto || undefined,
      });

      setSelectedSistema('');
      setSelectedProduto('');
      refetch();
    } catch (error) {
      console.error('Error granting access:', error);
    } finally {
      setIsGranting(false);
    }
  };

  const handleRevokeAccess = async (accessId: string) => {
    try {
      await revokeAccess.mutateAsync(accessId);
      refetch();
    } catch (error) {
      console.error('Error revoking access:', error);
    }
  };

  const getSistemaName = (sistemaId: string) => {
    return allSistemas.find(s => s.id === sistemaId)?.nome || 'Sistema não encontrado';
  };

  const getProdutoName = (produtoId: string) => {
    return allSistemas
      .flatMap(s => s.produtos || [])
      .find(p => p.id === produtoId)?.nome || 'Produto não encontrado';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-400" />
            Controle de Acesso - {cartorioName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Adicionar novo acesso */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Conceder Novo Acesso
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-300 mb-2 block">Sistema *</label>
                  <Select value={selectedSistema} onValueChange={setSelectedSistema}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Selecione um sistema" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      {allSistemas.map((sistema) => (
                        <SelectItem key={sistema.id} value={sistema.id} className="text-white">
                          {sistema.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm text-gray-300 mb-2 block">Produto (Opcional)</label>
                  <Select 
                    value={selectedProduto} 
                    onValueChange={setSelectedProduto}
                    disabled={!selectedSistema}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Todos os produtos" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="" className="text-white">
                        Todos os produtos do sistema
                      </SelectItem>
                      {availableProducts.map((produto) => (
                        <SelectItem key={produto.id} value={produto.id} className="text-white">
                          {produto.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleGrantAccess}
                disabled={!selectedSistema || isGranting}
                className="bg-green-600 hover:bg-green-700"
              >
                {isGranting ? 'Concedendo...' : 'Conceder Acesso'}
              </Button>
            </CardContent>
          </Card>

          {/* Lista de acessos atuais */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Users className="h-4 w-4" />
                Acessos Atuais ({currentAccess.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentAccess.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">
                    Nenhuma restrição definida. Este cartório tem acesso total a todos os sistemas e produtos.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentAccess.map((access) => (
                    <div
                      key={access.id}
                      className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg border border-gray-600"
                    >
                      <div>
                        <h4 className="text-white font-medium">
                          {getSistemaName(access.sistema_id)}
                        </h4>
                        {access.produto_id ? (
                          <p className="text-sm text-gray-300">
                            Produto: {getProdutoName(access.produto_id)}
                          </p>
                        ) : (
                          <p className="text-sm text-green-400">
                            Todos os produtos deste sistema
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {access.nivel_acesso}
                          </Badge>
                          <span className="text-xs text-gray-400">
                            Liberado em: {new Date(access.data_liberacao).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => handleRevokeAccess(access.id)}
                        variant="destructive"
                        size="sm"
                        className="ml-4"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

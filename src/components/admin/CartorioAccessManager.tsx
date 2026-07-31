
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
      <DialogContent className="max-w-4xl bg-card/95 backdrop-blur-md border-border/50 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/15 text-destructive">
              <Shield className="h-5 w-5" />
            </span>
            <span className="truncate">Controle de Acesso - {cartorioName}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Adicionar novo acesso */}
          <Card className="bg-card/70 backdrop-blur-md border-border/50 rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Conceder Novo Acesso
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Sistema *</label>
                  <Select value={selectedSistema} onValueChange={setSelectedSistema}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um sistema" />
                    </SelectTrigger>
                    <SelectContent>
                      {allSistemas.map((sistema) => (
                        <SelectItem key={sistema.id} value={sistema.id}>
                          {sistema.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Produto (Opcional)</label>
                  <Select 
                    value={selectedProduto} 
                    onValueChange={setSelectedProduto}
                    disabled={!selectedSistema}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os produtos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">
                        Todos os produtos do sistema
                      </SelectItem>
                      {availableProducts.map((produto) => (
                        <SelectItem key={produto.id} value={produto.id}>
                          {produto.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                variant="glow"
                onClick={handleGrantAccess}
                disabled={!selectedSistema || isGranting}
              >
                {isGranting ? 'Concedendo...' : 'Conceder Acesso'}
              </Button>
            </CardContent>
          </Card>

          {/* Lista de acessos atuais */}
          <Card className="bg-card/70 backdrop-blur-md border-border/50 rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-4 w-4" />
                Acessos Atuais ({currentAccess.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentAccess.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Nenhuma restrição definida. Este cartório tem acesso total a todos os sistemas e produtos.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentAccess.map((access) => (
                    <div
                      key={access.id}
                      className="flex items-center justify-between gap-4 p-4 bg-muted/40 rounded-xl border border-border/50"
                    >
                      <div className="min-w-0">
                        <h4 className="font-medium truncate">
                          {getSistemaName(access.sistema_id)}
                        </h4>
                        {access.produto_id ? (
                          <p className="text-sm text-muted-foreground truncate">
                            Produto: {getProdutoName(access.produto_id)}
                          </p>
                        ) : (
                          <p className="text-sm text-success">
                            Todos os produtos deste sistema
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {access.nivel_acesso}
                          </Badge>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            Liberado em: {new Date(access.data_liberacao).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => handleRevokeAccess(access.id)}
                        variant="destructive"
                        size="sm"
                        className="shrink-0"
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

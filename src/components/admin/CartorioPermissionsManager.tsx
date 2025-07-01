
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Save, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface CartorioPermissionsManagerProps {
  cartorio: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export const CartorioPermissionsManager: React.FC<CartorioPermissionsManagerProps> = ({
  cartorio,
  isOpen,
  onClose,
  onUpdate
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [todosOsSistemas, setTodosOsSistemas] = useState<any[]>([]);
  const [permissoesAtuais, setPermissoesAtuais] = useState<any[]>([]);
  const [permissoesSelecionadas, setPermissoesSelecionadas] = useState<Set<string>>(new Set());

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      logger.info('🔐 [CartorioPermissionsManager] Fetching permissions for:', { cartorioId: cartorio.id });

      const { data, error } = await supabase.functions.invoke('get-cartorio-permissions', {
        body: { cartorioId: cartorio.id }
      });

      if (error) {
        logger.error('❌ [CartorioPermissionsManager] Function error:', { error });
        throw new Error(error.message || 'Erro ao buscar permissões');
      }

      if (!data?.success) {
        logger.error('❌ [CartorioPermissionsManager] API error:', { error: data?.error });
        throw new Error(data?.error || 'Erro na resposta da API');
      }

      setTodosOsSistemas(data.data.todosOsSistemas || []);
      setPermissoesAtuais(data.data.permissoes || []);

      // Configurar permissões selecionadas
      const selected = new Set<string>();
      data.data.permissoes?.forEach((p: any) => {
        if (p.produto_id) {
          selected.add(`produto-${p.produto_id}`);
        } else if (p.sistema_id) {
          selected.add(`sistema-${p.sistema_id}`);
        }
      });
      setPermissoesSelecionadas(selected);

      logger.info('✅ [CartorioPermissionsManager] Data loaded successfully');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      logger.error('❌ [CartorioPermissionsManager] Error:', { error: err });
      
      toast({
        title: "Erro ao carregar permissões",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      logger.info('💾 [CartorioPermissionsManager] Saving permissions');

      // Converter seleções para formato da API
      const permissoes: any[] = [];
      
      permissoesSelecionadas.forEach(selection => {
        const [tipo, id] = selection.split('-');
        
        if (tipo === 'sistema') {
          permissoes.push({
            sistema_id: id,
            produto_id: null
          });
        } else if (tipo === 'produto') {
          // Encontrar o sistema do produto
          const produto = todosOsSistemas
            .flatMap(s => s.produtos || [])
            .find(p => p.id === id);
          
          if (produto) {
            permissoes.push({
              sistema_id: produto.sistema_id,
              produto_id: id
            });
          }
        }
      });

      const { data, error } = await supabase.functions.invoke('update-cartorio-permissions', {
        body: {
          cartorioId: cartorio.id,
          permissoes
        }
      });

      if (error) {
        logger.error('❌ [CartorioPermissionsManager] Save function error:', { error });
        throw new Error(error.message || 'Erro ao salvar permissões');
      }

      if (!data?.success) {
        logger.error('❌ [CartorioPermissionsManager] Save API error:', { error: data?.error });
        throw new Error(data?.error || 'Erro na resposta da API');
      }

      logger.info('✅ [CartorioPermissionsManager] Permissions saved successfully');
      
      toast({
        title: "Sucesso",
        description: data.message || "Permissões atualizadas com sucesso!",
      });

      onUpdate();
      onClose();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      logger.error('❌ [CartorioPermissionsManager] Save error:', { error: err });
      
      toast({
        title: "Erro ao salvar permissões",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSelection = (key: string) => {
    const newSelected = new Set(permissoesSelecionadas);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setPermissoesSelecionadas(newSelected);
  };

  const toggleSistema = (sistemaId: string) => {
    const sistemaKey = `sistema-${sistemaId}`;
    const sistema = todosOsSistemas.find(s => s.id === sistemaId);
    const produtoKeys = sistema?.produtos?.map((p: any) => `produto-${p.id}`) || [];
    
    const newSelected = new Set(permissoesSelecionadas);
    
    if (newSelected.has(sistemaKey)) {
      // Desmarcar sistema e todos os produtos
      newSelected.delete(sistemaKey);
      produtoKeys.forEach(key => newSelected.delete(key));
    } else {
      // Marcar sistema (acesso completo)
      newSelected.add(sistemaKey);
      // Remover produtos individuais se existirem
      produtoKeys.forEach(key => newSelected.delete(key));
    }
    
    setPermissoesSelecionadas(newSelected);
  };

  useEffect(() => {
    if (isOpen && cartorio) {
      fetchData();
    }
  }, [isOpen, cartorio]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center">
            <Shield className="h-5 w-5 mr-2 text-blue-400" />
            Gerenciar Permissões - {cartorio?.nome}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-400">Carregando permissões...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-300">Como funciona:</h4>
                  <ul className="text-sm text-blue-200 mt-1 space-y-1">
                    <li>• Marque um <strong>Sistema</strong> para dar acesso completo a todos os produtos</li>
                    <li>• Marque <strong>Produtos</strong> específicos para acesso granular</li>
                    <li>• Se nenhuma permissão for marcada, o cartório terá acesso a tudo</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {todosOsSistemas.map((sistema) => {
                const sistemaKey = `sistema-${sistema.id}`;
                const sistemaSelected = permissoesSelecionadas.has(sistemaKey);
                
                return (
                  <Card key={sistema.id} className="bg-gray-800/50 border-gray-700">
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={sistemaSelected}
                          onCheckedChange={() => toggleSistema(sistema.id)}
                          className="border-gray-600"
                        />
                        <CardTitle className="text-lg text-white">
                          {sistema.nome}
                        </CardTitle>
                        {sistemaSelected && (
                          <span className="text-sm text-green-400 font-medium">
                            (Acesso Completo)
                          </span>
                        )}
                      </div>
                      {sistema.descricao && (
                        <p className="text-sm text-gray-400 ml-8">
                          {sistema.descricao}
                        </p>
                      )}
                    </CardHeader>
                    
                    {!sistemaSelected && sistema.produtos && sistema.produtos.length > 0 && (
                      <CardContent className="pt-0">
                        <div className="ml-6 space-y-2">
                          <p className="text-sm font-medium text-gray-300">Produtos:</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {sistema.produtos.map((produto: any) => {
                              const produtoKey = `produto-${produto.id}`;
                              return (
                                <div key={produto.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    checked={permissoesSelecionadas.has(produtoKey)}
                                    onCheckedChange={() => toggleSelection(produtoKey)}
                                    className="border-gray-600"
                                  />
                                  <label className="text-sm text-gray-300 cursor-pointer">
                                    {produto.nome}
                                  </label>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isSaving}
                className="border-gray-600 text-gray-300 hover:bg-gray-700/50"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Permissões
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

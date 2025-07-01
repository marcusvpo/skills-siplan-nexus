
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
  const [permissoesSelecionadas, setPermissoesSelecionadas] = useState<Set<string>>(new Set());

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Buscar todos os sistemas
      const { data: sistemas, error: sistemasError } = await supabase
        .from('sistemas')
        .select(`
          *,
          produtos (*)
        `)
        .order('ordem');

      if (sistemasError) {
        throw new Error(`Erro ao buscar sistemas: ${sistemasError.message}`);
      }

      setTodosOsSistemas(sistemas || []);

      // Buscar permissões atuais
      const { data: permissoes, error: permissoesError } = await supabase
        .from('cartorio_acesso_conteudo')
        .select('*')
        .eq('cartorio_id', cartorio.id)
        .eq('ativo', true);

      if (permissoesError) {
        throw new Error(`Erro ao buscar permissões: ${permissoesError.message}`);
      }

      // Configurar seleções
      const selected = new Set<string>();
      permissoes?.forEach((p: any) => {
        if (p.sistema_id && !p.produto_id) {
          selected.add(`sistema-${p.sistema_id}`);
        } else if (p.produto_id) {
          selected.add(`produto-${p.produto_id}`);
        }
      });
      
      setPermissoesSelecionadas(selected);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
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
      
      logger.info('🔐 [CartorioPermissionsManager] Salvando permissões para cartório:', { 
        cartorioId: cartorio.id,
        permissoes: Array.from(permissoesSelecionadas)
      });

      // Preparar array de permissões no formato correto com UUIDs completos
      const permissoes: any[] = [];
      
      permissoesSelecionadas.forEach(selection => {
        const [tipo, idCompleto] = selection.split('-');
        
        // CORREÇÃO CRÍTICA: Garantir que enviamos UUIDs completos
        if (tipo === 'sistema' && idCompleto && idCompleto.length === 36) {
          permissoes.push({
            sistema_id: idCompleto,
            produto_id: null
          });
        } else if (tipo === 'produto' && idCompleto && idCompleto.length === 36) {
          // Para produtos, encontrar o sistema pai
          const produto = todosOsSistemas
            .flatMap(s => s.produtos || [])
            .find(p => p.id === idCompleto);
          
          if (produto) {
            permissoes.push({
              sistema_id: null, // Para permissão granular de produto, sistema_id é null
              produto_id: idCompleto
            });
          }
        }
      });

      logger.info('🔐 [CartorioPermissionsManager] Permissões formatadas para envio:', { permissoes });

      // Usar a Edge Function para atualizar as permissões
      const { data, error } = await supabase.functions.invoke('update-cartorio-permissions', {
        body: {
          cartorioId: cartorio.id,
          permissoes: permissoes
        }
      });

      if (error) {
        logger.error('❌ [CartorioPermissionsManager] Function error:', { error });
        throw new Error(`Erro ao salvar permissões: ${error.message}`);
      }

      if (!data?.success) {
        logger.error('❌ [CartorioPermissionsManager] API error:', { error: data?.error });
        throw new Error(data?.error || 'Erro na resposta da API');
      }
      
      toast({
        title: "Sucesso",
        description: "Permissões atualizadas com sucesso!",
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

  const toggleSistema = (sistemaId: string) => {
    const sistemaKey = `sistema-${sistemaId}`;
    const sistema = todosOsSistemas.find(s => s.id === sistemaId);
    const produtoKeys = sistema?.produtos?.map((p: any) => `produto-${p.id}`) || [];
    
    const newSelected = new Set(permissoesSelecionadas);
    
    if (newSelected.has(sistemaKey)) {
      newSelected.delete(sistemaKey);
    } else {
      newSelected.add(sistemaKey);
      produtoKeys.forEach(key => newSelected.delete(key));
    }
    
    setPermissoesSelecionadas(newSelected);
  };

  const toggleProduto = (produtoId: string, sistemaId: string) => {
    const produtoKey = `produto-${produtoId}`;
    const sistemaKey = `sistema-${sistemaId}`;
    
    const newSelected = new Set(permissoesSelecionadas);
    
    if (newSelected.has(produtoKey)) {
      newSelected.delete(produtoKey);
    } else {
      newSelected.add(produtoKey);
      if (newSelected.has(sistemaKey)) {
        newSelected.delete(sistemaKey);
      }
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
            <Shield className="h-5 w-5 mr-2 text-red-400" />
            Gerenciar Permissões - {cartorio?.nome}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
              <p className="text-gray-400">Carregando permissões...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-red-300">Como funciona:</h4>
                  <ul className="text-sm text-red-200 mt-1 space-y-1">
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
                    </CardHeader>
                    
                    {sistema.produtos && sistema.produtos.length > 0 && (
                      <CardContent className="pt-0">
                        <div className="ml-6 space-y-2">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {sistema.produtos.map((produto: any) => {
                              const produtoKey = `produto-${produto.id}`;
                              const produtoSelected = permissoesSelecionadas.has(produtoKey);
                              
                              return (
                                <div key={produto.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    checked={produtoSelected || sistemaSelected}
                                    disabled={sistemaSelected}
                                    onCheckedChange={() => toggleProduto(produto.id, sistema.id)}
                                    className="border-gray-600"
                                  />
                                  <label className={`text-sm cursor-pointer ${
                                    sistemaSelected ? 'text-green-300' : 'text-gray-300'
                                  }`}>
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
                className="bg-red-600 hover:bg-red-700 text-white"
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

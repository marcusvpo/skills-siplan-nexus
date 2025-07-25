
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

      logger.info('🔐 [CartorioPermissionsManager] Permissões encontradas:', { permissoes });

      // Configurar seleções baseado nas permissões existentes
      const selected = new Set<string>();
      permissoes?.forEach((p: any) => {
        if (p.sistema_id && !p.produto_id) {
          selected.add(`sistema-${p.sistema_id}`);
        } else if (p.produto_id) {
          selected.add(`produto-${p.produto_id}`);
        }
      });
      
      logger.info('🔐 [CartorioPermissionsManager] Seleções configuradas:', { selected: Array.from(selected) });
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

      // Preparar array de permissões no formato correto - CRITICAL FIX
      const permissoes: any[] = [];
      
      permissoesSelecionadas.forEach(selection => {
        const [tipo, ...idParts] = selection.split('-');
        const fullId = idParts.join('-'); // Reconstrói o UUID completo
        
        // CRITICAL UUID VALIDATION
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        
        if (tipo === 'sistema' && fullId && uuidRegex.test(fullId)) {
          permissoes.push({
            sistema_id: fullId,
            produto_id: null
          });
          logger.info('🔐 [CartorioPermissionsManager] Sistema válido:', { sistemaId: fullId });
        } else if (tipo === 'produto' && fullId && uuidRegex.test(fullId)) {
          permissoes.push({
            sistema_id: null,
            produto_id: fullId
          });
          logger.info('🔐 [CartorioPermissionsManager] Produto válido:', { produtoId: fullId });
        } else {
          logger.warn('🔐 [CartorioPermissionsManager] ID inválido ignorado:', { tipo, fullId, selection });
        }
      });

      logger.info('🔐 [CartorioPermissionsManager] Permissões formatadas para envio:', { permissoes });

      // Primeiro, deletar permissões existentes
      const { error: deleteError } = await supabase
        .from('cartorio_acesso_conteudo')
        .delete()
        .eq('cartorio_id', cartorio.id);

      if (deleteError) {
        throw new Error(`Erro ao deletar permissões antigas: ${deleteError.message}`);
      }

      // Inserir novas permissões se houver alguma
      if (permissoes.length > 0) {
        const novasPermissoes = permissoes.map(p => ({
          cartorio_id: cartorio.id,
          sistema_id: p.sistema_id,
          produto_id: p.produto_id,
          ativo: true,
          nivel_acesso: 'completo'
        }));

        const { error: insertError } = await supabase
          .from('cartorio_acesso_conteudo')
          .insert(novasPermissoes);

        if (insertError) {
          throw new Error(`Erro ao inserir novas permissões: ${insertError.message}`);
        }

        logger.info('✅ [CartorioPermissionsManager] Permissões salvas com sucesso');
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
      // Desmarcar sistema
      newSelected.delete(sistemaKey);
    } else {
      // Marcar sistema e desmarcar produtos individuais
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
      // Desmarcar produto
      newSelected.delete(produtoKey);
    } else {
      // Marcar produto e desmarcar sistema completo
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

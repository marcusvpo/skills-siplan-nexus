
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
      
      console.log('🔐 [CartorioPermissionsManager] Fetching permissions for cartorio:', cartorio.id);

      const { data, error } = await supabase.functions.invoke('get-cartorio-permissions', {
        body: { cartorioId: cartorio.id }
      });

      console.log('🔐 [CartorioPermissionsManager] Response received:', {
        data: data ? { success: data.success, hasData: !!data.data } : null,
        error: error ? { message: error.message, context: error.context } : null
      });

      if (error) {
        console.error('❌ [CartorioPermissionsManager] Function error:', {
          error,
          message: error.message,
          context: error.context || 'No context available'
        });
        throw new Error(error.message || 'Erro ao buscar permissões');
      }

      if (!data?.success) {
        console.error('❌ [CartorioPermissionsManager] API error:', data?.error);
        throw new Error(data?.error || 'Erro na resposta da API');
      }

      console.log('✅ [CartorioPermissionsManager] Data received successfully:', {
        sistemas: data.data.todosOsSistemas?.length || 0,
        permissoes: data.data.permissoes?.length || 0
      });

      setTodosOsSistemas(data.data.todosOsSistemas || []);
      setPermissoesAtuais(data.data.permissoes || []);

      // Configurar permissões selecionadas com granularidade correta
      const selected = new Set<string>();
      
      data.data.permissoes?.forEach((p: any) => {
        if (p.produto_id && !p.sistema_id) {
          // Produto específico selecionado
          selected.add(`produto-${p.produto_id}`);
          console.log('🔐 Permission loaded (produto específico):', p.produto_id);
        } else if (p.sistema_id && !p.produto_id) {
          // Sistema completo selecionado
          selected.add(`sistema-${p.sistema_id}`);
          console.log('🔐 Permission loaded (sistema completo):', p.sistema_id);
        }
      });
      
      setPermissoesSelecionadas(selected);
      console.log('🔐 [CartorioPermissionsManager] Permissions loaded:', Array.from(selected));

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('❌ [CartorioPermissionsManager] Error:', {
        error: err,
        message: errorMessage,
        stack: err instanceof Error ? err.stack : 'No stack available'
      });
      
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
      
      console.log('💾 [CartorioPermissionsManager] Starting save process...');
      console.log('💾 [CartorioPermissionsManager] Selected permissions:', Array.from(permissoesSelecionadas));

      // Converter seleções para formato da API com granularidade correta
      const permissoes: any[] = [];
      
      permissoesSelecionadas.forEach(selection => {
        const [tipo, id] = selection.split('-');
        
        if (tipo === 'sistema') {
          // Sistema completo - inserir apenas sistema_id (produto_id = null)
          permissoes.push({
            sistema_id: id,
            produto_id: null
          });
          console.log('🔐 Adding sistema completo:', id);
        } else if (tipo === 'produto') {
          // Produto específico - inserir apenas produto_id (sistema_id = null)
          permissoes.push({
            sistema_id: null,
            produto_id: id
          });
          console.log('🔐 Adding produto específico:', id);
        }
      });

      console.log('🔐 [CartorioPermissionsManager] Final permissions payload:', {
        cartorioId: cartorio.id,
        permissoes: permissoes
      });

      const { data, error } = await supabase.functions.invoke('update-cartorio-permissions', {
        body: {
          cartorioId: cartorio.id,
          permissoes
        }
      });

      console.log('🔐 [CartorioPermissionsManager] Save response:', {
        data: data ? { success: data.success, message: data.message } : null,
        error: error ? { message: error.message, context: error.context } : null
      });

      if (error) {
        console.error('❌ [CartorioPermissionsManager] Save function error:', {
          error,
          message: error.message,
          context: error.context || 'No context available'
        });
        throw new Error(error.message || 'Erro ao salvar permissões');
      }

      if (!data?.success) {
        console.error('❌ [CartorioPermissionsManager] Save API error:', data?.error);
        throw new Error(data?.error || 'Erro na resposta da API');
      }

      console.log('✅ [CartorioPermissionsManager] Permissions saved successfully');
      
      toast({
        title: "Sucesso",
        description: "Permissões atualizadas com sucesso!",
      });

      onUpdate();
      onClose();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('❌ [CartorioPermissionsManager] Save error:', {
        error: err,
        message: errorMessage,
        stack: err instanceof Error ? err.stack : 'No stack available'
      });
      
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
      // Desmarcar sistema completo
      newSelected.delete(sistemaKey);
      console.log('🔐 Deselecting sistema completo:', sistemaId);
    } else {
      // Marcar sistema completo
      newSelected.add(sistemaKey);
      // Remover produtos individuais deste sistema se existirem
      produtoKeys.forEach(key => {
        if (newSelected.has(key)) {
          newSelected.delete(key);
          console.log('🔐 Removing individual produto when selecting sistema:', key);
        }
      });
      console.log('🔐 Selecting sistema completo:', sistemaId);
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
      console.log('🔐 Deselecting produto:', produtoId);
    } else {
      // Marcar produto
      newSelected.add(produtoKey);
      // Se o sistema completo estava marcado, remover
      if (newSelected.has(sistemaKey)) {
        newSelected.delete(sistemaKey);
        console.log('🔐 Removing sistema completo when selecting individual produto');
      }
      console.log('🔐 Selecting produto:', produtoId);
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
                  <h4 className="text-sm font-medium text-blue-300">Granularidade de Permissões:</h4>
                  <ul className="text-sm text-blue-200 mt-1 space-y-1">
                    <li>• Marque um <strong>Sistema</strong> para dar acesso completo a todos os produtos</li>
                    <li>• Marque <strong>Produtos</strong> específicos para acesso granular (independente do sistema)</li>
                    <li>• Se nenhuma permissão for marcada, o cartório terá acesso a tudo</li>
                    <li>• <span className="text-yellow-300">Novo:</span> Você pode misturar sistemas completos com produtos específicos</li>
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
                    
                    {sistema.produtos && sistema.produtos.length > 0 && (
                      <CardContent className="pt-0">
                        <div className="ml-6 space-y-2">
                          <p className="text-sm font-medium text-gray-300">
                            Produtos {sistemaSelected ? '(incluídos automaticamente)' : '(selecione individualmente)'}:
                          </p>
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
                                    {produtoSelected && !sistemaSelected && (
                                      <span className="text-blue-400 ml-1">(específico)</span>
                                    )}
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
